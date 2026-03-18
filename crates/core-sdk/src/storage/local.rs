//! StorageProvider implementacao para filesystem local.
//!
//! Armazena chunks como arquivos no disco.
//! Sharding por 2 chars do chunk_id evita diretorios com milhoes de arquivos.
//! Estrutura: {base_path}/{chunk_id[0..2]}/{chunk_id}

use super::{StorageCapacity, StorageError, StorageProvider};
use async_trait::async_trait;
use std::path::PathBuf;
use tokio::fs;

/// StorageProvider para filesystem local.
/// Usado pelo agente de no para armazenar chunks no disco.
pub struct LocalStorageProvider {
    base_path: PathBuf,
    total_capacity: u64,
}

impl LocalStorageProvider {
    pub fn new(base_path: PathBuf, total_capacity: u64) -> Self {
        Self {
            base_path,
            total_capacity,
        }
    }

    /// Retorna o caminho completo de um chunk: {base}/{prefix}/{chunk_id}
    fn chunk_path(&self, chunk_id: &str) -> PathBuf {
        let prefix = if chunk_id.len() >= 2 {
            &chunk_id[..2]
        } else {
            chunk_id
        };
        self.base_path.join(prefix).join(chunk_id)
    }

    /// Calcula espaco usado somando o tamanho de todos os arquivos no base_path.
    async fn calc_used_bytes(&self) -> Result<u64, StorageError> {
        let mut total = 0u64;
        let mut stack = vec![self.base_path.clone()];

        while let Some(dir) = stack.pop() {
            let mut entries = match fs::read_dir(&dir).await {
                Ok(e) => e,
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
                Err(e) => return Err(e.into()),
            };

            while let Some(entry) = entries.next_entry().await? {
                let ft = entry.file_type().await?;
                if ft.is_dir() {
                    stack.push(entry.path());
                } else if ft.is_file() {
                    total += entry.metadata().await?.len();
                }
            }
        }

        Ok(total)
    }
}

#[async_trait]
impl StorageProvider for LocalStorageProvider {
    async fn put(&self, chunk_id: &str, data: &[u8]) -> Result<(), StorageError> {
        // RN-N5: verificar capacidade antes de gravar
        let used = self.calc_used_bytes().await?;
        if used + data.len() as u64 > self.total_capacity {
            return Err(StorageError::InsufficientSpace);
        }

        let path = self.chunk_path(chunk_id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        fs::write(&path, data).await?;
        Ok(())
    }

    async fn get(&self, chunk_id: &str) -> Result<Vec<u8>, StorageError> {
        let path = self.chunk_path(chunk_id);
        match fs::read(&path).await {
            Ok(data) => Ok(data),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                Err(StorageError::NotFound(chunk_id.to_string()))
            }
            Err(e) => Err(e.into()),
        }
    }

    async fn exists(&self, chunk_id: &str) -> Result<bool, StorageError> {
        let path = self.chunk_path(chunk_id);
        Ok(path.exists())
    }

