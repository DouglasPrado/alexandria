use anyhow::Result;
use std::sync::Arc;
use tracing_subscriber::EnvFilter;

mod api;
mod config;
mod heartbeat;

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
