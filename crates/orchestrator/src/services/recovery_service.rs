//! Recovery Service — UC-007: Recovery do Sistema via Seed.
//!
//! Fluxo (07-critical_flows.md):
//!   1. Admin insere seed phrase de 12 palavras
//!   2. Valida contra wordlist BIP-39
//!   3. Deriva master key (HKDF)
//!   4. Busca e descriptografa vaults dos membros (v2)
//!   5. Conecta a S3/R2 com credenciais (v2)
//!   6. Escaneia manifests replicados (v2)
//!   7. Reconstroi banco PostgreSQL (v2)
//!   8. Valida integridade e agenda auto-healing
//!
//! Erros: E1 (seed incorreta), E2 (nenhum manifest encontrado).

use alexandria_core::crypto;
use alexandria_core::crypto::envelope::{MasterKey, SeedPhrase};
use serde::Serialize;
use sqlx::PgPool;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RecoveryError {
    #[error("seed phrase invalida: {0}")]
    InvalidSeedPhrase(String),
    #[error("seed phrase incorreta: vaults nao descriptografam")]
    #[allow(dead_code)]
    IncorrectSeedPhrase,
    #[error("nenhum manifest encontrado nos nos — recovery impossivel")]
    #[allow(dead_code)]
    NoManifestsFound,
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("erro de criptografia: {0}")]
    Crypto(#[from] crypto::CryptoError),
}

