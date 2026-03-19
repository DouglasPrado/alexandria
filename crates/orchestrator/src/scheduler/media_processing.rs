//! Scheduler task: processa arquivos com status="processing" via media_pipeline.
//!
//! Roda periodicamente (default: 10s), pega 1 arquivo pendente por ciclo,
//! le bytes do temp_path e dispara process_file.

use crate::api::AppState;
use crate::services::media_pipeline;
use tracing::{error, info, warn};

/// Verifica se ha arquivos com status="processing" e os processa via pipeline.
pub async fn run(state: &AppState) {
    // 1. Buscar proximo arquivo pendente
    let row = sqlx::query_as::<_, (uuid::Uuid, Option<String>)>(
        "SELECT id, temp_path FROM files WHERE status = 'processing' ORDER BY created_at LIMIT 1",
    )
    .fetch_optional(&state.db)
    .await;

    let (file_id, temp_path) = match row {
        Ok(Some(r)) => r,
        Ok(None) => return, // nenhum arquivo pendente
        Err(e) => {
            error!(error = %e, "falha ao consultar arquivos em processamento");
            return;
        }
    };

    // 2. Verificar master_key disponivel (retorna cedo sem segurar lock por muito tempo)
    {
        let guard = state.master_key.read().await;
        if guard.is_none() {
            warn!(
                file_id = %file_id,
                "master_key nao disponivel — ignorando processamento"
            );
            return;
        }
    }

    // 3. Ler bytes do arquivo temporario
    let temp_path = match temp_path {
        Some(p) if !p.is_empty() => p,
        _ => {
            error!(file_id = %file_id, "arquivo nao tem temp_path definido");
            return;
        }
    };

    let data = match tokio::fs::read(&temp_path).await {
        Ok(d) => d,
        Err(e) => {
            error!(
                file_id = %file_id,
                temp_path = %temp_path,
                error = %e,
                "nao foi possivel ler arquivo temporario"
            );
            return;
        }
    };

    // 4. Adquirir locks e processar via pipeline
    // Todos os locks sao read locks — nao causam deadlock entre si
    let master_key_guard = state.master_key.read().await;
    let master_key = match master_key_guard.as_ref() {
        Some(mk) => mk,
        None => {
            // Pode ter sido limpa entre a verificacao acima e agora
            warn!(file_id = %file_id, "master_key removida antes do processamento");
            return;
        }
    };

    let hash_ring = state.hash_ring.read().await;
    let storage_providers = state.storage_providers.read().await;

    // 5. Processar via pipeline
    match media_pipeline::process_file(
        &state.db,
        file_id,
        &data,
        master_key,
        &hash_ring,
        &storage_providers,
    )
    .await
    {
        Ok(result) => {
            info!(
                file_id = %file_id,
                manifest_id = %result.manifest_id,
                chunks = result.chunks_count,
                encrypted_size = result.total_encrypted_size,
                "media pipeline concluido com sucesso"
            );

            // Liberar locks antes de operacoes de IO
            drop(storage_providers);
            drop(hash_ring);
            drop(master_key_guard);

            // 6. Remover arquivo temporario apos sucesso
            if let Err(e) = tokio::fs::remove_file(&temp_path).await {
                warn!(
                    file_id = %file_id,
                    temp_path = %temp_path,
                    error = %e,
                    "falha ao remover arquivo temporario (nao critico)"
                );
            }
        }
        Err(e) => {
            // process_file ja marca status="error" internamente
            error!(
                file_id = %file_id,
                error = %e,
                "media pipeline falhou"
            );
        }
    }
}
