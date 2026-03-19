//! Deduplication Service — RN-F4, RN-CH3.
//!
//! Duplicatas (mesmo content_hash) compartilham chunks.
//! chunk_id = SHA-256 → content-addressable → deduplicacao automatica.
//!
//! Fluxo:
//!   1. Calcular hash do conteudo otimizado
//!   2. Verificar se arquivo com mesmo hash ja existe (status = ready)
//!   3. Se sim: criar novo File linkando ao mesmo manifest/chunks
//!   4. Se nao: prosseguir com pipeline normal

use crate::db::{chunks, files, manifests};
use sqlx::PgPool;
use uuid::Uuid;

/// Resultado da verificacao de duplicata.
pub enum DedupResult {
    /// Arquivo novo — nenhuma duplicata encontrada. Prosseguir com pipeline.
    New,
    /// Duplicata encontrada — chunks ja existem. File ID do original.
    Duplicate {
        original_file_id: Uuid,
        chunks_count: usize,
        optimized_size: i64,
    },
}

/// Verifica se conteudo com este hash ja foi processado (RN-F4).
pub async fn check_duplicate(
    pool: &PgPool,
    content_hash: &str,
) -> Result<DedupResult, sqlx::Error> {
    if content_hash.is_empty() {
        return Ok(DedupResult::New);
    }

    // Buscar arquivo existente com mesmo hash e status ready
    let existing = files::find_by_content_hash(pool, content_hash).await?;

    match existing {
        Some(file) if file.status == "ready" => {
            let file_chunks = chunks::find_by_file(pool, file.id).await?;
            Ok(DedupResult::Duplicate {
                original_file_id: file.id,
                chunks_count: file_chunks.len(),
                optimized_size: file.optimized_size,
            })
        }
        _ => Ok(DedupResult::New),
    }
}

/// Cria novo File que reutiliza chunks de um arquivo existente (dedup link).
/// O novo arquivo aponta para os mesmos chunks via um novo manifest.
pub async fn link_duplicate(
    pool: &PgPool,
    new_file_id: Uuid,
    original_file_id: Uuid,
) -> Result<(), sqlx::Error> {
    // Copiar manifest do original para o novo file
    let original_manifest = manifests::find_by_file(pool, original_file_id).await?;

    if let Some(manifest) = original_manifest {
        // Criar novo manifest apontando para mesmos chunks
        let new_manifest = manifests::insert(
            pool,
            new_file_id,
            &manifest.chunks_json,
            &manifest.file_key_encrypted,
            manifest.signature.as_deref(),
        )
        .await?;

        // Linkar chunks ao novo manifest (para GC nao remover)
        if let Some(chunks_array) = manifest.chunks_json.as_array() {
            for chunk_info in chunks_array {
                if let Some(chunk_id) = chunk_info["chunk_id"].as_str() {
                    sqlx::query(
                        "INSERT INTO manifest_chunks (manifest_id, chunk_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    )
                    .bind(new_manifest.id)
                    .bind(chunk_id)
                    .execute(pool)
                    .await?;
                }
            }
        }

        // Copiar content_hash e optimized_size do original
        let original_file = files::find_by_id(pool, original_file_id).await?;
        if let Some(orig) = original_file {
            files::update_status(
                pool,
                new_file_id,
                "ready",
                orig.optimized_size,
                &orig.content_hash,
            )
            .await?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // RN-F4: DedupResult::New para hash vazio
    #[test]
    fn dedup_result_new_variant_exists() {
        let result = DedupResult::New;
        assert!(matches!(result, DedupResult::New));
    }

    // RN-F4: DedupResult::Duplicate contem info do original
    #[test]
    fn dedup_result_duplicate_carries_original_info() {
        let result = DedupResult::Duplicate {
            original_file_id: Uuid::new_v4(),
            chunks_count: 5,
            optimized_size: 4_000_000,
        };
        match result {
            DedupResult::Duplicate {
                chunks_count,
                optimized_size,
                ..
            } => {
                assert_eq!(chunks_count, 5);
                assert_eq!(optimized_size, 4_000_000);
            }
            _ => panic!("expected Duplicate"),
        }
    }

    // RN-CH3: content-addressable — mesmos bytes = mesmo hash = dedup
    #[test]
    fn content_addressable_same_bytes_same_hash() {
        let data = b"hello world foto familiar";
        let hash1 = alexandria_core::hashing::sha256_hex(data);
        let hash2 = alexandria_core::hashing::sha256_hex(data);
        assert_eq!(hash1, hash2, "mesmos bytes devem produzir mesmo hash");
    }

    // RN-CH3: conteudos diferentes = hashes diferentes
    #[test]
    fn different_content_different_hash() {
        let hash1 = alexandria_core::hashing::sha256_hex(b"foto1.jpg");
        let hash2 = alexandria_core::hashing::sha256_hex(b"foto2.jpg");
        assert_ne!(hash1, hash2);
    }
}
