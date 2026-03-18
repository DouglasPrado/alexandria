//! Modulo de criptografia: AES-256-GCM + envelope encryption.
//!
//! Zero-knowledge: criptografia no cliente antes do upload.
//! Chunks criptografados sao autenticados — detectam adulteracao (STRIDE: Tampering).
//! Nonce aleatorio de 96 bits garante que mesmos dados + mesma chave = ciphertexts diferentes.
//!
//! Formato do ciphertext: [nonce (12 bytes) | encrypted_data + tag (16 bytes)]
//!
//! Envelope encryption (ADR-005):
//!   seed phrase (12 palavras BIP-39) → master key → file keys → AES-256-GCM

pub mod envelope;

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, AeadCore, Nonce};
use thiserror::Error;

/// Tamanho do nonce AES-256-GCM (96 bits)
pub const NONCE_SIZE: usize = 12;

/// Tamanho da authentication tag GCM (128 bits)
pub const TAG_SIZE: usize = 16;

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

/// Criptografa dados com AES-256-GCM.
/// Retorna: [nonce (12 bytes) | ciphertext + tag (16 bytes)]
/// Nonce aleatorio gerado internamente — cada chamada produz output diferente.
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    // Prepend nonce ao ciphertext
    let mut result = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);
    Ok(result)
}

/// Descriptografa dados criptografados com AES-256-GCM.
/// Espera formato: [nonce (12 bytes) | ciphertext + tag (16 bytes)]
/// Verifica autenticidade via GCM tag — adulteracao e detectada.
pub fn decrypt(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, CryptoError> {
    if data.len() < NONCE_SIZE + TAG_SIZE {
        return Err(CryptoError::DecryptionFailed(
            "dados muito curtos para conter nonce + tag".into(),
        ));
    }

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    let nonce = Nonce::from_slice(&data[..NONCE_SIZE]);
    let ciphertext = &data[NONCE_SIZE..];

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
}

/// Gera chave aleatoria de 256 bits (32 bytes) para AES-256-GCM.
pub fn generate_key() -> [u8; 32] {
    let key = Aes256Gcm::generate_key(&mut OsRng);
    let mut result = [0u8; 32];
    result.copy_from_slice(&key);
    result
}

/// Gera nonce aleatorio de 96 bits (12 bytes).
pub fn generate_nonce() -> [u8; 12] {
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let mut result = [0u8; 12];
    result.copy_from_slice(&nonce);
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    // -- encrypt + decrypt roundtrip --

    #[test]
    fn encrypt_decrypt_roundtrip_recovers_plaintext() {
        let key = generate_key();
        let plaintext = b"hello alexandria";
        let ciphertext = encrypt(&key, plaintext).unwrap();
        let recovered = decrypt(&key, &ciphertext).unwrap();
        assert_eq!(recovered, plaintext);
    }

    #[test]
    fn encrypt_decrypt_roundtrip_with_empty_plaintext() {
        let key = generate_key();
        let plaintext = b"";
        let ciphertext = encrypt(&key, plaintext).unwrap();
        let recovered = decrypt(&key, &ciphertext).unwrap();
        assert_eq!(recovered, plaintext);
    }

    #[test]
    fn encrypt_decrypt_roundtrip_with_large_data() {
        let key = generate_key();
        let plaintext = vec![0xABu8; 4 * 1024 * 1024]; // 4MB chunk
        let ciphertext = encrypt(&key, &plaintext).unwrap();
        let recovered = decrypt(&key, &ciphertext).unwrap();
        assert_eq!(recovered, plaintext);
    }

    // -- ciphertext formato: nonce (12) + data + tag (16) --

    #[test]
    fn ciphertext_is_larger_than_plaintext_by_nonce_and_tag() {
        let key = generate_key();
        let plaintext = b"test data";
        let ciphertext = encrypt(&key, plaintext).unwrap();
        // nonce (12) + plaintext (9) + tag (16) = 37
        assert_eq!(ciphertext.len(), plaintext.len() + NONCE_SIZE + TAG_SIZE);
    }

    // -- nonce aleatorio: mesmos dados + mesma chave = ciphertexts diferentes --

    #[test]
    fn encrypt_produces_different_ciphertext_each_time() {
        let key = generate_key();
        let plaintext = b"same data";
        let ct1 = encrypt(&key, plaintext).unwrap();
        let ct2 = encrypt(&key, plaintext).unwrap();
        assert_ne!(ct1, ct2, "nonce aleatorio deve gerar ciphertexts diferentes");
        // Mas ambos descriptografam para o mesmo plaintext
        assert_eq!(decrypt(&key, &ct1).unwrap(), plaintext);
        assert_eq!(decrypt(&key, &ct2).unwrap(), plaintext);
    }

    // -- chave errada falha na descriptografia (autenticacao GCM) --

    #[test]
    fn decrypt_with_wrong_key_fails() {
        let key1 = generate_key();
        let key2 = generate_key();
        let plaintext = b"secret family photo";
        let ciphertext = encrypt(&key1, plaintext).unwrap();
        let result = decrypt(&key2, &ciphertext);
        assert!(result.is_err(), "chave errada deve falhar");
    }

    // -- adulteracao detectada (STRIDE: Tampering) --

    #[test]
    fn tampered_ciphertext_fails_decryption() {
        let key = generate_key();
        let plaintext = b"important data";
        let mut ciphertext = encrypt(&key, plaintext).unwrap();
        // Altera um byte no meio do ciphertext (apos o nonce)
        let mid = NONCE_SIZE + 1;
        if mid < ciphertext.len() {
            ciphertext[mid] ^= 0xFF;
        }
        let result = decrypt(&key, &ciphertext);
        assert!(result.is_err(), "ciphertext adulterado deve falhar (GCM auth tag)");
    }

    #[test]
    fn truncated_ciphertext_fails_decryption() {
        let key = generate_key();
        let plaintext = b"data";
        let ciphertext = encrypt(&key, plaintext).unwrap();
        // Trunca — menor que nonce + tag
        let truncated = &ciphertext[..NONCE_SIZE + 2];
        let result = decrypt(&key, truncated);
        assert!(result.is_err(), "ciphertext truncado deve falhar");
    }

    #[test]
    fn ciphertext_too_short_fails() {
        let key = generate_key();
        let result = decrypt(&key, &[0u8; 10]); // menor que NONCE_SIZE + TAG_SIZE
        assert!(result.is_err());
    }

    // -- generate_key produz chaves de 256 bits --

    #[test]
    fn generate_key_produces_32_bytes() {
        let key = generate_key();
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn generate_key_produces_unique_keys() {
        let k1 = generate_key();
        let k2 = generate_key();
        assert_ne!(k1, k2, "chaves aleatorias devem ser diferentes");
    }

    // -- generate_nonce produz nonces de 96 bits --

    #[test]
    fn generate_nonce_produces_12_bytes() {
        let nonce = generate_nonce();
        assert_eq!(nonce.len(), 12);
    }

    #[test]
    fn generate_nonce_produces_unique_nonces() {
        let n1 = generate_nonce();
        let n2 = generate_nonce();
        assert_ne!(n1, n2, "nonces aleatorios devem ser diferentes");
    }
}
