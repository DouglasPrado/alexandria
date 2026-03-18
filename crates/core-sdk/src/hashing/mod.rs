//! Modulo de hashing: SHA-256 para integridade e content-addressing.
//!
//! Usado para:
//! - chunk_id = SHA-256 do conteudo criptografado (RN-CH2)
//! - content_hash de File = SHA-256 do conteudo otimizado (RN-F4, deduplicacao)
//! - cluster_id = SHA-256 da public_key
//! - Scrubbing: recalcular hash e comparar com chunk_id (RN-CH4)

use sha2::{Digest, Sha256};
use std::fmt;
use std::io::Read;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HashError {
    #[error("hash mismatch: esperado {expected}, recebido {actual}")]
    Mismatch { expected: String, actual: String },
    #[error("erro de IO ao ler dados: {0}")]
    IoError(#[from] std::io::Error),
}

/// Hash SHA-256 de 32 bytes.
/// Representa o resultado de qualquer operacao de hashing no Alexandria.
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct Hash([u8; 32]);

impl Hash {
    /// Retorna os 32 bytes brutos do hash.
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Retorna o hash como string hexadecimal lowercase (64 chars).
    pub fn to_hex(&self) -> String {
        self.0.iter().map(|b| format!("{b:02x}")).collect()
    }
}

impl fmt::Display for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for byte in &self.0 {
            write!(f, "{byte:02x}")?;
        }
        Ok(())
    }
}

impl fmt::Debug for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Hash({})", self.to_hex())
    }
}

/// Calcula SHA-256 de um slice de bytes.
pub fn sha256(data: &[u8]) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    Hash(result.into())
}

/// Calcula SHA-256 e retorna como hex string (64 chars).
/// Conveniencia para gerar chunk_id e content_hash.
pub fn sha256_hex(data: &[u8]) -> String {
    sha256(data).to_hex()
}

/// Calcula SHA-256 de um reader (streaming).
/// Util para arquivos grandes que nao cabem em memoria.
const READER_BUF_SIZE: usize = 8 * 1024; // 8KB

pub fn sha256_reader<R: Read>(reader: &mut R) -> Result<Hash, HashError> {
    let mut hasher = Sha256::new();
    let mut buf = [0u8; READER_BUF_SIZE];
    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    let result = hasher.finalize();
    Ok(Hash(result.into()))
}

/// Verifica integridade: calcula SHA-256 dos dados e compara com o hash esperado.
/// Usado no scrubbing (RN-CH4) e na verificacao de download.
pub fn verify(data: &[u8], expected_hex: &str) -> Result<(), HashError> {
    let actual = sha256(data);
    let actual_hex = actual.to_hex();
    if actual_hex == expected_hex {
        Ok(())
    } else {
        Err(HashError::Mismatch {
            expected: expected_hex.to_string(),
            actual: actual_hex,
        })
    }
}

/// Verifica integridade via reader (streaming).
/// Util para verificar chunks grandes sem carregar em memoria.
pub fn verify_reader<R: Read>(reader: &mut R, expected_hex: &str) -> Result<(), HashError> {
    let actual = sha256_reader(reader)?;
    let actual_hex = actual.to_hex();
    if actual_hex == expected_hex {
        Ok(())
    } else {
        Err(HashError::Mismatch {
            expected: expected_hex.to_string(),
            actual: actual_hex,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // -- Test vectors conhecidos (NIST) --

    /// SHA-256 de string vazia = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const EMPTY_HASH: &str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    /// SHA-256 de "hello" = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    const HELLO_HASH: &str = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

    // -- Hash type --

    #[test]
    fn hash_from_bytes_produces_correct_hex() {
        let hash = sha256(b"hello");
        assert_eq!(hash.to_hex(), HELLO_HASH);
    }

    #[test]
    fn hash_from_empty_input() {
        let hash = sha256(b"");
        assert_eq!(hash.to_hex(), EMPTY_HASH);
    }

    #[test]
    fn hash_display_is_hex() {
        let hash = sha256(b"hello");
        assert_eq!(format!("{hash}"), HELLO_HASH);
    }

    #[test]
    fn hash_as_bytes_is_32_bytes() {
        let hash = sha256(b"hello");
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn hash_equality_same_input() {
        let a = sha256(b"hello");
        let b = sha256(b"hello");
        assert_eq!(a, b);
    }

    #[test]
    fn hash_inequality_different_input() {
        let a = sha256(b"hello");
        let b = sha256(b"world");
        assert_ne!(a, b);
    }

    // -- sha256_hex convenience --

    #[test]
    fn sha256_hex_returns_64_char_lowercase_string() {
        let hex = sha256_hex(b"hello");
        assert_eq!(hex.len(), 64);
        assert!(hex.chars().all(|c: char| c.is_ascii_hexdigit()));
        assert_eq!(hex, HELLO_HASH);
    }

    // -- sha256_reader streaming --

    #[test]
    fn sha256_reader_matches_sha256_for_small_data() {
        let data = b"hello";
        let hash_direct = sha256(data);
        let hash_reader = sha256_reader(&mut &data[..]).unwrap();
        assert_eq!(hash_direct, hash_reader);
    }

    #[test]
    fn sha256_reader_handles_large_data() {
        // Simula dados maiores que o buffer interno (>8KB)
        let data = vec![0xABu8; 32 * 1024]; // 32KB
        let hash_direct = sha256(&data);
        let hash_reader = sha256_reader(&mut &data[..]).unwrap();
        assert_eq!(hash_direct, hash_reader);
    }

    #[test]
    fn sha256_reader_empty_input() {
        let data: &[u8] = b"";
        let hash = sha256_reader(&mut &data[..]).unwrap();
        assert_eq!(hash.to_hex(), EMPTY_HASH);
    }

    // -- verify (scrubbing: RN-CH4) --

    #[test]
    fn verify_passes_with_correct_hash() {
        let result = verify(b"hello", HELLO_HASH);
        assert!(result.is_ok());
    }

    #[test]
    fn verify_fails_with_wrong_hash() {
        let result = verify(b"hello", EMPTY_HASH);
        assert!(result.is_err());
        match result.unwrap_err() {
            HashError::Mismatch { expected, actual } => {
                assert_eq!(expected, EMPTY_HASH);
                assert_eq!(actual, HELLO_HASH);
            }
            other => panic!("esperava HashError::Mismatch, recebeu: {other}"),
        }
    }

    #[test]
    fn verify_reader_passes_with_correct_hash() {
        let data = b"hello";
        let result = verify_reader(&mut &data[..], HELLO_HASH);
        assert!(result.is_ok());
    }

    #[test]
    fn verify_reader_fails_with_wrong_hash() {
        let data = b"hello";
        let result = verify_reader(&mut &data[..], EMPTY_HASH);
        assert!(result.is_err());
    }

    // -- content-addressable: mesmo conteudo = mesmo ID (RN-CH3) --

    #[test]
    fn identical_content_produces_identical_chunk_id() {
        let content = b"chunk data here";
        let id_a = sha256_hex(content);
        let id_b = sha256_hex(content);
        assert_eq!(id_a, id_b, "RN-CH3: mesmo conteudo deve gerar mesmo hash");
    }

    #[test]
    fn different_content_produces_different_chunk_id() {
        let id_a = sha256_hex(b"chunk A");
        let id_b = sha256_hex(b"chunk B");
        assert_ne!(id_a, id_b, "RN-CH2: conteudo diferente = ID diferente");
    }
}
