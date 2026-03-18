//! Envelope encryption: BIP-39 seed → master key → file keys.
//!
//! Hierarquia (ADR-005):
//!   seed phrase (12 palavras BIP-39)
//!     → master key (32 bytes, derivada via PBKDF2 interno do BIP-39)
//!       → file key (32 bytes por arquivo, derivada via HKDF-SHA256)
//!
//! Master key nunca e persistida em disco — existe apenas em memoria.
//! Comprometimento de uma file key nao afeta outros arquivos (isolamento).

use super::CryptoError;
use ring::hkdf;
use uuid::Uuid;

/// Seed phrase de 12 palavras BIP-39.
/// Unico segredo que o usuario precisa guardar para recovery.
pub struct SeedPhrase {
    words: Vec<String>,
}

impl SeedPhrase {
    pub fn words(&self) -> Vec<&str> {
        self.words.iter().map(|w| w.as_str()).collect()
    }
}

/// Master key de 32 bytes derivada da seed phrase.
/// Existe apenas em memoria — nunca persistida em disco.
pub struct MasterKey([u8; 32]);

impl MasterKey {
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl Drop for MasterKey {
    fn drop(&mut self) {
        // Zeroize on drop para seguranca
        self.0.fill(0);
    }
}

/// File key de 32 bytes derivada da master key + file_id.
/// Cada arquivo tem sua propria chave — isolamento de comprometimento.
pub struct FileKey([u8; 32]);

impl FileKey {
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl Drop for FileKey {
    fn drop(&mut self) {
        self.0.fill(0);
    }
}

/// Gera seed phrase de 12 palavras BIP-39.
/// Usada na criacao do cluster (RN-C1).
/// 12 palavras = 128 bits de entropia.
pub fn generate_seed_phrase() -> Result<SeedPhrase, CryptoError> {
    // 128 bits de entropia = 16 bytes = 12 palavras BIP-39
    let mut entropy = [0u8; 16];
    ring::rand::SecureRandom::fill(&ring::rand::SystemRandom::new(), &mut entropy)
        .map_err(|_| CryptoError::EncryptionFailed("falha ao gerar entropia".into()))?;

    let mnemonic = bip39::Mnemonic::from_entropy(&entropy)
        .map_err(|e| CryptoError::EncryptionFailed(format!("falha ao gerar seed phrase: {e}")))?;

    let words = mnemonic
        .words()
        .map(|w: &'static str| w.to_string())
        .collect();
    Ok(SeedPhrase { words })
}

/// Valida seed phrase contra wordlist BIP-39.
/// Retorna SeedPhrase se valida, erro caso contrario.
pub fn validate_seed_phrase(phrase: &str) -> Result<SeedPhrase, CryptoError> {
    let mnemonic: bip39::Mnemonic = phrase.parse().map_err(|_| CryptoError::InvalidSeedPhrase)?;

    if mnemonic.word_count() != 12 {
        return Err(CryptoError::InvalidSeedPhrase);
    }

    let words = mnemonic
        .words()
        .map(|w: &'static str| w.to_string())
        .collect();
    Ok(SeedPhrase { words })
}

/// Deriva master key a partir da seed phrase.
/// Usa PBKDF2 interno do BIP-39 (to_seed) — deterministico.
/// Mesma seed phrase sempre gera a mesma master key (OBJ-02).
pub fn derive_master_key(seed_phrase: &SeedPhrase) -> MasterKey {
    let phrase = seed_phrase.words().join(" ");
    let mnemonic: bip39::Mnemonic = phrase.parse().expect("seed phrase ja validada");

    // BIP-39 to_seed usa PBKDF2-HMAC-SHA512 com 2048 iteracoes
    // Retorna 64 bytes — usamos os primeiros 32 como master key
    let seed_bytes = mnemonic.to_seed("");
    let mut key = [0u8; 32];
    key.copy_from_slice(&seed_bytes[..32]);
    MasterKey(key)
}

/// Deriva file key a partir da master key + file_id via HKDF-SHA256.
/// Cada arquivo recebe chave unica — comprometimento de uma nao afeta outras.
pub fn derive_file_key(master_key: &MasterKey, file_id: &Uuid) -> FileKey {
    let salt = hkdf::Salt::new(hkdf::HKDF_SHA256, b"alexandria-file-key-v1");
    let prk = salt.extract(master_key.as_bytes());

    let info = [file_id.as_bytes().as_slice()];
    let okm = prk
        .expand(&info, HkdfLen(32))
        .expect("HKDF expand com 32 bytes nunca falha");

    let mut key = [0u8; 32];
    okm.fill(&mut key).expect("fill 32 bytes");
    FileKey(key)
}

/// Helper para ring::hkdf — define o tamanho de output desejado.
struct HkdfLen(usize);

impl hkdf::KeyType for HkdfLen {
    fn len(&self) -> usize {
        self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // -- SeedPhrase: geracao e validacao --

    #[test]
    fn generate_seed_phrase_produces_12_words() {
        let seed = generate_seed_phrase().unwrap();
        assert_eq!(seed.words().len(), 12);
    }

    #[test]
    fn generate_seed_phrase_words_are_non_empty() {
        let seed = generate_seed_phrase().unwrap();
        for word in seed.words() {
            assert!(!word.is_empty());
        }
    }

    #[test]
    fn generate_seed_phrase_produces_unique_phrases() {
        let s1 = generate_seed_phrase().unwrap();
        let s2 = generate_seed_phrase().unwrap();
        assert_ne!(s1.words(), s2.words());
    }

    #[test]
    fn validate_seed_phrase_accepts_valid_phrase() {
        let seed = generate_seed_phrase().unwrap();
        let phrase = seed.words().join(" ");
        let result = validate_seed_phrase(&phrase);
        assert!(result.is_ok());
    }

    #[test]
    fn validate_seed_phrase_rejects_invalid_words() {
        let result =
            validate_seed_phrase("foo bar baz qux quux corge grault garply waldo fred plugh xyzzy");
        assert!(result.is_err());
    }

    #[test]
    fn validate_seed_phrase_rejects_wrong_word_count() {
        let result = validate_seed_phrase("abandon abandon abandon");
        assert!(result.is_err());
    }

    // -- MasterKey: derivacao deterministica (OBJ-02) --

    #[test]
    fn derive_master_key_is_deterministic() {
        let seed = generate_seed_phrase().unwrap();
        let mk1 = derive_master_key(&seed);
        let mk2 = derive_master_key(&seed);
        assert_eq!(
            mk1.as_bytes(),
            mk2.as_bytes(),
            "OBJ-02: mesma seed = mesma master key"
        );
    }

    #[test]
    fn derive_master_key_produces_32_bytes() {
        let seed = generate_seed_phrase().unwrap();
        let mk = derive_master_key(&seed);
        assert_eq!(mk.as_bytes().len(), 32);
    }

    #[test]
    fn derive_master_key_different_seeds_produce_different_keys() {
        let s1 = generate_seed_phrase().unwrap();
        let s2 = generate_seed_phrase().unwrap();
        let mk1 = derive_master_key(&s1);
        let mk2 = derive_master_key(&s2);
        assert_ne!(mk1.as_bytes(), mk2.as_bytes());
    }

    // -- FileKey: derivacao por arquivo (isolamento) --

    #[test]
    fn derive_file_key_produces_32_bytes() {
        let seed = generate_seed_phrase().unwrap();
        let mk = derive_master_key(&seed);
        let file_id = Uuid::new_v4();
        let fk = derive_file_key(&mk, &file_id);
        assert_eq!(fk.as_bytes().len(), 32);
    }

    #[test]
    fn derive_file_key_is_deterministic() {
        let seed = generate_seed_phrase().unwrap();
        let mk = derive_master_key(&seed);
        let file_id = Uuid::new_v4();
        let fk1 = derive_file_key(&mk, &file_id);
        let fk2 = derive_file_key(&mk, &file_id);
        assert_eq!(
            fk1.as_bytes(),
            fk2.as_bytes(),
            "mesma master key + file_id = mesma file key"
        );
    }

    #[test]
    fn derive_file_key_different_files_produce_different_keys() {
        let seed = generate_seed_phrase().unwrap();
        let mk = derive_master_key(&seed);
        let f1 = Uuid::new_v4();
        let f2 = Uuid::new_v4();
        let fk1 = derive_file_key(&mk, &f1);
        let fk2 = derive_file_key(&mk, &f2);
        assert_ne!(
            fk1.as_bytes(),
            fk2.as_bytes(),
            "file keys devem ser isoladas por arquivo"
        );
    }

    #[test]
    fn derive_file_key_different_master_keys_produce_different_file_keys() {
        let s1 = generate_seed_phrase().unwrap();
        let s2 = generate_seed_phrase().unwrap();
        let mk1 = derive_master_key(&s1);
        let mk2 = derive_master_key(&s2);
        let file_id = Uuid::new_v4();
        let fk1 = derive_file_key(&mk1, &file_id);
        let fk2 = derive_file_key(&mk2, &file_id);
        assert_ne!(fk1.as_bytes(), fk2.as_bytes());
    }

    // -- Integracao: seed → master key → file key → encrypt/decrypt --

    #[test]
    fn full_envelope_roundtrip() {
        use crate::crypto;

        let seed = generate_seed_phrase().unwrap();
        let mk = derive_master_key(&seed);
        let file_id = Uuid::new_v4();
        let fk = derive_file_key(&mk, &file_id);

        let plaintext = b"family photo data";
        let ciphertext = crypto::encrypt(fk.as_bytes(), plaintext).unwrap();
        let recovered = crypto::decrypt(fk.as_bytes(), &ciphertext).unwrap();
        assert_eq!(recovered, plaintext);
    }

    #[test]
    fn recovery_with_same_seed_decrypts_data() {
        use crate::crypto;

        // Simula: admin cria cluster, criptografa arquivo
        let seed = generate_seed_phrase().unwrap();
        let phrase = seed.words().join(" ");
        let mk = derive_master_key(&seed);
        let file_id = Uuid::new_v4();
        let fk = derive_file_key(&mk, &file_id);
        let plaintext = b"precious memories";
        let ciphertext = crypto::encrypt(fk.as_bytes(), plaintext).unwrap();

        // Simula: recovery — re-derive tudo a partir da seed phrase
        let recovered_seed = validate_seed_phrase(&phrase).unwrap();
        let recovered_mk = derive_master_key(&recovered_seed);
        let recovered_fk = derive_file_key(&recovered_mk, &file_id);
        let recovered = crypto::decrypt(recovered_fk.as_bytes(), &ciphertext).unwrap();
        assert_eq!(
            recovered, plaintext,
            "recovery via seed deve descriptografar dados"
        );
    }
}
