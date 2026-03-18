use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Grupo familiar que compartilha armazenamento distribuido.
/// Entidade raiz que agrupa membros, nos e arquivos.
/// Possui identidade criptografica derivada de um par de chaves.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cluster {
    pub id: Uuid,
    /// Hash da chave publica — identidade criptografica imutavel
    pub cluster_id: String,
    pub name: String,
    /// Chave publica para verificacao de assinaturas
    pub public_key: Vec<u8>,
    /// Chave privada criptografada com master key
    pub encrypted_private_key: Vec<u8>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClusterEvent {
    /// Dispara geracao de seed phrase e criacao do vault do membro admin
    Created { cluster_id: String },
    /// Dispara reconexao de nos e rebuild do indice de metadados
    Recovered { cluster_id: String },
}
