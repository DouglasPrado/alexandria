use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Tipo do no de armazenamento.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Local,
    S3,
    R2,
    Vps,
}

impl NodeType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Local => "local",
            Self::S3 => "s3",
            Self::R2 => "r2",
            Self::Vps => "vps",
        }
    }
}

impl std::fmt::Display for NodeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Estado atual do no.
/// online → suspect (>30min sem heartbeat) → lost (>1h sem heartbeat)
/// qualquer → draining (migracao de chunks antes de desconectar)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeStatus {
    Online,
    Suspect,
    Lost,
    Draining,
}

impl NodeStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Online => "online",
            Self::Suspect => "suspect",
            Self::Lost => "lost",
            Self::Draining => "draining",
        }
    }
}

impl std::fmt::Display for NodeStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Dispositivo ou servico que armazena chunks criptografados.
/// Pode ser computador local, celular, NAS, VPS ou bucket cloud (S3, R2).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub owner_id: Uuid,
    pub node_type: NodeType,
    pub name: String,
    /// Espaco total disponivel em bytes
    pub total_capacity: i64,
    /// Espaco atualmente ocupado por chunks em bytes
    pub used_capacity: i64,
    pub status: NodeStatus,
    /// URL ou endereco de conexao (para nos remotos)
    pub endpoint: Option<String>,
    /// Credenciais de acesso criptografadas (S3 keys, OAuth tokens)
    pub config_encrypted: Option<Vec<u8>>,
    pub last_heartbeat: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeEvent {
    Registered { node_id: Uuid, cluster_id: Uuid },
    Online { node_id: Uuid },
    Suspected { node_id: Uuid },
    Lost { node_id: Uuid },
    DrainStarted { node_id: Uuid },
    Disconnected { node_id: Uuid },
}
