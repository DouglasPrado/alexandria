//! Repository para a entidade Vault.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct VaultRow {
    pub id: Uuid,
    pub member_id: Uuid,
    pub vault_data: Vec<u8>,
    pub encryption_algorithm: String,
    pub version: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    member_id: Uuid,
    vault_data: &[u8],
) -> Result<VaultRow, sqlx::Error> {
    sqlx::query_as::<_, VaultRow>(
        r#"
        INSERT INTO vaults (member_id, vault_data)
        VALUES ($1, $2)
        RETURNING *
        "#,
    )
    .bind(member_id)
    .bind(vault_data)
    .fetch_one(pool)
    .await
}

#[allow(dead_code)]
pub async fn find_by_member(
    pool: &PgPool,
    member_id: Uuid,
) -> Result<Option<VaultRow>, sqlx::Error> {
    sqlx::query_as::<_, VaultRow>("SELECT * FROM vaults WHERE member_id = $1")
        .bind(member_id)
        .fetch_optional(pool)
        .await
}
