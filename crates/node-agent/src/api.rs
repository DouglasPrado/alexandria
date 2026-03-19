//! API REST local do Node Agent.
//!
//! Endpoints:
//!   PUT    /chunks/{chunk_id} — armazena chunk
//!   GET    /chunks/{chunk_id} — serve chunk
//!   DELETE /chunks/{chunk_id} — remove chunk
//!   GET    /health            — status + capacidade

use axum::{
    Json, Router,
    body::Bytes,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, put},
};
use serde::Serialize;
use std::sync::Arc;
use tower_http::trace::TraceLayer;

use alexandria_core::storage::{StorageError, StorageProvider};

/// Estado compartilhado entre handlers.
pub struct AgentState {
    pub storage: Box<dyn StorageProvider>,
    pub node_id: uuid::Uuid,
}

pub fn router(state: Arc<AgentState>) -> Router {
    Router::new()
        .route("/chunks/{chunk_id}", put(put_chunk))
        .route("/chunks/{chunk_id}", get(get_chunk))
        .route("/chunks/{chunk_id}", delete(delete_chunk))
        .route("/health", get(health))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
}

/// PUT /chunks/{chunk_id} — armazena chunk.
async fn put_chunk(
    State(state): State<Arc<AgentState>>,
    Path(chunk_id): Path<String>,
    body: Bytes,
) -> impl IntoResponse {
    match state.storage.put(&chunk_id, &body).await {
        Ok(()) => StatusCode::CREATED,
        Err(e) => {
            tracing::error!(chunk_id = %chunk_id, error = %e, "failed to store chunk");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

/// GET /chunks/{chunk_id} — serve chunk.
async fn get_chunk(
    State(state): State<Arc<AgentState>>,
    Path(chunk_id): Path<String>,
) -> impl IntoResponse {
    match state.storage.get(&chunk_id).await {
        Ok(data) => (StatusCode::OK, data).into_response(),
        Err(StorageError::NotFound(_)) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => {
            tracing::error!(chunk_id = %chunk_id, error = %e, "failed to get chunk");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

/// DELETE /chunks/{chunk_id} — remove chunk.
async fn delete_chunk(
    State(state): State<Arc<AgentState>>,
    Path(chunk_id): Path<String>,
) -> impl IntoResponse {
    match state.storage.delete(&chunk_id).await {
        Ok(()) => StatusCode::NO_CONTENT,
        Err(e) => {
            tracing::error!(chunk_id = %chunk_id, error = %e, "failed to delete chunk");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[derive(Serialize)]
struct HealthResponse {
    node_id: uuid::Uuid,
    status: String,
    total_capacity: u64,
    used_capacity: u64,
    available_capacity: u64,
}

/// GET /health — status + capacidade.
async fn health(State(state): State<Arc<AgentState>>) -> impl IntoResponse {
    match state.storage.capacity().await {
        Ok(cap) => {
            let resp = HealthResponse {
                node_id: state.node_id,
                status: "online".into(),
                total_capacity: cap.total_bytes,
                used_capacity: cap.used_bytes,
                available_capacity: cap.available_bytes(),
            };
            (StatusCode::OK, Json(resp)).into_response()
        }
        Err(e) => {
            tracing::error!(error = %e, "failed to get capacity");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use tower::ServiceExt;

    fn test_state(dir: &std::path::Path) -> Arc<AgentState> {
        let storage = alexandria_core::storage::local::LocalStorageProvider::new(
            dir.to_path_buf(),
            1024 * 1024 * 100, // 100MB
        );
        Arc::new(AgentState {
            storage: Box::new(storage),
            node_id: uuid::Uuid::new_v4(),
        })
    }

    #[tokio::test]
    async fn put_and_get_chunk() {
        let tmp = tempfile::tempdir().unwrap();
        let state = test_state(tmp.path());
        let app = router(state);

        // PUT
        let put_req = Request::builder()
            .method("PUT")
            .uri("/chunks/test-chunk-001")
            .body(Body::from(vec![104, 101, 108, 108, 111]))
            .unwrap();
        let resp = ServiceExt::<Request<Body>>::oneshot(app.clone(), put_req)
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);

        // GET
        let get_req = Request::builder()
            .uri("/chunks/test-chunk-001")
            .body(Body::empty())
            .unwrap();
        let resp = ServiceExt::<Request<Body>>::oneshot(app.clone(), get_req)
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), 1024).await.unwrap();
        assert_eq!(&body[..], &[104, 101, 108, 108, 111]);
    }

    #[tokio::test]
    async fn get_nonexistent_chunk_returns_404() {
        let tmp = tempfile::tempdir().unwrap();
        let state = test_state(tmp.path());
        let app = router(state);

        let req = Request::builder()
            .uri("/chunks/nonexistent")
            .body(Body::empty())
            .unwrap();
        let resp = ServiceExt::<Request<Body>>::oneshot(app, req)
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn delete_chunk_returns_no_content() {
        let tmp = tempfile::tempdir().unwrap();
        let state = test_state(tmp.path());
        let app = router(state);

        // PUT first
        let put_req = Request::builder()
            .method("PUT")
            .uri("/chunks/to-delete")
            .body(Body::from(vec![1, 2, 3]))
            .unwrap();
        let _ = ServiceExt::<Request<Body>>::oneshot(app.clone(), put_req)
            .await
            .unwrap();

        // DELETE
        let del_req = Request::builder()
            .method("DELETE")
            .uri("/chunks/to-delete")
            .body(Body::empty())
            .unwrap();
        let resp = ServiceExt::<Request<Body>>::oneshot(app, del_req)
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn health_returns_capacity() {
        let tmp = tempfile::tempdir().unwrap();
        let state = test_state(tmp.path());
        let app = router(state);

        let req = Request::builder()
            .uri("/health")
            .body(Body::empty())
            .unwrap();
        let resp = ServiceExt::<Request<Body>>::oneshot(app, req)
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), 4096).await.unwrap();
        let health: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(health["status"], "online");
        assert!(health["total_capacity"].as_u64().unwrap() > 0);
    }
}
