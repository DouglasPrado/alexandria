//! Repository para a entidade Node.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct NodeRow {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub owner_id: Uuid,
    pub r#type: String,
    pub name: String,
    pub total_capacity: i64,
    pub used_capacity: i64,
    pub status: String,
    pub endpoint: Option<String>,
    pub config_encrypted: Option<Vec<u8>>,
    pub last_heartbeat: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    cluster_id: Uuid,
    owner_id: Uuid,
    node_type: &str,
    name: &str,
    total_capacity: i64,
    endpoint: Option<&str>,
) -> Result<NodeRow, sqlx::Error> {
    sqlx::query_as::<_, NodeRow>(
        r#"
        INSERT INTO nodes (cluster_id, owner_id, type, name, total_capacity, endpoint)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(cluster_id)
    .bind(owner_id)
    .bind(node_type)
    .bind(name)
    .bind(total_capacity)
    .bind(endpoint)
    .fetch_one(pool)
    .await
}

/// Insere no com ID explicito (para auto-register onde o node-agent define seu proprio UUID).
pub async fn insert_with_id(
    pool: &PgPool,
    node_id: Uuid,
    cluster_id: Uuid,
    owner_id: Uuid,
    node_type: &str,
    name: &str,
    total_capacity: i64,
    endpoint: Option<&str>,
) -> Result<NodeRow, sqlx::Error> {
    sqlx::query_as::<_, NodeRow>(
        r#"
        INSERT INTO nodes (id, cluster_id, owner_id, type, name, total_capacity, endpoint)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(node_id)
    .bind(cluster_id)
    .bind(owner_id)
    .bind(node_type)
    .bind(name)
    .bind(total_capacity)
    .bind(endpoint)
    .fetch_one(pool)
    .await
}

pub async fn find_by_cluster(pool: &PgPool, cluster_id: Uuid) -> Result<Vec<NodeRow>, sqlx::Error> {
    sqlx::query_as::<_, NodeRow>("SELECT * FROM nodes WHERE cluster_id = $1 ORDER BY created_at")
        .bind(cluster_id)
        .fetch_all(pool)
        .await
}

#[allow(dead_code)]
pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<NodeRow>, sqlx::Error> {
    sqlx::query_as::<_, NodeRow>("SELECT * FROM nodes WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_heartbeat(pool: &PgPool, node_id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE nodes SET last_heartbeat = NOW(), status = 'online', updated_at = NOW() WHERE id = $1",
    )
    .bind(node_id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn update_status(
    pool: &PgPool,
    node_id: Uuid,
    status: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("UPDATE nodes SET status = $1, updated_at = NOW() WHERE id = $2")
        .bind(status)
        .bind(node_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM nodes WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn count_online_by_cluster(pool: &PgPool, cluster_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM nodes WHERE cluster_id = $1 AND status = 'online'")
            .bind(cluster_id)
            .fetch_one(pool)
            .await?;
    Ok(row.0)
}
