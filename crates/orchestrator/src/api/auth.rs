//! Endpoints REST de autenticacao.
//!
//! POST /api/v1/auth/login   — autenticar membro
//! POST /api/v1/auth/refresh — rotacionar tokens
//! POST /api/v1/auth/logout  — revogar refresh token (requer auth)
//! GET  /api/v1/auth/me      — dados do membro autenticado (requer auth)

use axum::{
    Json,
    extract::State,
    http::StatusCode,
};
use axum::Extension;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::AppState;
use crate::auth::claims::AuthClaims;
use crate::services::auth_service::{self, AuthServiceError, MemberInfo};

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub member: MemberInfoResponse,
    pub expires_in: i64,
    pub master_key_status: String,
}

#[derive(Serialize)]
pub struct MemberInfoResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub cluster_id: Uuid,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Serialize)]
pub struct RefreshResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Deserialize)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

// ---------------------------------------------------------------------------
// Conversao interna
// ---------------------------------------------------------------------------

fn member_info_to_response(info: MemberInfo) -> MemberInfoResponse {
    MemberInfoResponse {
        id: info.id,
        name: info.name,
        email: info.email,
        role: info.role,
        cluster_id: info.cluster_id,
    }
}

fn map_auth_error(e: AuthServiceError) -> StatusCode {
    match e {
        AuthServiceError::InvalidCredentials | AuthServiceError::NoPasswordSet => {
            StatusCode::UNAUTHORIZED
        }
        AuthServiceError::MemberNotFound => StatusCode::NOT_FOUND,
        AuthServiceError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
        AuthServiceError::Auth(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// POST /api/v1/auth/login
///
/// Autentica membro com email e senha. Retorna access_token, refresh_token e
/// informacoes do membro.
pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let master_key_loaded = state.master_key.read().await.is_some();

    let result = auth_service::login(
        &state.db,
        &req.email,
        &req.password,
        &state.jwt_secret,
        master_key_loaded,
    )
    .await
    .map_err(map_auth_error)?;

    Ok(Json(LoginResponse {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        member: member_info_to_response(result.member),
        expires_in: result.expires_in,
        master_key_status: result.master_key_status,
    }))
}

/// POST /api/v1/auth/refresh
///
/// Rotaciona o refresh token e emite novos tokens de acesso e refresh.
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<RefreshResponse>, StatusCode> {
    let result = auth_service::refresh_tokens(&state.db, &req.refresh_token, &state.jwt_secret)
        .await
        .map_err(map_auth_error)?;

    Ok(Json(RefreshResponse {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
    }))
}

/// POST /api/v1/auth/logout
///
/// Revoga o refresh token. Requer autenticacao via JWT (Extension<AuthClaims>).
/// Retorna 204 No Content em caso de sucesso.
pub async fn logout(
    Extension(_claims): Extension<AuthClaims>,
    State(state): State<AppState>,
    Json(req): Json<LogoutRequest>,
) -> StatusCode {
    match auth_service::logout(&state.db, &req.refresh_token).await {
        Ok(()) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

/// GET /api/v1/auth/me
///
/// Retorna dados do membro autenticado. Requer autenticacao via JWT.
pub async fn me(
    Extension(claims): Extension<AuthClaims>,
    State(state): State<AppState>,
) -> Result<Json<MemberInfoResponse>, StatusCode> {
    let info = auth_service::get_me(&state.db, claims.member_id)
        .await
        .map_err(map_auth_error)?;

    Ok(Json(member_info_to_response(info)))
}
