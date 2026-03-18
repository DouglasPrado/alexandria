use axum::{Router, routing::get};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

mod health;

#[derive(Clone)]
#[allow(dead_code)] // db sera usado nas features da Fase 1
pub struct AppState {
    pub db: PgPool,
}

pub fn router(db: PgPool) -> Router {
    let state = AppState { db };

    Router::new()
        .route("/api/v1/health", get(health::health_check))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
}
