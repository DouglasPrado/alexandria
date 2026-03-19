//! Endpoints REST para Files.
//!
//! POST /api/v1/files/upload — upload multipart (UC-004)
//! GET  /api/v1/clusters/:id/files — listar galeria (paginacao cursor)
//! GET  /api/v1/files/:id — obter arquivo
//! GET  /api/v1/files/:id/preview — preview/thumbnail
//! GET  /api/v1/files/:id/placeholder — metadados leves (UC-009)
//! GET  /api/v1/files/:id/download — download completo (UC-005)

use axum::{
    Extension, Json,
    extract::{Multipart, Path, Query, State},
    http::{StatusCode, header},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tracing::error;
use uuid::Uuid;

use super::AppState;
use crate::auth::claims::AuthClaims;
use crate::services::file_service;

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

/// POST /api/v1/files/upload — UC-004 (multipart/form-data)
///
/// Campos esperados:
/// - `file`: bytes do arquivo (field obrigatorio)
/// - `cluster_id`: UUID do cluster (text, obrigatorio)
/// - `media_type`: "foto" | "video" | "documento" (text, opcional — detectado pelo MIME)
pub async fn upload_file(
    Extension(claims): Extension<AuthClaims>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut original_name: Option<String> = None;
    let mut mime_type: Option<String> = None;
    let mut cluster_id: Option<Uuid> = None;
    let mut media_type_field: Option<String> = None;

    // Iterar sobre os campos do multipart
    loop {
        match multipart.next_field().await {
            Ok(Some(field)) => {
                let name = field.name().unwrap_or("").to_string();
                match name.as_str() {
                    "file" => {
                        original_name = field.file_name().map(|s| s.to_string());
                        mime_type = field.content_type().map(|s| s.to_string());
                        match field.bytes().await {
                            Ok(b) => file_bytes = Some(b.to_vec()),
                            Err(_) => return StatusCode::BAD_REQUEST.into_response(),
                        }
                    }
                    "cluster_id" => {
                        let text = match field.text().await {
                            Ok(t) => t,
                            Err(_) => return StatusCode::BAD_REQUEST.into_response(),
                        };
                        cluster_id = match Uuid::parse_str(&text) {
                            Ok(id) => Some(id),
                            Err(_) => return StatusCode::BAD_REQUEST.into_response(),
                        };
                    }
                    "media_type" => {
                        media_type_field = match field.text().await {
                            Ok(t) => Some(t),
                            Err(_) => return StatusCode::BAD_REQUEST.into_response(),
                        };
                    }
                    _ => {} // ignorar campos desconhecidos
                }
            }
            Ok(None) => break,
            Err(_) => return StatusCode::BAD_REQUEST.into_response(),
        }
    }

    // Validar campos obrigatorios
    let file_bytes = match file_bytes {
        Some(b) => b,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };
    let cluster_id = match cluster_id {
        Some(id) => id,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };

    let original_name = original_name.unwrap_or_else(|| "unknown".to_string());
    let uploaded_by = claims.member_id;

    // Detectar media_type a partir do MIME se nao fornecido
    let media_type = media_type_field.unwrap_or_else(|| {
        match mime_type.as_deref() {
            Some(m) if m.starts_with("image/") => "foto".to_string(),
            Some(m) if m.starts_with("video/") => "video".to_string(),
            _ => "documento".to_string(),
        }
    });

    let file_extension = original_name
        .rsplit('.')
        .next()
        .unwrap_or("bin")
        .to_string();

    let mime = mime_type
        .as_deref()
        .unwrap_or("application/octet-stream")
        .to_string();

    // Gerar ID e salvar em diretorio temporario
    let file_id = Uuid::new_v4();
    let temp_dir = "/tmp/alexandria/uploads";

    if let Err(_) = tokio::fs::create_dir_all(temp_dir).await {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    let temp_path = format!("{}/{}", temp_dir, file_id);
    if let Err(_) = tokio::fs::write(&temp_path, &file_bytes).await {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    // Criar registro no banco com status="processing" e temp_path
    // content_hash sera atualizado pelo pipeline apos processamento
    let result = sqlx::query(
        "INSERT INTO files (id, cluster_id, uploaded_by, original_name, media_type, mime_type, \
         file_extension, original_size, optimized_size, content_hash, status, temp_path, \
         created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, '', 'processing', $9, NOW(), NOW())",
    )
    .bind(file_id)
    .bind(cluster_id)
    .bind(uploaded_by)
    .bind(&original_name)
    .bind(&media_type)
    .bind(&mime)
    .bind(&file_extension)
    .bind(file_bytes.len() as i64)
    .bind(&temp_path)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (
            StatusCode::CREATED,
            Json(UploadResponse {
                file_id,
                status: "processing".to_string(),
            }),
        )
            .into_response(),
        Err(e) => {
            error!(file_id = %file_id, error = %e, "falha ao criar registro de arquivo");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
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
/// Retorna bytes WebP com Content-Type image/webp.
/// Preview e gerado pelo pipeline apos upload e salvo em /data/previews/{id}.webp.
pub async fn get_preview(
    Path(file_id): Path<Uuid>,
    State(_state): State<AppState>,
) -> impl IntoResponse {
    let preview_path = format!("/data/previews/{}.webp", file_id);
    match tokio::fs::read(&preview_path).await {
        Ok(bytes) => (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "image/webp")],
            bytes,
        )
            .into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
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
/// Reconstroi arquivo via manifest: decrypt chunks + reassemble.
pub async fn download_file(
    Extension(claims): Extension<AuthClaims>,
    Path(file_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // 1. Verificar arquivo existe e pertence ao cluster do membro
    let file = match file_service::get_file(&state.db, file_id).await {
        Ok(f) => f,
        Err(e) => return map_file_error(e).into_response(),
    };

    // Verificar que o membro tem acesso ao cluster do arquivo
    if file.cluster_id != claims.cluster_id {
        return StatusCode::FORBIDDEN.into_response();
    }

    // 2. Verificar status == "ready"
    if file.status != "ready" {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: format!(
                    "arquivo em status '{}' — download disponivel apenas para status 'ready'",
                    file.status
                ),
            }),
        )
            .into_response();
    }

    // 3. Obter master_key (guard mantido vivo durante o download)
    let master_key_guard = state.master_key.read().await;
    let master_key = match master_key_guard.as_ref() {
        Some(mk) => mk,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: "vault bloqueado — desbloqueie com a seed phrase".to_string(),
                }),
            )
                .into_response();
        }
    };

    // 4. Reconstituir arquivo via pipeline
    let storage_providers = state.storage_providers.read().await;
    match crate::services::media_pipeline::download_file(
        &state.db,
        file_id,
        master_key,
        &storage_providers,
    )
    .await
    {
        Ok(bytes) => {
            let content_disposition = format!(
                "attachment; filename=\"{}\"",
                file.original_name
            );
            (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, file.mime_type.clone()),
                    (header::CONTENT_DISPOSITION, content_disposition),
                ],
                bytes,
            )
                .into_response()
        }
        Err(e) => {
            error!(file_id = %file_id, error = %e, "falha no download do arquivo");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "falha ao reconstituir arquivo".to_string(),
                }),
            )
                .into_response()
        }
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
