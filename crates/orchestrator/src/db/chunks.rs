//! Repository para a entidade Chunk.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ChunkRow {
    pub id: String,
    pub file_id: Uuid,
    pub chunk_index: i32,
    pub size: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    chunk_id: &str,
    file_id: Uuid,
    chunk_index: i32,
    size: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO chunks (id, file_id, chunk_index, size)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(chunk_id)
    .bind(file_id)
    .bind(chunk_index)
    .bind(size)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_file(pool: &PgPool, file_id: Uuid) -> Result<Vec<ChunkRow>, sqlx::Error> {
    sqlx::query_as::<_, ChunkRow>("SELECT * FROM chunks WHERE file_id = $1 ORDER BY chunk_index")
        .bind(file_id)
        .fetch_all(pool)
        .await
}
