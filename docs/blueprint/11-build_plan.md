# Plano de Construção

> Como o sistema será construído incrementalmente? Defina fases, entregas e dependências.

---

## Fases / Milestones

---

### Fase 0: Fundação

**Objetivo:** Construir a infraestrutura criptográfica e o core SDK que sustentam todo o sistema. Validar que chunking, criptografia, hashing e consistent hashing funcionam corretamente em isolamento.

**Entregas:**

- Core SDK (crate Rust): chunking engine (~4MB), SHA-256 hashing, AES-256-GCM encryption/decryption
- Envelope encryption: BIP-39 seed → master key → file keys → chunk keys
- Consistent hashing ring com virtual nodes
- StorageProvider trait + implementação local (filesystem)
- StorageProvider implementação S3 (aws-sdk-s3) para S3/R2/B2
- Manifest structure: criação, serialização, validação de assinatura
- Vault: criação por membro, criptografia/descriptografia, serialização, gerenciamento de senhas
- Modelo de dados PostgreSQL 18: migrações iniciais (sqlx-cli)
- Setup do workspace Rust (cargo workspaces: core-sdk, orchestrator, node-agent)
- CI: GitHub Actions com cargo test + clippy + fmt

**Dependências:**

- Nenhuma (fase inicial)

**Critérios de Aceite:**

- Arquivo de teste passa pelo pipeline completo: chunk → encrypt → distribute (local) → reassemble → decrypt → verify hash
- Seed phrase gera master key deterministicamente (mesma seed = mesma key)
- Vault criptografa/descriptografa com senha do membro corretamente
- Consistent hashing distribui chunks proporcionalmente à capacidade dos nós de teste
- Migrações PostgreSQL aplicam sem erro; schema completo criado
- Todos os testes passando no CI

**Estimativa:** L (3-6 semanas)

---

### Fase 1: MVP

**Objetivo:** Fluxo principal funcionando end-to-end: upload → otimizar → criptografar → distribuir → replicar → visualizar → recuperar. Família do dev usando o sistema real.

**Entregas:**

- Orquestrador (Rust + Axum 0.8): API REST completa para clientes e agentes
- Pipeline de mídia: fotos → WebP 1920px (libvips); vídeos → 1080p H.265 (FFmpeg)
- Preview generation: thumbnail ~50KB (fotos), 480p ~5MB (vídeos)
- Replicação 3x com monitoramento contínuo
- Auto-healing: re-replicação quando nó é perdido
- Heartbeat monitoring de nós com detecção offline (suspect/lost)
- Scrubbing periódico (verificação de integridade SHA-256)
- Garbage collection de chunks órfãos
- Scheduler interno (tokio::time) para tarefas periódicas
- Agente de nó (binário Rust): armazenamento local + heartbeat + scrubbing
- Placeholder files com download sob demanda
- Seed phrase recovery: rebuild do orquestrador em nova VPS
- Web client básico (Next.js 16): upload, galeria com thumbnails, download
- Alertas de saúde: nó offline, replicação baixa, integridade
- Docker Compose para deploy (orquestrador + PostgreSQL 18 + Redis 7 + web client + Caddy)
- Cluster creation + member invitation + permission management

**Dependências:**

- Fase 0 concluída (Core SDK funcional e testado)
- VPS provisionada (Contabo)
- Domínio DNS configurado
- Pelo menos 1 bucket S3 ou R2 criado

**Critérios de Aceite:**

- Membro faz upload de foto → aparece na galeria com thumbnail em <30s
- Membro faz upload de vídeo → transcodificado e disponível em <5min
- Recovery testado: seed → nova VPS → sistema operacional em <2h
- Replicação: >99% chunks com 3+ réplicas após 24h de uso
- Auto-healing: nó removido → chunks re-replicados em <2h
- Zero perda de dados em 1 mês de uso pela família
- Scrubbing detecta e repara chunk corrompido artificialmente
- Família do dev (3-5 pessoas) usando por 1 mês sem perda de dados

**Estimativa:** XL (6+ semanas)

---

### Fase 2: Evolução

**Objetivo:** Features complementares, qualidade de vida e expansão para mais provedores cloud e clientes.

**Entregas:**

- Deduplicação global entre arquivos (content-addressable chunks)
- Integração OAuth: Google Drive, Dropbox, OneDrive como nós
- Rebalanceamento automático quando nós entram/saem
- Versionamento de arquivos com deduplicação chunk-level
- Busca por nome, data, tipo e metadata EXIF
- Timeline de fotos/vídeos com navegação cronológica
- Dashboard de saúde do cluster (capacidade, replicação, nós)
- Desktop client (Tauri) para macOS/Windows/Linux
- Family Storage Protocol (FSP) v1 documentado
- Quotas de armazenamento por usuário
- Tiered storage (hot/warm/cold)
- Observabilidade: Grafana + Prometheus + tracing

**Dependências:**

