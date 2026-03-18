//! StorageProvider implementacao para S3-compatible backends.
//!
//! Funciona com AWS S3, Cloudflare R2 e Backblaze B2 — todos S3-compatible.
//! Usa aws-sdk-s3 para operacoes.
//! Chunks sao armazenados como objetos: {prefix}/{chunk_id}

use super::{StorageCapacity, StorageError, StorageProvider};
use async_trait::async_trait;
use aws_credential_types::Credentials;
use aws_sdk_s3::Client;
use aws_sdk_s3::config::{BehaviorVersion, Region};

/// Configuracao para conectar a um backend S3-compatible.
#[derive(Debug, Clone)]
pub struct S3Config {
    pub bucket: String,
    pub region: String,
    /// Endpoint customizado (obrigatorio para R2, B2, MinIO)
    pub endpoint: Option<String>,
    pub access_key_id: String,
    pub secret_access_key: String,
    /// Prefixo para objetos (ex: "chunks/"). None = raiz do bucket.
    pub prefix: Option<String>,
}

/// StorageProvider para backends S3-compatible (AWS S3, Cloudflare R2, Backblaze B2).
pub struct S3StorageProvider {
    client: Client,
    bucket: String,
    prefix: Option<String>,
}

impl S3StorageProvider {
    /// Cria provider a partir de config (async — inicializa SDK client).
    pub async fn new(config: S3Config) -> Self {
        let credentials = Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "alexandria",
        );

        let mut s3_config = aws_sdk_s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(config.region))
            .credentials_provider(credentials)
            .force_path_style(true);

        if let Some(endpoint) = &config.endpoint {
            s3_config = s3_config.endpoint_url(endpoint);
        }

        let client = Client::from_conf(s3_config.build());

        Self {
            client,
            bucket: config.bucket,
            prefix: config.prefix,
        }
    }

    /// Cria provider de forma sincrona (sem inicializar operacoes async).
    /// Util para testes unitarios de configuracao.
    pub fn from_config_sync(config: S3Config) -> Self {
        let credentials = Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "alexandria",
        );

        let mut s3_config = aws_sdk_s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(config.region))
            .credentials_provider(credentials)
            .force_path_style(true);

        if let Some(endpoint) = &config.endpoint {
            s3_config = s3_config.endpoint_url(endpoint);
        }

        let client = Client::from_conf(s3_config.build());

        Self {
            client,
            bucket: config.bucket,
            prefix: config.prefix,
        }
    }

    /// Retorna a object key completa para um chunk_id.
    pub fn object_key(&self, chunk_id: &str) -> String {
        match &self.prefix {
            Some(prefix) => {
                if prefix.ends_with('/') {
                    format!("{prefix}{chunk_id}")
                } else {
                    format!("{prefix}/{chunk_id}")
                }
            }
            None => chunk_id.to_string(),
        }
    }
}

#[async_trait]
impl StorageProvider for S3StorageProvider {
    async fn put(&self, chunk_id: &str, data: &[u8]) -> Result<(), StorageError> {
        let key = self.object_key(chunk_id);
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(&key)
            .body(data.to_vec().into())
            .send()
            .await
            .map_err(|e| StorageError::ProviderError(format!("S3 put falhou: {e}")))?;
        Ok(())
    }

    async fn get(&self, chunk_id: &str) -> Result<Vec<u8>, StorageError> {
        let key = self.object_key(chunk_id);
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await
            .map_err(|e| {
                let msg = e.to_string();
                if msg.contains("NoSuchKey") || msg.contains("404") {
                    StorageError::NotFound(chunk_id.to_string())
                } else {
                    StorageError::ProviderError(format!("S3 get falhou: {e}"))
                }
            })?;

        let data = resp
            .body
            .collect()
            .await
            .map_err(|e| StorageError::ProviderError(format!("S3 read body falhou: {e}")))?;

        Ok(data.into_bytes().to_vec())
    }

