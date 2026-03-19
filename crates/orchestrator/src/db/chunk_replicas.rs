//! Repository para a entidade ChunkReplica.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ChunkReplicaRow {
    pub id: Uuid,
    pub chunk_id: String,
    pub node_id: Uuid,
    pub verified_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(pool: &PgPool, chunk_id: &str, node_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO chunk_replicas (chunk_id, node_id)
        VALUES ($1, $2)
        ON CONFLICT (chunk_id, node_id) DO NOTHING
        "#,
    )
    .bind(chunk_id)
    .bind(node_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn count_by_chunk(pool: &PgPool, chunk_id: &str) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM chunk_replicas WHERE chunk_id = $1")
        .bind(chunk_id)
        .fetch_one(pool)
        .await?;
    Ok(row.0)
}

#[allow(dead_code)]
pub async fn find_by_chunk(
    pool: &PgPool,
    chunk_id: &str,
) -> Result<Vec<ChunkReplicaRow>, sqlx::Error> {
    sqlx::query_as::<_, ChunkReplicaRow>("SELECT * FROM chunk_replicas WHERE chunk_id = $1")
        .bind(chunk_id)
        .fetch_all(pool)
        .await
}