- Fase 1 estável por 1+ mês
- APIs OAuth aprovadas por Google, Dropbox, Microsoft

**Critérios de Aceite:**

- Beta com 2-3 famílias estável por 1 mês
- Deduplicação reduz >30% do storage em acervo real
- OAuth: conectar Google Drive como nó em <5 cliques
- Desktop client funcional em macOS e Windows

**Estimativa:** XL (6+ semanas)

---

### Fase 3: Escala

**Objetivo:** Otimização avançada, inteligência e resiliência para GA (General Availability).

**Entregas:**

- Erasure coding (10+4 shards) como alternativa a replicação 3x
- Mobile client (React Native) para iOS e Android
- Indexação inteligente: EXIF automático, reconhecimento facial, OCR
- Disaster drills automáticos (recovery periódico de teste)
- Proteção contra ransomware (detecção de alterações massivas)
- Migração de formatos (workers de conversão para codecs futuros)
- Auto-update de clientes e agentes de nó
- Cold storage optimization
- Documentação completa para self-hosting

**Dependências:**

- Fase 2 estável
- Apple Developer Account (para iOS)
- Google Play Developer Account (para Android)

**Critérios de Aceite:**

- GA: documentação completa, zero bugs críticos por 1 mês
- Erasure coding: arquivo reconstruível com perda de até 4 shards
- Mobile: upload automático funcional em iOS e Android
- Disaster drill: recovery automático bem-sucedido

**Estimativa:** XL (6+ semanas)

---

## Priorização

| Fase | Prioridade | Justificativa |
|------|-----------|---------------|
| Fase 0: Fundação | Crítica | Reduz risco técnico máximo: valida que criptografia, chunking e hashing funcionam antes de construir o resto |
| Fase 1: MVP | Crítica | Entrega valor real: família usando o sistema; valida hipóteses (Full HD suficiente, recovery funciona) |
| Fase 2: Evolução | Alta | Expande para mais famílias e provedores; deduplicação e OAuth aumentam valor significativamente |
| Fase 3: Escala | Média | Otimização e features avançadas; necessário para GA mas não para validação |

---

## Riscos Técnicos

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Recovery via seed falha em cenário real | Alto | Média | Disaster drills mensais desde Fase 1; testes automatizados de recovery; vaults dos membros replicados em 3+ nós |
| Consistent hashing distribui chunks de forma desigual com poucos nós (<5) | Médio | Média | Virtual nodes com fator alto; rebalanceamento periódico; monitoramento de distribuição |
| FFmpeg falha em formatos de vídeo inesperados | Médio | Alta | Whitelist de formatos suportados; fallback para codec genérico; arquivo marcado como error com retry |
| Performance de criptografia AES-256-GCM insuficiente | Alto | Baixa | Benchmark na Fase 0; usar hardware AES-NI (presente em CPUs modernas); paralelizar chunks |
| Provedor cloud muda API S3 ou elimina free tier | Alto | Baixa | StorageProvider abstrai provedor; dados em 3+ provedores; migração transparente |
| Perda de seed phrase pelo usuário | Alto | Alta | Instruções claras; alerta persistente na UI; recovery guardians na Fase 3 (RF-005) |
| Complexidade do envelope encryption causa bugs de criptografia | Alto | Média | Testes extensivos na Fase 0; usar crates auditados (ring, aes-gcm); nunca implementar crypto próprio |
| Transcodificação de vídeo sobrecarrega VPS | Médio | Alta | Fila com rate limiting; processamento sequencial (não paralelo) de vídeos grandes; worker dedicado |
| Conflito de chunks durante upload concorrente de mesmo arquivo | Médio | Baixa | Deduplicação por hash (content-addressable); constraint unique no banco; idempotência |

---

## Dependências Externas

| Dependência | Tipo | Responsável | Status | Impacto se Atrasar |
|-------------|------|-------------|--------|---------------------|
| VPS Contabo | Infra | Douglas Prado | Pendente | Bloqueia deploy de Fase 1 |
| Domínio DNS | Infra | Douglas Prado | Pendente | Bloqueia discovery de nós e TLS |
| Bucket AWS S3 ou Cloudflare R2 | Serviço | Douglas Prado | Pendente | Bloqueia storage cloud na Fase 1 |
| FFmpeg 7+ | Biblioteca | Open source | Disponível | Bloqueia pipeline de vídeo |
| libvips | Biblioteca | Open source | Disponível | Bloqueia pipeline de fotos |
| BIP-39 wordlist | Padrão | Open source | Disponível | Bloqueia geração de seed |
| APIs OAuth (Google, Dropbox, Microsoft) | API | Google/Dropbox/Microsoft | Pendente | Bloqueia integração cloud na Fase 2 |
| Apple Developer Account | Serviço | Douglas Prado | Pendente | Bloqueia mobile iOS na Fase 3 |
| Google Play Developer Account | Serviço | Douglas Prado | Pendente | Bloqueia mobile Android na Fase 3 |
