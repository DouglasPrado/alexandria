use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::RngCore;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use super::claims::AuthClaims;
use super::AuthError;

const ACCESS_TOKEN_TTL_SECS: i64 = 24 * 60 * 60; // 24 hours

/// Encodes a signed JWT access token (HMAC-SHA256) for the given member.
///
/// The token expires 24 hours from the moment of issuance.
pub fn encode_access_token(
    member_id: Uuid,
    cluster_id: Uuid,
    role: &str,
    secret: &str,
) -> Result<String, AuthError> {
    let now = chrono::Utc::now().timestamp();
    let claims = AuthClaims {
        member_id,
        cluster_id,
        role: role.to_owned(),
        exp: now + ACCESS_TOKEN_TTL_SECS,
        iat: now,
    };

    encode(
        &Header::default(), // HS256
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AuthError::EncodeError(e.to_string()))
}

/// Decodes and validates a JWT access token.
///
/// Returns the embedded `AuthClaims` on success.
/// Returns `AuthError::TokenExpired` when the `exp` claim is in the past,
/// and `AuthError::InvalidSignature` when the signature does not match.
pub fn decode_token(token: &str, secret: &str) -> Result<AuthClaims, AuthError> {
    let mut validation = Validation::default(); // HS256 + validates `exp`
    validation.validate_exp = true;
    validation.leeway = 0; // no clock skew tolerance — callers must issue tokens with adequate TTL

    decode::<AuthClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
        jsonwebtoken::errors::ErrorKind::InvalidSignature => AuthError::InvalidSignature,
        _ => AuthError::DecodeError(e.to_string()),
    })
}

/// Generates a cryptographically random refresh token.
///
/// Returns `(raw_token, sha256_hash)` where:
/// - `raw_token` is the hex-encoded 32 random bytes to send to the client.
/// - `sha256_hash` is the SHA-256 hex digest of `raw_token` to store in the DB.
///
/// Only the hash is persisted; the raw token is never stored.
pub fn generate_refresh_token() -> (String, String) {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);

    let raw_token = hex::encode(bytes);

    let mut hasher = Sha256::new();
    hasher.update(raw_token.as_bytes());
    let hash_bytes = hasher.finalize();
    let token_hash = hex::encode(hash_bytes);

    (raw_token, token_hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "test-secret-key-do-not-use-in-production";

    fn sample_ids() -> (Uuid, Uuid) {
        (Uuid::new_v4(), Uuid::new_v4())
    }

    #[test]
    fn encode_decode_roundtrip() {
        let (member_id, cluster_id) = sample_ids();

        let token = encode_access_token(member_id, cluster_id, "admin", SECRET)
            .expect("encoding must succeed");

        let claims = decode_token(&token, SECRET).expect("decoding must succeed");

        assert_eq!(claims.member_id, member_id);
        assert_eq!(claims.cluster_id, cluster_id);
        assert_eq!(claims.role, "admin");
        assert!(claims.exp > claims.iat, "exp must be after iat");
        assert!(
            claims.exp - claims.iat == ACCESS_TOKEN_TTL_SECS,
            "TTL must be exactly 24h"
        );
    }

    #[test]
    fn expired_token_fails() {
        let (member_id, cluster_id) = sample_ids();

        // Manually craft a token with exp in the past
        let now = chrono::Utc::now().timestamp();
        let claims = AuthClaims {
            member_id,
            cluster_id,
            role: "membro".to_owned(),
            exp: now - 3600, // expired 1 hour ago
            iat: now - 7200,
        };

        let token = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &claims,
            &jsonwebtoken::EncodingKey::from_secret(SECRET.as_bytes()),
        )
        .expect("encoding must succeed");

        let result = decode_token(&token, SECRET);
        assert!(
            matches!(result, Err(AuthError::TokenExpired)),
            "expired token must return TokenExpired, got: {:?}",
            result
        );
    }

    #[test]
    fn invalid_signature_fails() {
        let (member_id, cluster_id) = sample_ids();

        let token = encode_access_token(member_id, cluster_id, "leitura", SECRET)
            .expect("encoding must succeed");

        let result = decode_token(&token, "wrong-secret");
        assert!(
            matches!(result, Err(AuthError::InvalidSignature)),
            "wrong secret must return InvalidSignature, got: {:?}",
            result
        );
    }

    #[test]
    fn refresh_token_produces_different_tokens_each_call() {
        let (raw1, hash1) = generate_refresh_token();
        let (raw2, hash2) = generate_refresh_token();

        assert_ne!(raw1, raw2, "each call must produce a unique raw token");
        assert_ne!(hash1, hash2, "each call must produce a unique hash");
    }

    #[test]
    fn refresh_token_hash_is_sha256_of_raw() {
        let (raw_token, stored_hash) = generate_refresh_token();

        let mut hasher = Sha256::new();
        hasher.update(raw_token.as_bytes());
        let expected = hex::encode(hasher.finalize());

        assert_eq!(stored_hash, expected, "stored hash must be SHA-256(raw_token)");
    }

    #[test]
    fn raw_token_is_64_hex_chars() {
        let (raw_token, _) = generate_refresh_token();
        // 32 bytes → 64 hex characters
        assert_eq!(raw_token.len(), 64, "raw token must be 64 hex chars (32 bytes)");
        assert!(
            raw_token.chars().all(|c| c.is_ascii_hexdigit()),
            "raw token must be valid hexadecimal"
        );
    }
}
