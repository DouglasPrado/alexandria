use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// JWT claims for an authenticated Alexandria member session.
///
/// The `member_id` field is serialized as the standard JWT `sub` claim.
/// All handlers and middleware reference `claims.member_id` (not `sub`).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthClaims {
    /// Subject: the member's UUID, serialized as "sub" in the JWT payload.
    #[serde(rename = "sub")]
    pub member_id: Uuid,
    /// The cluster this token was issued for.
    pub cluster_id: Uuid,
    /// Role of the member: "admin" | "membro" | "leitura"
    pub role: String,
    /// Expiration timestamp (Unix seconds). Set to 24h after issuance.
    pub exp: i64,
    /// Issued-at timestamp (Unix seconds).
    pub iat: i64,
}