    async fn exists(&self, chunk_id: &str) -> Result<bool, StorageError> {
        let key = self.object_key(chunk_id);
        match self
            .client
            .head_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                let msg = e.to_string();
                if msg.contains("NotFound") || msg.contains("404") || msg.contains("NoSuchKey") {
                    Ok(false)
                } else {
                    Err(StorageError::ProviderError(format!("S3 head falhou: {e}")))
                }
            }
        }
    }

    async fn delete(&self, chunk_id: &str) -> Result<(), StorageError> {
        let key = self.object_key(chunk_id);
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await
            .map_err(|e| StorageError::ProviderError(format!("S3 delete falhou: {e}")))?;
        Ok(())
    }

    async fn list(&self) -> Result<Vec<String>, StorageError> {
        let mut chunk_ids = Vec::new();
        let mut continuation_token: Option<String> = None;

        loop {
            let mut req = self.client.list_objects_v2().bucket(&self.bucket);

            if let Some(prefix) = &self.prefix {
                req = req.prefix(prefix);
            }
            if let Some(token) = &continuation_token {
                req = req.continuation_token(token);
            }

            let resp = req
                .send()
                .await
                .map_err(|e| StorageError::ProviderError(format!("S3 list falhou: {e}")))?;

            for obj in resp.contents() {
                if let Some(key) = obj.key() {
                    // Remove o prefixo para retornar apenas o chunk_id
                    let chunk_id: &str = match &self.prefix {
                        Some(prefix) => key.strip_prefix(prefix.as_str()).unwrap_or(key),
                        None => key,
                    };
                    if !chunk_id.is_empty() {
                        chunk_ids.push(chunk_id.to_string());
                    }
                }
            }

            if resp.is_truncated() == Some(true) {
                continuation_token = resp.next_continuation_token().map(|s| s.to_string());
            } else {
                break;
            }
        }

        Ok(chunk_ids)
    }

    async fn capacity(&self) -> Result<StorageCapacity, StorageError> {
        // S3 nao tem conceito nativo de capacidade/quota.
        // Retornamos u64::MAX como total (ilimitado) e estimamos used via list.
        // Em producao, o orquestrador trackeia used_capacity na tabela nodes.
        Ok(StorageCapacity {
            total_bytes: u64::MAX,
            used_bytes: 0,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // -- S3Config: construcao e validacao --

    #[test]
    fn s3_config_builder_produces_valid_config() {
        let config = S3Config {
            bucket: "my-bucket".into(),
            region: "us-east-1".into(),
            endpoint: None,
            access_key_id: "AKID".into(),
            secret_access_key: "SECRET".into(),
            prefix: Some("chunks/".into()),
        };
        assert_eq!(config.bucket, "my-bucket");
        assert_eq!(config.region, "us-east-1");
        assert!(config.endpoint.is_none());
        assert_eq!(config.prefix.as_deref(), Some("chunks/"));
    }

    #[test]
    fn s3_config_with_custom_endpoint_for_r2() {
        let config = S3Config {
            bucket: "alexandria-chunks".into(),
            region: "auto".into(),
            endpoint: Some("https://account-id.r2.cloudflarestorage.com".into()),
            access_key_id: "R2_KEY".into(),
            secret_access_key: "R2_SECRET".into(),
            prefix: None,
        };
        assert!(config.endpoint.is_some());
    }

    #[test]
    fn s3_config_default_prefix_is_none() {
        let config = S3Config {
            bucket: "test".into(),
            region: "us-east-1".into(),
            endpoint: None,
            access_key_id: "key".into(),
            secret_access_key: "secret".into(),
            prefix: None,
        };
        assert!(config.prefix.is_none());
    }

    // -- object_key: prefixo correto --

    #[test]
    fn object_key_without_prefix() {
        let provider = S3StorageProvider::from_config_sync(S3Config {
            bucket: "test".into(),
            region: "us-east-1".into(),
            endpoint: None,
            access_key_id: "key".into(),
            secret_access_key: "secret".into(),
            prefix: None,
        });
        assert_eq!(provider.object_key("abc123"), "abc123");
    }

    #[test]
    fn object_key_with_prefix() {
        let provider = S3StorageProvider::from_config_sync(S3Config {
            bucket: "test".into(),
            region: "us-east-1".into(),
            endpoint: None,
            access_key_id: "key".into(),
            secret_access_key: "secret".into(),
            prefix: Some("chunks/".into()),
        });
        assert_eq!(provider.object_key("abc123"), "chunks/abc123");
    }

    #[test]
    fn object_key_with_prefix_no_trailing_slash() {
        let provider = S3StorageProvider::from_config_sync(S3Config {
            bucket: "test".into(),
            region: "us-east-1".into(),
            endpoint: None,
            access_key_id: "key".into(),
            secret_access_key: "secret".into(),
            prefix: Some("data".into()),
        });
        assert_eq!(provider.object_key("abc123"), "data/abc123");
    }

    // -- Testes de integracao (requerem endpoint S3/MinIO) --
    // Rodar com: cargo test -- --ignored
    // Requer: ALEXANDRIA_TEST_S3_ENDPOINT, ALEXANDRIA_TEST_S3_BUCKET,
    //         ALEXANDRIA_TEST_S3_ACCESS_KEY, ALEXANDRIA_TEST_S3_SECRET_KEY

    #[tokio::test]
    #[ignore = "requer endpoint S3/MinIO configurado"]
    async fn integration_put_get_roundtrip() {
        let provider = test_provider().await;
        let chunk_id = &format!("test-{}", uuid::Uuid::new_v4());
        let data = b"integration test data";

        provider.put(chunk_id, data).await.unwrap();
        let recovered = provider.get(chunk_id).await.unwrap();
        assert_eq!(recovered, data);

        // Cleanup
        provider.delete(chunk_id).await.unwrap();
    }

    #[tokio::test]
    #[ignore = "requer endpoint S3/MinIO configurado"]
    async fn integration_exists_and_delete() {
        let provider = test_provider().await;
        let chunk_id = &format!("test-{}", uuid::Uuid::new_v4());

        assert!(!provider.exists(chunk_id).await.unwrap());
        provider.put(chunk_id, b"data").await.unwrap();
        assert!(provider.exists(chunk_id).await.unwrap());
        provider.delete(chunk_id).await.unwrap();
        assert!(!provider.exists(chunk_id).await.unwrap());
    }

    #[tokio::test]
    #[ignore = "requer endpoint S3/MinIO configurado"]
    async fn integration_get_nonexistent_returns_not_found() {
        let provider = test_provider().await;
        let result = provider.get("nonexistent-chunk-id-12345").await;
        assert!(result.is_err());
    }

    async fn test_provider() -> S3StorageProvider {
        let config = S3Config {
            bucket: std::env::var("ALEXANDRIA_TEST_S3_BUCKET")
                .unwrap_or_else(|_| "test-bucket".into()),
            region: std::env::var("ALEXANDRIA_TEST_S3_REGION")
                .unwrap_or_else(|_| "us-east-1".into()),
            endpoint: std::env::var("ALEXANDRIA_TEST_S3_ENDPOINT").ok(),
            access_key_id: std::env::var("ALEXANDRIA_TEST_S3_ACCESS_KEY")
                .unwrap_or_else(|_| "minioadmin".into()),
            secret_access_key: std::env::var("ALEXANDRIA_TEST_S3_SECRET_KEY")
                .unwrap_or_else(|_| "minioadmin".into()),
            prefix: Some("test-chunks/".into()),
        };
        S3StorageProvider::new(config).await
    }
}
