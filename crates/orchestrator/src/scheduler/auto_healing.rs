//! Auto-Healing — re-replicacao automatica de chunks sub-replicados.
//!
//! Trigger: No marcado como "lost" pelo heartbeat monitor.
//! Processo (07-critical_flows.md):
//!   1. Consulta chunk_replicas do no perdido
//!   2. Identifica chunks com COUNT(replicas) < replication_factor()
//!   3. ConsistentHashRing seleciona novos destinos
//!   4. Copia chunk de replica saudavel → novo destino
//!   5. Atualiza chunk_replicas e resolve alertas
//!
//! Na v1, este modulo detecta chunks sub-replicados e gera alertas.
//! A copia real via StorageProvider sera implementada quando o pipeline
//! de distribuicao estiver completo.

use sqlx::PgPool;

fn replication_factor() -> i64 {
    std::env::var("replication_factor()")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1)
}

/// Executa um ciclo de auto-healing.
pub async fn run(pool: &PgPool) -> Result<HealingReport, sqlx::Error> {
    let mut report = HealingReport::default();

    // 1. Encontrar nos perdidos
    let lost_nodes: Vec<(uuid::Uuid, uuid::Uuid)> =
        sqlx::query_as("SELECT id, cluster_id FROM nodes WHERE status = 'lost'")
            .fetch_all(pool)
            .await?;

    if lost_nodes.is_empty() {
        return Ok(report);
    }

    report.lost_nodes = lost_nodes.len();

    // 2. Para cada no perdido, encontrar chunks sub-replicados
    for (node_id, cluster_id) in &lost_nodes {
        let under_replicated: Vec<(String, i64)> = sqlx::query_as(
            r#"
            SELECT cr.chunk_id, COUNT(*) as replica_count
            FROM chunk_replicas cr
            WHERE cr.chunk_id IN (
                SELECT chunk_id FROM chunk_replicas WHERE node_id = $1
            )
            GROUP BY cr.chunk_id
            HAVING COUNT(*) < $2
            "#,
        )
        .bind(node_id)
        .bind(replication_factor())
        .fetch_all(pool)
        .await?;

        report.under_replicated_chunks += under_replicated.len();

        // 3. Gerar alerta de baixa replicacao por cluster (se houver chunks afetados)
        if !under_replicated.is_empty() {
            sqlx::query(
                r#"
                INSERT INTO alerts (cluster_id, type, message, severity, resource_type, resource_id)
                SELECT $1, 'low_replication', $2, 'critical', 'node', $3
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts
                    WHERE resource_type = 'node' AND resource_id = $3
                      AND type = 'low_replication' AND resolved = FALSE
                )
                "#,
            )
            .bind(cluster_id)
            .bind(format!(
                "{} chunks com replicacao abaixo de {} (no perdido)",
                under_replicated.len(),
                replication_factor()
            ))
            .bind(node_id.to_string())
            .execute(pool)
            .await?;
        }

        // TODO (v2): Copiar chunks via StorageProvider + ConsistentHashRing
        // Para cada chunk sub-replicado:
        //   - Ler de replica saudavel
        //   - HashRing.get_nodes(chunk_id) para novo destino
        //   - StorageProvider.put() no novo destino
        //   - INSERT chunk_replicas (chunk_id, new_node_id)
        //   - DELETE chunk_replicas (chunk_id, lost_node_id)
    }

    if report.under_replicated_chunks > 0 {
        tracing::warn!(
            lost_nodes = report.lost_nodes,
            under_replicated = report.under_replicated_chunks,
            "auto-healing: chunks sub-replicados detectados"
        );
    }

    Ok(report)
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct HealingReport {
    pub lost_nodes: usize,
    pub under_replicated_chunks: usize,
}
