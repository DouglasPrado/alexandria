//! Service de Node: UC-003 (Registrar No) e UC-006 (Desconectar No).
//!
//! Regras de negocio: RN-N1..N6, RN-M2.

use crate::db::{members, nodes};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum NodeError {
    #[error("erro de banco: {0}")]
    Database(#[from] sqlx::Error),
    #[error("no nao encontrado")]
    NotFound,
    #[error("permissao negada: apenas admin pode gerenciar nos")]
    Forbidden,
    #[error("nao e possivel remover — minimo de 3 nos necessario")]
    MinimumNodesRequired,
}

/// Registra no de armazenamento (UC-003).
pub async fn register_node(
    pool: &PgPool,
    cluster_id: Uuid,
    owner_id: Uuid,
    node_type: &str,
    name: &str,
    total_capacity: i64,
    endpoint: Option<&str>,
) -> Result<Uuid, NodeError> {
    // Verificar que owner e admin (RN-M2)
    let owner = members::find_by_id(pool, owner_id)
        .await?
        .ok_or(NodeError::NotFound)?;

    if owner.role != "admin" {
        return Err(NodeError::Forbidden);
    }

    let node = nodes::insert(
        pool,
        cluster_id,
        owner_id,
        node_type,
        name,
        total_capacity,
        endpoint,
    )
    .await?;

    Ok(node.id)
}

/// Processa heartbeat de no (atualiza last_heartbeat e status → online).
pub async fn process_heartbeat(pool: &PgPool, node_id: Uuid) -> Result<(), NodeError> {
    let updated = nodes::update_heartbeat(pool, node_id).await?;
    if !updated {
        return Err(NodeError::NotFound);
    }
    Ok(())
}

/// Desconecta no com drain (UC-006, RN-N3).
pub async fn disconnect_node(
    pool: &PgPool,
    cluster_id: Uuid,
    remover_id: Uuid,
    node_id: Uuid,
) -> Result<(), NodeError> {
    // Verificar admin (RN-M2)
    let remover = members::find_by_id(pool, remover_id)
        .await?
        .ok_or(NodeError::NotFound)?;

    if remover.role != "admin" {
        return Err(NodeError::Forbidden);
    }

    // Verificar minimo de nos (UC-006: E1)
    let online_count = nodes::count_online_by_cluster(pool, cluster_id).await?;
    if online_count <= 3 {
        return Err(NodeError::MinimumNodesRequired);
    }

    // Marcar como draining (RN-N6)
    nodes::update_status(pool, node_id, "draining").await?;

    // Em producao: scheduler dispara drain job async (re-replicacao)
    // Por agora: remove diretamente (drain sera implementado no scheduler)
    nodes::delete(pool, node_id).await?;

    Ok(())
}
