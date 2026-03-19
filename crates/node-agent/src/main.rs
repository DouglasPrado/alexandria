use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;
use tracing_subscriber::EnvFilter;

mod api;
mod config;
mod heartbeat;

/// Tenta registrar o no no orchestrator usando o bootstrap token.
/// Repete a cada 10s ate sucesso (200/201) ou 409 (ja registrado).
async fn auto_register(config: &config::NodeConfig) {
    let token = match config.bootstrap_token.as_ref() {
        Some(t) => t,
        None => {
            tracing::info!("BOOTSTRAP_TOKEN nao definido — pulando auto-registro");
            return;
        }
    };

    let client = reqwest::Client::new();
    let endpoint = format!("http://{}:{}", config.hostname, config.port);
    let url = format!("{}/api/v1/nodes/register", config.orchestrator_url);

    let body = serde_json::json!({
        "node_id": config.node_id,
        "name": config.node_name,
        "node_type": "local",
        "endpoint": endpoint,
        "total_capacity": config.max_capacity as i64,
    });

    loop {
        match client
            .post(&url)
            .header("X-Bootstrap-Token", token.as_str())
            .json(&body)
            .send()
            .await
        {
            Ok(r) if r.status().is_success() => {
                tracing::info!(
                    node_id = %config.node_id,
                    endpoint = %endpoint,
                    "no registrado com sucesso no orchestrator"
                );
                break;
            }
            Ok(r) if r.status().as_u16() == 409 => {
                tracing::info!(
                    node_id = %config.node_id,
                    "no ja registrado — prosseguindo com heartbeat"
                );
                break;
            }
            Ok(r) => {
                tracing::warn!(
                    node_id = %config.node_id,
                    status = %r.status(),
                    "registro falhou — tentando novamente em 10s"
                );
            }
            Err(e) => {
                tracing::warn!(
                    node_id = %config.node_id,
                    error = %e,
                    "requisicao de registro falhou — tentando novamente em 10s"
                );
            }
        }
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    let cfg = config::NodeConfig::from_env()?;

    tracing::info!(
        node_id = %cfg.node_id,
        node_name = %cfg.node_name,
        storage_path = %cfg.storage_path,
        port = cfg.port,
        max_capacity_gb = cfg.max_capacity / (1024 * 1024 * 1024),
        "Alexandria Node Agent starting..."
    );

    // Inicializar storage local
    let storage = alexandria_core::storage::local::LocalStorageProvider::new(
        std::path::PathBuf::from(&cfg.storage_path),
        cfg.max_capacity,
    );

    let state = Arc::new(api::AgentState {
        storage: Box::new(storage),
        node_id: cfg.node_id,
    });

    // Auto-registro no orchestrator via bootstrap token (antes do heartbeat loop)
    auto_register(&cfg).await;

    // Heartbeat em background
    let _heartbeat = heartbeat::start(
        cfg.orchestrator_url.clone(),
        cfg.node_id,
        cfg.heartbeat_interval,
    );
    tracing::info!(
        orchestrator = %cfg.orchestrator_url,
        interval_secs = cfg.heartbeat_interval.as_secs(),
        "heartbeat loop started"
    );

    // API local
    let app = api::router(state);
    let addr = format!("0.0.0.0:{}", cfg.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Node Agent listening on {addr}");
    axum::serve(listener, app).await?;

    Ok(())
}
