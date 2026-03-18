//! Repository para a entidade Member.

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)]
pub struct MemberRow {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub invited_by: Option<Uuid>,
    pub joined_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn insert(
    pool: &PgPool,
    cluster_id: Uuid,
    name: &str,
    email: &str,
    role: &str,
    invited_by: Option<Uuid>,
) -> Result<MemberRow, sqlx::Error> {
    sqlx::query_as::<_, MemberRow>(
        r#"
        INSERT INTO members (cluster_id, name, email, role, invited_by, joined_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
        "#,
    )
    .bind(cluster_id)
    .bind(name)
    .bind(email)
    .bind(role)
    .bind(invited_by)
    .fetch_one(pool)
    .await
}

pub async fn find_by_cluster(
    pool: &PgPool,
    cluster_id: Uuid,
) -> Result<Vec<MemberRow>, sqlx::Error> {
    sqlx::query_as::<_, MemberRow>("SELECT * FROM members WHERE cluster_id = $1 ORDER BY joined_at")
        .bind(cluster_id)
        .fetch_all(pool)
        .await
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<MemberRow>, sqlx::Error> {
    sqlx::query_as::<_, MemberRow>("SELECT * FROM members WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_email_in_cluster(
    pool: &PgPool,
    cluster_id: Uuid,
    email: &str,
) -> Result<Option<MemberRow>, sqlx::Error> {
    sqlx::query_as::<_, MemberRow>("SELECT * FROM members WHERE cluster_id = $1 AND email = $2")
        .bind(cluster_id)
        .bind(email)
        .fetch_optional(pool)
        .await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM members WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn count_admins(pool: &PgPool, cluster_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM members WHERE cluster_id = $1 AND role = 'admin'")
            .bind(cluster_id)
            .fetch_one(pool)
            .await?;
    Ok(row.0)
}
