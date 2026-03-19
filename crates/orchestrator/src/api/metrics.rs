//! Endpoint de metricas Prometheus — Golden Signals + metricas de negocio.
//!
//! Blueprint: 15-observability.md
//! Format: Prometheus text exposition (text/plain; version=0.0.4)
//!
//! Metricas expostas:
//!   alexandria_files_total{status}     — arquivos por status
//!   alexandria_chunks_total            — total de chunks
//!   alexandria_replicas_total          — total de replicas
//!   alexandria_nodes_total{status}     — nos por status
//!   alexandria_alerts_active{severity} — alertas ativos por severidade
//!   alexandria_storage_bytes{type}     — capacidade total/usada

use axum::{extract::State, http::StatusCode, response::IntoResponse};

use super::AppState;

/// GET /metrics — metricas Prometheus.
pub async fn prometheus_metrics(State(state): State<AppState>) -> impl IntoResponse {
    match collect_metrics(&state.db).await {
        Ok(body) => (
            StatusCode::OK,
            [("content-type", "text/plain; version=0.0.4; charset=utf-8")],
            body,
        )
            .into_response(),
        Err(e) => {
            tracing::error!(error = %e, "failed to collect metrics");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

async fn collect_metrics(pool: &sqlx::PgPool) -> Result<String, sqlx::Error> {
    let mut out = String::with_capacity(2048);

    // --- Files by status ---
    out.push_str("# HELP alexandria_files_total Total de arquivos por status.\n");
    out.push_str("# TYPE alexandria_files_total gauge\n");
    let file_counts: Vec<(String, i64)> =
        sqlx::query_as("SELECT status, COUNT(*) FROM files GROUP BY status")
            .fetch_all(pool)
            .await?;
    for (status, count) in &file_counts {
        out.push_str(&format!(
            "alexandria_files_total{{status=\"{status}\"}} {count}\n"
        ));
    }

    // --- Chunks ---
    out.push_str("# HELP alexandria_chunks_total Total de chunks armazenados.\n");
    out.push_str("# TYPE alexandria_chunks_total gauge\n");
    let (chunks_total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM chunks")
        .fetch_one(pool)
        .await?;
    out.push_str(&format!("alexandria_chunks_total {chunks_total}\n"));

    // --- Replicas ---
    out.push_str("# HELP alexandria_replicas_total Total de replicas de chunks.\n");
    out.push_str("# TYPE alexandria_replicas_total gauge\n");
    let (replicas_total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM chunk_replicas")
        .fetch_one(pool)
        .await?;
    out.push_str(&format!("alexandria_replicas_total {replicas_total}\n"));

    // --- Nodes by status ---
    out.push_str("# HELP alexandria_nodes_total Total de nos por status.\n");
    out.push_str("# TYPE alexandria_nodes_total gauge\n");
    let node_counts: Vec<(String, i64)> =
        sqlx::query_as("SELECT status, COUNT(*) FROM nodes GROUP BY status")
            .fetch_all(pool)
            .await?;
    for (status, count) in &node_counts {
        out.push_str(&format!(
            "alexandria_nodes_total{{status=\"{status}\"}} {count}\n"
        ));
    }

    // --- Active alerts by severity ---
    out.push_str("# HELP alexandria_alerts_active Alertas ativos por severidade.\n");
    out.push_str("# TYPE alexandria_alerts_active gauge\n");
    let alert_counts: Vec<(String, i64)> = sqlx::query_as(
        "SELECT severity, COUNT(*) FROM alerts WHERE resolved = FALSE GROUP BY severity",
    )
    .fetch_all(pool)
    .await?;
    for (severity, count) in &alert_counts {
        out.push_str(&format!(
            "alexandria_alerts_active{{severity=\"{severity}\"}} {count}\n"
        ));
    }

    // --- Storage capacity ---
    out.push_str("# HELP alexandria_storage_bytes Capacidade de armazenamento em bytes.\n");
    out.push_str("# TYPE alexandria_storage_bytes gauge\n");
    let storage: Vec<(i64, i64)> =
        sqlx::query_as("SELECT COALESCE(SUM(total_capacity), 0), COALESCE(SUM(used_capacity), 0) FROM nodes WHERE status = 'online'")
            .fetch_all(pool)
            .await?;
    if let Some((total, used)) = storage.first() {
        out.push_str(&format!(
            "alexandria_storage_bytes{{type=\"total\"}} {total}\n"
        ));
        out.push_str(&format!(
            "alexandria_storage_bytes{{type=\"used\"}} {used}\n"
        ));
        out.push_str(&format!(
            "alexandria_storage_bytes{{type=\"available\"}} {}\n",
            total - used
        ));
    }

    // --- Clusters ---
    out.push_str("# HELP alexandria_clusters_total Total de clusters.\n");
    out.push_str("# TYPE alexandria_clusters_total gauge\n");
    let (clusters_total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM clusters")
        .fetch_one(pool)
        .await?;
    out.push_str(&format!("alexandria_clusters_total {clusters_total}\n"));

    // --- Members ---
    out.push_str("# HELP alexandria_members_total Total de membros.\n");
    out.push_str("# TYPE alexandria_members_total gauge\n");
    let (members_total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
        .fetch_one(pool)
        .await?;
    out.push_str(&format!("alexandria_members_total {members_total}\n"));

    Ok(out)
}
