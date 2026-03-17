# Decisões Arquiteturais

## Índice de ADRs

| ID | Título | Status | Data |
|----|--------|--------|------|
| ADR-001 | Rust como linguagem principal do backend | Aceita | 2026-03-16 |
| ADR-002 | Axum como web framework | Aceita | 2026-03-16 |
| ADR-003 | Orquestrador centralizado vs P2P | Aceita | 2026-03-16 |
| ADR-004 | PostgreSQL 17 para metadados | Aceita | 2026-03-16 |
| ADR-005 | Envelope encryption com seed phrase BIP-39 | Aceita | 2026-03-16 |
| ADR-006 | Consistent hashing para distribuição de chunks | Aceita | 2026-03-16 |
| ADR-007 | Otimização destrutiva de mídia (sem preservar originais) | Aceita | 2026-03-16 |

> 📄 Template completo: [adr-template.md](../adr/adr-template.md)
>
> Cada ADR é detalhado em arquivo individual em [docs/adr/](../adr/).

---

### ADR-001: Rust como linguagem principal do backend

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Sistema de armazenamento distribuído com operações IO-bound pesadas (chunks, replicação, criptografia). Time de 1 pessoa; binários precisam rodar em VPS, PCs e NAS como agentes de nó.

**Decisão:** Rust — performance nativa, memory safety sem GC, binário único sem runtime, ecossistema async maduro (Tokio).

**Alternativas descartadas:** Go (GC pode causar latency spikes em IO pesado; menos controle de memória), Node.js (single-threaded; overhead de runtime em agentes de nó), Python (performance insuficiente para pipeline de criptografia).

> 📄 Detalhes: [adr/ADR-001.md](../adr/ADR-001.md)

---

### ADR-002: Axum como web framework

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Precisamos de um web framework Rust para a API REST do orquestrador e agentes de nó. Deve suportar async, middleware composável e integração com Tokio.

**Decisão:** Axum 0.8 — async-first, built on Tokio/Tower/Hyper; middleware composável via Tower; integração natural com SQLx e tracing.

**Alternativas descartadas:** Actix-web (bom, mas menos integrado com ecossistema Tower; API menos ergonômica para middleware), Warp (menor comunidade, menos mantido).

> 📄 Detalhes: [adr/ADR-002.md](../adr/ADR-002.md)

---

### ADR-003: Orquestrador centralizado vs P2P

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** O sistema precisa coordenar distribuição de chunks entre nós. Duas abordagens: orquestrador centralizado ou rede P2P descentralizada (DHT/gossip).

**Decisão:** Orquestrador centralizado (descartável via seed) — complexidade drasticamente menor; time de 1 pessoa não consegue implementar e manter protocolo P2P; orquestrador pode ser destruído e reconstruído via seed phrase.

**Alternativas descartadas:** P2P com DHT (complexidade excessiva; latência de convergência; dificuldade de debugging), P2P com gossip (overhead de bandwidth; complexidade de partição de rede).

> 📄 Detalhes: [adr/ADR-003.md](../adr/ADR-003.md)

---

### ADR-004: PostgreSQL 17 para metadados

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Orquestrador precisa de banco para metadados: clusters, membros, nós, arquivos, chunks, réplicas. Dados altamente relacionais com integridade referencial necessária.

**Decisão:** PostgreSQL 17 + SQLx (compile-time checked, async) — ACID para transações críticas (criar arquivo + chunks + réplicas atomicamente), JSONB para metadata flexível (EXIF), ecossistema maduro de migrações.

**Alternativas descartadas:** SQLite (sem concorrência; limitações em queries complexas com joins), MongoDB (sem integridade referencial; equipe sem experiência), CockroachDB (overkill para escala familiar).

> 📄 Detalhes: [adr/ADR-004.md](../adr/ADR-004.md)

---

### ADR-005: Envelope encryption com seed phrase BIP-39

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Dados familiares (fotos, vídeos) são sensíveis. Criptografia ponta-a-ponta é requisito. Sistema precisa ser recuperável com um único segredo (seed phrase).

**Decisão:** Hierarquia: seed (12 palavras BIP-39) → master key (PBKDF2) → file keys (derivação) → chunk keys (AES-256-GCM). Vault criptografado com senha do usuário para tokens/credenciais/senhas. Master key nunca persistida; usada apenas em recovery do orquestrador.

**Alternativas descartadas:** Chave simétrica única (comprometimento de uma chave = comprometimento total), KMS cloud (dependência de provedor; custo; contradiz princípio de independência), PGP/GPG (complexo de gerenciar para família não-técnica).

> 📄 Detalhes: [adr/ADR-005.md](../adr/ADR-005.md)

---

### ADR-006: Consistent hashing para distribuição de chunks

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Chunks precisam ser distribuídos entre nós proporcionalmente à capacidade. Quando nós entram ou saem, redistribuição deve ser mínima.

**Decisão:** Consistent hashing ring com virtual nodes proporcionais à capacidade — redistribuição mínima (apenas K/N chunks migram quando nó entra/sai); determinístico (mesmo chunk sempre mapeia para mesmos nós).

**Alternativas descartadas:** Round-robin (não proporcional à capacidade; redistribuição total quando nó muda), Random placement (não determinístico; requer índice centralizado para localizar chunks), Rendezvous hashing (similar em resultado mas menos suporte de bibliotecas).

> 📄 Detalhes: [adr/ADR-006.md](../adr/ADR-006.md)

---

### ADR-007: Otimização destrutiva de mídia (sem preservar originais)

**Data:** 2026-03-16 | **Status:** Aceita

**Contexto:** Famílias acumulam centenas de GB. Free tiers de cloud oferecem ~100GB/pessoa. Para viabilizar custo zero, redução de 10-20x em fotos e 3-5x em vídeos é necessária.

**Decisão:** Fotos → WebP max 1920px (~300-600KB vs 5-8MB). Vídeos → 1080p H.265/AV1 (~400-600MB vs 2GB). Originais NÃO preservados. Metadados EXIF extraídos e preservados separadamente.

**Alternativas descartadas:** Preservar originais + versão otimizada (dobra o storage necessário; inviabiliza modelo de custo zero), Apenas compressão lossless (redução insuficiente — 10-30% vs 70-95%), Armazenar originais em cold storage (custo de retrieval; complexidade de gestão de tiers).

> 📄 Detalhes: [adr/ADR-007.md](../adr/ADR-007.md)
