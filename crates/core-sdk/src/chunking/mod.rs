//! Modulo de chunking: divisao de arquivos em blocos de ~4MB.
//!
//! Cada chunk e identificado pelo SHA-256 do seu conteudo criptografado
//! (content-addressable storage).

use thiserror::Error;

#[derive(Debug, Error)]
pub enum ChunkingError {
    #[error("erro de IO ao ler arquivo: {0}")]
    IoError(#[from] std::io::Error),
    #[error("arquivo vazio")]
    EmptyFile,
}
