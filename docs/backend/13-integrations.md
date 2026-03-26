# Integracoes Externas

Define os clients de APIs externas — metodos, timeout, retry, circuit breaker e fallback para cada integracao.

<!-- do blueprint: 06-system-architecture.md, 10-architecture_decisions.md -->

---

## Catalogo de Integracoes

> Quais servicos externos o backend consome?

| Servico                               | Funcao                                  | Protocolo             | Criticidade | SLA    |
| ------------------------------------- | --------------------------------------- | --------------------- | ----------- | ------ |
| AWS S3 / Cloudflare R2 / Backblaze B2 | Armazenamento de chunks (S3-compatible) | HTTPS (aws-sdk-s3 v3) | Critica     | 99.99% |
| Resend                                | Email transacional                      | REST API (SDK TS)     | Media       | 99.9%  |
| FFmpeg                                | Transcodificacao de video               | CLI (child_process)   | Alta        | Local  |
| libvips (sharp)                       | Processamento de imagens                | Native binding        | Alta        | Local  |

---

## Detalhamento por Integracao

> Para CADA servico externo, documente o client, metodos, resiliencia e configuracao.

### StorageProviderClient (S3/R2/B2)

**Funcao:** Armazenamento distribuido de chunks encriptados em provedores S3-compatible. Cada node de um membro pode usar um provedor diferente.

**Client Class:** `StorageProviderClient`

**Metodos:**

| Metodo                              | Descricao                                   | Timeout | Retry           |
| ----------------------------------- | ------------------------------------------- | ------- | --------------- |
| putChunk(nodeConfig, chunkId, data) | Armazena chunk encriptado no bucket do node | 30s     | 3x, backoff 2^n |
| getChunk(nodeConfig, chunkId)       | Recupera chunk encriptado do bucket         | 30s     | 3x, backoff 2^n |
| existsChunk(nodeConfig, chunkId)    | Verifica se chunk existe no bucket          | 10s     | 3x, backoff 2^n |
| deleteChunk(nodeConfig, chunkId)    | Remove chunk do bucket                      | 10s     | 3x, backoff 2^n |
| listChunks(nodeConfig, prefix?)     | Lista chunks no bucket com filtro opcional  | 10s     | 3x, backoff 2^n |
| getCapacity(nodeConfig)             | Consulta espaco usado/disponivel no bucket  | 5s      | 2x, backoff 2^n |

**Circuit Breaker:**

| Parametro     | Valor                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Threshold     | 5 falhas em 60s                                                              |
| Estado aberto | 30s                                                                          |
| Half-open     | 1 request de teste                                                           |
| Fallback      | Se um node falha, tentar proxima replica; re-enfileirar para retry posterior |

**Configuracao:**

| Variavel    | Descricao                                                   |
| ----------- | ----------------------------------------------------------- |
| Credenciais | Armazenadas no vault do membro (encriptadas com master key) |
| Endpoint    | Configurado por node (endpoint, region, bucket)             |

> Nota: nao ha env var global — cada node tem suas proprias credenciais e configuracao de provedor, desencriptadas em runtime a partir do vault do membro.

---

### ResendClient

**Funcao:** Envio de emails transacionais (convites de membro, alertas de node perdido, notificacoes de erro de arquivo).

**Client Class:** `ResendClient`

**Metodos:**

| Metodo                             | Descricao                  | Timeout | Retry          |
| ---------------------------------- | -------------------------- | ------- | -------------- |
| sendEmail(to, subject, html, text) | Envia email via Resend API | 10s     | 3x, linear 30s |

**Circuit Breaker:**

| Parametro     | Valor                                                           |
| ------------- | --------------------------------------------------------------- |
| Threshold     | 10 falhas em 5min                                               |
| Estado aberto | 60s                                                             |
| Half-open     | 1 request de teste                                              |
| Fallback      | Enfileirar em email.send.dlq; admin notificado via AlertCreated |

**Configuracao:**

| Variavel          | Descricao                                          |
| ----------------- | -------------------------------------------------- |
| RESEND_API_KEY    | API key do ambiente (env var)                      |
| RESEND_FROM_EMAIL | Endereco remetente (ex: noreply@alexandria.family) |

---

### FFmpegClient

**Funcao:** Transcodificacao de video para H.265/AV1, extracao de metadata e geracao de preview 480p.

**Client Class:** `FFmpegClient`

**Metodos:**

