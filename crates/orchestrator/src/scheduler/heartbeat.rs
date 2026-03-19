//! Heartbeat Monitor — deteccao de nos suspect e lost.
//!
//! State machine do Node (09-state_models.md):
//!   online  → suspect : heartbeat > 30 min atrás
//!   suspect → lost    : heartbeat > 1 hora atrás
//!   suspect → online  : heartbeat recebido (via API)
//!   lost    → online  : heartbeat recebido (via API)
//!
//! Regras: RN-A1 (alerta critico < 5 min), RN-A2 (auto-resolve), RN-A3 (dedup).

use sqlx::PgPool;

/// Thresholds de deteccao (conforme 07-critical_flows.md).
const SUSPECT_THRESHOLD_MINUTES: i64 = 30;
const LOST_THRESHOLD_MINUTES: i64 = 60;

/// Executa um ciclo de monitoramento de heartbeat.
///
/// 1. Detecta nos online com heartbeat atrasado → marca suspect + alerta warning
/// 2. Detecta nos suspect com heartbeat muito atrasado → marca lost + alerta critical
/// 3. Detecta nos suspect/lost que voltaram → marca online + resolve alerta
pub async fn run(pool: &PgPool) -> Result<HeartbeatReport, sqlx::Error> {
    let mut report = HeartbeatReport::default();

    // 1. online → suspect (heartbeat > 30 min)
    let newly_suspect = sqlx::query_as::<_, NodeHeartbeatRow>(
        r#"
        UPDATE nodes
        SET status = 'suspect', updated_at = NOW()
        WHERE status = 'online'
          AND last_heartbeat < NOW() - ($1 || ' minutes')::interval
        RETURNING id, cluster_id, name
        "#,
    )
    .bind(SUSPECT_THRESHOLD_MINUTES.to_string())
    .fetch_all(pool)
    .await?;

    for node in &newly_suspect {
        // Gerar alerta warning (RN-A3: dedup por resource)
        create_alert_if_not_exists(
            pool,
            node.cluster_id,
            "node_offline",
            &format!("No '{}' nao envia heartbeat ha mais de 30 min", node.name),
            "warning",
            "node",
            &node.id.to_string(),
        )
        .await?;
    }
    report.newly_suspect = newly_suspect.len();

    // 2. suspect → lost (heartbeat > 1 hora)
    let newly_lost = sqlx::query_as::<_, NodeHeartbeatRow>(
        r#"
        UPDATE nodes
        SET status = 'lost', updated_at = NOW()
        WHERE status = 'suspect'
          AND last_heartbeat < NOW() - ($1 || ' minutes')::interval
        RETURNING id, cluster_id, name
        "#,
    )
    .bind(LOST_THRESHOLD_MINUTES.to_string())
    .fetch_all(pool)
    .await?;

    for node in &newly_lost {
        // Escalar alerta para critical (RN-A1)
        escalate_alert(pool, "node", &node.id.to_string()).await?;
    }
    report.newly_lost = newly_lost.len();

    // 3. Auto-resolve: nos suspect/lost que receberam heartbeat recente → online
    //    (A API de heartbeat ja marca como online; aqui apenas resolvemos alertas)
    let recovered = sqlx::query_as::<_, NodeHeartbeatRow>(
        r#"
        SELECT id, cluster_id, name FROM nodes
        WHERE status = 'online'
          AND id IN (
            SELECT CAST(resource_id AS UUID) FROM alerts
            WHERE resource_type = 'node' AND type = 'node_offline' AND resolved = FALSE
          )
        "#,
    )
    .fetch_all(pool)
    .await?;

    for node in &recovered {
        // Auto-resolve alerta (RN-A2)
        resolve_alert_for_resource(pool, "node", &node.id.to_string()).await?;
    }
    report.recovered = recovered.len();

    if report.newly_suspect > 0 || report.newly_lost > 0 || report.recovered > 0 {
        tracing::info!(
            suspect = report.newly_suspect,
            lost = report.newly_lost,
            recovered = report.recovered,
            "heartbeat monitor cycle complete"
        );
    }

    Ok(report)
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct HeartbeatReport {
    pub newly_suspect: usize,
    pub newly_lost: usize,
    pub recovered: usize,
}

#[derive(Debug, sqlx::FromRow)]
struct NodeHeartbeatRow {
    id: uuid::Uuid,
    cluster_id: uuid::Uuid,
    name: String,
}

/// Cria alerta se nao existir um ativo para o mesmo recurso (RN-A3: dedup).
async fn create_alert_if_not_exists(
    pool: &PgPool,
    cluster_id: uuid::Uuid,
    alert_type: &str,
    message: &str,
    severity: &str,
    resource_type: &str,
    resource_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO alerts (cluster_id, type, message, severity, resource_type, resource_id)
        SELECT $1, $2, $3, $4, $5, $6
        WHERE NOT EXISTS (
            SELECT 1 FROM alerts
            WHERE resource_type = $5 AND resource_id = $6
              AND type = $2 AND resolved = FALSE
        )
        "#,
    )
    .bind(cluster_id)
    .bind(alert_type)
    .bind(message)
    .bind(severity)
    .bind(resource_type)
    .bind(resource_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// Escala alerta existente para critical.
async fn escalate_alert(
    pool: &PgPool,
    resource_type: &str,
    resource_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE alerts
        SET severity = 'critical'
        WHERE resource_type = $1 AND resource_id = $2
          AND resolved = FALSE
        "#,
    )
    .bind(resource_type)
    .bind(resource_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// Resolve alertas ativos para um recurso (RN-A2: auto-resolve).
async fn resolve_alert_for_resource(
    pool: &PgPool,
    resource_type: &str,
    resource_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE alerts
        SET resolved = TRUE, resolved_at = NOW()
        WHERE resource_type = $1 AND resource_id = $2
          AND resolved = FALSE
        "#,
    )
    .bind(resource_type)
    .bind(resource_id)
    .execute(pool)
    .await?;
    Ok(())
}
