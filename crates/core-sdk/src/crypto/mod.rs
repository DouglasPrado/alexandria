//! Modulo de criptografia: AES-256-GCM, envelope encryption, key derivation.
//!
//! Seed phrase (BIP-39, 12 palavras) → master key → file keys → chunk keys.
//! Master key existe apenas em memoria, nunca persistida em disco.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("falha na criptografia: {0}")]
    EncryptionFailed(String),
    #[error("falha na descriptografia: {0}")]
    DecryptionFailed(String),
    #[error("seed phrase invalida")]
    InvalidSeedPhrase,
    #[error("chave invalida")]
    InvalidKey,
}
