use anyhow::Result;
use tracing_subscriber::EnvFilter;

mod api;
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

    let app = api::router(pool.clone());

    // Scheduler em background (heartbeat, auto-healing, scrubbing, GC)
    let _scheduler = scheduler::start(pool, scheduler::SchedulerConfig::default());
    tracing::info!("Scheduler started");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Listening on {addr}");
    axum::serve(listener, app).await?;

    Ok(())
}
