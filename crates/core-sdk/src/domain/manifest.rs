use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Entrada de chunk dentro do manifest — descreve posicao e hash.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestChunkEntry {
    pub chunk_id: String,
    pub index: u32,
    pub hash: String,
    pub size: u32,
}

/// Mapa que descreve completamente um arquivo: chunks, hashes, chave de criptografia.
/// Permite reconstruir o arquivo a partir dos chunks distribuidos.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub id: Uuid,
    pub file_id: Uuid,
    /// Lista ordenada de chunks com hash e tamanho
    pub chunks: Vec<ManifestChunkEntry>,
    /// Chave do arquivo criptografada com master key (envelope encryption)
    pub file_key_encrypted: Vec<u8>,
    /// Assinatura criptografica para verificacao de integridade
    pub signature: Option<Vec<u8>>,
    /// IDs dos nos que possuem copia do manifest
    pub replicated_to: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ManifestEvent {
    Created { manifest_id: Uuid, file_id: Uuid },
    Replicated { manifest_id: Uuid, node_id: Uuid },
    Validated { manifest_id: Uuid },
}