    async fn delete(&self, chunk_id: &str) -> Result<(), StorageError> {
        let path = self.chunk_path(chunk_id);
        match fs::remove_file(&path).await {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e.into()),
        }
    }

    async fn list(&self) -> Result<Vec<String>, StorageError> {
        let mut chunk_ids = Vec::new();
        let mut shard_dirs = match fs::read_dir(&self.base_path).await {
            Ok(d) => d,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(chunk_ids),
            Err(e) => return Err(e.into()),
        };

        while let Some(shard_entry) = shard_dirs.next_entry().await? {
            if !shard_entry.file_type().await?.is_dir() {
                continue;
            }

            let mut files = fs::read_dir(shard_entry.path()).await?;
            while let Some(file_entry) = files.next_entry().await? {
                if file_entry.file_type().await?.is_file()
                    && let Some(name) = file_entry.file_name().to_str()
                {
                    chunk_ids.push(name.to_string());
                }
            }
        }

        Ok(chunk_ids)
    }

    async fn capacity(&self) -> Result<StorageCapacity, StorageError> {
        let used = self.calc_used_bytes().await?;
        Ok(StorageCapacity {
            total_bytes: self.total_capacity,
            used_bytes: used,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    async fn setup() -> (LocalStorageProvider, TempDir) {
        let dir = TempDir::new().unwrap();
        let provider = LocalStorageProvider::new(
            dir.path().to_path_buf(),
            1_000_000_000, // 1GB
        );
        (provider, dir)
    }

    // -- put + get roundtrip --

    #[tokio::test]
    async fn put_and_get_roundtrip() {
        let (provider, _dir) = setup().await;
        let data = b"chunk data here";
        provider.put("abc123def456", data).await.unwrap();
        let recovered = provider.get("abc123def456").await.unwrap();
        assert_eq!(recovered, data);
    }

    #[tokio::test]
    async fn put_overwrites_existing_chunk() {
        let (provider, _dir) = setup().await;
        provider.put("chunk1", b"version1").await.unwrap();
        provider.put("chunk1", b"version2").await.unwrap();
        let data = provider.get("chunk1").await.unwrap();
        assert_eq!(data, b"version2");
    }

    #[tokio::test]
    async fn put_large_chunk() {
        let (provider, _dir) = setup().await;
        let data = vec![0xABu8; 4 * 1024 * 1024]; // 4MB
        provider.put("large_chunk", &data).await.unwrap();
        let recovered = provider.get("large_chunk").await.unwrap();
        assert_eq!(recovered, data);
    }

    // -- get: chunk nao encontrado --

    #[tokio::test]
    async fn get_nonexistent_chunk_returns_not_found() {
        let (provider, _dir) = setup().await;
        let result = provider.get("nonexistent").await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), StorageError::NotFound(_)));
    }

    // -- exists --

    #[tokio::test]
    async fn exists_returns_true_for_stored_chunk() {
        let (provider, _dir) = setup().await;
        provider.put("exists_test", b"data").await.unwrap();
        assert!(provider.exists("exists_test").await.unwrap());
    }

    #[tokio::test]
    async fn exists_returns_false_for_missing_chunk() {
        let (provider, _dir) = setup().await;
        assert!(!provider.exists("missing").await.unwrap());
    }

    // -- delete --

    #[tokio::test]
    async fn delete_removes_chunk() {
        let (provider, _dir) = setup().await;
        provider.put("to_delete", b"data").await.unwrap();
        provider.delete("to_delete").await.unwrap();
        assert!(!provider.exists("to_delete").await.unwrap());
    }

    #[tokio::test]
    async fn delete_nonexistent_is_ok() {
        let (provider, _dir) = setup().await;
        let result = provider.delete("nonexistent").await;
        assert!(result.is_ok());
    }

    // -- list --

    #[tokio::test]
    async fn list_returns_all_stored_chunks() {
        let (provider, _dir) = setup().await;
        provider.put("chunk_aaa", b"data1").await.unwrap();
        provider.put("chunk_bbb", b"data2").await.unwrap();
        provider.put("chunk_ccc", b"data3").await.unwrap();

        let mut chunks = provider.list().await.unwrap();
        chunks.sort();
        assert_eq!(chunks, vec!["chunk_aaa", "chunk_bbb", "chunk_ccc"]);
    }

    #[tokio::test]
    async fn list_empty_storage_returns_empty() {
        let (provider, _dir) = setup().await;
        let chunks = provider.list().await.unwrap();
        assert!(chunks.is_empty());
    }

    // -- capacity --

    #[tokio::test]
    async fn capacity_reports_total_and_used() {
        let (provider, _dir) = setup().await;
        provider.put("cap_test", b"12345").await.unwrap();

        let cap = provider.capacity().await.unwrap();
        assert_eq!(cap.total_bytes, 1_000_000_000);
        assert_eq!(cap.used_bytes, 5);
        assert_eq!(cap.available_bytes(), 1_000_000_000 - 5);
    }

    #[tokio::test]
    async fn capacity_empty_storage() {
        let (provider, _dir) = setup().await;
        let cap = provider.capacity().await.unwrap();
        assert_eq!(cap.used_bytes, 0);
    }

    // -- sharding: chunk_id com prefixo cria subdiretorio --

    #[tokio::test]
    async fn chunks_are_sharded_by_prefix() {
        let (provider, dir) = setup().await;
        provider.put("ab1234", b"data").await.unwrap();

        // Verifica que o arquivo foi criado em {base}/ab/ab1234
        let shard_path = dir.path().join("ab").join("ab1234");
        assert!(shard_path.exists());
    }

    // -- RN-N5: capacidade insuficiente --

    #[tokio::test]
    async fn put_rejects_when_capacity_exceeded() {
        let dir = TempDir::new().unwrap();
        let provider = LocalStorageProvider::new(
            dir.path().to_path_buf(),
            10, // 10 bytes total
        );
        provider.put("small", b"12345").await.unwrap(); // 5 bytes
        let result = provider.put("overflow", b"1234567890").await; // 10 bytes — excederia
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            StorageError::InsufficientSpace
        ));
    }
}
