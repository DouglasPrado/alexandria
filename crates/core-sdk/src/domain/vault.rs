use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Cofre criptografado individual por membro.
/// Armazena tokens OAuth, credenciais de provedores cloud, chaves e senhas.
/// Conteudo e um blob criptografado com AES-256-GCM;
/// estrutura interna (JSON) so e acessivel apos desbloqueio com senha do membro
/// ou master key em recovery.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vault {
    pub id: Uuid,
    pub member_id: Uuid,
    /// Conteudo criptografado (tokens, credenciais, senhas, config)
    pub vault_data: Vec<u8>,
    pub encryption_algorithm: String,
    /// Versao do formato interno para migracoes futuras
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Estrutura interna do vault apos descriptografia.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultData {
    pub oauth_tokens: Vec<OAuthToken>,
    pub node_credentials: Vec<NodeCredential>,
    pub passwords: Vec<VaultPassword>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthToken {
    pub provider: String,
    pub node_name: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeCredential {
    pub node_name: String,
    pub credential_type: String,
    pub endpoint: String,
    pub access_key: String,
    pub secret_key: String,
    pub bucket: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultPassword {
    pub id: Uuid,
    pub title: String,
    pub username: String,
    pub password_encrypted: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VaultEvent {
    Created { member_id: Uuid },
    Unlocked { member_id: Uuid },
    Updated { member_id: Uuid },
    Replicated { member_id: Uuid, node_id: Uuid },
}
