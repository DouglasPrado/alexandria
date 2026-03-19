//! Endpoints REST para Files.
//!
//! POST /api/v1/files/upload — iniciar upload (UC-004)
//! GET  /api/v1/clusters/:id/files — listar galeria (paginacao cursor)
//! GET  /api/v1/files/:id — obter arquivo

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::AppState;
use crate::services::file_service;

#[derive(Deserialize)]
pub struct UploadRequest {
    pub cluster_id: Uuid,
    pub uploaded_by: Uuid,
    pub original_name: String,
    pub media_type: String,
    pub mime_type: String,
    pub file_extension: String,
    pub original_size: i64,
}

#[derive(Serialize)]
pub struct UploadResponse {
    pub file_id: Uuid,
    pub status: String,
}

#[derive(Deserialize)]
pub struct GalleryParams {
    pub cursor: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Serialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub original_name: String,
    pub media_type: String,
    pub mime_type: String,
    pub file_extension: String,
    pub original_size: i64,
    pub optimized_size: i64,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct GalleryResponse {
    pub files: Vec<FileResponse>,
    pub next_cursor: Option<String>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

/// POST /api/v1/files/upload — UC-004
pub async fn upload_file(
    State(state): State<AppState>,
    Json(req): Json<UploadRequest>,
) -> impl IntoResponse {
    match file_service::initiate_upload(
        &state.db,
        file_service::UploadParams {
            cluster_id: req.cluster_id,
            uploaded_by: req.uploaded_by,
            original_name: &req.original_name,
            media_type: &req.media_type,
            mime_type: &req.mime_type,
            file_extension: &req.file_extension,
            original_size: req.original_size,
        },
    )
    .await
    {
        Ok(result) => (
            StatusCode::CREATED,
            Json(UploadResponse {
                file_id: result.file_id,
                status: result.status,
            }),
        )
            .into_response(),
        Err(e) => map_file_error(e).into_response(),
    }
}

/// GET /api/v1/clusters/:id/files — galeria com paginacao cursor
pub async fn list_gallery(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
    Query(params): Query<GalleryParams>,
) -> impl IntoResponse {
    let cursor = params
        .cursor
        .and_then(|c| c.parse::<chrono::DateTime<chrono::Utc>>().ok());
    let limit = params.limit.unwrap_or(20);

    match file_service::list_gallery(&state.db, cluster_id, cursor, limit).await {
        Ok(rows) => {
            let next_cursor = rows.last().map(|r| r.created_at.to_rfc3339());
            let files: Vec<FileResponse> = rows
                .into_iter()
                .map(|r| FileResponse {
                    id: r.id,
                    cluster_id: r.cluster_id,
                    original_name: r.original_name,
                    media_type: r.media_type,
                    mime_type: r.mime_type,
                    file_extension: r.file_extension,
                    original_size: r.original_size,
                    optimized_size: r.optimized_size,
                    status: r.status,
                    created_at: r.created_at,
                })
                .collect();
            (StatusCode::OK, Json(GalleryResponse { files, next_cursor })).into_response()
        }
        Err(e) => map_file_error(e).into_response(),
    }
}

/// GET /api/v1/files/:id
pub async fn get_file(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> impl IntoResponse {
    match file_service::get_file(&state.db, file_id).await {
        Ok(r) => (
            StatusCode::OK,
            Json(FileResponse {
                id: r.id,
                cluster_id: r.cluster_id,
                original_name: r.original_name,
                media_type: r.media_type,
                mime_type: r.mime_type,
                file_extension: r.file_extension,
                original_size: r.original_size,
                optimized_size: r.optimized_size,
                status: r.status,
                created_at: r.created_at,
            }),
        )
            .into_response(),
        Err(e) => map_file_error(e).into_response(),
    }
}

fn map_file_error(e: file_service::FileError) -> impl IntoResponse {
    let (status, msg) = match &e {
        file_service::FileError::NotFound => (StatusCode::NOT_FOUND, e.to_string()),
        file_service::FileError::InsufficientNodes => {
            (StatusCode::SERVICE_UNAVAILABLE, e.to_string())
        }
        file_service::FileError::Unavailable => (StatusCode::SERVICE_UNAVAILABLE, e.to_string()),
        file_service::FileError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    (status, Json(ErrorResponse { error: msg }))
}
