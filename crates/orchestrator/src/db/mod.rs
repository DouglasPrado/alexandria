//! Camada de acesso ao banco de dados (PostgreSQL 18 via SQLx).
//! Repositorios por entidade de dominio.

pub mod alerts;
#[allow(dead_code)]
pub mod chunk_replicas;
#[allow(dead_code)]
pub mod chunks;
pub mod clusters;
pub mod files;
#[allow(dead_code)]
pub mod manifests;
pub mod members;
pub mod nodes;
pub mod vaults;