| Metodo                                          | Descricao                                            | Timeout      | Retry                                                        |
| ----------------------------------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| transcode(inputPath, outputPath, options)       | Transcodifica video para 1080p H.265/AV1             | 600s (10min) | 3x com mesmo input; se codec nao suportado, falha permanente |
| extractMetadata(inputPath)                      | Extrai metadata (duracao, resolucao, codec, bitrate) | 30s          | 2x imediato                                                  |
| generatePreview(inputPath, outputPath, options) | Gera preview 480p para streaming rapido              | 120s         | 3x, backoff 2^n                                              |

**Circuit Breaker:** Nao aplicavel (processo local).

**Configuracao:**

| Variavel    | Descricao                                            |
| ----------- | ---------------------------------------------------- |
| FFMPEG_PATH | Caminho do binario FFmpeg (default: /usr/bin/ffmpeg) |

---

### SharpClient (libvips)

**Funcao:** Redimensionamento de imagens para WebP, geracao de thumbnails e extracao de EXIF.

**Client Class:** `SharpClient`

**Metodos:**

| Metodo                                | Descricao                                                | Timeout | Retry       |
| ------------------------------------- | -------------------------------------------------------- | ------- | ----------- |
| resize(inputBuffer, maxWidth, format) | Redimensiona imagem para max 1920px e converte para WebP | 30s     | 2x imediato |
| generateThumbnail(inputBuffer, size)  | Gera thumbnail quadrado (ex: 200x200)                    | 30s     | 2x imediato |
| generatePdfPreview(inputBuffer, width) | Gera PNG renderizado da primeira pagina via SVG→PNG      | 30s     | 2x imediato |
| extractExif(inputBuffer)              | Extrai dados EXIF (camera, GPS, data, orientacao)        | 10s     | 1x imediato |

**Circuit Breaker:** Nao aplicavel (binding nativo).

**Configuracao:** Nenhuma — sharp usa libvips embeddada via npm.

---

## pdfjs-dist + canvas (PDF Preview)

**Proposito:** Renderizar primeira pagina de PDFs como imagem PNG (preview estilo Google Drive) e extrair contagem de paginas. Sem dependencia de poppler/pdfium.

**Modulo:** `src/workers/pdf-renderer.ts` — wrapper sobre `pdfjs-dist` (Mozilla PDF.js) e `canvas` (node-canvas).

**Metodos:**

| Metodo                              | Descricao                                                     | Timeout | Retry       |
| ----------------------------------- | ------------------------------------------------------------- | ------- | ----------- |
| renderPdfPage(buffer, targetWidth)  | Renderiza pagina 1 do PDF em PNG com largura alvo (300px)     | 30s     | 2x imediato |
| getPdfPageCount(buffer)             | Retorna numero total de paginas                                | 10s     | 1x imediato |

**Circuit Breaker:** Nao aplicavel (processamento local, sem I/O externo).

**Configuracao:** `pdfjs-dist/legacy/build/pdf.mjs` (build CJS-compatible). `canvas` (node-canvas) requer binarios nativos de Cairo — instalados automaticamente via prebuild.

---

## Webhooks

Alexandria e um sistema self-hosted. Nao recebe nem envia webhooks para servicos externos. Toda comunicacao entre componentes internos e feita via BullMQ (filas) e Redis pub/sub (notificacoes real-time).

---

## Health Checks de Integracoes

> Como verificar se as integracoes estao funcionando?

| Servico          | Endpoint de Health      | Frequencia | Acao se Falhar                      |
| ---------------- | ----------------------- | ---------- | ----------------------------------- |
| PostgreSQL       | SELECT 1                | 10s        | Alerta P1, bloquear readiness probe |
| Redis            | PING                    | 10s        | Alerta P1, bloquear readiness probe |
| S3/R2 (por node) | HEAD em objeto de teste | 60s        | Alerta P2, marcar node como suspect |
| Resend           | GET /health (SDK)       | 300s       | Alerta P3, enfileirar emails na DLQ |

> (ver [14-tests.md](14-tests.md) para estrategia de testes)

---

<!-- added: opensource -->

## Integration Development Guide

- **Adding new integrations**: implement the relevant interface (`StorageProvider`, `EmailClient`, etc.) in `src/infrastructure/`; register in the module providers; add env var configuration; write contract tests
- **Plugin system**: community integrations that don't belong in core can be published as separate npm packages (`@alexandria/storage-gdrive`, `@alexandria/storage-mega`, etc.); they import `@alexandria/core-sdk` and implement the `StorageProvider` interface
- **Testing integrations**: use mock adapters (`MockStorageProvider`) for unit tests; use `testcontainers` or sandbox environments for integration tests — never hit real external services in CI
- **Registry**: community plugins listed in `docs/ecosystem.md`; submit a PR to add your integration to the official list
