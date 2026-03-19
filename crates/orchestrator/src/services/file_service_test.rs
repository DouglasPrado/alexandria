//! Testes para file_service — UC-004, UC-005, state machine (09-state_models).

#[cfg(test)]
mod tests {
    use crate::services::file_service::FileError;

    // UC-004: Error variants cobrem todos os cenarios documentados
    #[test]
    fn file_error_variants_exist() {
        let _not_found = FileError::NotFound;
        let _insufficient = FileError::InsufficientNodes;
    }

    // UC-004: Mensagem de InsufficientNodes indica replicacao
    #[test]
    fn insufficient_nodes_mentions_replication_factor() {
        let msg = FileError::InsufficientNodes.to_string();
        assert!(msg.contains("replicacao"), "mensagem deve mencionar replicacao");
    }

    // 09-state_models: file error messages usam linguagem ubiqua
    #[test]
    fn error_messages_use_ubiquitous_language() {
        assert_eq!(FileError::NotFound.to_string(), "arquivo nao encontrado");
        assert!(
            FileError::InsufficientNodes
                .to_string()
                .contains("replicacao")
        );
    }
}
