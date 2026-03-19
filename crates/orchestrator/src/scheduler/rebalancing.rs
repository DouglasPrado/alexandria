//! Rebalancing — redistribuicao de chunks quando nos entram/saem.
//!
//! Glossario: Rebalanceamento = redistribuicao proporcional de chunks entre nos.
//! ConsistentHashRing minimiza migracao (K/N chunks migram por evento).
//!
//! Processo:
//!   1. Construir HashRing com nos online + capacidades atuais
//!   2. Para cada chunk: comparar nos atuais (chunk_replicas) vs nos ideais (HashRing)
//!   3. Identificar chunks mal-posicionados (no atual != no ideal)
//!   4. Gerar plano de migracao
//!   5. (v2) Executar migracao via StorageProvider
//!
//! Trigger: periodico (1h) ou manual (POST /clusters/{id}/rebalance)

use alexandria_core::consistent_hashing::HashRing;
use sqlx::PgPool;
use uuid::Uuid;

fn replication_factor() -> usize {
    std::env::var("replication_factor()")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1)
}

/// Resultado de um ciclo de rebalanceamento.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct RebalanceReport {
    /// Nodes online considerados no ring.
    pub nodes_in_ring: usize,
    /// Total de chunks analisados.
    pub chunks_analyzed: usize,
    /// Chunks que estao nos nos corretos.
    pub correctly_placed: usize,
    /// Chunks que precisam migrar.
    pub need_migration: usize,
    /// Migracoes executadas (v2).
    pub migrations_executed: usize,
}

/// Chunk que precisa migrar.
#[derive(Debug)]
#[allow(dead_code)]
pub struct MigrationPlan {
    pub chunk_id: String,
    pub current_nodes: Vec<Uuid>,
    pub ideal_nodes: Vec<Uuid>,
    pub to_add: Vec<Uuid>,
    pub to_remove: Vec<Uuid>,
}

/// Executa um ciclo de rebalanceamento para um cluster.
pub async fn run_for_cluster(
    pool: &PgPool,
    cluster_id: Uuid,
) -> Result<RebalanceReport, sqlx::Error> {
    let mut report = RebalanceReport::default();

    // 1. Buscar nos online do cluster
    let online_nodes: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT id, total_capacity FROM nodes WHERE cluster_id = $1 AND status = 'online'",
    )
    .bind(cluster_id)
    .fetch_all(pool)
    .await?;

    if online_nodes.len() < replication_factor() {
        // Sem nos suficientes para rebalancear
        return Ok(report);
    }

    // 2. Construir HashRing
    let mut ring = HashRing::new();
    for (node_id, capacity) in &online_nodes {
        ring.add_node(*node_id, *capacity as u64);
    }
    report.nodes_in_ring = online_nodes.len();

    // 3. Buscar todos chunks do cluster (via files)
    let chunks: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT DISTINCT c.id
        FROM chunks c
        JOIN files f ON c.file_id = f.id
        WHERE f.cluster_id = $1 AND f.status = 'ready'
        "#,
    )
    .bind(cluster_id)
    .fetch_all(pool)
    .await?;

    report.chunks_analyzed = chunks.len();

    // 4. Para cada chunk, comparar placement atual vs ideal
    for (chunk_id,) in &chunks {
        let ideal_nodes = ring.get_nodes(chunk_id, replication_factor());

        let current_nodes: Vec<(Uuid,)> =
            sqlx::query_as("SELECT node_id FROM chunk_replicas WHERE chunk_id = $1")
                .bind(chunk_id)
                .fetch_all(pool)
                .await?;

        let current_set: std::collections::HashSet<Uuid> =
            current_nodes.iter().map(|(id,)| *id).collect();
        let ideal_set: std::collections::HashSet<Uuid> = ideal_nodes.iter().copied().collect();

        if current_set == ideal_set {
            report.correctly_placed += 1;
        } else {
            report.need_migration += 1;

            // TODO (v2): Executar migracao
            // let to_add: nos em ideal mas nao em current
            // let to_remove: nos em current mas nao em ideal
            // Para cada to_add:
            //   - StorageProvider.get(current_node, chunk_id)
            //   - StorageProvider.put(new_node, chunk_id, data)
            //   - INSERT chunk_replicas (chunk_id, new_node)
            // Para cada to_remove:
            //   - StorageProvider.delete(old_node, chunk_id)
            //   - DELETE chunk_replicas (chunk_id, old_node)
        }
    }

    if report.need_migration > 0 {
        tracing::info!(
            cluster_id = %cluster_id,
            analyzed = report.chunks_analyzed,
            correct = report.correctly_placed,
            need_migration = report.need_migration,
            "rebalancing: chunks mal-posicionados detectados"
        );
    }

    Ok(report)
}

