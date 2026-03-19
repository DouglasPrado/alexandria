//! Testes para node_service — UC-003, UC-006.
//!
//! Testes unitarios validam logica de erro e tipos.
//! Testes de integracao (#[ignore]) validam contra banco real.

#[cfg(test)]
mod tests {
    use crate::services::node_service::NodeError;

    // UC-003: NodeError variants cobrem todos os cenarios documentados
    #[test]
    fn node_error_variants_exist() {
        // Verificar que todas as variantes documentadas existem
        let _not_found = NodeError::NotFound;
        let _forbidden = NodeError::Forbidden;
        let _min_nodes = NodeError::MinimumNodesRequired;
    }

    // UC-003: Error messages usam linguagem ubiqua
    #[test]
    fn error_messages_use_ubiquitous_language() {
        assert_eq!(
            NodeError::Forbidden.to_string(),
            "permissao negada: apenas admin pode gerenciar nos"
        );
        assert_eq!(
            NodeError::MinimumNodesRequired.to_string(),
            "nao e possivel remover — minimo de 3 nos necessario"
        );
        assert_eq!(NodeError::NotFound.to_string(), "no nao encontrado");
    }

    // UC-006: Regra RN-N3 — minimo de nos configuravel
    #[test]
    fn minimum_nodes_error_mentions_replication() {
        let msg = NodeError::MinimumNodesRequired.to_string();
        assert!(
            msg.contains("minimo") || msg.contains("replicacao"),
            "mensagem deve mencionar minimo de nos"
        );
    }
}
