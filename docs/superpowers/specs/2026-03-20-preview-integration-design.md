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

Novo passo **após** a deduplicação e **antes** do chunking:

```
optimize(bypass) → deduplicate → GERAR PREVIEW → chunk → encrypt → distribute → manifest → ready
```

Passos do novo bloco:

1. Chamar `alexandria_core::preview::generate(data, &file.media_type, &file.mime_type)`
2. Se `Ok(preview_output)`:
   a. Derivar `file_key = crypto::envelope::derive_file_key(master_key, &file_id)`
   b. Criptografar preview com `file_key` via `crypto::encrypt(file_key, &preview_output.data)`
   c. Calcular `preview_chunk_id = hashing::sha256_hex(&encrypted_preview)`
   d. Registrar chunk em `chunks` (file_id, chunk_index = -1, size) — ver justificativa abaixo
   e. Distribuir para N nós via ConsistentHashRing + StorageProvider
   f. Registrar réplicas em `chunk_replicas` (chunk_id = preview_chunk_id, node_id)
   g. Guardar `preview_chunk_id` em variável local para uso posterior
3. Se `Err(PreviewError::UnsupportedFormat(_))`: preview_chunk_id = None, continuar sem erro
4. Se `Err(outro_erro)`: log warning, preview_chunk_id = None, continuar sem erro (preview não é crítico)

**Armazenamento em `chunks` com `chunk_index = -1`:**

A tabela `chunk_replicas` possui FK `chunk_id → chunks(id) ON DELETE CASCADE`. Portanto, o preview chunk DEVE ter um registro em `chunks` para que suas réplicas possam ser rastreadas.

Usamos `chunk_index = -1` como sentinela para diferenciar preview chunks de chunks de conteúdo (0-based). Isto é seguro porque:
- `download_file` reconstrói arquivos a partir de `manifest.chunks_json`, não da tabela `chunks` — o -1 nunca é consultado para reconstrução
- Scrubbing itera `chunk_replicas` verificando hashes — funciona identicamente para preview chunks
- Auto-healing re-replica chunks consultando `chunk_replicas WHERE node_id = X` — preview chunks são incluídos automaticamente
- Drain migra chunks via `chunk_replicas` — preview chunks são migrados junto

O **único** componente que precisa de ajuste é o GC (ver seção abaixo).

### Proteção contra Garbage Collection

O GC identifica chunks órfãos via `manifest_chunks`. O preview chunk não faz parte do manifest, então precisa de proteção explícita:

- Atualizar a lógica de GC para **excluir chunks referenciados por `files.preview_chunk_id`** antes de deletar órfãos
- Query de GC obrigatória:

```sql
SELECT c.id FROM chunks c
WHERE NOT EXISTS (
    SELECT 1 FROM manifest_chunks mc WHERE mc.chunk_id = c.id
)
AND NOT EXISTS (
    SELECT 1 FROM files f WHERE f.preview_chunk_id = c.id
)
```

Esta abordagem é precisa e auto-documentada — protege exatamente os chunks que são referenciados como previews.

### Limpeza de preview ao deletar arquivo

Quando um arquivo é deletado da tabela `files`:
- `chunks.file_id` tem `REFERENCES files(id) ON DELETE CASCADE` — todos os chunks do arquivo (incluindo preview com `chunk_index = -1`) são deletados automaticamente
- `chunk_replicas.chunk_id` tem `REFERENCES chunks(id) ON DELETE CASCADE` — réplicas são removidas em cascata
- Bytes no StorageProvider: o GC normal é responsável por limpar bytes de chunks que não existem mais em `chunk_replicas` (reconciliação storage vs DB)

**A limpeza acontece via CASCADE direto, não via GC.** O preview chunk segue exatamente o mesmo ciclo de vida dos chunks de conteúdo.

### Tratamento de deduplicação

Quando o pipeline detecta um arquivo duplicado (mesmo `content_hash`), ele retorna cedo via `link_duplicate`. Neste caso:

- O `link_duplicate` deve **copiar o `preview_chunk_id` do arquivo original** para o arquivo duplicado
- Como o conteúdo é idêntico, o mesmo preview se aplica
- Não é necessário gerar ou armazenar um novo preview
- Implementação: `link_duplicate` deve chamar `update_status_with_preview(pool, new_file_id, "ready", orig.optimized_size, &orig.content_hash, orig.preview_chunk_id.as_deref())` em vez do atual `update_status`

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

O `process_file_inner` passa a chamar `update_status_with_preview` em vez de `update_status`. Esta função é chamada apenas no path não-dedup. O path de dedup usa `link_duplicate` que já cuida do `preview_chunk_id`.

### Endpoint reescrito (`GET /api/v1/files/:id/preview`)

Fluxo atual (quebrado):
```
read /data/previews/{id}.webp → serve
```

