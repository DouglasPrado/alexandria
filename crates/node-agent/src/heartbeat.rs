//! Heartbeat loop — envia sinal periodico ao orchestrator.
//!
//! POST /api/v1/nodes/{node_id}/heartbeat
//! O orchestrator atualiza last_heartbeat e status → online.

use std::time::Duration;
use uuid::Uuid;

/// Inicia loop de heartbeat em background.
/// Retorna JoinHandle que pode ser cancelado via abort().
pub fn start(
    orchestrator_url: String,
    node_id: Uuid,
    interval: Duration,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let client = reqwest::Client::new();
        let url = format!("{}/api/v1/nodes/{}/heartbeat", orchestrator_url, node_id);

        let mut ticker = tokio::time::interval(interval);

        loop {
            ticker.tick().await;

            match client.post(&url).send().await {
                Ok(resp) if resp.status().is_success() => {
                    tracing::debug!(node_id = %node_id, "heartbeat sent");
                }
                Ok(resp) => {
                    tracing::warn!(
                        node_id = %node_id,
                        status = %resp.status(),
                        "heartbeat rejected by orchestrator"
                    );
                }
                Err(e) => {
                    tracing::warn!(
                        node_id = %node_id,
                        error = %e,
                        "heartbeat failed — orchestrator unreachable"
                    );
                }
            }
        }
    })
}
