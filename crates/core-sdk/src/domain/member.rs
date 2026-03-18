use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Nivel de permissao do membro no cluster.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemberRole {
    Admin,
    Membro,
    Leitura,
}

impl MemberRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Admin => "admin",
            Self::Membro => "membro",
            Self::Leitura => "leitura",
        }
    }
}

impl std::fmt::Display for MemberRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Pessoa autorizada a participar de um cluster com um nivel de permissao.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: Uuid,
    pub cluster_id: Uuid,
    pub name: String,
    pub email: String,
    pub role: MemberRole,
    /// Membro que convidou (None para o criador do cluster)
    pub invited_by: Option<Uuid>,
    pub joined_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// -- Eventos de dominio --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemberEvent {
    /// Token de convite gerado e enviado
    Invited { member_id: Uuid, cluster_id: Uuid },
    /// Membro aceitou convite; dispara criacao do vault
    Joined { member_id: Uuid, cluster_id: Uuid },
    /// Membro desconectado do cluster; vault marcado para exclusao
    Removed { member_id: Uuid, cluster_id: Uuid },
}
