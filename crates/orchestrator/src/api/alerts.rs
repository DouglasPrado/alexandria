//! Endpoints REST para Alerts.
//!
//! GET /api/v1/clusters/:id/alerts — listar alertas ativos

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Serialize;
use uuid::Uuid;

use super::AppState;

#[derive(Serialize)]
pub struct AlertResponse {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub alert_type: String,
    pub message: String,
    pub severity: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

/// GET /api/v1/clusters/:id/alerts
pub async fn list_alerts(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::db::alerts::find_active_by_cluster(&state.db, cluster_id).await {
        Ok(rows) => {
            let alerts: Vec<AlertResponse> = rows
                .into_iter()
                .map(|r| AlertResponse {
                    id: r.id,
                    cluster_id: r.cluster_id,
                    alert_type: r.r#type,
                    message: r.message,
                    severity: r.severity,
                    resource_type: r.resource_type,
                    resource_id: r.resource_id,
                    created_at: r.created_at,
                })
                .collect();
            (StatusCode::OK, Json(alerts)).into_response()
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
