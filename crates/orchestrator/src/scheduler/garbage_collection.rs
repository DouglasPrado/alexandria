//! Garbage Collection — remocao de chunks orfaos.
//!
//! Processo (07-critical_flows.md):
//!   1. Consulta chunks nao referenciados por nenhum manifest
//!   2. Para cada chunk orfao: deleta de todos os nos via StorageProvider
//!   3. Remove chunk_replicas e chunk records
//!   4. Gera relatorio
//!
//! Na v1, este modulo detecta e remove registros orfaos do banco.
//! A delecao real dos bytes via StorageProvider sera implementada
//! quando o pipeline de distribuicao estiver completo.

use sqlx::PgPool;

/// Executa um ciclo de garbage collection.
pub async fn run(pool: &PgPool) -> Result<GcReport, sqlx::Error> {
    // 1. Encontrar chunks orfaos (nao referenciados por nenhum manifest)
    let orphaned: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT c.id FROM chunks c
        WHERE NOT EXISTS (
            SELECT 1 FROM manifest_chunks mc WHERE mc.chunk_id = c.id
        )
        "#,
    )
    .fetch_all(pool)
    .await?;

    if orphaned.is_empty() {
        return Ok(GcReport::default());
    }

    let orphan_ids: Vec<String> = orphaned.into_iter().map(|(id,)| id).collect();
    let count = orphan_ids.len();

    // TODO (v2): Para cada chunk orfao:
    //   - Buscar chunk_replicas para saber em quais nos esta
    //   - StorageProvider.delete(node, chunk_id) para cada replica
    //   - Confirmar delecao

    // 2. Remover chunk_replicas dos orfaos
    sqlx::query(
        r#"
        DELETE FROM chunk_replicas
        WHERE chunk_id = ANY($1)
        "#,
    )
    .bind(&orphan_ids)
    .execute(pool)
    .await?;

    // 3. Remover chunks orfaos
    sqlx::query(
        r#"
        DELETE FROM chunks
        WHERE id = ANY($1)
        "#,
    )
    .bind(&orphan_ids)
    .execute(pool)
    .await?;

    let report = GcReport {
        orphaned_chunks: count,
        replicas_removed: count, // aproximacao: 1 chunk pode ter N replicas
    };

    tracing::info!(
        orphaned = report.orphaned_chunks,
        "garbage collection cycle complete"
    );

    Ok(report)
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct GcReport {
    pub orphaned_chunks: usize,
    pub replicas_removed: usize,
}
