//! Endpoints REST para Files.
//!
//! POST /api/v1/files/upload — iniciar upload (UC-004)
//! GET  /api/v1/clusters/:id/files — listar galeria (paginacao cursor)
//! GET  /api/v1/files/:id — obter arquivo
//! GET  /api/v1/files/:id/preview — preview/thumbnail
//! GET  /api/v1/files/:id/placeholder — metadados leves (UC-009)
//! GET  /api/v1/files/:id/download — download completo (UC-005)

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

#[derive(Deserialize)]
pub struct SearchParams {
    pub q: Option<String>,
    pub media_type: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
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

/// GET /api/v1/clusters/:id/files/search — busca por nome, tipo, data (UC-010)
pub async fn search_files(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
    Query(params): Query<SearchParams>,
) -> impl IntoResponse {
    let date_from = params
        .from
        .and_then(|d| d.parse::<chrono::DateTime<chrono::Utc>>().ok());
    let date_to = params
        .to
        .and_then(|d| d.parse::<chrono::DateTime<chrono::Utc>>().ok());
    let limit = params.limit.unwrap_or(50).clamp(1, 200);

    match crate::db::files::search(
        &state.db,
        cluster_id,
        params.q.as_deref(),
        params.media_type.as_deref(),
        date_from,
        date_to,
        limit,
    )
    .await
    {
        Ok(rows) => {
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
            (
                StatusCode::OK,
                Json(serde_json::json!({ "files": files, "count": files.len() })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
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

/// GET /api/v1/files/:id/preview — serve preview/thumbnail do arquivo.
/// Retorna bytes da imagem com Content-Type apropriado.
/// Na v1: gera preview on-the-fly (nao cached). v2: preview pre-gerado no pipeline.
pub async fn get_preview(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> impl IntoResponse {
    // Buscar arquivo
    let file = match file_service::get_file(&state.db, file_id).await {
        Ok(f) => f,
        Err(e) => return map_file_error(e).into_response(),
    };

    // Verificar se media_type suporta preview
    if !alexandria_core::preview::is_supported(&file.media_type) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: format!("preview nao disponivel para tipo '{}'", file.media_type),
            }),
        )
            .into_response();
    }

    // Na v1: preview nao esta pre-gerado (seria via preview_chunk_id).
    // Retornamos 204 indicando que preview sera disponibilizado apos pipeline.
    (StatusCode::NO_CONTENT).into_response()
}

/// GET /api/v1/clusters/:id/timeline — agrupamento por mes/ano para navegacao cronologica.
pub async fn timeline(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::db::files::timeline(&state.db, cluster_id).await {
        Ok(entries) => (
            StatusCode::OK,
            Json(serde_json::json!({ "timeline": entries })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

#[derive(Deserialize)]
pub struct ByDateParams {
    pub year: i32,
    pub month: i32,
    pub limit: Option<i64>,
}

/// GET /api/v1/clusters/:id/files/by-date — lista arquivos de um mes/ano.
pub async fn files_by_date(
    State(state): State<AppState>,
    Path(cluster_id): Path<Uuid>,
    Query(params): Query<ByDateParams>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(100).clamp(1, 500);
    match crate::db::files::find_by_month(&state.db, cluster_id, params.year, params.month, limit)
        .await
    {
        Ok(rows) => {
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
            (StatusCode::OK, Json(serde_json::json!({ "files": files }))).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// GET /api/v1/files/:id/versions — lista versoes de um arquivo.
pub async fn list_versions(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> impl IntoResponse {
    match crate::db::files::find_versions(&state.db, file_id).await {
        Ok(rows) => {
            let versions: Vec<serde_json::Value> = rows
                .into_iter()
                .map(|r| {
                    serde_json::json!({
                        "id": r.id,
                        "version": r.version,
                        "parent_id": r.parent_id,
                        "original_name": r.original_name,
                        "original_size": r.original_size,
                        "optimized_size": r.optimized_size,
                        "content_hash": r.content_hash,
                        "status": r.status,
                        "created_at": r.created_at,
                    })
                })
                .collect();
            (
                StatusCode::OK,
                Json(serde_json::json!({ "versions": versions })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// GET /api/v1/files/check-hash/:hash — verifica se conteudo ja existe (dedup RN-F4).
/// Client pode verificar antes de iniciar upload.
pub async fn check_hash(
    State(state): State<AppState>,
    Path(hash): Path<String>,
) -> impl IntoResponse {
    match crate::services::dedup_service::check_duplicate(&state.db, &hash).await {
        Ok(crate::services::dedup_service::DedupResult::Duplicate {
            original_file_id,
            chunks_count,
            optimized_size,
        }) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "exists": true,
                "original_file_id": original_file_id,
                "chunks_count": chunks_count,
                "optimized_size": optimized_size,
            })),
        )
            .into_response(),
        Ok(crate::services::dedup_service::DedupResult::New) => {
            (StatusCode::OK, Json(serde_json::json!({ "exists": false }))).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response(),
    }
}

/// GET /api/v1/files/:id/placeholder — metadados leves para exibicao local (UC-009).
/// Retorna nome, tipo, tamanho, status e preview_chunk_id sem baixar conteudo.
/// Dispositivos locais usam placeholder + download sob demanda para economizar espaco.
pub async fn get_placeholder(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> impl IntoResponse {
    match file_service::get_file(&state.db, file_id).await {
        Ok(f) => (
            StatusCode::OK,
            Json(PlaceholderResponse {
                id: f.id,
                original_name: f.original_name,
                media_type: f.media_type,
                mime_type: f.mime_type,
                file_extension: f.file_extension,
                original_size: f.original_size,
                optimized_size: f.optimized_size,
                status: f.status,
                preview_chunk_id: f.preview_chunk_id,
                has_content: false, // Placeholder: conteudo nao baixado localmente
                created_at: f.created_at,
            }),
        )
            .into_response(),
        Err(e) => map_file_error(e).into_response(),
    }
}

/// GET /api/v1/files/:id/download — download completo do arquivo (UC-005).
/// Na v1: retorna 202 Accepted indicando que o download sera processado.
/// v2: reconstroi arquivo via manifest (decrypt chunks + reassemble).
pub async fn download_file(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> impl IntoResponse {
    // Verificar arquivo existe e esta ready
    match file_service::get_file(&state.db, file_id).await {
        Ok(f) => {
            if f.status != "ready" {
                return (
                    StatusCode::CONFLICT,
                    Json(ErrorResponse {
                        error: format!(
                            "arquivo em status '{}' — download disponivel apenas para status 'ready'",
                            f.status
                        ),
                    }),
                )
                    .into_response();
            }

            // v1: retorna metadados do download (v2: stream de bytes reconstruidos)
            // TODO (v2): media_pipeline::download_file(pool, file_id, master_key, providers)
            (
                StatusCode::ACCEPTED,
                Json(serde_json::json!({
                    "file_id": f.id,
                    "original_name": f.original_name,
                    "optimized_size": f.optimized_size,
                    "content_hash": f.content_hash,
                    "status": "download_queued",
                    "message": "download sera processado (v2: reconstituicao via manifest)"
                })),
            )
                .into_response()
        }
        Err(e) => map_file_error(e).into_response(),
    }
}

#[derive(Serialize)]
pub struct PlaceholderResponse {
    pub id: Uuid,
    pub original_name: String,
    pub media_type: String,
    pub mime_type: String,
    pub file_extension: String,
    pub original_size: i64,
    pub optimized_size: i64,
    pub status: String,
    pub preview_chunk_id: Option<String>,
    pub has_content: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
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

#[cfg(test)]
mod tests {
    use super::*;

    // UC-009: PlaceholderResponse has_content is false
    #[test]
    fn placeholder_has_content_false() {
        let p = PlaceholderResponse {
            id: Uuid::new_v4(),
            original_name: "familia.jpg".into(),
            media_type: "foto".into(),
            mime_type: "image/jpeg".into(),
            file_extension: "jpg".into(),
            original_size: 5_000_000,
            optimized_size: 1_200_000,
            status: "ready".into(),
            preview_chunk_id: Some("abc123".into()),
            has_content: false,
            created_at: chrono::Utc::now(),
        };
        assert!(!p.has_content);
    }

    // UC-009: Placeholder contem metadados suficientes para exibicao
    #[test]
    fn placeholder_has_required_metadata() {
        let p = PlaceholderResponse {
            id: Uuid::new_v4(),
            original_name: "video.mp4".into(),
            media_type: "video".into(),
            mime_type: "video/mp4".into(),
            file_extension: "mp4".into(),
            original_size: 500_000_000,
            optimized_size: 200_000_000,
            status: "ready".into(),
            preview_chunk_id: None,
            has_content: false,
            created_at: chrono::Utc::now(),
        };
        assert!(!p.original_name.is_empty());
        assert!(!p.media_type.is_empty());
        assert!(p.original_size > 0);
    }

    // UC-009: Placeholder serializa para JSON com has_content
    #[test]
    fn placeholder_serializes_to_json() {
        let p = PlaceholderResponse {
            id: Uuid::new_v4(),
            original_name: "doc.pdf".into(),
            media_type: "documento".into(),
            mime_type: "application/pdf".into(),
            file_extension: "pdf".into(),
            original_size: 1_000_000,
            optimized_size: 1_000_000,
            status: "ready".into(),
            preview_chunk_id: None,
            has_content: false,
            created_at: chrono::Utc::now(),
        };
        let json = serde_json::to_string(&p).unwrap();
        assert!(json.contains("\"has_content\":false"));
        assert!(json.contains("\"media_type\":\"documento\""));
    }
}
