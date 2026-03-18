use anyhow::Result;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    tracing::info!("Alexandria Node Agent starting...");

    // TODO: Implementar na Fase 1
    // - API local para receber/servir chunks
    // - Heartbeat periodico ao orquestrador
    // - Scrubbing local
    // - Report de capacidade

    Ok(())
}
