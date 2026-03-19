//! Repository para a entidade File.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct FileRow {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub uploaded_by: Uuid,
    pub original_name: String,
    pub media_type: String,
    pub mime_type: String,
    pub file_extension: String,
    pub original_size: i64,
    pub optimized_size: i64,
    pub content_hash: String,
    pub metadata: Option<serde_json::Value>,
    pub preview_chunk_id: Option<String>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub struct InsertFileParams<'a> {
    pub cluster_id: Uuid,
    pub uploaded_by: Uuid,
    pub original_name: &'a str,
    pub media_type: &'a str,
    pub mime_type: &'a str,
    pub file_extension: &'a str,
    pub original_size: i64,
}

pub async fn insert(pool: &PgPool, params: InsertFileParams<'_>) -> Result<FileRow, sqlx::Error> {
    sqlx::query_as::<_, FileRow>(
        r#"
        INSERT INTO files (cluster_id, uploaded_by, original_name, media_type, mime_type, file_extension, original_size, optimized_size, content_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, '')
        RETURNING *
        "#,
    )
    .bind(params.cluster_id)
    .bind(params.uploaded_by)
    .bind(params.original_name)
    .bind(params.media_type)
    .bind(params.mime_type)
    .bind(params.file_extension)
    .bind(params.original_size)
    .fetch_one(pool)
    .await
}

pub async fn find_by_cluster_paginated(
    pool: &PgPool,
    cluster_id: Uuid,
    cursor: Option<chrono::DateTime<chrono::Utc>>,
    limit: i64,
) -> Result<Vec<FileRow>, sqlx::Error> {
    match cursor {
        Some(cursor_ts) => {
            sqlx::query_as::<_, FileRow>(
                r#"
                SELECT * FROM files
                WHERE cluster_id = $1 AND status = 'ready' AND created_at < $2
                ORDER BY created_at DESC
                LIMIT $3
                "#,
            )
            .bind(cluster_id)
            .bind(cursor_ts)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
        None => {
            sqlx::query_as::<_, FileRow>(
                r#"
                SELECT * FROM files
                WHERE cluster_id = $1 AND status = 'ready'
                ORDER BY created_at DESC
                LIMIT $2
                "#,
            )
            .bind(cluster_id)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
    }
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<FileRow>, sqlx::Error> {
    sqlx::query_as::<_, FileRow>("SELECT * FROM files WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

#[allow(dead_code)]
pub async fn update_status(
    pool: &PgPool,
    file_id: Uuid,
    status: &str,
    optimized_size: i64,
    content_hash: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE files SET status = $1, optimized_size = $2, content_hash = $3, updated_at = NOW() WHERE id = $4",
    )
    .bind(status)
    .bind(optimized_size)
    .bind(content_hash)
    .bind(file_id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

#[allow(dead_code)]
pub async fn find_by_content_hash(
    pool: &PgPool,
    content_hash: &str,
) -> Result<Option<FileRow>, sqlx::Error> {
    sqlx::query_as::<_, FileRow>("SELECT * FROM files WHERE content_hash = $1")
        .bind(content_hash)
        .fetch_optional(pool)
        .await
}
