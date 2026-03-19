use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use super::{claims::AuthClaims, jwt::decode_token};

/// Axum middleware that validates a `Bearer` JWT from the `Authorization` header.
///
/// On success the decoded `AuthClaims` are inserted into the request extensions
/// so that downstream handlers can extract them with `Extension<AuthClaims>`.
///
/// On failure returns `401 Unauthorized`.
///
/// Usage (wired in Task 5 when AppState is available):
/// ```ignore
/// Router::new()
///     .route("/...", get(handler))
///     .layer(axum::middleware::from_fn_with_state(state, auth_middleware))
/// ```
pub async fn auth_middleware(
    State(jwt_secret): State<String>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = extract_bearer_token(&req).ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = decode_token(token, &jwt_secret).map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

/// Extracts the raw token string from `Authorization: Bearer <token>`.
///
/// Returns `None` if the header is absent, non-ASCII, or not prefixed with "Bearer ".
fn extract_bearer_token(req: &Request) -> Option<&str> {
    let header_value = req
        .headers()
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?;

    header_value.strip_prefix("Bearer ")
}

// ---------------------------------------------------------------------------
// Role guard helpers
// ---------------------------------------------------------------------------

/// Returns `Ok(())` if the member holds the `admin` role, `Err(403)` otherwise.
pub fn require_admin(claims: &AuthClaims) -> Result<(), StatusCode> {
    if claims.role == "admin" {
        Ok(())
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

/// Returns `Ok(())` if the member holds `admin` or `membro` role, `Err(403)` otherwise.
pub fn require_member_or_above(claims: &AuthClaims) -> Result<(), StatusCode> {
    match claims.role.as_str() {
        "admin" | "membro" => Ok(()),
        _ => Err(StatusCode::FORBIDDEN),
    }
}

// ---------------------------------------------------------------------------
// Unit tests (no DB or HTTP server required)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::{claims::AuthClaims, jwt::encode_access_token};
    use uuid::Uuid;

    fn make_claims(role: &str) -> AuthClaims {
        let member_id = Uuid::new_v4();
        let cluster_id = Uuid::new_v4();
        let secret = "test-secret";
        let token = encode_access_token(member_id, cluster_id, role, secret).unwrap();
        decode_token(&token, secret).unwrap()
    }

    #[test]
    fn require_admin_allows_admin() {
        let claims = make_claims("admin");
        assert!(require_admin(&claims).is_ok());
    }

    #[test]
    fn require_admin_rejects_membro() {
        let claims = make_claims("membro");
        assert_eq!(require_admin(&claims), Err(StatusCode::FORBIDDEN));
    }

    #[test]
    fn require_admin_rejects_leitura() {
        let claims = make_claims("leitura");
        assert_eq!(require_admin(&claims), Err(StatusCode::FORBIDDEN));
    }

    #[test]
    fn require_member_or_above_allows_admin() {
        let claims = make_claims("admin");
        assert!(require_member_or_above(&claims).is_ok());
    }

    #[test]
    fn require_member_or_above_allows_membro() {
        let claims = make_claims("membro");
        assert!(require_member_or_above(&claims).is_ok());
    }

    #[test]
    fn require_member_or_above_rejects_leitura() {
        let claims = make_claims("leitura");
        assert_eq!(require_member_or_above(&claims), Err(StatusCode::FORBIDDEN));
    }
}
