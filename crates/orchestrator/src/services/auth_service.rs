//! Service de Autenticacao: login, refresh, logout, me.
//!
//! Implementa a logica de negocio para autenticacao de membros.

use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

use crate::auth::{self, AuthError};
use crate::auth::jwt::encode_access_token;
use crate::auth::refresh::{create_refresh_token, revoke_token, validate_and_rotate};

const ACCESS_TOKEN_TTL_SECS: i64 = 24 * 60 * 60; // 24 horas

#[derive(Debug, Error)]
pub enum AuthServiceError {
    #[error("credenciais invalidas")]
    InvalidCredentials,
    #[error("membro nao encontrado")]
    MemberNotFound,
    #[error("membro nao possui senha configurada")]
    NoPasswordSet,
    #[error("erro de banco: {0}")]
    Database(String),
    #[error("erro de autenticacao: {0}")]
    Auth(#[from] AuthError),
}

impl From<sqlx::Error> for AuthServiceError {
    fn from(e: sqlx::Error) -> Self {
        AuthServiceError::Database(e.to_string())
    }
}

/// Informacoes publicas do membro autenticado.
#[derive(Debug, Clone)]
pub struct MemberInfo {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub cluster_id: Uuid,
}

/// Resposta ao login bem-sucedido.
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub member: MemberInfo,
    pub expires_in: i64,
    pub master_key_status: String,
}

/// Resposta ao refresh de tokens.
pub struct RefreshResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

/// Row interno para query de membro com password_hash.
#[derive(sqlx::FromRow)]
struct MemberAuthRow {
    id: Uuid,
    cluster_id: Uuid,
    name: String,
    email: String,
    role: String,
    password_hash: Option<String>,
}

/// Autentica membro por email/senha e emite tokens de acesso e refresh.
///
/// Fluxo:
/// 1. Busca membro por email
/// 2. Verifica senha contra password_hash (Argon2id)
/// 3. Gera access_token (JWT) e refresh_token
/// 4. Retorna LoginResponse com tokens + info do membro + status da master_key
pub async fn login(
    pool: &PgPool,
    email: &str,
    password: &str,
    jwt_secret: &str,
    master_key_loaded: bool,
) -> Result<LoginResponse, AuthServiceError> {
    // 1. Busca membro por email (v1: cluster unico, sem filtro de cluster_id)
    let row: Option<MemberAuthRow> = sqlx::query_as(
        r#"
        SELECT id, cluster_id, name, email, role, password_hash
        FROM members
        WHERE email = $1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    let row = row.ok_or(AuthServiceError::MemberNotFound)?;

    // 2. Verifica se membro tem senha configurada
    let hash = row.password_hash.as_deref().ok_or(AuthServiceError::NoPasswordSet)?;

    // 3. Verifica senha contra hash Argon2id
    let valid = auth::password::verify_password(password, hash)?;
    if !valid {
        return Err(AuthServiceError::InvalidCredentials);
    }

    // 4. Gera tokens
    let access_token = encode_access_token(row.id, row.cluster_id, &row.role, jwt_secret)?;
    let refresh_token = create_refresh_token(pool, row.id).await?;

    let master_key_status = if master_key_loaded {
        "ready".to_string()
    } else {
        "locked".to_string()
    };

    Ok(LoginResponse {
        access_token,
        refresh_token,
        member: MemberInfo {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            cluster_id: row.cluster_id,
        },
        expires_in: ACCESS_TOKEN_TTL_SECS,
        master_key_status,
    })
}

/// Rotaciona refresh token e emite novos tokens de acesso e refresh.
///
/// Fluxo:
/// 1. Valida e revoga o refresh token atual (rotacao)
/// 2. Busca informacoes do membro
/// 3. Gera novos access_token e refresh_token
pub async fn refresh_tokens(
    pool: &PgPool,
    raw_refresh_token: &str,
    jwt_secret: &str,
) -> Result<RefreshResponse, AuthServiceError> {
    // 1. Valida e rotaciona o refresh token
    let member_id = validate_and_rotate(pool, raw_refresh_token).await?;

    // 2. Busca info do membro
    let member = get_me(pool, member_id).await?;

    // 3. Gera novos tokens
    let access_token = encode_access_token(member.id, member.cluster_id, &member.role, jwt_secret)?;
    let refresh_token = create_refresh_token(pool, member.id).await?;

    Ok(RefreshResponse {
        access_token,
        refresh_token,
        expires_in: ACCESS_TOKEN_TTL_SECS,
    })
}

/// Revoga o refresh token (logout explicito).
pub async fn logout(pool: &PgPool, raw_refresh_token: &str) -> Result<(), AuthServiceError> {
    revoke_token(pool, raw_refresh_token).await?;
    Ok(())
}

/// Retorna informacoes publicas do membro autenticado.
pub async fn get_me(pool: &PgPool, member_id: Uuid) -> Result<MemberInfo, AuthServiceError> {
    let row: Option<MemberAuthRow> = sqlx::query_as(
        r#"
        SELECT id, cluster_id, name, email, role, password_hash
        FROM members
        WHERE id = $1
        "#,
    )
    .bind(member_id)
    .fetch_optional(pool)
    .await?;

    let row = row.ok_or(AuthServiceError::MemberNotFound)?;

    Ok(MemberInfo {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        cluster_id: row.cluster_id,
    })
}
