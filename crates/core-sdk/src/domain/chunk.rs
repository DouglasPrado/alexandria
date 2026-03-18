use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Bloco de dados criptografado de ~4MB.
/// Unidade atomica de armazenamento, replicacao e verificacao de integridade.
/// ID = SHA-256 do conteudo criptografado (content-addressable storage).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chunk {
    /// SHA-256 do conteudo criptografado — funciona como ID e prova de integridade
    pub id: String,
    pub file_id: Uuid,
    /// Posicao dentro do arquivo (0-based)
    pub chunk_index: i32,
    /// Tamanho em bytes
    pub size: i32,
    pub created_at: DateTime<Utc>,
}

/// Tamanho alvo de cada chunk (~4MB)
pub const CHUNK_TARGET_SIZE: usize = 4 * 1024 * 1024;

/// Fator minimo de replicacao por chunk
pub const REPLICATION_FACTOR: u32 = 3;

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChunkEvent {
    Created { chunk_id: String },
    Replicated { chunk_id: String, node_id: Uuid },
    Corrupted { chunk_id: String, node_id: Uuid },
    Repaired { chunk_id: String, node_id: Uuid },
    Orphaned { chunk_id: String },
}
