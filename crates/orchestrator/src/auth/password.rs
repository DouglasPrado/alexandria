use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Failed to hash password: {0}")]
    HashError(String),
    #[error("Failed to verify password: {0}")]
    VerifyError(String),
    #[error("Invalid password hash format: {0}")]
    InvalidHash(String),
}

/// Hashes a plain-text password using Argon2id with a random salt.
/// Returns a PHC-formatted string (e.g. `$argon2id$v=19$...`).
pub fn hash_password(password: &str) -> Result<String, AuthError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AuthError::HashError(e.to_string()))
}

/// Verifies a plain-text password against a stored Argon2 PHC hash.
/// Returns `true` if the password matches, `false` otherwise.
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AuthError> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|e| AuthError::InvalidHash(e.to_string()))?;

    match Argon2::default().verify_password(password.as_bytes(), &parsed_hash) {
        Ok(()) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false),
        Err(e) => Err(AuthError::VerifyError(e.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_roundtrip_succeeds() {
        let password = "correct-horse-battery-staple";
        let hash = hash_password(password).expect("hashing must succeed");

        assert!(
            hash.starts_with("$argon2id$"),
            "hash must be in Argon2id PHC format"
        );

        let valid = verify_password(password, &hash).expect("verification must not error");
        assert!(valid, "correct password must verify as true");
    }

    #[test]
    fn wrong_password_fails() {
        let hash = hash_password("secret-password").expect("hashing must succeed");
        let valid =
            verify_password("wrong-password", &hash).expect("verification must not error");
        assert!(!valid, "wrong password must verify as false");
    }

    #[test]
    fn empty_password_hashes_and_verifies() {
        let hash = hash_password("").expect("empty password hashing must succeed");
        let valid = verify_password("", &hash).expect("verification must not error");
        assert!(valid, "empty password must verify against its own hash");

        let wrong = verify_password("nonempty", &hash).expect("verification must not error");
        assert!(!wrong, "non-empty password must not verify against empty hash");
    }

    #[test]
    fn two_hashes_of_same_password_differ() {
        let password = "same-password";
        let hash1 = hash_password(password).expect("hashing must succeed");
        let hash2 = hash_password(password).expect("hashing must succeed");
        // Different salts → different hashes
        assert_ne!(hash1, hash2, "each hash must use a unique salt");
    }
}
