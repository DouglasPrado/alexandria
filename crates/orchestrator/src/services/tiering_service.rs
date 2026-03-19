//! Tiering Service — classificacao hot/warm/cold baseada em frequencia de acesso.
//!
//! Tiers:
//!   hot  — acessado nos ultimos 30 dias (SSD local, nos rapidos)
//!   warm — acessado entre 30-180 dias (S3 standard)
//!   cold — nao acessado ha 180+ dias (S3 Glacier, B2 archive)
//!
//! Politica: arquivos migram automaticamente entre tiers baseado em last_accessed_at.

use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

/// Thresholds de classificacao (dias desde ultimo acesso).
pub const HOT_THRESHOLD_DAYS: i64 = 30;
pub const WARM_THRESHOLD_DAYS: i64 = 180;

/// Classifica tier baseado em dias desde ultimo acesso.
pub fn classify_tier(days_since_access: i64) -> &'static str {
    if days_since_access < HOT_THRESHOLD_DAYS {
        "hot"
    } else if days_since_access < WARM_THRESHOLD_DAYS {
        "warm"
    } else {
        "cold"
    }
}

/// Sugestao de migracao de um arquivo entre tiers.
#[derive(Debug, Serialize)]
pub struct TieringMigration {
    pub file_id: Uuid,
    pub original_name: String,
    pub current_tier: String,
    pub suggested_tier: String,
    pub days_since_access: i64,
    pub optimized_size: i64,
}

/// Relatorio de tiering para um cluster.
#[derive(Debug, Serialize, Default)]
pub struct TieringReport {
    pub hot_files: i64,
    pub warm_files: i64,
    pub cold_files: i64,
    pub migrations_suggested: Vec<TieringMigration>,
}

/// Analisa cluster e sugere migracoes entre tiers.
pub async fn analyze_cluster(
    pool: &PgPool,
    cluster_id: Uuid,
) -> Result<TieringReport, sqlx::Error> {
    let mut report = TieringReport::default();

    // Contar arquivos por tier baseado em last_accessed_at
    let files: Vec<(Uuid, String, i64, i64)> = sqlx::query_as(
        r#"
        SELECT id, original_name, optimized_size,
               EXTRACT(EPOCH FROM (NOW() - last_accessed_at))::BIGINT / 86400 as days_ago
        FROM files
        WHERE cluster_id = $1 AND status = 'ready'
        ORDER BY last_accessed_at ASC
        "#,
    )
    .bind(cluster_id)
    .fetch_all(pool)
    .await?;

    // Buscar tier dos nos onde chunks estao armazenados (simplificado: primeiro no)
    for (file_id, name, size, days_ago) in &files {
        let suggested = classify_tier(*days_ago);

        match suggested {
            "hot" => report.hot_files += 1,
            "warm" => report.warm_files += 1,
            "cold" => report.cold_files += 1,
            _ => {}
        }

        // Determinar tier atual do arquivo (tier do primeiro no com replica)
        let current_tier: Option<(String,)> = sqlx::query_as(
            r#"
            SELECT n.tier FROM nodes n
            JOIN chunk_replicas cr ON cr.node_id = n.id
            JOIN chunks c ON c.id = cr.chunk_id
            WHERE c.file_id = $1
            LIMIT 1
            "#,
        )
        .bind(file_id)
        .fetch_optional(pool)
        .await?;

        let current = current_tier.map(|(t,)| t).unwrap_or_else(|| "hot".into());

        // Se tier sugerido != tier atual, adicionar sugestao de migracao
        if current != suggested {
            report.migrations_suggested.push(TieringMigration {
                file_id: *file_id,
                original_name: name.clone(),
                current_tier: current,
                suggested_tier: suggested.into(),
                days_since_access: *days_ago,
                optimized_size: *size,
            });
        }
    }

    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_hot() {
        assert_eq!(classify_tier(0), "hot");
        assert_eq!(classify_tier(15), "hot");
        assert_eq!(classify_tier(29), "hot");
    }

    #[test]
    fn classify_warm() {
        assert_eq!(classify_tier(30), "warm");
        assert_eq!(classify_tier(90), "warm");
        assert_eq!(classify_tier(179), "warm");
    }

    #[test]
    fn classify_cold() {
        assert_eq!(classify_tier(180), "cold");
        assert_eq!(classify_tier(365), "cold");
        assert_eq!(classify_tier(1000), "cold");
    }

    #[test]
    fn thresholds_match_blueprint() {
        assert_eq!(HOT_THRESHOLD_DAYS, 30);
        assert_eq!(WARM_THRESHOLD_DAYS, 180);
    }

    #[test]
    fn tiering_report_default_empty() {
        let report = TieringReport::default();
        assert_eq!(report.hot_files, 0);
        assert_eq!(report.warm_files, 0);
        assert_eq!(report.cold_files, 0);
        assert!(report.migrations_suggested.is_empty());
    }
}
