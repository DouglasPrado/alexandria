//! StorageProvider: interface unificada para backends de armazenamento.
//!
//! Implementacoes: filesystem local, S3, R2, B2 (todos S3-compatible via aws-sdk-s3).
//! Operacoes: put, get, exists, delete, list, capacity.

pub mod local;
pub mod s3;

use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("chunk nao encontrado: {0}")]
    NotFound(String),
    #[error("erro de IO: {0}")]
    IoError(#[from] std::io::Error),
    #[error("espaco insuficiente no no")]
    InsufficientSpace,
    #[error("erro do provedor: {0}")]
    ProviderError(String),
}

/// Interface unificada para todos os backends de storage.
/// Cada implementacao (local, S3, R2) implementa este trait.
#[async_trait]
pub trait StorageProvider: Send + Sync {
    async fn put(&self, chunk_id: &str, data: &[u8]) -> Result<(), StorageError>;
    async fn get(&self, chunk_id: &str) -> Result<Vec<u8>, StorageError>;
    async fn exists(&self, chunk_id: &str) -> Result<bool, StorageError>;
    async fn delete(&self, chunk_id: &str) -> Result<(), StorageError>;
    async fn list(&self) -> Result<Vec<String>, StorageError>;
    async fn capacity(&self) -> Result<StorageCapacity, StorageError>;
}

#[derive(Debug, Clone)]
pub struct StorageCapacity {
    pub total_bytes: u64,
    pub used_bytes: u64,
}

impl StorageCapacity {
    pub fn available_bytes(&self) -> u64 {
        self.total_bytes.saturating_sub(self.used_bytes)
    }
}
