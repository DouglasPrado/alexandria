//! Service de convites: UC-002 (Convidar Membro) — geração, validação e aceitação.
//!
//! Fluxo:
//! 1. Admin cria convite (create_invite) → token aleatório salvo com hash na tabela invites
//! 2. Convidado valida o token (validate_invite) → retorna dados do cluster e role
//! 3. Convidado aceita o convite (accept_invite) → cria membro + vault + tokens JWT

use crate::auth;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

#[derive(Debug, Error)]
pub enum InviteError {
    #[error("convite nao encontrado")]
    NotFound,
    #[error("convite expirado")]
    Expired,
    #[error("convite ja foi aceito")]
    AlreadyUsed,
    #[error("email ja existe neste cluster")]
    EmailConflict,
    #[error("erro de banco: {0}")]
    Database(String),
    #[error("erro de autenticacao: {0}")]
    Auth(#[from] auth::AuthError),
}

impl From<sqlx::Error> for InviteError {
    fn from(e: sqlx::Error) -> Self {
        InviteError::Database(e.to_string())
    }
}

impl From<alexandria_core::crypto::CryptoError> for InviteError {
    fn from(e: alexandria_core::crypto::CryptoError) -> Self {
        InviteError::Database(e.to_string())
    }
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

pub struct ValidateInviteResponse {
    pub valid: bool,
    pub cluster_name: Option<String>,
    pub role: Option<String>,
    pub email: Option<String>,
    pub error: Option<String>, // "expired" | "already_used" | "not_found"
}

pub struct MemberInfo {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
}

pub struct AcceptInviteResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub member: MemberInfo,
    pub expires_in: i64,
}

// ---------------------------------------------------------------------------
// Internal row types
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct InviteRow {
    id: Uuid,
    cluster_id: Uuid,
    email: String,
    role: String,
    accepted: bool,
    expires_at: chrono::DateTime<chrono::Utc>,
    invited_by: Uuid,
}

#[derive(sqlx::FromRow)]
struct InviteWithClusterRow {
    id: Uuid,
    cluster_id: Uuid,
    cluster_name: String,
    email: String,
    role: String,
    accepted: bool,
    expires_at: chrono::DateTime<chrono::Utc>,
    invited_by: Uuid,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Computes SHA-256 hex digest of raw_token string.
fn sha256_hex(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Cria convite para um membro (UC-002).
///
/// - Gera token aleatório (32 bytes hex) via `auth::jwt::generate_refresh_token`
/// - Armazena hash SHA-256 na tabela `invites`
/// - Retorna o raw token para ser enviado ao convidado (ex: link de convite)
pub async fn create_invite(
    pool: &PgPool,
    cluster_id: Uuid,
    email: &str,
    role: &str,
    invited_by: Uuid,
) -> Result<String, InviteError> {
    let (raw_token, token_hash) = auth::jwt::generate_refresh_token();
    let expires_at = chrono::Utc::now() + chrono::Duration::days(7);

    sqlx::query(
        r#"
        INSERT INTO invites (cluster_id, email, role, token_hash, invited_by, accepted, expires_at)
        VALUES ($1, $2, $3, $4, $5, FALSE, $6)
        "#,
    )
    .bind(cluster_id)
    .bind(email)
    .bind(role)
    .bind(&token_hash)
    .bind(invited_by)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(raw_token)
}

/// Valida um token de convite sem aceitar.
///
/// Retorna informações do cluster e role caso válido.
/// Campos `error` preenchidos com "expired", "already_used" ou "not_found" quando inválido.
pub async fn validate_invite(
    pool: &PgPool,
    raw_token: &str,
) -> Result<ValidateInviteResponse, InviteError> {
    let token_hash = sha256_hex(raw_token);

    let row: Option<InviteWithClusterRow> = sqlx::query_as(
        r#"
        SELECT
            i.id,
            i.cluster_id,
            c.name AS cluster_name,
            i.email,
            i.role,
            i.accepted,
            i.expires_at,
            i.invited_by
        FROM invites i
        JOIN clusters c ON c.id = i.cluster_id
        WHERE i.token_hash = $1
        "#,
    )
    .bind(&token_hash)
    .fetch_optional(pool)
    .await?;

    let Some(invite) = row else {
        return Ok(ValidateInviteResponse {
            valid: false,
            cluster_name: None,
            role: None,
            email: None,
            error: Some("not_found".into()),
        });
    };

    if invite.accepted {
        return Ok(ValidateInviteResponse {
            valid: false,
            cluster_name: Some(invite.cluster_name),
            role: Some(invite.role),
            email: Some(invite.email),
            error: Some("already_used".into()),
        });
    }

    if invite.expires_at < chrono::Utc::now() {
        return Ok(ValidateInviteResponse {
            valid: false,
            cluster_name: Some(invite.cluster_name),
            role: Some(invite.role),
            email: Some(invite.email),
            error: Some("expired".into()),
        });
    }

    Ok(ValidateInviteResponse {
        valid: true,
        cluster_name: Some(invite.cluster_name),
        role: Some(invite.role),
        email: Some(invite.email),
        error: None,
    })
}

/// Aceita convite: cria membro + vault + tokens JWT.
///
/// Fluxo:
/// 1. Valida token (não expirado, não aceito)
/// 2. Hash da senha com Argon2id
/// 3. Cria membro com name, email, role e cluster_id do convite
/// 4. Cria vault individual criptografado com a senha
/// 5. Marca convite como aceito
/// 6. Gera access_token + refresh_token
pub async fn accept_invite(
    pool: &PgPool,
    raw_token: &str,
    name: &str,
    email: &str,
    password: &str,
    jwt_secret: &str,
) -> Result<AcceptInviteResponse, InviteError> {
    let token_hash = sha256_hex(raw_token);

    // 1. Busca convite
    let invite: Option<InviteRow> = sqlx::query_as(
        r#"
        SELECT id, cluster_id, email, role, accepted, expires_at, invited_by
        FROM invites
        WHERE token_hash = $1
        "#,
    )
    .bind(&token_hash)
    .fetch_optional(pool)
    .await?;

    let invite = invite.ok_or(InviteError::NotFound)?;

    if invite.accepted {
        return Err(InviteError::AlreadyUsed);
    }

    if invite.expires_at < chrono::Utc::now() {
        return Err(InviteError::Expired);
    }

    // 2. Verifica unicidade do email no cluster
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM members WHERE cluster_id = $1 AND email = $2",
    )
    .bind(invite.cluster_id)
    .bind(email)
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        return Err(InviteError::EmailConflict);
    }

