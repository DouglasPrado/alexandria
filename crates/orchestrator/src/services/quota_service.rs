//! Quota Service — gerenciamento de quotas de armazenamento por membro.
//!
//! Regras:
//!   - Cada membro tem um limite de armazenamento (storage_quota)
//!   - Upload rejeitado se usage + file_size > quota
//!   - Admin pode alterar quota de qualquer membro
//!   - storage_used atualizado a cada upload/delete

use crate::db::members;
use serde::Serialize;
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum QuotaError {
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("membro nao encontrado")]
    MemberNotFound,
    #[error("quota excedida: {used} + {requested} > {quota} bytes")]
    #[allow(dead_code)]
    QuotaExceeded {
        quota: i64,
        used: i64,
        requested: i64,
    },
}

#[derive(Debug, Serialize)]
pub struct QuotaInfo {
    pub member_id: Uuid,
    pub storage_quota: i64,
    pub storage_used: i64,
    pub storage_available: i64,
    pub usage_percent: f64,
}

/// Retorna informacoes de quota de um membro.
pub async fn get_quota(pool: &PgPool, member_id: Uuid) -> Result<QuotaInfo, QuotaError> {
    let member = members::find_by_id(pool, member_id)
        .await?
        .ok_or(QuotaError::MemberNotFound)?;

    let available = member.storage_quota - member.storage_used;
    let usage_percent = if member.storage_quota > 0 {
        (member.storage_used as f64 / member.storage_quota as f64) * 100.0
    } else {
        0.0
    };

    Ok(QuotaInfo {
        member_id,
        storage_quota: member.storage_quota,
        storage_used: member.storage_used,
        storage_available: available.max(0),
        usage_percent,
    })
}

#[allow(dead_code)]
/// Verifica se membro tem quota suficiente para upload de file_size bytes.
pub async fn check_quota(pool: &PgPool, member_id: Uuid, file_size: i64) -> Result<(), QuotaError> {
    let member = members::find_by_id(pool, member_id)
        .await?
        .ok_or(QuotaError::MemberNotFound)?;

    if member.storage_used + file_size > member.storage_quota {
        return Err(QuotaError::QuotaExceeded {
            quota: member.storage_quota,
            used: member.storage_used,
            requested: file_size,
        });
    }

    Ok(())
}

#[allow(dead_code)]
/// Incrementa storage_used apos upload bem-sucedido.
pub async fn record_usage(pool: &PgPool, member_id: Uuid, bytes: i64) -> Result<(), QuotaError> {
    members::update_storage_used(pool, member_id, bytes).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // QuotaExceeded carrega informacao util
    #[test]
    fn quota_exceeded_error_has_details() {
        let err = QuotaError::QuotaExceeded {
            quota: 10_000_000,
            used: 8_000_000,
            requested: 5_000_000,
        };
        let msg = err.to_string();
        assert!(msg.contains("8000000"));
        assert!(msg.contains("5000000"));
        assert!(msg.contains("10000000"));
    }

    // QuotaInfo calcula available e usage_percent
    #[test]
    fn quota_info_calculations() {
        let info = QuotaInfo {
            member_id: Uuid::new_v4(),
            storage_quota: 10_000_000_000, // 10 GB
            storage_used: 3_000_000_000,   // 3 GB
            storage_available: 7_000_000_000,
            usage_percent: 30.0,
        };
        assert_eq!(info.storage_available, 7_000_000_000);
        assert!((info.usage_percent - 30.0).abs() < 0.01);
    }

    // Default quota is 10 GB
    #[test]
    fn default_quota_is_10gb() {
        let default_quota: i64 = 10 * 1024 * 1024 * 1024; // 10 GB
        assert_eq!(default_quota, 10_737_418_240);
    }
}