Fluxo novo:
1. Extrair `AuthClaims` e verificar que o membro pertence ao mesmo cluster do arquivo (mesma lógica de `download_file`)
2. Buscar arquivo no DB via `files::find_by_id(pool, file_id)`
3. Verificar `file.cluster_id == claims.cluster_id` → senão 403
4. Se `preview_chunk_id` é `None` → retornar 404
5. Buscar réplicas do preview chunk via `chunk_replicas::find_by_chunk(pool, preview_chunk_id)`
6. Ler chunk de um nó disponível via StorageProvider (tentar próximo se falhar)
7. Derivar `file_key = crypto::envelope::derive_file_key(master_key, &file_id)`
8. Decriptar: `crypto::decrypt(file_key, &encrypted_preview)`
9. Retornar bytes com `Content-Type: image/png` (v1, hardcoded — ver nota abaixo) e `Cache-Control: private, max-age=86400`

**Assinatura atualizada:**

```rust
pub async fn get_preview(
    Path(file_id): Path<Uuid>,
    Extension(claims): Extension<AuthClaims>,
    State(state): State<AppState>,
) -> impl IntoResponse
```

**Nota sobre Content-Type:** Na v1, previews são sempre PNG (gerados pelo módulo `preview::generate()`). Quando WebP for implementado (v2), será necessário persistir o mime_type do preview. Opções futuras: campo `preview_mime_type` na tabela `files`, ou entrada em `metadata` JSONB. Para v1, `image/png` hardcoded é aceitável.

**Nota sobre Cache-Control:** Usa `private` em vez de `public` para que apenas o browser do usuário faça cache, não proxies intermediários. Alinhado com o princípio Zero-Knowledge — minimizar janelas de exposição de dados decriptados.

### Atualização do `PipelineResult`

Adicionar campo para rastreabilidade:

```rust
pub struct PipelineResult {
    pub file_id: Uuid,
    pub manifest_id: Uuid,
    pub chunks_count: usize,
    pub total_encrypted_size: i64,
    pub preview_chunk_id: Option<String>, // novo
}
```

### O que NÃO muda

| Componente | Razão |
|-----------|-------|
| `preview::generate()` no core-sdk | Já implementado e testado (9 testes) |
| Schema do banco (`files.preview_chunk_id`) | Campo já existe na migration 004 |
| Domain model (`FileRow.preview_chunk_id`) | Campo já existe |
| Tabela `chunks` (schema) | Sem migration — usa chunk_index = -1 como sentinela; `find_by_file` precisa de `WHERE chunk_index >= 0` |
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
| Membro de outro cluster tenta acessar | 403 Forbidden |

### Testes

1. **Unit test (core-sdk):** Já existem 9 testes em `preview/mod.rs` — sem mudança
2. **Integration test (pipeline):** Novo teste que verifica:
   - Após `process_file`, arquivo com media_type="foto" tem `preview_chunk_id` não-nulo
   - Chunk de preview existe em `chunks` com `chunk_index = -1`
   - Réplicas de preview existem em `chunk_replicas`
3. **Integration test (pipeline):** Arquivo com media_type="video" tem `preview_chunk_id = None`
4. **Integration test (dedup):** Arquivo duplicado herda `preview_chunk_id` do original
5. **Integration test (endpoint):** `GET /files/:id/preview` retorna bytes decriptados para foto com preview
6. **Integration test (endpoint):** `GET /files/:id/preview` retorna 404 para arquivo sem preview
7. **Integration test (endpoint):** `GET /files/:id/preview` retorna 403 para membro de outro cluster

### Performance

| Operação | Estimativa |
|----------|-----------|
| Gerar thumbnail (foto 5MB → 200px PNG) | ~50-100ms |
| Criptografar preview (~5-50KB) | < 1ms |
| Distribuir 1 chunk pequeno (N nós) | ~50-100ms |
| **Overhead total no pipeline** | **~100-200ms por foto** |
| Servir preview (read + decrypt) | ~50-100ms |

**Nota:** Na v1, previews são PNG (~10-30KB para 200x150px). O blueprint menciona ~50KB assumindo WebP. PNG é suficiente para v1; WebP será adotado em v2 quando a feature `webp` do crate `image` for habilitada.

### Limitações conhecidas (v1)

- Previews apenas para fotos — vídeo e documento retornam 404
- Formato PNG (não WebP) — suficiente mas não ótimo em tamanho
- Content-Type hardcoded `image/png` — será dinâmico em v2
- `chunk_index = -1` como sentinela — funciona mas estende a semântica original do campo (0-based positional). Aceitável porque nenhum consumidor existente itera `chunks` por index diretamente
- Tipo `INTEGER` no schema de `chunks.size` vs `i64` no Rust — discrepância pré-existente, não introduzida por esta spec

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `crates/orchestrator/src/services/media_pipeline.rs` | Adicionar passo de preview, atualizar PipelineResult |
| `crates/orchestrator/src/db/files.rs` | Nova função `update_status_with_preview` |
| `crates/orchestrator/src/api/files.rs` | Reescrever `get_preview` com auth + storage distribuído |
| `crates/orchestrator/src/services/dedup_service.rs` | `link_duplicate` usa `update_status_with_preview` para copiar `preview_chunk_id` do original |
| `crates/orchestrator/src/db/chunks.rs` | `find_by_file` adiciona `WHERE chunk_index >= 0` para excluir preview chunks |
| GC logic (quando implementado) | Query exclui chunks referenciados por `files.preview_chunk_id` |
