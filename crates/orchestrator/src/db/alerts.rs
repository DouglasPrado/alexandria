//! Repository para a entidade Alert.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct AlertRow {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub r#type: String,
    pub message: String,
    pub severity: String,
    pub resolved: bool,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[allow(dead_code)]
pub async fn insert(
    pool: &PgPool,
    cluster_id: Uuid,
    alert_type: &str,
    message: &str,
    severity: &str,
    resource_type: Option<&str>,
    resource_id: Option<&str>,
) -> Result<AlertRow, sqlx::Error> {
    sqlx::query_as::<_, AlertRow>(
        r#"
        INSERT INTO alerts (cluster_id, type, message, severity, resource_type, resource_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(cluster_id)
    .bind(alert_type)
    .bind(message)
    .bind(severity)
    .bind(resource_type)
    .bind(resource_id)
    .fetch_one(pool)
    .await
}

pub async fn find_active_by_cluster(
    pool: &PgPool,
    cluster_id: Uuid,
) -> Result<Vec<AlertRow>, sqlx::Error> {
    sqlx::query_as::<_, AlertRow>(
        "SELECT * FROM alerts WHERE cluster_id = $1 AND resolved = FALSE ORDER BY created_at DESC",
    )
    .bind(cluster_id)
    .fetch_all(pool)
    .await
}

#[allow(dead_code)]
pub async fn resolve(pool: &PgPool, alert_id: Uuid) -> Result<bool, sqlx::Error> {
    let result =
        sqlx::query("UPDATE alerts SET resolved = TRUE, resolved_at = NOW() WHERE id = $1")
            .bind(alert_id)
            .execute(pool)
            .await?;
    Ok(result.rows_affected() > 0)
}

#[allow(dead_code)]
pub async fn find_by_resource(
    pool: &PgPool,
    resource_type: &str,
    resource_id: &str,
) -> Result<Option<AlertRow>, sqlx::Error> {
    sqlx::query_as::<_, AlertRow>(
        "SELECT * FROM alerts WHERE resource_type = $1 AND resource_id = $2 AND resolved = FALSE",
    )
    .bind(resource_type)
    .bind(resource_id)
    .fetch_optional(pool)
    .await
}
