//! Tiering scheduler task — avalia e loga sugestoes de migracao entre tiers.
//!
//! Roda periodicamente (default: 24h).
//! v1: detecta e loga migracoes sugeridas.
//! v2: executa migracoes via StorageProvider.

use crate::services::tiering_service;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn run(pool: &PgPool) -> Result<(), sqlx::Error> {
    let clusters: Vec<(Uuid,)> = sqlx::query_as("SELECT id FROM clusters")
        .fetch_all(pool)
        .await?;

    for (cluster_id,) in clusters {
        match tiering_service::analyze_cluster(pool, cluster_id).await {
            Ok(report) => {
                if !report.migrations_suggested.is_empty() {
                    tracing::info!(
                        cluster_id = %cluster_id,
                        hot = report.hot_files,
                        warm = report.warm_files,
                        cold = report.cold_files,
                        migrations = report.migrations_suggested.len(),
                        "tiering: migracoes sugeridas"
                    );
                }
            }
            Err(e) => {
                tracing::error!(cluster_id = %cluster_id, error = %e, "tiering analysis failed");
            }
        }
    }

    Ok(())
}