    // 3. Hash da senha
    let password_hash = auth::password::hash_password(password)?;

    // 4. Cria membro
    let member_row: crate::db::members::MemberRow = sqlx::query_as(
        r#"
        INSERT INTO members (cluster_id, name, email, role, invited_by, joined_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
        "#,
    )
    .bind(invite.cluster_id)
    .bind(name)
    .bind(email)
    .bind(&invite.role)
    .bind(invite.invited_by)
    .fetch_one(pool)
    .await?;

    // 5. Salva password_hash
    sqlx::query("UPDATE members SET password_hash = $1 WHERE id = $2")
        .bind(&password_hash)
        .bind(member_row.id)
        .execute(pool)
        .await?;

    // 6. Cria vault individual criptografado com senha
    let empty_vault_data = serde_json::json!({
        "oauth_tokens": [],
        "node_credentials": [],
        "passwords": []
    });
    let vault_json = serde_json::to_vec(&empty_vault_data).expect("serialize vault");
    let vault_key = derive_vault_key(password);
    let encrypted_vault = alexandria_core::crypto::encrypt(&vault_key, &vault_json)?;
    crate::db::vaults::insert(pool, member_row.id, &encrypted_vault).await?;

    // 7. Marca convite como aceito
    sqlx::query("UPDATE invites SET accepted = TRUE WHERE id = $1")
        .bind(invite.id)
        .execute(pool)
        .await?;

    // 8. Gera tokens JWT
    let access_token = auth::jwt::encode_access_token(
        member_row.id,
        invite.cluster_id,
        &invite.role,
        jwt_secret,
    )?;

    let refresh_token = auth::refresh::create_refresh_token(pool, member_row.id).await?;

    Ok(AcceptInviteResponse {
        access_token,
        refresh_token,
        member: MemberInfo {
            id: member_row.id,
            cluster_id: invite.cluster_id,
            name: member_row.name.clone(),
            email: member_row.email.clone(),
            role: invite.role.clone(),
        },
        expires_in: 24 * 60 * 60,
    })
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Deriva chave de 32 bytes para criptografar vault a partir da senha.
fn derive_vault_key(password: &str) -> [u8; 32] {
    let hash = alexandria_core::hashing::sha256(password.as_bytes());
    *hash.as_bytes()
}
