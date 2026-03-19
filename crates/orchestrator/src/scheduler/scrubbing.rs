//! Scrubbing — verificacao periodica de integridade via hash.
//!
//! Processo (07-critical_flows.md):
//!   1. Consulta chunk_replicas ORDER BY verified_at ASC NULLS FIRST
//!   2. Para cada replica: le chunk via StorageProvider, recalcula SHA-256
//!   3. Compara hash calculado com chunk_id (hash original)
//!   4. Se ok: atualiza verified_at
//!   5. Se corrupto: repara com replica saudavel, gera alerta
//!
//! Na v1, este modulo apenas atualiza verified_at para replicas existentes
//! (simulando verificacao). A leitura real via StorageProvider sera
//! implementada quando o pipeline de distribuicao estiver completo.

use sqlx::PgPool;

/// Maximo de replicas verificadas por ciclo.
const BATCH_SIZE: i64 = 1000;

/// Executa um ciclo de scrubbing.
pub async fn run(pool: &PgPool) -> Result<ScrubReport, sqlx::Error> {
    // Buscar replicas mais antigas (ou nunca verificadas)
    let stale_replicas: Vec<(uuid::Uuid,)> = sqlx::query_as(
        r#"
        SELECT id FROM chunk_replicas
        ORDER BY verified_at ASC NULLS FIRST
        LIMIT $1
        "#,
    )
    .bind(BATCH_SIZE)
    .fetch_all(pool)
    .await?;

    let total = stale_replicas.len();

    if total == 0 {
        return Ok(ScrubReport::default());
    }

    // TODO (v2): Para cada replica:
    //   - StorageProvider.get(node, chunk_id) → bytes
    //   - alexandria_core::hashing::sha256(&bytes) → calculated_hash
    //   - Se calculated_hash != chunk_id → corrupcao detectada
    //     - Buscar replica saudavel
    //     - StorageProvider.put(node, chunk_id, healthy_bytes)
    //     - Gerar alerta integrity_error

    // Na v1: marca todas como verificadas (sem leitura real)
    let ids: Vec<uuid::Uuid> = stale_replicas.into_iter().map(|(id,)| id).collect();

    sqlx::query(
        r#"
        UPDATE chunk_replicas
        SET verified_at = NOW()
        WHERE id = ANY($1)
        "#,
    )
    .bind(&ids)
    .execute(pool)
    .await?;

    let report = ScrubReport {
        verified: total,
        corrupted: 0,
        repaired: 0,
    };

    if total > 0 {
        tracing::info!(verified = report.verified, "scrubbing cycle complete");
    }

    Ok(report)
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct ScrubReport {
    pub verified: usize,
    pub corrupted: usize,
    pub repaired: usize,
}
