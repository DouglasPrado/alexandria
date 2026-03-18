//! Modulo de hashing: SHA-256 para integridade e content-addressing.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum HashError {
    #[error("hash mismatch: esperado {expected}, recebido {actual}")]
    Mismatch { expected: String, actual: String },
}
