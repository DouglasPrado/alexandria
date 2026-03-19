//! Endpoints REST para Nodes.
//!
//! POST   /api/v1/nodes/register — registrar no (UC-003)
//! GET    /api/v1/clusters/:id/nodes — listar nos
//! POST   /api/v1/nodes/:id/heartbeat — heartbeat
//! DELETE /api/v1/nodes/:id — desconectar no (UC-006)

use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::AppState;
use crate::services::node_service;

#[derive(Deserialize)]
pub struct RegisterNodeRequest {
    pub node_id: Option<Uuid>,      // se fornecido, usa como ID (auto-register)
    pub name: String,
    pub node_type: String,
    pub endpoint: Option<String>,   // URL do node agent para comunicacao do orchestrator
    pub total_capacity: i64,
}

#[derive(Serialize)]
pub struct NodeResponse {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub name: String,
    pub node_type: String,
    pub status: String,
    pub total_capacity: i64,
    pub used_capacity: i64,
    pub last_heartbeat: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct DisconnectNodeRequest {
    pub cluster_id: Uuid,
    pub remover_id: Uuid,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

/// POST /api/v1/nodes/register
///
/// Autenticacao via X-Bootstrap-Token header.
/// Resolve cluster_id e owner_id do primeiro cluster + seu admin.
/// Retorna 409 se node_id ja existir (node pode prosseguir com heartbeat).
pub async fn register_node(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RegisterNodeRequest>,
) -> impl IntoResponse {
    // Validar bootstrap token
    let expected = match state.bootstrap_token.as_ref() {
        Some(t) => t,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "error": "bootstrap token nao configurado" })),
            )
                .into_response();
        }
    };

    let token = match headers.get("X-Bootstrap-Token").and_then(|v| v.to_str().ok()) {
        Some(t) => t,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "X-Bootstrap-Token header obrigatorio" })),
            )
                .into_response();
        }
    };

    if token != expected {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "bootstrap token invalido" })),
        )
            .into_response();
    }

    // Resolver cluster_id e owner_id do primeiro cluster + admin
    let row: Option<(Uuid, Uuid)> = sqlx::query_as(
        r#"
        SELECT c.id, m.id
        FROM clusters c
        JOIN members m ON m.cluster_id = c.id
        WHERE m.role = 'admin'
        ORDER BY c.created_at
        LIMIT 1
        "#,
    )
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);

    let (cluster_id, owner_id) = match row {
        Some(ids) => ids,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "error": "nenhum cluster com admin encontrado — crie um cluster primeiro" })),
            )
                .into_response();
        }
    };

    // Usar node_id da requisicao ou gerar novo
    let node_id = req.node_id.unwrap_or_else(Uuid::new_v4);

    match node_service::register_node(
        &state.db,
        node_id,
        cluster_id,
        owner_id,
        &req.node_type,
        &req.name,
        req.total_capacity,
        req.endpoint.as_deref(),
    )
    .await
    {
        Ok(id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "node_id": id })),
        )
            .into_response(),
        Err(node_service::NodeError::AlreadyRegistered) => (
            StatusCode::CONFLICT,
            Json(serde_json::json!({ "node_id": node_id, "message": "no ja registrado" })),
        )
            .into_response(),
        Err(e) => map_node_error(e).into_response(),
    }
}

/// GET /api/v1/clusters/:id/nodes
pub async fn list_nodes(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::db::nodes::find_by_cluster(&state.db, cluster_id).await {
        Ok(rows) => {
            let nodes: Vec<NodeResponse> = rows
                .into_iter()
                .map(|r| NodeResponse {
                    id: r.id,
                    cluster_id: r.cluster_id,
                    name: r.name,
                    node_type: r.r#type,
                    status: r.status,
                    total_capacity: r.total_capacity,
                    used_capacity: r.used_capacity,
                    last_heartbeat: r.last_heartbeat,
                })
                .collect();
            (StatusCode::OK, Json(nodes)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// POST /api/v1/nodes/:id/heartbeat
pub async fn heartbeat(
    State(state): State<AppState>,
    Path(node_id): Path<Uuid>,
) -> impl IntoResponse {
    match node_service::process_heartbeat(&state.db, node_id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => map_node_error(e).into_response(),
    }
}

/// DELETE /api/v1/nodes/:id
pub async fn disconnect_node(
    State(state): State<AppState>,
    Path(node_id): Path<Uuid>,
    Json(req): Json<DisconnectNodeRequest>,
) -> impl IntoResponse {
    match node_service::disconnect_node(&state.db, req.cluster_id, req.remover_id, node_id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => map_node_error(e).into_response(),
    }
}

fn map_node_error(e: node_service::NodeError) -> impl IntoResponse {
    let (status, msg) = match &e {
        node_service::NodeError::NotFound => (StatusCode::NOT_FOUND, e.to_string()),
        node_service::NodeError::Forbidden => (StatusCode::FORBIDDEN, e.to_string()),
        node_service::NodeError::MinimumNodesRequired => {
            (StatusCode::UNPROCESSABLE_ENTITY, e.to_string())
        }
        node_service::NodeError::AlreadyRegistered => (StatusCode::CONFLICT, e.to_string()),
        node_service::NodeError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    (status, Json(ErrorResponse { error: msg }))
}
