//! Repository para a entidade Cluster.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ClusterRow {
    pub id: Uuid,
    pub cluster_id: String,
    pub name: String,
    pub public_key: Vec<u8>,
    pub encrypted_private_key: Vec<u8>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    cluster_id: &str,
    name: &str,
    public_key: &[u8],
    encrypted_private_key: &[u8],
) -> Result<ClusterRow, sqlx::Error> {
    sqlx::query_as::<_, ClusterRow>(
        r#"
        INSERT INTO clusters (cluster_id, name, public_key, encrypted_private_key)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
    )
    .bind(cluster_id)
    .bind(name)
    .bind(public_key)
    .bind(encrypted_private_key)
    .fetch_one(pool)
    .await
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<ClusterRow>, sqlx::Error> {
    sqlx::query_as::<_, ClusterRow>("SELECT * FROM clusters WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

#[allow(dead_code)]
pub async fn find_by_cluster_id(
    pool: &PgPool,
    cluster_id: &str,
) -> Result<Option<ClusterRow>, sqlx::Error> {
    sqlx::query_as::<_, ClusterRow>("SELECT * FROM clusters WHERE cluster_id = $1")
        .bind(cluster_id)
        .fetch_optional(pool)
        .await
}
