pub mod claims;
pub mod jwt;
pub mod middleware;
pub mod password;
pub mod refresh;

use thiserror::Error;

/// Shared auth error type used by password, jwt, and middleware modules.
#[derive(Debug, Error)]
pub enum AuthError {
    // Password errors
    #[error("Failed to hash password: {0}")]
    HashError(String),
    #[error("Failed to verify password: {0}")]
    VerifyError(String),
    #[error("Invalid password hash format: {0}")]
    InvalidHash(String),
    // JWT errors
    #[error("Failed to encode JWT: {0}")]
    EncodeError(String),
    #[error("Failed to decode JWT: {0}")]
    DecodeError(String),
    #[error("Token has expired")]
    TokenExpired,
    #[error("Invalid token signature")]
    InvalidSignature,
}
