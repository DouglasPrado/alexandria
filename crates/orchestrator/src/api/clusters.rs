//! Endpoints REST para Cluster e Members.
//!
//! POST /api/v1/clusters — criar cluster (UC-001)
//! GET  /api/v1/clusters/:id — obter cluster
//! POST /api/v1/clusters/:id/invite — convidar membro (UC-002)
//! POST /api/v1/invite/:token — aceitar convite
//! GET  /api/v1/clusters/:id/members — listar membros
//! DELETE /api/v1/clusters/:id/members/:member_id — remover membro

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::AppState;
use crate::services::cluster_service;

// -- Request/Response types --

#[derive(Deserialize)]
pub struct CreateClusterRequest {
    pub name: String,
    pub admin_name: String,
    pub admin_email: String,
    pub admin_password: String,
}

#[derive(Serialize)]
pub struct CreateClusterResponse {
    pub cluster_id: Uuid,
    pub crypto_cluster_id: String,
    pub seed_phrase: Vec<String>,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Serialize)]
pub struct ClusterResponse {
    pub id: Uuid,
    pub cluster_id: String,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct InviteMemberRequest {
    pub inviter_id: Uuid,
    pub email: String,
    pub role: String,
}

#[derive(Serialize)]
pub struct InviteResponse {
    pub token: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct AcceptInviteRequest {
    pub cluster_id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub invited_by: Uuid,
    pub password: String,
}

#[derive(Serialize)]
pub struct MemberResponse {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

// -- Handlers --

/// GET /api/v1/members/:id/quota — quota de armazenamento do membro
pub async fn get_member_quota(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::services::quota_service::get_quota(&state.db, member_id).await {
        Ok(info) => (StatusCode::OK, Json(info)).into_response(),
        Err(crate::services::quota_service::QuotaError::MemberNotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "membro nao encontrado".into(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// GET /api/v1/clusters/:id/tiering — analise de tiering (hot/warm/cold)
pub async fn cluster_tiering(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::services::tiering_service::analyze_cluster(&state.db, id).await {
        Ok(report) => (StatusCode::OK, Json(report)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// POST /api/v1/clusters/:id/rebalance — trigger manual de rebalanceamento
pub async fn rebalance_cluster(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::scheduler::rebalancing::run_for_cluster(&state.db, id).await {
        Ok(report) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "nodes_in_ring": report.nodes_in_ring,
                "chunks_analyzed": report.chunks_analyzed,
                "correctly_placed": report.correctly_placed,
                "need_migration": report.need_migration,
                "migrations_executed": report.migrations_executed,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// GET /api/v1/clusters — listar todos os clusters
pub async fn list_clusters(State(state): State<AppState>) -> impl IntoResponse {
    match crate::db::clusters::find_all(&state.db).await {
        Ok(rows) => {
            let clusters: Vec<ClusterResponse> = rows
                .into_iter()
                .map(|r| ClusterResponse {
                    id: r.id,
                    cluster_id: r.cluster_id,
                    name: r.name,
                    created_at: r.created_at,
                })
                .collect();
            (StatusCode::OK, Json(clusters)).into_response()
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

/// POST /api/v1/clusters — UC-001: Criar Cluster Familiar
pub async fn create_cluster(
    State(state): State<AppState>,
    Json(req): Json<CreateClusterRequest>,
) -> impl IntoResponse {
    // Guard: apenas um cluster por instancia (single-cluster deployment)
    let count: Result<(i64,), _> = sqlx::query_as("SELECT COUNT(*) FROM clusters")
        .fetch_one(&state.db)
        .await;

    match count {
        Ok((n,)) if n > 0 => {
            return (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "cluster ja existe nesta instancia".into(),
                }),
            )
                .into_response();
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "erro ao verificar clusters existentes".into(),
                }),
            )
                .into_response();
        }
        Ok(_) => {}
    }

    match cluster_service::create_cluster(
        &state.db,
        &req.name,
        &req.admin_name,
        &req.admin_email,
        &req.admin_password,
    )
    .await
    {
        Ok(result) => {
            // Gera tokens JWT para o admin recem criado
            let access_token = match crate::auth::jwt::encode_access_token(
                result.member_id,
                result.cluster_id,
                "admin",
                &state.jwt_secret,
            ) {
                Ok(t) => t,
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ErrorResponse {
                            error: e.to_string(),
                        }),
                    )
                        .into_response();
                }
            };

            let refresh_token =
                match crate::auth::refresh::create_refresh_token(&state.db, result.member_id)
                    .await
                {
                    Ok(t) => t,
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(ErrorResponse {
                                error: e.to_string(),
                            }),
                        )
                            .into_response();
                    }
                };

            // Armazena master_key no AppState (em memoria, nunca persistida)
            {
                let mut mk = state.master_key.write().await;
                *mk = Some(result.master_key);
            }

            (
                StatusCode::CREATED,
                Json(CreateClusterResponse {
                    cluster_id: result.cluster_id,
                    crypto_cluster_id: result.crypto_cluster_id,
                    seed_phrase: result.seed_phrase,
                    access_token,
                    refresh_token,
                    expires_in: 24 * 60 * 60, // 24 horas em segundos
                }),
            )
                .into_response()
        }
        Err(e) => map_error(e).into_response(),
    }
}

/// GET /api/v1/clusters/:id
pub async fn get_cluster(State(state): State<AppState>, Path(id): Path<Uuid>) -> impl IntoResponse {
    match crate::db::clusters::find_by_id(&state.db, id).await {
        Ok(Some(row)) => (
            StatusCode::OK,
            Json(ClusterResponse {
                id: row.id,
                cluster_id: row.cluster_id,
                name: row.name,
                created_at: row.created_at,
            }),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "cluster nao encontrado".into(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// POST /api/v1/clusters/:id/invite — UC-002: Convidar Membro
pub async fn invite_member(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
    Json(req): Json<InviteMemberRequest>,
) -> impl IntoResponse {
    match cluster_service::invite_member(
        &state.db,
        cluster_id,
        req.inviter_id,
        &req.email,
        &req.role,
    )
    .await
    {
        Ok(invite) => (
            StatusCode::CREATED,
            Json(InviteResponse {
                token: invite.token,
                expires_at: invite.expires_at,
            }),
        )
            .into_response(),
        Err(e) => map_error(e).into_response(),
    }
}

/// POST /api/v1/invite/:token — Aceitar convite
pub async fn accept_invite(
    State(state): State<AppState>,
    Path(_token): Path<String>,
    Json(req): Json<AcceptInviteRequest>,
) -> impl IntoResponse {
    match cluster_service::accept_invite(
        &state.db,
        req.cluster_id,
        &req.name,
        &req.email,
        &req.role,
        req.invited_by,
        &req.password,
    )
    .await
    {
        Ok(member_id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "member_id": member_id })),
        )
            .into_response(),
        Err(e) => map_error(e).into_response(),
    }
}

/// GET /api/v1/clusters/:id/members — Listar membros
pub async fn list_members(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::db::members::find_by_cluster(&state.db, cluster_id).await {
        Ok(rows) => {
            let members: Vec<MemberResponse> = rows
                .into_iter()
                .map(|r| MemberResponse {
                    id: r.id,
                    cluster_id: r.cluster_id,
                    name: r.name,
                    email: r.email,
                    role: r.role,
                    joined_at: r.joined_at,
                })
                .collect();
            (StatusCode::OK, Json(members)).into_response()
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

/// DELETE /api/v1/clusters/:id/members/:member_id — Remover membro
pub async fn remove_member(
    State(state): State<AppState>,
    Path((cluster_id, member_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let remover_id = match body.get("remover_id").and_then(|v| v.as_str()) {
        Some(id) => match Uuid::parse_str(id) {
            Ok(uuid) => uuid,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        error: "remover_id invalido".into(),
                    }),
                )
                    .into_response();
            }
        },
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "remover_id obrigatorio".into(),
                }),
            )
                .into_response();
        }
    };

    match cluster_service::remove_member(&state.db, cluster_id, remover_id, member_id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => map_error(e).into_response(),
    }
}

fn map_error(e: cluster_service::ClusterError) -> impl IntoResponse {
    let (status, msg) = match &e {
        cluster_service::ClusterError::NotFound => (StatusCode::NOT_FOUND, e.to_string()),
        cluster_service::ClusterError::EmailAlreadyExists => (StatusCode::CONFLICT, e.to_string()),
        cluster_service::ClusterError::Forbidden => (StatusCode::FORBIDDEN, e.to_string()),
        cluster_service::ClusterError::InvalidInviteToken => {
            (StatusCode::UNAUTHORIZED, e.to_string())
        }
        cluster_service::ClusterError::CannotRemoveLastAdmin => {
            (StatusCode::UNPROCESSABLE_ENTITY, e.to_string())
        }
        cluster_service::ClusterError::Database(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
        cluster_service::ClusterError::Crypto(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
        cluster_service::ClusterError::Auth(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    };
    (status, Json(ErrorResponse { error: msg }))
}
