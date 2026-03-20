# Preview Integration no Media Pipeline

**Data:** 2026-03-20
**Status:** Aprovado
**Decisão:** Preview como chunk criptografado, inline no pipeline (Abordagem A)

---

## Contexto

O blueprint (07-critical_flows.md, passo 8) define que previews devem ser gerados durante o pipeline de mídia:

- Foto → thumbnail ~50KB
- Vídeo → 480p ~5MB (v2, FFmpeg)
- PDF → imagem da primeira página (v2, pdf-render)
- Documento genérico → ícone por extensão (v2)

O módulo `alexandria_core::preview::generate()` existe e funciona para fotos, mas **nunca é chamado** pelo pipeline. O campo `preview_chunk_id` na tabela `files` nunca é populado. O endpoint `GET /files/:id/preview` lê de um path hardcoded (`/data/previews/{id}.webp`) que ninguém escreve.

## Decisão

Preview gerado **inline no `process_file`**, armazenado como chunk criptografado no storage distribuído, seguindo o mesmo modelo LOCKSS do conteúdo principal.

### Alternativas descartadas

- **Preview em filesystem local** — rápido mas não replica, não sobrevive a recovery, viola Zero-Knowledge
- **Preview como job separado** — janela onde arquivo `ready` não tem preview, complexidade operacional extra

## Design

### Fluxo no pipeline (`media_pipeline::process_file_inner`)

Novo passo entre optimize (passo 1) e deduplicação (passo 2):

```
optimize(bypass) → GERAR PREVIEW → deduplicate → chunk → encrypt → distribute → manifest → ready
```

Passos do novo bloco:

1. Chamar `alexandria_core::preview::generate(data, &file.media_type, &file.mime_type)`
2. Se `Ok(preview_output)`:
   a. Criptografar preview com `file_key` via `crypto::encrypt(file_key, &preview_output.data)`
   b. Calcular `preview_chunk_id = hashing::sha256_hex(&encrypted_preview)`
   c. Registrar chunk em `chunks` (file_id, chunk_index = -1, size)
   d. Distribuir para N nós via ConsistentHashRing + StorageProvider
   e. Registrar réplicas em `chunk_replicas`
3. Se `Err(PreviewError::UnsupportedFormat(_))`: preview_chunk_id = None, continuar sem erro
4. Se `Err(outro_erro)`: log warning, preview_chunk_id = None, continuar sem erro (preview não é crítico)

**Justificativa chunk_index = -1:** Diferencia o chunk de preview dos chunks de conteúdo (que usam 0-based). Permite identificar previews em queries sem campo adicional.

### Mudança no DB layer (`db/files.rs`)

Nova função que substitui `update_status` no fluxo do pipeline:

```rust
pub async fn update_status_with_preview(
    pool: &PgPool,
    file_id: Uuid,
    status: &str,
    optimized_size: i64,
    content_hash: &str,
    preview_chunk_id: Option<&str>,
) -> Result<bool, sqlx::Error>
```

SQL: `UPDATE files SET status=$1, optimized_size=$2, content_hash=$3, preview_chunk_id=$4, updated_at=NOW() WHERE id=$5`

O `process_file_inner` passa a chamar `update_status_with_preview` em vez de `update_status`.

### Endpoint reescrito (`GET /api/v1/files/:id/preview`)

Fluxo atual (quebrado):
```
read /data/previews/{id}.webp → serve
```

Fluxo novo:
1. Buscar arquivo no DB via `files::find_by_id(pool, file_id)`
2. Se `preview_chunk_id` é `None` → retornar 404
3. Buscar réplicas do preview chunk via `chunk_replicas::find_by_chunk(pool, preview_chunk_id)`
4. Ler chunk de um nó disponível via StorageProvider (tentar próximo se falhar)
5. Derivar `file_key = crypto::envelope::derive_file_key(master_key, &file_id)`
6. Decriptar: `crypto::decrypt(file_key, &encrypted_preview)`
7. Retornar bytes com `Content-Type: image/png` e headers de cache (`Cache-Control: public, max-age=86400`)

**Assinatura atualizada** — precisa de `State(state)` para acessar `master_key`, `storage_providers` e `db`:

```rust
pub async fn get_preview(
    Path(file_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse
```

### O que NÃO muda

| Componente | Razão |
|-----------|-------|
| `preview::generate()` no core-sdk | Já implementado e testado (9 testes) |
| Schema do banco (`files.preview_chunk_id`) | Campo já existe na migration 004 |
| Domain model (`FileRow.preview_chunk_id`) | Campo já existe |
| Preview de vídeo/documento | Continuam `UnsupportedFormat` (v2) |
| Endpoint `/files/:id/placeholder` | Já retorna `preview_chunk_id` corretamente |

### Tratamento de erros

| Cenário | Comportamento |
|---------|--------------|
| Preview não suportado (vídeo, doc) | `preview_chunk_id = None`, pipeline continua normalmente |
| Erro na geração de preview (imagem corrompida) | Log warning, `preview_chunk_id = None`, pipeline continua |
| Falha ao distribuir chunk de preview | Pipeline falha (mesmo tratamento que falha em chunk de conteúdo) |
| Preview chunk não encontrado no GET | 404 Not Found |
| Todas réplicas offline no GET | 503 Service Unavailable |
| Master key não disponível no GET | 503 Service Unavailable |

### Testes

1. **Unit test (core-sdk):** Já existem 9 testes em `preview/mod.rs` — sem mudança
2. **Integration test (pipeline):** Novo teste que verifica:
   - Após `process_file`, arquivo com media_type="foto" tem `preview_chunk_id` não-nulo
   - Chunk de preview existe em `chunks` com `chunk_index = -1`
   - Réplicas de preview existem em `chunk_replicas`
3. **Integration test (pipeline):** Arquivo com media_type="video" tem `preview_chunk_id = None`
4. **Integration test (endpoint):** `GET /files/:id/preview` retorna bytes decriptados para foto com preview
5. **Integration test (endpoint):** `GET /files/:id/preview` retorna 404 para arquivo sem preview

### Performance

| Operação | Estimativa |
|----------|-----------|
| Gerar thumbnail (foto 5MB → 200px PNG) | ~50-100ms |
| Criptografar preview (~5-50KB) | < 1ms |
| Distribuir 1 chunk pequeno (N nós) | ~50-100ms |
| **Overhead total no pipeline** | **~100-200ms por foto** |
| Servir preview (read + decrypt) | ~50-100ms |

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `crates/orchestrator/src/services/media_pipeline.rs` | Adicionar passo de preview no `process_file_inner` |
| `crates/orchestrator/src/db/files.rs` | Nova função `update_status_with_preview` |
| `crates/orchestrator/src/api/files.rs` | Reescrever `get_preview` para usar storage distribuído |
