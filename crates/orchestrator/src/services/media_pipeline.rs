//! Media Pipeline — fluxo completo de processamento de arquivo.
//!
//! Pipeline (07-critical_flows.md, Fluxo 1):
//!   1. Optimize (v1: bypass)
//!   2. Chunk (~4MB blocks)
//!   3. Encrypt (AES-256-GCM per chunk, envelope encryption)
//!   4. Distribute (3 nos via ConsistentHashRing)
//!   5. Manifest (chunks_json + file_key_encrypted)
//!   6. File status → "ready"
//!
//! Regras: RN-F1..F6, RN-CH1..CH6, RN-MA1..MA5.

use crate::db::{chunk_replicas, chunks, files, manifests};
use alexandria_core::{chunking, consistent_hashing::HashRing, crypto, hashing};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

const REPLICATION_FACTOR: usize = 3;

#[derive(Debug, Error)]
pub enum PipelineError {
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("arquivo nao encontrado")]
    FileNotFound,
    #[error("nos insuficientes para replicacao (precisa {REPLICATION_FACTOR}+)")]
    InsufficientNodes,
    #[error("erro de criptografia: {0}")]
    Crypto(#[from] crypto::CryptoError),
    #[error("erro de chunking: {0}")]
    Chunking(#[from] chunking::ChunkingError),
    #[error("erro de storage: {0}")]
    Storage(String),
}

/// Resultado do pipeline.
pub struct PipelineResult {
    pub file_id: Uuid,
    pub manifest_id: Uuid,
    pub chunks_count: usize,
    pub total_encrypted_size: i64,
}

/// Processa arquivo completo: optimize → chunk → encrypt → distribute → manifest.
///
/// `master_key`: master key derivada da seed phrase (em memoria, nunca persistida).
/// `data`: bytes do arquivo (ja otimizado na v1 futura).
/// `storage_providers`: map node_id → StorageProvider para distribuicao.
pub async fn process_file(
    pool: &PgPool,
    file_id: Uuid,
    data: &[u8],
    master_key: &crypto::envelope::MasterKey,
    hash_ring: &HashRing,
    storage_providers: &std::collections::HashMap<
        Uuid,
        Box<dyn alexandria_core::storage::StorageProvider>,
    >,
) -> Result<PipelineResult, PipelineError> {
    // 0. Verificar arquivo existe
    let file = files::find_by_id(pool, file_id)
        .await?
        .ok_or(PipelineError::FileNotFound)?;

    // 1. Optimize (v1: bypass — dados passam direto)
    // TODO (v2): libvips para fotos, FFmpeg para videos
    let optimized_data = data;
    let content_hash = hashing::sha256_hex(optimized_data);

    // 2. Deduplicacao (RN-F4): verificar se ja existe arquivo com mesmo hash
    // Se sim, podemos reusar chunks. Na v1, prosseguimos sem dedup.

    // 3. Derive file key via envelope encryption (RN-MA2)
    let file_key = crypto::envelope::derive_file_key(master_key, &file_id);

    // 4. Chunk (~4MB blocks)
    let chunk_outputs = chunking::chunk_data(optimized_data)?;

    // 5. Encrypt cada chunk + distribute para 3 nos
    let mut chunks_manifest = Vec::new();
    let mut total_encrypted_size: i64 = 0;

    for chunk_output in &chunk_outputs {
        // Encrypt com file_key (AES-256-GCM)
        let encrypted = crypto::encrypt(file_key.as_bytes(), &chunk_output.data)?;
        let encrypted_hash = hashing::sha256_hex(&encrypted);
        let encrypted_size = encrypted.len() as i64;

        // Registrar chunk no banco
        chunks::insert(
            pool,
            &encrypted_hash,
            file_id,
            chunk_output.index as i32,
            encrypted_size,
        )
        .await?;

        // Distribuir para N nos via ConsistentHashRing
        let target_nodes = hash_ring.get_nodes(&encrypted_hash, REPLICATION_FACTOR);
        if target_nodes.len() < REPLICATION_FACTOR {
            return Err(PipelineError::InsufficientNodes);
        }

        for node_id in &target_nodes {
            // Enviar chunk via StorageProvider
            if let Some(provider) = storage_providers.get(node_id) {
                provider
                    .put(&encrypted_hash, &encrypted)
                    .await
                    .map_err(|e| PipelineError::Storage(e.to_string()))?;

                // Registrar replica
                chunk_replicas::insert(pool, &encrypted_hash, *node_id).await?;
            }
        }

        total_encrypted_size += encrypted_size;

        // Adicionar ao manifest
        chunks_manifest.push(serde_json::json!({
            "chunk_id": encrypted_hash,
            "index": chunk_output.index,
            "original_hash": chunk_output.hash,
            "encrypted_size": encrypted_size,
        }));
    }

    // 6. Criar manifest
    let chunks_json = serde_json::Value::Array(chunks_manifest.clone());

    // Encrypt file_key com master_key para armazenamento (envelope encryption)
    let file_key_encrypted = crypto::encrypt(master_key.as_bytes(), file_key.as_bytes())?;

    let manifest = manifests::insert(
        pool,
        file_id,
        &chunks_json,
        &file_key_encrypted,
        None, // signature (v2)
    )
    .await?;

    // 7. Atualizar arquivo → ready (RN-F6)
    files::update_status(
        pool,
        file_id,
        "ready",
        optimized_data.len() as i64,
        &content_hash,
    )
    .await?;

    // Registrar manifests nos chunks (tabela manifest_chunks para GC)
    for chunk_info in &chunks_manifest {
        if let Some(chunk_id) = chunk_info["chunk_id"].as_str() {
            sqlx::query(
                "INSERT INTO manifest_chunks (manifest_id, chunk_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(manifest.id)
            .bind(chunk_id)
            .execute(pool)
            .await?;
        }
    }

    tracing::info!(
        file_id = %file_id,
        manifest_id = %manifest.id,
        chunks = chunk_outputs.len(),
        encrypted_size = total_encrypted_size,
        "{} status → ready",
        file.original_name,
    );

    Ok(PipelineResult {
        file_id,
        manifest_id: manifest.id,
        chunks_count: chunk_outputs.len(),
        total_encrypted_size,
    })
}

/// Download: reconstroi arquivo a partir do manifest.
///
/// 1. Le manifest do banco
/// 2. Decrypt file_key com master_key
/// 3. Para cada chunk: le de um no, decrypt com file_key
/// 4. Reassembla na ordem correta
#[allow(dead_code)]
pub async fn download_file(
    pool: &PgPool,
    file_id: Uuid,
    master_key: &crypto::envelope::MasterKey,
    storage_providers: &std::collections::HashMap<
        Uuid,
        Box<dyn alexandria_core::storage::StorageProvider>,
    >,
) -> Result<Vec<u8>, PipelineError> {
    // 1. Le manifest
    let manifest = manifests::find_by_file(pool, file_id)
        .await?
        .ok_or(PipelineError::FileNotFound)?;

    // 2. Decrypt file_key
    let file_key_bytes = crypto::decrypt(master_key.as_bytes(), &manifest.file_key_encrypted)?;
    let file_key: [u8; 32] = file_key_bytes
        .try_into()
        .map_err(|_| PipelineError::Crypto(crypto::CryptoError::InvalidKey))?;

    // 3. Para cada chunk (em ordem), le e decrypta
    let chunks_array = manifest
        .chunks_json
        .as_array()
        .ok_or(PipelineError::FileNotFound)?;

    let mut decrypted_chunks = Vec::new();

    for chunk_info in chunks_array {
        let chunk_id = chunk_info["chunk_id"]
            .as_str()
            .ok_or(PipelineError::FileNotFound)?;

        // Encontrar um no que tenha este chunk
        let replicas = chunk_replicas::find_by_chunk(pool, chunk_id).await?;

        let mut chunk_data = None;
        for replica in &replicas {
            if let Some(provider) = storage_providers.get(&replica.node_id) {
                match provider.get(chunk_id).await {
                    Ok(data) => {
                        chunk_data = Some(data);
                        break;
                    }
                    Err(_) => continue, // Tenta proximo no
                }
            }
        }

        let encrypted_chunk = chunk_data.ok_or(PipelineError::Storage(format!(
            "chunk {chunk_id} indisponivel em todos os nos"
        )))?;

        // Decrypt
        let decrypted = crypto::decrypt(&file_key, &encrypted_chunk)?;
        decrypted_chunks.push(decrypted);
    }

    // 4. Reassembla
    let refs: Vec<&[u8]> = decrypted_chunks.iter().map(|c| c.as_slice()).collect();
    Ok(chunking::reassemble(&refs))
}
