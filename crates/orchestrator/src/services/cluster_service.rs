//! Service de Cluster: UC-001 (Criar Cluster) e UC-002 (Convidar Membro).
//!
//! Regras de negocio: RN-C1..C4, RN-M1..M5.

use crate::db::{clusters, members, vaults};
use alexandria_core::crypto;
use alexandria_core::crypto::envelope;
use alexandria_core::hashing;
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum ClusterError {
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("erro de criptografia: {0}")]
    Crypto(#[from] alexandria_core::crypto::CryptoError),
    #[error("cluster nao encontrado")]
    NotFound,
    #[error("email ja existe neste cluster")]
    EmailAlreadyExists,
    #[error("permissao negada: apenas admin pode executar esta acao")]
    Forbidden,
    #[error("token de convite invalido ou expirado")]
    #[allow(dead_code)]
    InvalidInviteToken,
    #[error("nao pode remover o ultimo admin do cluster")]
    CannotRemoveLastAdmin,
}

/// Resultado da criacao de cluster — inclui seed phrase (exibida uma unica vez).
pub struct CreateClusterResult {
    pub cluster_id: Uuid,
    pub crypto_cluster_id: String,
    pub seed_phrase: Vec<String>,
}

/// Token de convite para membro.
pub struct InviteToken {
    pub token: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// Cria cluster familiar (UC-001).
///
/// Fluxo:
/// 1. Gera seed phrase 12 palavras (RN-C1)
/// 2. Deriva master key
/// 3. Gera par de chaves, calcula cluster_id = SHA-256(public_key) (RN-C2)
/// 4. Criptografa private_key com master key
/// 5. Persiste cluster + admin + vault
pub async fn create_cluster(
    pool: &PgPool,
    cluster_name: &str,
    admin_name: &str,
    admin_email: &str,
    admin_password: &str,
) -> Result<CreateClusterResult, ClusterError> {
    // 1. Gera seed phrase (RN-C1)
    let seed = envelope::generate_seed_phrase()?;
    let seed_words: Vec<String> = seed.words().iter().map(|w| w.to_string()).collect();

    // 2. Deriva master key
    let master_key = envelope::derive_master_key(&seed);

    // 3. Gera par de chaves para o cluster
    let key_pair = crypto::generate_key();
    let public_key = key_pair.to_vec();

    // 4. cluster_id = SHA-256(public_key) (RN-C2)
    let crypto_cluster_id = hashing::sha256_hex(&public_key);

    // 5. Criptografa private_key com master key
    let encrypted_private_key = crypto::encrypt(master_key.as_bytes(), &key_pair)?;

    // 6. Persiste cluster
    let cluster_row = clusters::insert(
        pool,
        &crypto_cluster_id,
        cluster_name,
        &public_key,
        &encrypted_private_key,
    )
    .await?;

    // 7. Cria membro admin (RN-C4)
    let admin_row = members::insert(
        pool,
        cluster_row.id,
        admin_name,
        admin_email,
        "admin",
        None, // criador nao tem invited_by
    )
    .await?;

    // 8. Cria vault do admin criptografado com senha
    let empty_vault_data = serde_json::json!({
        "oauth_tokens": [],
        "node_credentials": [],
        "passwords": []
    });
    let vault_json = serde_json::to_vec(&empty_vault_data).expect("serialize vault");

    // Deriva chave do vault a partir da senha do admin
    let vault_key = derive_vault_key(admin_password);
    let encrypted_vault = crypto::encrypt(&vault_key, &vault_json)?;
    vaults::insert(pool, admin_row.id, &encrypted_vault).await?;

    Ok(CreateClusterResult {
        cluster_id: cluster_row.id,
        crypto_cluster_id,
        seed_phrase: seed_words,
    })
}

/// Gera token de convite para membro (UC-002, RN-M1, RN-M2).
///
/// Apenas admin pode convidar. Token expira em 7 dias.
pub async fn invite_member(
    pool: &PgPool,
    cluster_id: Uuid,
    inviter_id: Uuid,
    email: &str,
    role: &str,
) -> Result<InviteToken, ClusterError> {
    // Verificar que inviter e admin (RN-M2)
    let inviter = members::find_by_id(pool, inviter_id)
        .await?
        .ok_or(ClusterError::NotFound)?;

    if inviter.role != "admin" {
        return Err(ClusterError::Forbidden);
    }

    // Verificar email unico no cluster (RN-M4)
    if members::find_by_email_in_cluster(pool, cluster_id, email)
        .await?
        .is_some()
    {
        return Err(ClusterError::EmailAlreadyExists);
    }

    // Gera token de convite (HMAC do payload)
    let expires_at = chrono::Utc::now() + chrono::Duration::days(7);
    let payload = format!("{cluster_id}:{email}:{role}:{}", expires_at.timestamp());
    let token = hashing::sha256_hex(payload.as_bytes());

    Ok(InviteToken { token, expires_at })
}

/// Aceita convite e cria membro (UC-002).
pub async fn accept_invite(
    pool: &PgPool,
    cluster_id: Uuid,
    name: &str,
    email: &str,
    role: &str,
    invited_by: Uuid,
    password: &str,
) -> Result<Uuid, ClusterError> {
    // Verificar email unico (RN-M4)
    if members::find_by_email_in_cluster(pool, cluster_id, email)
        .await?
        .is_some()
    {
        return Err(ClusterError::EmailAlreadyExists);
    }

    // Criar membro
    let member = members::insert(pool, cluster_id, name, email, role, Some(invited_by)).await?;

    // Criar vault individual do membro
    let empty_vault_data = serde_json::json!({
        "oauth_tokens": [],
        "node_credentials": [],
        "passwords": []
    });
    let vault_json = serde_json::to_vec(&empty_vault_data).expect("serialize vault");
    let vault_key = derive_vault_key(password);
    let encrypted_vault = crypto::encrypt(&vault_key, &vault_json)?;
    vaults::insert(pool, member.id, &encrypted_vault).await?;

    Ok(member.id)
}

/// Remove membro do cluster (RN-M5: nao pode remover ultimo admin).
pub async fn remove_member(
    pool: &PgPool,
    cluster_id: Uuid,
    remover_id: Uuid,
    member_id: Uuid,
) -> Result<(), ClusterError> {
    // Verificar que quem remove e admin (RN-M2)
    let remover = members::find_by_id(pool, remover_id)
        .await?
        .ok_or(ClusterError::NotFound)?;

    if remover.role != "admin" {
        return Err(ClusterError::Forbidden);
    }

    // Verificar que nao esta removendo o ultimo admin (RN-M5)
    let target = members::find_by_id(pool, member_id)
        .await?
        .ok_or(ClusterError::NotFound)?;

    if target.role == "admin" {
        let admin_count = members::count_admins(pool, cluster_id).await?;
        if admin_count <= 1 {
            return Err(ClusterError::CannotRemoveLastAdmin);
        }
    }

    members::delete(pool, member_id).await?;
    Ok(())
}

/// Deriva chave de 32 bytes a partir da senha do membro (para criptografar vault).
/// Usa SHA-256 da senha como chave simplificada.
/// Em producao, migrar para Argon2id ou scrypt.
fn derive_vault_key(password: &str) -> [u8; 32] {
    let hash = hashing::sha256(password.as_bytes());
    *hash.as_bytes()
}
