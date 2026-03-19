use axum::{
    Router,
    routing::{delete, get, post},
};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use uuid::Uuid;

mod alerts;
mod auth;
mod clusters;
mod files;
mod health;
mod metrics;
mod nodes;
mod recovery;

use crate::auth::middleware::auth_middleware;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub bootstrap_token: Option<String>,
    pub master_key: Arc<RwLock<Option<alexandria_core::crypto::envelope::MasterKey>>>,
    pub hash_ring: Arc<RwLock<alexandria_core::consistent_hashing::HashRing>>,
    pub storage_providers: Arc<RwLock<HashMap<Uuid, Box<dyn alexandria_core::storage::StorageProvider>>>>,
}

pub fn router(state: AppState) -> Router {
    // ---------------------------------------------------------------------------
    // Public routes — no JWT required
    // ---------------------------------------------------------------------------
    let public = Router::new()
        .route("/api/v1/health", get(health::health_check))
        .route("/metrics", get(metrics::prometheus_metrics))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/refresh", post(auth::refresh_token))
        // POST /api/v1/clusters is public (cluster creation / onboarding)
        .route("/api/v1/clusters", post(clusters::create_cluster))
        .route("/api/v1/invite/{token}", post(clusters::accept_invite))
        .route("/api/v1/invite/{token}/validate", get(clusters::validate_invite))
        .route("/api/v1/nodes/{id}/heartbeat", post(nodes::heartbeat))
        .route("/api/v1/nodes/register", post(nodes::register_node));

    // ---------------------------------------------------------------------------
    // Protected routes — JWT required (auth_middleware validates Bearer token)
    // ---------------------------------------------------------------------------
    let protected = Router::new()
        // Auth
        .route("/api/v1/auth/logout", post(auth::logout))
        .route("/api/v1/auth/me", get(auth::me))
        // Clusters — GET /api/v1/clusters is protected (list requires membership)
        .route("/api/v1/clusters", get(clusters::list_clusters))
        .route("/api/v1/clusters/{id}", get(clusters::get_cluster))
        .route("/api/v1/clusters/{id}/invite", post(clusters::invite_member))
        .route("/api/v1/clusters/{id}/members", get(clusters::list_members))
        .route(
            "/api/v1/clusters/{cluster_id}/members/{member_id}",
            delete(clusters::remove_member),
        )
        .route("/api/v1/members/{id}/quota", get(clusters::get_member_quota))
        .route(
            "/api/v1/clusters/{id}/rebalance",
            post(clusters::rebalance_cluster),
        )
        .route(
            "/api/v1/clusters/{id}/tiering",
            get(clusters::cluster_tiering),
        )
        // Nodes
        .route("/api/v1/clusters/{id}/nodes", get(nodes::list_nodes))
        .route("/api/v1/nodes/{id}", delete(nodes::disconnect_node))
        // Files
        .route("/api/v1/files/upload", post(files::upload_file))
        .route("/api/v1/files/check-hash/{hash}", get(files::check_hash))
        .route("/api/v1/clusters/{id}/files", get(files::list_gallery))
        .route("/api/v1/clusters/{id}/timeline", get(files::timeline))
        .route(
            "/api/v1/clusters/{id}/files/by-date",
            get(files::files_by_date),
        )
        .route(
            "/api/v1/clusters/{id}/files/search",
            get(files::search_files),
        )
        .route("/api/v1/files/{id}", get(files::get_file))
        .route("/api/v1/files/{id}/preview", get(files::get_preview))
        .route(
            "/api/v1/files/{id}/placeholder",
            get(files::get_placeholder),
        )
        .route("/api/v1/files/{id}/download", get(files::download_file))
        .route("/api/v1/files/{id}/versions", get(files::list_versions))
        // Recovery
        .route("/api/v1/recovery", post(recovery::start_recovery))
        // Health dashboard + Alerts
        .route("/api/v1/clusters/{id}/health", get(health::cluster_health))
        .route("/api/v1/clusters/{id}/alerts", get(alerts::list_alerts))
        // Apply JWT auth middleware to all protected routes.
        // auth_middleware takes State<String> (the jwt_secret).
        .layer(axum::middleware::from_fn_with_state(
            state.jwt_secret.clone(),
            auth_middleware,
        ));

    // ---------------------------------------------------------------------------
    // Merge public and protected, then wire state and global middleware.
    //
    // Note: /api/v1/clusters appears in both routers but with DIFFERENT HTTP
    // methods (POST in public, GET in protected). Axum allows merging two
    // routers that have the same path with different method routers — each
    // method is dispatched independently, so there is no conflict.
    // ---------------------------------------------------------------------------
    public
        .merge(protected)
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
}
