use axum::{
    Router,
    routing::{delete, get, post},
};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

mod clusters;
mod health;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

pub fn router(db: PgPool) -> Router {
    let state = AppState { db };

    Router::new()
        // Health
        .route("/api/v1/health", get(health::health_check))
        // Clusters (UC-001)
        .route("/api/v1/clusters", post(clusters::create_cluster))
        .route("/api/v1/clusters/{id}", get(clusters::get_cluster))
        // Members (UC-002)
        .route(
            "/api/v1/clusters/{id}/invite",
            post(clusters::invite_member),
        )
        .route("/api/v1/invite/{token}", post(clusters::accept_invite))
        .route("/api/v1/clusters/{id}/members", get(clusters::list_members))
        .route(
            "/api/v1/clusters/{cluster_id}/members/{member_id}",
            delete(clusters::remove_member),
        )
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
}
