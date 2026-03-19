//! Servicos de dominio e use cases.
//! Cada servico orquestra logica de negocio usando repositorios e core-sdk.

pub mod cluster_service;
pub mod dedup_service;
pub mod file_service;
#[cfg(test)]
mod file_service_test;
#[allow(dead_code)]
pub mod media_pipeline;
pub mod node_service;
#[cfg(test)]
mod node_service_test;
pub mod recovery_service;