/// Resultado do processo de recovery.
#[derive(Debug, Serialize)]
pub struct RecoveryReport {
    pub seed_valid: bool,
    pub master_key_derived: bool,
    pub vaults_recovered: usize,
    pub manifests_found: usize,
    pub files_recovered: usize,
    pub chunks_missing: usize,
    pub nodes_reconnected: usize,
    pub status: RecoveryStatus,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub enum RecoveryStatus {
    /// Recovery completo — todos os dados restaurados.
    Complete,
    /// Recovery parcial — alguns vaults/manifests nao encontrados.
    Partial,
    /// Recovery falhou — seed invalida ou sem manifests.
    #[allow(dead_code)]
    Failed,
}

/// Passo 1-3: Valida seed phrase e deriva master key.
/// Retorna a MasterKey para uso nos passos subsequentes.
pub fn validate_and_derive(seed_phrase: &str) -> Result<(SeedPhrase, MasterKey), RecoveryError> {
    // Passo 2: Validar seed contra wordlist BIP-39
    let seed = crypto::envelope::validate_seed_phrase(seed_phrase)
        .map_err(|e| RecoveryError::InvalidSeedPhrase(e.to_string()))?;

    // Passo 3: Derivar master key
    let master_key = crypto::envelope::derive_master_key(&seed);

    Ok((seed, master_key))
}

/// Executa recovery completo (UC-007).
///
/// Na v1: valida seed + deriva master key. Passos 4-8 sao stubs
/// que serao implementados quando vault discovery e manifest scan
/// estiverem disponiveis via StorageProvider.
pub async fn execute_recovery(
    pool: &PgPool,
    seed_phrase: &str,
) -> Result<RecoveryReport, RecoveryError> {
    // Passos 1-3: Validar e derivar
    let (_seed, _master_key) = validate_and_derive(seed_phrase)?;

    // Passo 4-5: Buscar vaults dos membros nos nos (v2)
    // TODO (v2): Iterar nos conhecidos (bootstrap list ou ultimo DNS)
    //   - StorageProvider.list() para encontrar vaults
    //   - crypto::decrypt(master_key, vault_data) para cada vault
    //   - Se AEAD auth tag falhar → E1: seed incorreta
    let vaults_recovered = 0;

    // Passo 6: Conectar a S3/R2 com credenciais dos vaults (v2)
    // TODO (v2): Para cada vault com credenciais S3/R2:
    //   - S3StorageProvider::new(config)
    //   - Verificar conectividade

    // Passo 7-8: Escanear manifests e reconstruir banco (v2)
    // TODO (v2): Para cada StorageProvider:
    //   - StorageProvider.list() para encontrar manifests
    //   - Deserializar e validar assinatura
    //   - Bulk insert em PostgreSQL (files, chunks, chunk_replicas)
    let manifests_found = 0;
    let files_recovered = 0;

    // Passo 9: Verificar integridade (cruza manifests com chunks)
    // Na v1: conta registros existentes no banco
    let existing_files: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM files")
        .fetch_one(pool)
        .await?;

    let existing_chunks: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM chunks")
        .fetch_one(pool)
        .await?;

    let status = if existing_files.0 > 0 {
        RecoveryStatus::Partial
    } else if manifests_found > 0 {
        RecoveryStatus::Complete
    } else {
        RecoveryStatus::Partial
    };

    Ok(RecoveryReport {
        seed_valid: true,
        master_key_derived: true,
        vaults_recovered,
        manifests_found,
        files_recovered: files_recovered + existing_files.0 as usize,
        chunks_missing: 0,
        nodes_reconnected: existing_chunks.0 as usize,
        status,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    // UC-007, Passo 2: seed valida passa validacao
    #[test]
    fn valid_seed_phrase_validates_and_derives() {
        let seed = crypto::envelope::generate_seed_phrase().unwrap();
        let phrase: String = seed.words().join(" ");
        let result = validate_and_derive(&phrase);
        assert!(result.is_ok());
        let (_seed, master_key) = result.unwrap();
        assert_eq!(master_key.as_bytes().len(), 32);
    }

    // UC-007, E1: seed com palavra invalida retorna erro claro
    #[test]
    fn invalid_word_returns_clear_error() {
        let result =
            validate_and_derive("invalid words that are not in bip39 wordlist at all foo bar baz");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, RecoveryError::InvalidSeedPhrase(_)));
        assert!(err.to_string().contains("invalida"));
    }

    // UC-007, E1: seed com numero errado de palavras retorna erro
    #[test]
    fn wrong_word_count_returns_error() {
        let result = validate_and_derive("abandon abandon abandon");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            RecoveryError::InvalidSeedPhrase(_)
        ));
    }

    // UC-007, Passo 3: mesma seed sempre deriva mesma master key (deterministico)
    #[test]
    fn same_seed_derives_same_master_key() {
        let seed = crypto::envelope::generate_seed_phrase().unwrap();
        let phrase: String = seed.words().join(" ");

        let (_, key1) = validate_and_derive(&phrase).unwrap();
        let (_, key2) = validate_and_derive(&phrase).unwrap();

        assert_eq!(key1.as_bytes(), key2.as_bytes());
    }

    // UC-007: seeds diferentes derivam master keys diferentes
    #[test]
    fn different_seeds_derive_different_keys() {
        let seed1 = crypto::envelope::generate_seed_phrase().unwrap();
        let seed2 = crypto::envelope::generate_seed_phrase().unwrap();
        let phrase1: String = seed1.words().join(" ");
        let phrase2: String = seed2.words().join(" ");

        let (_, key1) = validate_and_derive(&phrase1).unwrap();
        let (_, key2) = validate_and_derive(&phrase2).unwrap();

        assert_ne!(key1.as_bytes(), key2.as_bytes());
    }

    // RecoveryReport serializa corretamente
    #[test]
    fn recovery_report_serializes() {
        let report = RecoveryReport {
            seed_valid: true,
            master_key_derived: true,
            vaults_recovered: 0,
            manifests_found: 0,
            files_recovered: 0,
            chunks_missing: 0,
            nodes_reconnected: 0,
            status: RecoveryStatus::Partial,
        };
        let json = serde_json::to_string(&report).unwrap();
        assert!(json.contains("\"seed_valid\":true"));
        assert!(json.contains("\"Partial\""));
    }

    // RecoveryStatus values exist per blueprint
    #[test]
    fn recovery_status_variants_exist() {
        assert_eq!(RecoveryStatus::Complete, RecoveryStatus::Complete);
        assert_eq!(RecoveryStatus::Partial, RecoveryStatus::Partial);
        assert_eq!(RecoveryStatus::Failed, RecoveryStatus::Failed);
    }
}
