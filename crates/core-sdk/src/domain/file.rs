use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Tipo de midia classificado pelo pipeline.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaType {
    Foto,
    Video,
    Documento,
}

impl MediaType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Foto => "foto",
            Self::Video => "video",
            Self::Documento => "documento",
        }
    }
}

impl std::fmt::Display for MediaType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Estado do pipeline de processamento do arquivo.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FileStatus {
    Processing,
    Ready,
    Error,
}

impl FileStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Processing => "processing",
            Self::Ready => "ready",
            Self::Error => "error",
        }
    }
}

impl std::fmt::Display for FileStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Representacao logica de uma foto, video ou documento no cluster.
/// Nao contem os dados em si — estes vivem nos chunks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct File {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub uploaded_by: Uuid,
    pub original_name: String,
    pub media_type: MediaType,
    pub mime_type: String,
    pub file_extension: String,
    /// Tamanho antes de otimizacao (bytes)
    pub original_size: i64,
    /// Tamanho apos pipeline de midia (bytes)
    pub optimized_size: i64,
    /// SHA-256 do conteudo otimizado (para deduplicacao)
    pub content_hash: String,
    /// EXIF e metadados extraidos
    pub metadata: Option<serde_json::Value>,
    /// Chunk ID do preview/thumbnail
    pub preview_chunk_id: Option<String>,
    pub status: FileStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileEvent {
    /// Upload iniciado, job enfileirado no pipeline
    Received { file_id: Uuid },
    /// Pipeline concluido, chunks distribuidos
    Processed { file_id: Uuid },
    /// Replicacao minima atingida (3x), visivel na galeria
    Ready { file_id: Uuid },
    /// Pipeline falhou
    Error { file_id: Uuid, reason: String },
}
