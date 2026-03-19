use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Serialize;
use uuid::Uuid;

use super::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub version: &'static str,
}

pub async fn health_check(State(_state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

#[derive(Serialize)]
pub struct ClusterHealthResponse {
    pub cluster_id: Uuid,
    pub files: FilesHealth,
    pub storage: StorageHealth,
    pub nodes: NodesHealth,
    pub replication: ReplicationHealth,
    pub alerts: AlertsHealth,
}

#[derive(Serialize)]
pub struct FilesHealth {
    pub total: i64,
    pub ready: i64,
    pub processing: i64,
    pub error: i64,
}

#[derive(Serialize)]
pub struct StorageHealth {
    pub total_bytes: i64,
    pub used_bytes: i64,
    pub available_bytes: i64,
    pub usage_percent: f64,
}

#[derive(Serialize)]
pub struct NodesHealth {
    pub total: i64,
    pub online: i64,
    pub suspect: i64,
    pub lost: i64,
}

#[derive(Serialize)]
pub struct ReplicationHealth {
    pub total_chunks: i64,
    pub total_replicas: i64,
    pub avg_replicas_per_chunk: f64,
    pub under_replicated: i64,
    pub health_percent: f64,
}

#[derive(Serialize)]
pub struct AlertsHealth {
    pub active: i64,
    pub critical: i64,
    pub warning: i64,
    pub info: i64,
}

/// GET /api/v1/clusters/:id/health — dashboard de saude completo
pub async fn cluster_health(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
) -> impl IntoResponse {
    match collect_cluster_health(&state.db, cluster_id).await {
        Ok(health) => (StatusCode::OK, Json(health)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn collect_cluster_health(
    pool: &sqlx::PgPool,
    cluster_id: Uuid,
) -> Result<ClusterHealthResponse, sqlx::Error> {
    // Files by status
    let file_counts: Vec<(String, i64)> =
        sqlx::query_as("SELECT status, COUNT(*) FROM files WHERE cluster_id = $1 GROUP BY status")
            .bind(cluster_id)
            .fetch_all(pool)
            .await?;

    let mut files = FilesHealth {
        total: 0,
        ready: 0,
        processing: 0,
        error: 0,
    };
    for (status, count) in &file_counts {
        files.total += count;
        match status.as_str() {
            "ready" => files.ready = *count,
            "processing" => files.processing = *count,
            "error" => files.error = *count,
            _ => {}
        }
    }

    // Nodes by status
    let node_counts: Vec<(String, i64)> =
        sqlx::query_as("SELECT status, COUNT(*) FROM nodes WHERE cluster_id = $1 GROUP BY status")
            .bind(cluster_id)
            .fetch_all(pool)
            .await?;

    let mut nodes = NodesHealth {
        total: 0,
        online: 0,
        suspect: 0,
        lost: 0,
    };
    for (status, count) in &node_counts {
        nodes.total += count;
        match status.as_str() {
            "online" => nodes.online = *count,
            "suspect" => nodes.suspect = *count,
            "lost" => nodes.lost = *count,
            _ => {}
        }
    }

    // Storage capacity
    let (total_cap, used_cap): (i64, i64) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_capacity), 0), COALESCE(SUM(used_capacity), 0) FROM nodes WHERE cluster_id = $1 AND status = 'online'",
    )
    .bind(cluster_id)
    .fetch_one(pool)
    .await?;

    let storage = StorageHealth {
        total_bytes: total_cap,
        used_bytes: used_cap,
        available_bytes: total_cap - used_cap,
        usage_percent: if total_cap > 0 {
            (used_cap as f64 / total_cap as f64) * 100.0
        } else {
            0.0
        },
    };

    // Replication health
    let (total_chunks,): (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT c.id) FROM chunks c JOIN files f ON c.file_id = f.id WHERE f.cluster_id = $1",
    )
    .bind(cluster_id)
    .fetch_one(pool)
    .await?;

    let (total_replicas,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM chunk_replicas cr JOIN chunks c ON cr.chunk_id = c.id JOIN files f ON c.file_id = f.id WHERE f.cluster_id = $1",
    )
    .bind(cluster_id)
    .fetch_one(pool)
    .await?;

    let (under_replicated,): (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM (
            SELECT c.id, COUNT(cr.id) as replica_count
            FROM chunks c
            JOIN files f ON c.file_id = f.id
            LEFT JOIN chunk_replicas cr ON cr.chunk_id = c.id
            WHERE f.cluster_id = $1
            GROUP BY c.id
            HAVING COUNT(cr.id) < 3
        ) sub
        "#,
    )
    .bind(cluster_id)
    .fetch_one(pool)
    .await?;

    let replication = ReplicationHealth {
        total_chunks,
        total_replicas,
        avg_replicas_per_chunk: if total_chunks > 0 {
            total_replicas as f64 / total_chunks as f64
        } else {
            0.0
        },
        under_replicated,
        health_percent: if total_chunks > 0 {
            ((total_chunks - under_replicated) as f64 / total_chunks as f64) * 100.0
        } else {
            100.0
        },
    };

    // Alerts
    let alert_counts: Vec<(String, i64)> = sqlx::query_as(
        "SELECT severity, COUNT(*) FROM alerts WHERE cluster_id = $1 AND resolved = FALSE GROUP BY severity",
    )
    .bind(cluster_id)
    .fetch_all(pool)
    .await?;

    let mut alerts = AlertsHealth {
        active: 0,
        critical: 0,
        warning: 0,
        info: 0,
    };
    for (severity, count) in &alert_counts {
        alerts.active += count;
        match severity.as_str() {
            "critical" => alerts.critical = *count,
            "warning" => alerts.warning = *count,
            "info" => alerts.info = *count,
            _ => {}
        }
    }

    Ok(ClusterHealthResponse {
        cluster_id,
        files,
        storage,
        nodes,
        replication,
        alerts,
    })
}
