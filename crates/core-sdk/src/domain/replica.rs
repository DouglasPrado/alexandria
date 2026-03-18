use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Registro de que um chunk especifico esta armazenado em um no especifico.
/// Permite rastrear onde cada chunk vive e quando foi verificado.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkReplica {
    pub id: Uuid,
    /// SHA-256 do chunk (FK para chunks)
    pub chunk_id: String,
    pub node_id: Uuid,
    /// Ultimo scrubbing bem-sucedido nesta replica
    pub verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
