use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing_subscriber::EnvFilter;

mod api;
mod auth;
mod db;
mod scheduler;
mod services;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    tracing::info!("Alexandria Orchestrator starting...");

    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    let addr = format!("{host}:{port}");

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = sqlx::PgPool::connect(&database_url).await?;

    sqlx::migrate!("../../migrations").run(&pool).await?;
    tracing::info!("Database migrations applied");

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".to_string());
    let bootstrap_token = std::env::var("BOOTSTRAP_TOKEN").ok();

    let state = api::AppState {
        db: pool.clone(),
        jwt_secret,
        bootstrap_token,
        master_key: Arc::new(RwLock::new(None)),
        hash_ring: Arc::new(RwLock::new(alexandria_core::consistent_hashing::HashRing::new())),
        storage_providers: Arc::new(RwLock::new(HashMap::new())),
    };

    // Limpar arquivos temporarios obsoletos (> 1 hora) de uploads anteriores
    let temp_dir = "/tmp/alexandria/uploads";
    if let Ok(mut entries) = tokio::fs::read_dir(temp_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            if let Ok(meta) = entry.metadata().await {
                if let Ok(modified) = meta.modified() {
                    if modified.elapsed().unwrap_or_default() > std::time::Duration::from_secs(3600) {
                        let _ = tokio::fs::remove_file(entry.path()).await;
                    }
                }
            }
        }
    }

    let app = api::router(state.clone());

    // Scheduler em background (heartbeat, auto-healing, scrubbing, GC, media processing)
    let _scheduler = scheduler::start(state, scheduler::SchedulerConfig::default());
    tracing::info!("Scheduler started");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Listening on {addr}");
    axum::serve(listener, app).await?;

    Ok(())
}
