//! Modulo de chunking: divisao de arquivos em blocos de ~4MB.
//!
//! Cada chunk e identificado pelo SHA-256 do seu conteudo
//! (content-addressable storage).
//!
//! Pipeline: upload → optimize → **chunk** → encrypt → distribute
//! (fluxo critico 1, passo 10)

use crate::domain::chunk::CHUNK_TARGET_SIZE;
use crate::hashing;
use std::io::Read;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ChunkingError {
    #[error("erro de IO ao ler arquivo: {0}")]
    IoError(#[from] std::io::Error),
    #[error("arquivo vazio")]
    EmptyFile,
}

/// Resultado da divisao de um bloco de dados.
/// Contem os bytes, o indice (0-based), o hash SHA-256 e o tamanho.
#[derive(Debug, Clone)]
pub struct ChunkOutput {
    /// Posicao dentro do arquivo (0-based)
    pub index: u32,
    /// Bytes brutos do chunk
    pub data: Vec<u8>,
    /// SHA-256 hex do conteudo (64 chars) — sera o chunk_id (RN-CH2)
    pub hash: String,
    /// Tamanho em bytes
    pub size: usize,
}

/// Divide um slice de bytes em chunks de ~4MB.
/// Cada chunk recebe um indice sequencial (0-based) e hash SHA-256.
pub fn chunk_data(data: &[u8]) -> Result<Vec<ChunkOutput>, ChunkingError> {
    if data.is_empty() {
        return Err(ChunkingError::EmptyFile);
    }

    let chunks = data
        .chunks(CHUNK_TARGET_SIZE)
        .enumerate()
        .map(|(i, piece)| ChunkOutput {
            index: i as u32,
            data: piece.to_vec(),
            hash: hashing::sha256_hex(piece),
            size: piece.len(),
        })
        .collect();

    Ok(chunks)
}

/// Divide dados de um reader em chunks de ~4MB (streaming).
/// Util para arquivos grandes que nao cabem em memoria de uma vez.
pub fn chunk_reader<R: Read>(reader: &mut R) -> Result<Vec<ChunkOutput>, ChunkingError> {
    let mut chunks = Vec::new();
    let mut index = 0u32;
    let mut buf = vec![0u8; CHUNK_TARGET_SIZE];

    loop {
        let mut filled = 0;
        // Ler exatamente CHUNK_TARGET_SIZE bytes (ou ate EOF)
        while filled < CHUNK_TARGET_SIZE {
            let n = reader.read(&mut buf[filled..])?;
            if n == 0 {
                break;
            }
            filled += n;
        }

        if filled == 0 {
            break;
        }

        let piece = &buf[..filled];
        let hash = hashing::sha256_hex(piece);
        chunks.push(ChunkOutput {
            index,
            data: piece.to_vec(),
            hash,
            size: filled,
        });
        index += 1;
    }

    if chunks.is_empty() {
        return Err(ChunkingError::EmptyFile);
    }

    Ok(chunks)
}

/// Remonta dados originais a partir de chunks ordenados.
/// Os chunks devem estar na ordem correta (por index).
pub fn reassemble(chunks: &[&[u8]]) -> Vec<u8> {
    let total: usize = chunks.iter().map(|c| c.len()).sum();
    let mut result = Vec::with_capacity(total);
    for chunk in chunks {
        result.extend_from_slice(chunk);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    // -- chunk_data: divisao basica --

    #[test]
    fn chunk_data_single_chunk_when_smaller_than_target() {
        let data = vec![0xAAu8; 1024]; // 1KB — bem menor que 4MB
        let chunks = chunk_data(&data).unwrap();
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].index, 0);
        assert_eq!(chunks[0].data, data);
        assert_eq!(chunks[0].size, 1024);
    }

    #[test]
    fn chunk_data_exact_target_size_produces_one_chunk() {
        let data = vec![0xBBu8; CHUNK_TARGET_SIZE];
        let chunks = chunk_data(&data).unwrap();
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].size, CHUNK_TARGET_SIZE);
    }

    #[test]
    fn chunk_data_splits_at_target_boundary() {
        // 4MB + 1 byte = 2 chunks
        let data = vec![0xCCu8; CHUNK_TARGET_SIZE + 1];
        let chunks = chunk_data(&data).unwrap();
        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].size, CHUNK_TARGET_SIZE);
        assert_eq!(chunks[1].size, 1);
    }

    #[test]
    fn chunk_data_multiple_full_chunks() {
        // Exatamente 3 chunks cheios
        let data = vec![0xDDu8; CHUNK_TARGET_SIZE * 3];
        let chunks = chunk_data(&data).unwrap();
        assert_eq!(chunks.len(), 3);
        for (i, chunk) in chunks.iter().enumerate() {
            assert_eq!(chunk.index, i as u32);
            assert_eq!(chunk.size, CHUNK_TARGET_SIZE);
        }
    }

    #[test]
    fn chunk_data_rejects_empty_input() {
        let result = chunk_data(b"");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ChunkingError::EmptyFile));
    }

    // -- indices sequenciais (0-based, conforme domain model) --

    #[test]
    fn chunk_data_indices_are_sequential_zero_based() {
        let data = vec![0xEEu8; CHUNK_TARGET_SIZE * 4 + 500];
        let chunks = chunk_data(&data).unwrap();
        assert_eq!(chunks.len(), 5);
        for (i, chunk) in chunks.iter().enumerate() {
            assert_eq!(chunk.index, i as u32, "index deve ser {i}");
        }
    }

    // -- hash SHA-256 por chunk (RN-CH2) --

    #[test]
    fn chunk_data_hash_matches_sha256_of_chunk_content() {
        let data = vec![0xFFu8; 2048];
        let chunks = chunk_data(&data).unwrap();
        let expected_hash = hashing::sha256_hex(&data);
        assert_eq!(chunks[0].hash, expected_hash, "RN-CH2: hash = SHA-256 do conteudo");
    }

    #[test]
    fn chunk_data_each_chunk_has_unique_hash_for_different_content() {
        // Chunk 0 = todos 0xAA, chunk 1 = todos 0xBB
        let mut data = vec![0xAAu8; CHUNK_TARGET_SIZE];
        data.extend(vec![0xBBu8; CHUNK_TARGET_SIZE]);
        let chunks = chunk_data(&data).unwrap();
        assert_ne!(chunks[0].hash, chunks[1].hash, "chunks com conteudo diferente devem ter hashes diferentes");
    }

    // -- content-addressable (RN-CH3) --

    #[test]
    fn identical_data_produces_identical_hashes() {
        let data = vec![0x42u8; 8192];
        let chunks_a = chunk_data(&data).unwrap();
        let chunks_b = chunk_data(&data).unwrap();
        assert_eq!(chunks_a[0].hash, chunks_b[0].hash, "RN-CH3: mesmo conteudo = mesmo hash");
    }

    // -- chunk_reader: streaming --

    #[test]
    fn chunk_reader_matches_chunk_data_for_small_input() {
        let data = b"hello world streaming test";
        let from_data = chunk_data(data).unwrap();
        let from_reader = chunk_reader(&mut &data[..]).unwrap();
        assert_eq!(from_data.len(), from_reader.len());
        assert_eq!(from_data[0].hash, from_reader[0].hash);
        assert_eq!(from_data[0].data, from_reader[0].data);
    }

    #[test]
    fn chunk_reader_splits_large_input() {
        let data = vec![0xABu8; CHUNK_TARGET_SIZE * 2 + 100];
        let chunks = chunk_reader(&mut &data[..]).unwrap();
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].size, CHUNK_TARGET_SIZE);
        assert_eq!(chunks[1].size, CHUNK_TARGET_SIZE);
        assert_eq!(chunks[2].size, 100);
    }

    #[test]
    fn chunk_reader_rejects_empty_input() {
        let data: &[u8] = b"";
        let result = chunk_reader(&mut &data[..]);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ChunkingError::EmptyFile));
    }

    // -- reassemble: reconstrucao --

    #[test]
    fn reassemble_recovers_original_data() {
        let original = vec![0xABu8; CHUNK_TARGET_SIZE * 2 + 500];
        let chunks = chunk_data(&original).unwrap();
        let chunk_slices: Vec<&[u8]> = chunks.iter().map(|c| c.data.as_slice()).collect();
        let recovered = reassemble(&chunk_slices);
        assert_eq!(recovered, original);
    }

    #[test]
    fn reassemble_single_chunk() {
        let original = b"small file content";
        let chunks = chunk_data(original).unwrap();
        let chunk_slices: Vec<&[u8]> = chunks.iter().map(|c| c.data.as_slice()).collect();
        let recovered = reassemble(&chunk_slices);
        assert_eq!(recovered, original);
    }

    #[test]
    fn reassemble_empty_slices_returns_empty() {
        let recovered = reassemble(&[]);
        assert!(recovered.is_empty());
    }

    // -- total size consistency --

    #[test]
    fn sum_of_chunk_sizes_equals_input_size() {
        let data = vec![0x99u8; CHUNK_TARGET_SIZE * 3 + 777];
        let chunks = chunk_data(&data).unwrap();
        let total: usize = chunks.iter().map(|c| c.size).sum();
        assert_eq!(total, data.len());
    }
}
