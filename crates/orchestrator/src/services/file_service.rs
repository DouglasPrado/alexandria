//! Service de File: UC-004 (Upload) e UC-005 (Download).
//!
//! Regras de negocio: RN-F1..F6, RN-CH1..CH6.

use crate::db::{files, nodes};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum FileError {
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("arquivo nao encontrado")]
    NotFound,
    #[error("nos insuficientes para replicacao minima (precisa 3+)")]
    InsufficientNodes,
    #[error("arquivo temporariamente indisponivel")]
    #[allow(dead_code)]
    Unavailable,
}

/// Resultado do inicio de upload.
pub struct UploadResult {
    pub file_id: Uuid,
    pub status: String,
}

/// Parametros para iniciar upload.
pub struct UploadParams<'a> {
    pub cluster_id: Uuid,
    pub uploaded_by: Uuid,
    pub original_name: &'a str,
    pub media_type: &'a str,
    pub mime_type: &'a str,
    pub file_extension: &'a str,
    pub original_size: i64,
}

/// Inicia upload de arquivo (UC-004).
/// Registra file com status "processing" e enfileira job.
pub async fn initiate_upload(
    pool: &PgPool,
    params: UploadParams<'_>,
) -> Result<UploadResult, FileError> {
    // Verificar minimo de nos para replicacao (UC-004: E1)
    let online_nodes = nodes::count_online_by_cluster(pool, params.cluster_id).await?;
    if online_nodes < 3 {
        return Err(FileError::InsufficientNodes);
    }

    // Registrar arquivo com status "processing"
    let file = files::insert(
        pool,
        files::InsertFileParams {
            cluster_id: params.cluster_id,
            uploaded_by: params.uploaded_by,
            original_name: params.original_name,
            media_type: params.media_type,
            mime_type: params.mime_type,
            file_extension: params.file_extension,
            original_size: params.original_size,
        },
    )
    .await?;

    // Em producao: enfileira job no Redis para Media Worker processar
    // Pipeline: optimize → preview → chunk → encrypt → distribute → manifest

    Ok(UploadResult {
        file_id: file.id,
        status: "processing".into(),
    })
}

/// Lista arquivos do cluster com paginacao por cursor (galeria).
pub async fn list_gallery(
    pool: &PgPool,
    cluster_id: Uuid,
    cursor: Option<chrono::DateTime<chrono::Utc>>,
    limit: i64,
) -> Result<Vec<files::FileRow>, FileError> {
    let limit = limit.clamp(1, 100);
    let rows = files::find_by_cluster_paginated(pool, cluster_id, cursor, limit).await?;
    Ok(rows)
}

/// Obtem arquivo por ID.
pub async fn get_file(pool: &PgPool, file_id: Uuid) -> Result<files::FileRow, FileError> {
    files::find_by_id(pool, file_id)
        .await?
        .ok_or(FileError::NotFound)
}

/// Marca arquivo como "error" quando o pipeline falha (09-state_models: processing → error).
pub async fn mark_error(pool: &PgPool, file_id: Uuid) -> Result<(), FileError> {
    files::update_status(pool, file_id, "error", 0, "").await?;
    Ok(())
}

#[allow(dead_code)]
/// Marca arquivo como "ready" quando o pipeline completa com sucesso
/// (09-state_models: processing → ready). Condicao: todos chunks com 3+ replicas (RN-F6).
pub async fn mark_ready(
    pool: &PgPool,
    file_id: Uuid,
    optimized_size: i64,
    content_hash: &str,
) -> Result<(), FileError> {
    files::update_status(pool, file_id, "ready", optimized_size, content_hash).await?;
    Ok(())
}
