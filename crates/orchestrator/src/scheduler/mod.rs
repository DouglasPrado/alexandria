//! Scheduler de tarefas periodicas (tokio::time).
//!
//! Executa em background junto ao servidor HTTP:
//! - Heartbeat monitoring: deteccao de nos suspect/lost
//! - Auto-healing: re-replicacao de chunks sub-replicados
//! - Scrubbing: verificacao de integridade via hash
//! - Garbage collection: remocao de chunks orfaos

pub mod auto_healing;
#[cfg(test)]
mod auto_healing_test;
pub mod garbage_collection;
pub mod heartbeat;
#[cfg(test)]
mod heartbeat_test;
pub mod rebalancing;
pub mod scrubbing;
#[cfg(test)]
mod scrubbing_test;
pub mod tiering;

use sqlx::PgPool;
use std::time::Duration;
use tokio::time;

/// Configuracao dos intervalos do scheduler.
pub struct SchedulerConfig {
    /// Intervalo entre checks de heartbeat (default: 5 min).
    pub heartbeat_interval: Duration,
    /// Intervalo entre ciclos de scrubbing (default: 24h).
    pub scrubbing_interval: Duration,
    /// Intervalo entre ciclos de GC (default: 24h).
    pub gc_interval: Duration,
    /// Intervalo entre ciclos de auto-healing (default: 10 min).
    pub healing_interval: Duration,
    /// Intervalo entre ciclos de rebalanceamento (default: 1h).
    pub rebalancing_interval: Duration,
    /// Intervalo entre ciclos de tiering (default: 24h).
    pub tiering_interval: Duration,
}

impl Default for SchedulerConfig {
    fn default() -> Self {
        Self {
            heartbeat_interval: Duration::from_secs(5 * 60),
            scrubbing_interval: Duration::from_secs(24 * 60 * 60),
            gc_interval: Duration::from_secs(24 * 60 * 60),
            healing_interval: Duration::from_secs(10 * 60),
            rebalancing_interval: Duration::from_secs(60 * 60),
            tiering_interval: Duration::from_secs(24 * 60 * 60),
        }
    }
}

/// Inicia todas as tarefas periodicas do scheduler.
/// Cada tarefa roda em sua propria tokio task.
/// Retorna um JoinHandle que pode ser usado para aguardar ou cancelar.
pub fn start(pool: PgPool, config: SchedulerConfig) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let pool_hb = pool.clone();
        let pool_heal = pool.clone();
        let pool_scrub = pool.clone();
        let pool_gc = pool.clone();
        let pool_rebal = pool.clone();
        let pool_tier = pool.clone();

        let hb = tokio::spawn(async move {
            let mut interval = time::interval(config.heartbeat_interval);
            loop {
                interval.tick().await;
                if let Err(e) = heartbeat::run(&pool_hb).await {
                    tracing::error!(error = %e, "heartbeat monitor failed");
                }
            }
        });

        let heal = tokio::spawn(async move {
            let mut interval = time::interval(config.healing_interval);
            loop {
                interval.tick().await;
                if let Err(e) = auto_healing::run(&pool_heal).await {
                    tracing::error!(error = %e, "auto-healing failed");
                }
            }
        });

        let scrub = tokio::spawn(async move {
            let mut interval = time::interval(config.scrubbing_interval);
            loop {
                interval.tick().await;
                if let Err(e) = scrubbing::run(&pool_scrub).await {
                    tracing::error!(error = %e, "scrubbing failed");
                }
            }
        });

        let gc = tokio::spawn(async move {
            let mut interval = time::interval(config.gc_interval);
            loop {
                interval.tick().await;
                if let Err(e) = garbage_collection::run(&pool_gc).await {
                    tracing::error!(error = %e, "garbage collection failed");
                }
            }
        });

        let rebal = tokio::spawn(async move {
            let mut interval = time::interval(config.rebalancing_interval);
            loop {
                interval.tick().await;
                if let Err(e) = rebalancing::run(&pool_rebal).await {
                    tracing::error!(error = %e, "rebalancing failed");
                }
            }
        });

        let tier = tokio::spawn(async move {
            let mut interval = time::interval(config.tiering_interval);
            loop {
                interval.tick().await;
                if let Err(e) = tiering::run(&pool_tier).await {
                    tracing::error!(error = %e, "tiering failed");
                }
            }
        });

        // Se qualquer task falhar, logamos e continuamos as demais
        let _ = tokio::join!(hb, heal, scrub, gc, rebal, tier);
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_sane_intervals() {
        let cfg = SchedulerConfig::default();
        assert_eq!(cfg.heartbeat_interval, Duration::from_secs(300));
        assert_eq!(cfg.scrubbing_interval, Duration::from_secs(86400));
        assert_eq!(cfg.gc_interval, Duration::from_secs(86400));
        assert_eq!(cfg.healing_interval, Duration::from_secs(600));
        assert_eq!(cfg.rebalancing_interval, Duration::from_secs(3600));
        assert_eq!(cfg.tiering_interval, Duration::from_secs(86400));
    }
}