/// Executa rebalanceamento para todos os clusters.
pub async fn run(pool: &PgPool) -> Result<(), sqlx::Error> {
    let clusters: Vec<(Uuid,)> = sqlx::query_as("SELECT id FROM clusters")
        .fetch_all(pool)
        .await?;

    for (cluster_id,) in clusters {
        if let Err(e) = run_for_cluster(pool, cluster_id).await {
            tracing::error!(cluster_id = %cluster_id, error = %e, "rebalancing failed");
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rebalance_report_default_is_zero() {
        let report = RebalanceReport::default();
        assert_eq!(report.nodes_in_ring, 0);
        assert_eq!(report.chunks_analyzed, 0);
        assert_eq!(report.correctly_placed, 0);
        assert_eq!(report.need_migration, 0);
        assert_eq!(report.migrations_executed, 0);
    }

    #[test]
    fn rebalance_report_tracks_all_fields() {
        let report = RebalanceReport {
            nodes_in_ring: 5,
            chunks_analyzed: 100,
            correctly_placed: 85,
            need_migration: 15,
            migrations_executed: 0,
        };
        assert_eq!(
            report.correctly_placed + report.need_migration,
            report.chunks_analyzed
        );
    }

    // HashRing distribui deterministicamente — mesmo chunk sempre vai para mesmos nos
    #[test]
    fn hash_ring_deterministic_placement() {
        let mut ring = HashRing::new();
        let n1 = Uuid::new_v4();
        let n2 = Uuid::new_v4();
        let n3 = Uuid::new_v4();
        ring.add_node(n1, 100 * 1024 * 1024 * 1024);
        ring.add_node(n2, 100 * 1024 * 1024 * 1024);
        ring.add_node(n3, 100 * 1024 * 1024 * 1024);

        let placement1 = ring.get_nodes("chunk-abc", 3);
        let placement2 = ring.get_nodes("chunk-abc", 3);
        assert_eq!(placement1, placement2, "mesma query = mesmos nos");
    }

    // Adicionar no causa redistribuicao minima
    #[test]
    fn adding_node_causes_minimal_redistribution() {
        let mut ring = HashRing::new();
        let n1 = Uuid::new_v4();
        let n2 = Uuid::new_v4();
        let n3 = Uuid::new_v4();
        ring.add_node(n1, 100 * 1024 * 1024 * 1024);
        ring.add_node(n2, 100 * 1024 * 1024 * 1024);
        ring.add_node(n3, 100 * 1024 * 1024 * 1024);

        // Capturar placement antes
        let chunks: Vec<String> = (0..100).map(|i| format!("chunk-{i}")).collect();
        let before: Vec<Vec<Uuid>> = chunks.iter().map(|c| ring.get_nodes(c, 3)).collect();

        // Adicionar no
        let n4 = Uuid::new_v4();
        ring.add_node(n4, 100 * 1024 * 1024 * 1024);

        let after: Vec<Vec<Uuid>> = chunks.iter().map(|c| ring.get_nodes(c, 3)).collect();

        // Contar chunks que mudaram
        let changed = before
            .iter()
            .zip(after.iter())
            .filter(|(b, a)| b != a)
            .count();

        // Com consistent hashing e replication factor 3/4 nos, a maioria dos
        // chunks tera pelo menos 1 no diferente. O importante e que NAO TODOS mudam.
        assert!(
            changed < 100,
            "consistent hashing deve causar redistribuicao parcial, mas todos {changed}/100 mudaram"
        );
        // Pelo menos alguns chunks devem permanecer estaveis
        let stable = 100 - changed;
        assert!(
            stable > 0,
            "pelo menos alguns chunks devem permanecer nos mesmos nos"
        );
    }
}
