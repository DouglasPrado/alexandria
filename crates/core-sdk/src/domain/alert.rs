use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Tipo do alerta de saude do cluster.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertType {
    NodeOffline,
    LowReplication,
    IntegrityError,
    TokenExpired,
    SpaceLow,
}

impl AlertType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::NodeOffline => "node_offline",
            Self::LowReplication => "low_replication",
            Self::IntegrityError => "integrity_error",
            Self::TokenExpired => "token_expired",
            Self::SpaceLow => "space_low",
        }
    }
}

impl std::fmt::Display for AlertType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Severidade do alerta.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

impl AlertSeverity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Info => "info",
            Self::Warning => "warning",
            Self::Critical => "critical",
        }
    }
}

impl std::fmt::Display for AlertSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Notificacao de problema ou evento importante no cluster.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub alert_type: AlertType,
    pub message: String,
    pub severity: AlertSeverity,
    pub resolved: bool,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}
