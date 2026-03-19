//! Endpoint REST para Recovery (UC-007).
//!
//! POST /api/v1/recovery — inicia recovery via seed phrase

use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};

use super::AppState;
use crate::services::recovery_service;

#[derive(Deserialize)]
pub struct RecoveryRequest {
    pub seed_phrase: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

/// POST /api/v1/recovery — UC-007: Recovery via seed phrase.
pub async fn start_recovery(
    State(state): State<AppState>,
    Json(req): Json<RecoveryRequest>,
) -> impl IntoResponse {
    match recovery_service::execute_recovery(&state.db, &req.seed_phrase).await {
        Ok(report) => (StatusCode::OK, Json(report)).into_response(),
        Err(e) => map_recovery_error(e).into_response(),
    }
}

fn map_recovery_error(e: recovery_service::RecoveryError) -> impl IntoResponse {
    let (status, msg) = match &e {
        recovery_service::RecoveryError::InvalidSeedPhrase(_) => {
            (StatusCode::BAD_REQUEST, e.to_string())
        }
        recovery_service::RecoveryError::IncorrectSeedPhrase => {
            (StatusCode::UNAUTHORIZED, e.to_string())
        }
        recovery_service::RecoveryError::NoManifestsFound => (StatusCode::NOT_FOUND, e.to_string()),
        recovery_service::RecoveryError::Database(_)
        | recovery_service::RecoveryError::Crypto(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    };
    (status, Json(ErrorResponse { error: msg }))
}
