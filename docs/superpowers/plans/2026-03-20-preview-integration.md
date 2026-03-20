# Preview Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire preview generation into the media pipeline so every uploaded photo gets an encrypted preview chunk stored in distributed storage, and the GET /files/:id/preview endpoint serves it correctly.

**Architecture:** Preview is generated after dedup check, encrypted with the file_key, stored as a chunk (chunk_index=-1 sentinel) in the same nodes via ConsistentHashRing, and tracked via `files.preview_chunk_id`. The endpoint decrypts on-demand using master_key → file_key derivation.

**Tech Stack:** Rust, Axum 0.8, SQLx, PostgreSQL 18, alexandria_core (preview, crypto, hashing modules)

**Spec:** `docs/superpowers/specs/2026-03-20-preview-integration-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `crates/orchestrator/src/db/files.rs` | Modify | Add `update_status_with_preview` function |
| `crates/orchestrator/src/db/chunks.rs` | Modify | Filter preview chunks from `find_by_file` |
| `crates/orchestrator/src/services/media_pipeline.rs` | Modify | Add preview generation step, update PipelineResult |
| `crates/orchestrator/src/services/dedup_service.rs` | Modify | Copy `preview_chunk_id` in `link_duplicate` |
| `crates/orchestrator/src/api/files.rs` | Modify | Rewrite `get_preview` with auth + distributed storage |
| `crates/orchestrator/src/scheduler/media_processing.rs` | Modify | Add preview_chunk_id to success log |

---

### Task 1: Add `update_status_with_preview` to DB layer

**Files:**
- Modify: `crates/orchestrator/src/db/files.rs:104-121`

- [ ] **Step 1: Write the new function**

Add after the existing `update_status` function in `crates/orchestrator/src/db/files.rs`:

```rust
pub async fn update_status_with_preview(
    pool: &PgPool,
    file_id: Uuid,
    status: &str,
    optimized_size: i64,
    content_hash: &str,
    preview_chunk_id: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE files SET status = $1, optimized_size = $2, content_hash = $3, preview_chunk_id = $4, updated_at = NOW() WHERE id = $5",
    )
    .bind(status)
    .bind(optimized_size)
    .bind(content_hash)
    .bind(preview_chunk_id)
    .bind(file_id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add crates/orchestrator/src/db/files.rs
git commit -m "feat: add update_status_with_preview to files DB layer"
```

---

### Task 2: Filter preview chunks from `find_by_file`

**Files:**
- Modify: `crates/orchestrator/src/db/chunks.rs:39-44`

- [ ] **Step 1: Update `find_by_file` to exclude preview chunks**

In `crates/orchestrator/src/db/chunks.rs`, change the `find_by_file` function:

```rust
pub async fn find_by_file(pool: &PgPool, file_id: Uuid) -> Result<Vec<ChunkRow>, sqlx::Error> {
    sqlx::query_as::<_, ChunkRow>(
        "SELECT * FROM chunks WHERE file_id = $1 AND chunk_index >= 0 ORDER BY chunk_index",
    )
    .bind(file_id)
    .fetch_all(pool)
    .await
}
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add crates/orchestrator/src/db/chunks.rs
git commit -m "fix: exclude preview chunks (index=-1) from find_by_file"
```

---

### Task 3: Integrate preview generation into media pipeline

This is the core task. Modifies `media_pipeline.rs` to generate, encrypt, store and track the preview chunk.

**Files:**
- Modify: `crates/orchestrator/src/services/media_pipeline.rs:44-49` (PipelineResult)
- Modify: `crates/orchestrator/src/services/media_pipeline.rs:89-257` (process_file_inner)

**Read first:**
- `crates/core-sdk/src/preview/mod.rs` — the `generate()` function signature and `PreviewOutput` struct
- `docs/superpowers/specs/2026-03-20-preview-integration-design.md` — the full spec

- [ ] **Step 1: Add `preview` to imports and update `PipelineResult`**

In `crates/orchestrator/src/services/media_pipeline.rs`, update the import at line 15:

```rust
use alexandria_core::{chunking, consistent_hashing::HashRing, crypto, hashing, preview};
```

Then update the PipelineResult struct:

```rust
/// Resultado do pipeline.
pub struct PipelineResult {
    pub file_id: Uuid,
    pub manifest_id: Uuid,
    pub chunks_count: usize,
    pub total_encrypted_size: i64,
    pub preview_chunk_id: Option<String>,
}
```

- [ ] **Step 2: Verify compilation fails (PipelineResult construction sites need updating)**

Run: `cargo check -p alexandria-orchestrator`
Expected: compilation errors at the two places that construct PipelineResult (dedup early return and normal return)

- [ ] **Step 3: Fix PipelineResult construction — add preview generation logic**

In `process_file_inner`, **after** the dedup check block (after line 142), **move** the existing `file_key` derivation (line 144) to before the preview block, then insert the preview generation code. The file_key is reused for both preview encryption and content chunk encryption.

Replace the existing line 144:
```rust
    // 3. Derive file key via envelope encryption (RN-MA2)
    let file_key = crypto::envelope::derive_file_key(master_key, &file_id);
```

With the file_key derivation followed by the preview block:

```rust
    // 3. Derive file key via envelope encryption (RN-MA2)
    // Used for both preview encryption and content chunk encryption.
    let file_key = crypto::envelope::derive_file_key(master_key, &file_id);

    // 3.5. Generate preview (after dedup, before chunking)
    // Only generates for supported types (foto in v1). Non-critical: failures log warning.
    let preview_chunk_id: Option<String> = match preview::generate(
        optimized_data,
        &file.media_type,
        &file.mime_type,
    ) {
        Ok(preview_output) => {
            match crypto::encrypt(file_key.as_bytes(), &preview_output.data) {
                Ok(encrypted_preview) => {
                    let p_chunk_id = hashing::sha256_hex(&encrypted_preview);
                    let p_size = encrypted_preview.len() as i64;

                    // Insert preview chunk in chunks table (chunk_index = -1 sentinel)
                    if let Err(e) = chunks::insert(pool, &p_chunk_id, file_id, -1, p_size).await {
                        tracing::warn!(file_id = %file_id, error = %e, "falha ao inserir preview chunk");
                        None
                    } else {
                        // Distribute to N nodes via ConsistentHashRing
                        let target_nodes = hash_ring.get_nodes(&p_chunk_id, replication_factor());
                        let mut distributed = false;
                        for node_id in &target_nodes {
                            if let Some(provider) = storage_providers.get(node_id) {
                                if let Err(e) = provider.put(&p_chunk_id, &encrypted_preview).await {
                                    tracing::warn!(node_id = %node_id, error = %e, "falha ao distribuir preview chunk");
                                    continue;
                                }
                                if let Err(e) = chunk_replicas::insert(pool, &p_chunk_id, *node_id).await {
                                    tracing::warn!(node_id = %node_id, error = %e, "falha ao registrar replica de preview");
                                    continue;
                                }
                                distributed = true;
                            }
                        }
                        if distributed {
                            tracing::info!(file_id = %file_id, preview_chunk_id = %p_chunk_id, "preview gerado e distribuido");
                            Some(p_chunk_id)
                        } else {
                            tracing::warn!(file_id = %file_id, "preview gerado mas nao distribuido — nenhum no disponivel");
                            None
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!(file_id = %file_id, error = %e, "falha ao criptografar preview");
                    None
                }
            }
        }
        Err(preview::PreviewError::UnsupportedFormat(_)) => {
            // Video/documento — esperado na v1, sem log
            None
        }
        Err(e) => {
            tracing::warn!(file_id = %file_id, error = %e, "falha ao gerar preview");
            None
        }
    };
```

- [ ] **Step 4: Replace `update_status` with `update_status_with_preview` in the normal path**

Change the file status update (around line 220) from:

```rust
    files::update_status(
        pool,
        file_id,
        "ready",
        optimized_data.len() as i64,
        &content_hash,
    )
    .await?;
```

To:

```rust
    files::update_status_with_preview(
        pool,
        file_id,
        "ready",
        optimized_data.len() as i64,
        &content_hash,
        preview_chunk_id.as_deref(),
    )
    .await?;
```

- [ ] **Step 5: Update PipelineResult at the normal return (end of function)**

Change the final Ok return to include `preview_chunk_id`:

```rust
    Ok(PipelineResult {
        file_id,
        manifest_id: manifest.id,
        chunks_count: chunk_outputs.len(),
        total_encrypted_size,
        preview_chunk_id,
    })
```

- [ ] **Step 6: Update PipelineResult at the dedup early return**

In the dedup `Duplicate` match arm (around line 129), update to:

```rust
            return Ok(PipelineResult {
                file_id,
                manifest_id: Uuid::nil(),
                chunks_count,
                total_encrypted_size: 0,
                preview_chunk_id: None, // link_duplicate handles this
            });
```

- [ ] **Step 7: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 8: Run existing tests**

Run: `cargo test -p alexandria-orchestrator`
Expected: all existing tests pass (no regressions)

- [ ] **Step 9: Commit**

```bash
git add crates/orchestrator/src/services/media_pipeline.rs
git commit -m "feat: integrate preview generation into media pipeline"
```

---

### Task 4: Copy `preview_chunk_id` in dedup `link_duplicate`

**Files:**
- Modify: `crates/orchestrator/src/services/dedup_service.rs:89-100`

- [ ] **Step 1: Update `link_duplicate` to use `update_status_with_preview`**

In `crates/orchestrator/src/services/dedup_service.rs`, change the status update inside `link_duplicate` from:

```rust
        let original_file = files::find_by_id(pool, original_file_id).await?;
        if let Some(orig) = original_file {
            files::update_status(
                pool,
                new_file_id,
                "ready",
                orig.optimized_size,
                &orig.content_hash,
            )
            .await?;
        }
```

To:

```rust
        let original_file = files::find_by_id(pool, original_file_id).await?;
        if let Some(orig) = original_file {
            files::update_status_with_preview(
                pool,
                new_file_id,
                "ready",
                orig.optimized_size,
                &orig.content_hash,
                orig.preview_chunk_id.as_deref(),
            )
            .await?;
        }
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 3: Run tests**

Run: `cargo test -p alexandria-orchestrator`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add crates/orchestrator/src/services/dedup_service.rs
git commit -m "feat: copy preview_chunk_id from original in link_duplicate"
```

---

### Task 5: Rewrite `get_preview` endpoint

**Files:**
- Modify: `crates/orchestrator/src/api/files.rs:325-342`

**Read first:** The `download_file` endpoint in the same file (lines 514-595) — it follows the exact same pattern we need: auth check → master_key → storage_providers → decrypt → serve.

- [ ] **Step 1: Rewrite the `get_preview` function**

Replace the existing `get_preview` function in `crates/orchestrator/src/api/files.rs`:

```rust
/// GET /api/v1/files/:id/preview — serve preview/thumbnail do arquivo.
/// Preview e um chunk criptografado armazenado no storage distribuido.
/// Requer autenticacao e membro do mesmo cluster.
pub async fn get_preview(
    Extension(claims): Extension<AuthClaims>,
    Path(file_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // 1. Buscar arquivo e verificar acesso
    let file = match file_service::get_file(&state.db, file_id).await {
        Ok(f) => f,
        Err(e) => return map_file_error(e).into_response(),
    };

    if file.cluster_id != claims.cluster_id {
        return StatusCode::FORBIDDEN.into_response();
    }

    // 2. Verificar se preview existe
    let preview_chunk_id = match &file.preview_chunk_id {
        Some(id) => id.clone(),
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    // 3. Obter master_key
    let master_key_guard = state.master_key.read().await;
    let master_key = match master_key_guard.as_ref() {
        Some(mk) => mk,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: "vault bloqueado — desbloqueie com a seed phrase".to_string(),
                }),
            )
                .into_response();
        }
    };

    // 4. Buscar replicas do preview chunk
    let replicas = match crate::db::chunk_replicas::find_by_chunk(&state.db, &preview_chunk_id).await {
        Ok(r) => r,
        Err(e) => {
            error!(file_id = %file_id, error = %e, "falha ao buscar replicas do preview");
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    if replicas.is_empty() {
        return StatusCode::NOT_FOUND.into_response();
    }

    // 5. Ler chunk de um no disponivel
    let storage_providers = state.storage_providers.read().await;
    let mut encrypted_preview = None;
    for replica in &replicas {
        if let Some(provider) = storage_providers.get(&replica.node_id) {
            match provider.get(&preview_chunk_id).await {
                Ok(data) => {
                    encrypted_preview = Some(data);
                    break;
                }
                Err(_) => continue,
            }
        }
    }

    let encrypted_data = match encrypted_preview {
        Some(data) => data,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: "preview indisponivel — todos os nos offline".to_string(),
                }),
            )
                .into_response();
        }
    };

    // 6. Decrypt preview
    let file_key = alexandria_core::crypto::envelope::derive_file_key(master_key, &file_id);
    match alexandria_core::crypto::decrypt(file_key.as_bytes(), &encrypted_data) {
        Ok(preview_bytes) => (
            StatusCode::OK,
            [
                (header::CONTENT_TYPE, "image/png".to_string()),
                (header::CACHE_CONTROL, "private, max-age=86400".to_string()),
            ],
            preview_bytes,
        )
            .into_response(),
        Err(e) => {
            error!(file_id = %file_id, error = %e, "falha ao decriptar preview");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 3: Run all tests**

Run: `cargo test -p alexandria-orchestrator`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add crates/orchestrator/src/api/files.rs
git commit -m "feat: rewrite get_preview to serve from distributed encrypted storage"
```

---

### Task 6: Update scheduler logging for preview

**Files:**
- Modify: `crates/orchestrator/src/scheduler/media_processing.rs:88-95`

- [ ] **Step 1: Add preview_chunk_id to the success log**

In `crates/orchestrator/src/scheduler/media_processing.rs`, update the success log:

```rust
        Ok(result) => {
            info!(
                file_id = %file_id,
                manifest_id = %result.manifest_id,
                chunks = result.chunks_count,
                encrypted_size = result.total_encrypted_size,
                preview = ?result.preview_chunk_id,
                "media pipeline concluido com sucesso"
            );
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check -p alexandria-orchestrator`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add crates/orchestrator/src/scheduler/media_processing.rs
git commit -m "feat: log preview_chunk_id in media processing scheduler"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run: `cargo test --workspace`
Expected: all tests pass across all crates

- [ ] **Step 2: Run clippy**

Run: `cargo clippy --workspace -- -D warnings`
Expected: no warnings or errors

- [ ] **Step 3: Final commit if any clippy fixes needed**

```bash
git add -A
git commit -m "fix: address clippy warnings from preview integration"
```
