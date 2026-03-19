//! Repository para a entidade Manifest.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ManifestRow {
    pub id: Uuid,
    pub file_id: Uuid,
    pub chunks_json: serde_json::Value,
    pub file_key_encrypted: Vec<u8>,
    pub signature: Option<Vec<u8>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    file_id: Uuid,
    chunks_json: &serde_json::Value,
    file_key_encrypted: &[u8],
    signature: Option<&[u8]>,
) -> Result<ManifestRow, sqlx::Error> {
    sqlx::query_as::<_, ManifestRow>(
        r#"
        INSERT INTO manifests (file_id, chunks_json, file_key_encrypted, signature)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
    )
    .bind(file_id)
    .bind(chunks_json)
    .bind(file_key_encrypted)
    .bind(signature)
    .fetch_one(pool)
    .await
}

pub async fn find_by_file(
    pool: &PgPool,
    file_id: Uuid,
) -> Result<Option<ManifestRow>, sqlx::Error> {
    sqlx::query_as::<_, ManifestRow>("SELECT * FROM manifests WHERE file_id = $1")
        .bind(file_id)
        .fetch_optional(pool)
        .await
}
