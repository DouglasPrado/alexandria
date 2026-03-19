use axum::{
    Router,
    routing::{delete, get, post},
};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

mod alerts;
mod clusters;
mod files;
mod health;
mod nodes;

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
        // Nodes (UC-003, UC-006)
        .route("/api/v1/nodes/register", post(nodes::register_node))
        .route("/api/v1/clusters/{id}/nodes", get(nodes::list_nodes))
        .route("/api/v1/nodes/{id}/heartbeat", post(nodes::heartbeat))
        .route("/api/v1/nodes/{id}", delete(nodes::disconnect_node))
        // Files (UC-004, UC-005)
        .route("/api/v1/files/upload", post(files::upload_file))
        .route("/api/v1/clusters/{id}/files", get(files::list_gallery))
        .route("/api/v1/files/{id}", get(files::get_file))
        // Alerts
        .route("/api/v1/clusters/{id}/alerts", get(alerts::list_alerts))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
}
