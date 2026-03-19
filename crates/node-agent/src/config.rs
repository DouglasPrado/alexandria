//! Configuracao do Node Agent.

use std::time::Duration;
use uuid::Uuid;

/// Configuracao carregada via env vars.
pub struct NodeConfig {
    /// ID do no (registrado no orchestrator).
    pub node_id: Uuid,
    /// URL base do orchestrator (ex: http://localhost:8080).
    pub orchestrator_url: String,
    /// Caminho do diretorio de storage local.
    pub storage_path: String,
    /// Capacidade maxima em bytes.
    pub max_capacity: u64,
    /// Porta da API local.
    pub port: u16,
    /// Intervalo entre heartbeats.
    pub heartbeat_interval: Duration,
}

impl NodeConfig {
    /// Carrega configuracao das variaveis de ambiente.
    pub fn from_env() -> anyhow::Result<Self> {
        let node_id: Uuid = std::env::var("NODE_ID")
            .map_err(|_| anyhow::anyhow!("NODE_ID must be set"))?
            .parse()
            .map_err(|_| anyhow::anyhow!("NODE_ID must be a valid UUID"))?;

        let orchestrator_url =
            std::env::var("ORCHESTRATOR_URL").unwrap_or_else(|_| "http://localhost:8080".into());

        let storage_path =
            std::env::var("STORAGE_PATH").unwrap_or_else(|_| "/data/alexandria".into());

        let max_capacity: u64 = std::env::var("MAX_CAPACITY_GB")
            .unwrap_or_else(|_| "100".into())
            .parse::<u64>()
            .unwrap_or(100)
            * 1024
            * 1024
            * 1024;

        let port: u16 = std::env::var("NODE_PORT")
            .unwrap_or_else(|_| "9090".into())
            .parse()
            .unwrap_or(9090);

        let heartbeat_secs: u64 = std::env::var("HEARTBEAT_INTERVAL_SECS")
            .unwrap_or_else(|_| "60".into())
            .parse()
            .unwrap_or(60);

        Ok(Self {
            node_id,
            orchestrator_url,
            storage_path,
            max_capacity,
            port,
            heartbeat_interval: Duration::from_secs(heartbeat_secs),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_env_requires_node_id() {
        // Sem NODE_ID definido, deve falhar
        // SAFETY: test runs single-threaded, no other thread reads NODE_ID
        unsafe { std::env::remove_var("NODE_ID") };
        let result = NodeConfig::from_env();
        assert!(result.is_err());
    }
}
