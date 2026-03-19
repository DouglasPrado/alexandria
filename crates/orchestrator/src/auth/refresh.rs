use chrono::{DateTime, Duration, Utc};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use super::{jwt::generate_refresh_token, AuthError};

const REFRESH_TOKEN_TTL_DAYS: i64 = 30;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Generates a fresh refresh token, stores its SHA-256 hash in the database,
/// and returns the raw (unhashed) token to be sent to the client.
///
/// Only the hash is persisted — the raw token is never stored.
pub async fn create_refresh_token(pool: &PgPool, member_id: Uuid) -> Result<String, AuthError> {
    let (raw_token, token_hash) = generate_refresh_token();
    let expires_at = Utc::now() + Duration::days(REFRESH_TOKEN_TTL_DAYS);

    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (member_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(member_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(pool)
    .await
    .map_err(|e| AuthError::Database(e.to_string()))?;

    Ok(raw_token)
}

/// Validates a raw refresh token, marks it as revoked (token rotation), and
/// returns the associated `member_id` so the caller can issue a new access token.
///
/// Fails with:
/// - `AuthError::InvalidRefreshToken` — no matching row found.
/// - `AuthError::RefreshTokenExpired`  — token exists but `expires_at` is in the past.
/// - `AuthError::RefreshTokenRevoked`  — token has already been revoked.
/// - `AuthError::Database(_)`          — unexpected DB error.
pub async fn validate_and_rotate(pool: &PgPool, raw_token: &str) -> Result<Uuid, AuthError> {
    let token_hash = sha256_hex(raw_token);

    let row: Option<RefreshTokenRow> = sqlx::query_as(
        r#"
        SELECT id, member_id, expires_at, revoked
        FROM refresh_tokens
        WHERE token_hash = $1
        "#,
    )
    .bind(&token_hash)
    .fetch_optional(pool)
    .await
    .map_err(|e| AuthError::Database(e.to_string()))?;

    let row = row.ok_or(AuthError::InvalidRefreshToken)?;

    if row.revoked {
        return Err(AuthError::RefreshTokenRevoked);
    }

    if row.expires_at < Utc::now() {
        return Err(AuthError::RefreshTokenExpired);
    }

    // Revoke the token (rotation — one-time use)
    sqlx::query(r#"UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1"#)
        .bind(row.id)
        .execute(pool)
        .await
        .map_err(|e| AuthError::Database(e.to_string()))?;

    Ok(row.member_id)
}

/// Revokes a refresh token without rotating it (e.g. explicit logout).
///
/// Returns `AuthError::InvalidRefreshToken` if no matching row is found.
pub async fn revoke_token(pool: &PgPool, raw_token: &str) -> Result<(), AuthError> {
    let token_hash = sha256_hex(raw_token);

    let result = sqlx::query(
        r#"UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1"#,
    )
    .bind(&token_hash)
    .execute(pool)
    .await
    .map_err(|e| AuthError::Database(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AuthError::InvalidRefreshToken);
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Internal row type for query_as
// ---------------------------------------------------------------------------

/// Internal projection used by `validate_and_rotate`.
#[derive(sqlx::FromRow)]
struct RefreshTokenRow {
    id: Uuid,
    member_id: Uuid,
    expires_at: DateTime<Utc>,
    revoked: bool,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Returns the lowercase hex-encoded SHA-256 digest of `input`.
fn sha256_hex(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}
