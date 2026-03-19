//! Configuracao do Node Agent.

use std::time::Duration;
use uuid::Uuid;

/// Configuracao carregada via env vars.
pub struct NodeConfig {
    /// ID do no (persistente — gera novo UUID se nao definido).
    pub node_id: Uuid,
    /// Nome legivel do no.
    pub node_name: String,
    /// Hostname para construir endpoint URL (NODE_HOSTNAME ou HOSTNAME do Docker).
    pub hostname: String,
    /// Token de bootstrap para auto-registro no orchestrator.
    pub bootstrap_token: Option<String>,
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
        // NODE_ID: opcional — gera novo UUID se nao definido
        let node_id: Uuid = match std::env::var("NODE_ID") {
            Ok(v) => v
                .parse()
                .map_err(|_| anyhow::anyhow!("NODE_ID must be a valid UUID"))?,
            Err(_) => Uuid::new_v4(),
        };

        // NODE_NAME: nome legivel do no
        let node_name = std::env::var("NODE_NAME")
            .unwrap_or_else(|_| format!("node-{}", &node_id.to_string()[..8]));

        // NODE_HOSTNAME ou HOSTNAME (Docker define HOSTNAME automaticamente)
        let hostname = std::env::var("NODE_HOSTNAME")
            .or_else(|_| std::env::var("HOSTNAME"))
            .unwrap_or_else(|_| "localhost".into());

        let bootstrap_token = std::env::var("BOOTSTRAP_TOKEN").ok();

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
            node_name,
            hostname,
            bootstrap_token,
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
    fn from_env_generates_node_id_when_missing() {
        // Sem NODE_ID definido, deve gerar UUID automaticamente
        // SAFETY: test runs single-threaded, no other thread reads NODE_ID
        unsafe { std::env::remove_var("NODE_ID") };
        let result = NodeConfig::from_env();
        assert!(result.is_ok(), "deve funcionar sem NODE_ID");
    }

    #[test]
    fn from_env_uses_provided_node_id() {
        let expected = Uuid::new_v4();
        unsafe { std::env::set_var("NODE_ID", expected.to_string()) };
        let cfg = NodeConfig::from_env().unwrap();
        assert_eq!(cfg.node_id, expected);
        unsafe { std::env::remove_var("NODE_ID") };
    }
}
