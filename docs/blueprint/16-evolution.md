# Evolução

> Software é um organismo vivo. Planeje como ele vai evoluir.

---

## Roadmap Técnico

> Melhorias técnicas planejadas além do MVP, alinhadas às fases do PRD.

| Item | Prioridade | Justificativa | Fase estimada |
|------|------------|---------------|---------------|
| Deduplicação global entre membros | Alta | Famílias compartilham 20-60% de fotos duplicadas (WhatsApp); economia significativa de storage | Fase 2 |
| Integração OAuth (Google Drive, Dropbox, OneDrive) | Alta | Expande storage gratuito de ~100GB/pessoa (S3/R2) para ~200GB+ combinando provedores | Fase 2 |
| Desktop client (Tauri) | Alta | Sync engine nativo para auto-upload; liberação de espaço automática; agente de nó integrado | Fase 2 |
| Family Storage Protocol (FSP) v1 | Média | Protocolo versionado permite evolução sem breaking changes; qualquer cliente pode implementar | Fase 2 |
| Erasure coding (10+4 shards) | Média | Economia de ~40% vs replicação 3x para mesma durabilidade; viabiliza escala de storage | Fase 3 |
| Mobile client (React Native) | Média | Upload automático do rolo da câmera; placeholder files; liberação de espaço no celular | Fase 3 |
| Indexação inteligente (EXIF, faces, OCR) | Baixa | Busca por pessoa, local e texto em documentos; valor alto mas complexidade também | Fase 3 |
| Migração de formatos (workers de conversão) | Baixa | Codecs evoluem em décadas; workers convertem WebP→futuro formato automaticamente | Fase 3 |
| Content-defined chunking (Rabin fingerprint) | Baixa | Melhora deduplicação entre versões de arquivos; mais complexo que fixed-size | Fase 2-3 |

---

## Débitos Técnicos

> Trade-offs aceitos nas decisões da v1 que geram débito a ser pago.

| Débito | Impacto | Esforço para resolver | Prioridade |
|--------|---------|----------------------|------------|
| Sem recovery guardians (multi-seed) — perda da seed = perda total | Alto — risco de perda irreversível se admin perder seed | M (2-3 semanas) | Alta |
| Chunking fixo (~4MB) em vez de content-defined | Médio — deduplicação entre versões de arquivos é subótima | L (3-6 semanas) | Média |
| Sem mutual TLS entre nós (RF-051 é Should) | Médio — nó não-autorizado poderia se conectar se tiver endpoint | M (2-3 semanas) | Média |
| Sem assinatura criptográfica de manifests (RF-052 é Should) | Médio — manifest adulterado não seria detectado sem scrubbing | S (1 semana) | Média |
| Media workers inline no orquestrador (mesmo processo) | Médio — transcodificação de vídeo pesada compete com API | M (separar em processo dedicado) | Média |
| Sem rate limiting por provedor cloud (apenas backoff reativo) | Baixo — rate limits do S3/R2 são altos; risco baixo em volume familiar | S (1 semana) | Baixa |
| Web client sem offline support | Baixo — galeria não funciona sem internet; placeholders são locais mas UI não | M (Service Worker + cache) | Baixa |
| Sem versionamento de API (endpoints não versionados) | Baixo — v1 não tem clientes terceiros; risco cresce com FSP na fase 2 | S (adicionar /v1/ prefix) | Baixa |
| PostgreSQL single-instance (sem read replicas) | Baixo — volume familiar não justifica; gargalo não atingido | M (se volume crescer) | Baixa |

### Processo de Gestão de Débitos

- **Registro:** Débitos são registrados nesta seção e como issues no GitHub com label `tech-debt`
- **Revisão:** A cada transição de fase (Fase 0→1, 1→2, 2→3), revisar lista e priorizar
- **Priorização:** Impacto na durabilidade de dados > impacto em usabilidade > impacto em performance

---

## Estratégia de Versionamento

### Versionamento Semântico (SemVer)

O projeto segue o padrão **MAJOR.MINOR.PATCH**:

- **MAJOR** — mudanças incompatíveis: formato de manifest, protocolo de comunicação entre nós, schema dos vaults
- **MINOR** — novas funcionalidades: novo StorageProvider, novo tipo de alerta, novo endpoint de API
- **PATCH** — correções de bugs e melhorias de performance sem breaking changes

Versão atual: **0.1.0** (Fase 0 — pré-MVP)

### Versionamento de APIs

- **Estratégia:** URI path prefix (ex.: `/v1/files`, `/v1/nodes`). Não na v1 (será `/files`, `/nodes`); adicionado quando FSP for publicado na Fase 2.
- **Formato:** `/v{MAJOR}/resource` — incrementar MAJOR apenas com breaking changes na API
- **Versões ativas:** v1 (única)
- **Política de suporte:** Manter versão anterior por pelo menos 6 meses após lançamento da nova; comunicar deprecação com 3 meses de antecedência

### Versionamento de Manifest

Manifests incluem campo `version` no JSON para permitir evolução do formato sem breaking changes:

```json
{
  "version": 1,
  "file_id": "...",
  "chunks": [...]
}
```

Orquestrador deve ser capaz de ler manifests de todas as versões anteriores (backward-compatible readers).

### Versionamento de Vault

Vault inclui campo `version` no header criptografado. Novas versões podem mudar estrutura interna sem afetar desbloqueio (mecanismo de desbloqueio via senha do membro permanece compatível). Cada membro possui seu próprio vault.

---

## Plano de Deprecação

### Processo de Deprecação

1. **Anúncio** — comunicar deprecação com antecedência mínima de 3 meses (via changelog e alerta na UI)
2. **Período de transição** — manter ambas as versões por 6 meses
3. **Migração** — oferecer migration path automático quando possível (ex.: workers de conversão de formato)
4. **Remoção** — remover funcionalidade após período de transição; log de warning durante 1 mês antes

### Itens em Deprecação

| Funcionalidade | Data de deprecação | Alternativa | Data de remoção |
|---|---|---|---|
| Nenhum item deprecated atualmente | — | — | — |

> Itens candidatos a deprecação futura:
> - Formato de manifest v1 → v2 (quando content-defined chunking for implementado)
> - WebP como formato padrão → AVIF (se benchmark confirmar vantagem significativa — hipótese H-06)
> - H.265 como codec de vídeo → AV1 (quando encoding speed for aceitável em CPUs familiares)

---

## Critérios para Revisão do Blueprint

### Gatilhos de Revisão

Este documento deve ser revisado quando:

- Uma nova fase é iniciada (Fase 0→1, 1→2, 2→3)
- Um ADR é criado ou alterado (decisão arquitetural significativa)
- Um incidente revela lacuna na documentação (postmortem aponta gap)
- Uma hipótese do PRD é validada ou invalidada (H-01 a H-07)
- Um débito técnico é pago ou um novo é identificado
- Mudança significativa de arquitetura ou tecnologia
- Entrada de novos contribuidores no projeto

### Cadência de Revisão

- **Revisão completa:** A cada transição de fase (trimestral, ~3 meses)
- **Revisão parcial (seções críticas: arquitetura, dados, segurança):** Mensal ou após incidente
- **Responsável pela revisão:** Douglas Prado (owner/tech lead)

### Histórico de Revisões

| Data | Autor | Seções alteradas | Motivo |
|------|-------|------------------|--------|
| 2026-03-16 | Douglas Prado | Todas (00-16) | Criação inicial do blueprint completo a partir do PRD v1.0.0 |
