# Opensource Ecosystem Context

<!-- updated: opensource — open-core -->This section establishes the **ecosystem context** where the project operates. Defines the developer community landscape, ecosystem alternatives, trends, and assumptions that shape strategic decisions for the Alexandria open-core project.

---

## Project Stage

> What stage is the project in today?

- [x] Pre-release (idea / research / design)
- [ ] Alpha (early adopters, core pipeline functional)
- [ ] Beta (public Docker Compose release, Show HN)
- [ ] Stable v1.0 (all must-have requirements implemented)
- [ ] LTS (long-term support, mature community)

**Current stage:** Design and documentation phase. PRD v1.0.0 complete with 79 functional requirements. Technical blueprint finalized. No code written yet. Next step is Phase 0 (Foundation — Core SDK in TypeScript). Pending validations include: Full HD perceptual quality for family photos (H-01), deduplication rate on real archive (H-02), and seed phrase recovery (H-04).

---

## Ecosystem

> Alexandria operates in the **personal/family data storage** ecosystem — specifically at the intersection of self-hosted software, privacy-first cloud storage, and long-term digital preservation.

| Dimension                        | Value                                                                                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Total Addressable Developers** | ~5–10M globally (self-hosters, data hoarders, privacy-conscious developers — r/selfhosted 1.5M, r/datahoarder 700K, r/degoogle 300K + multiplier 2–3× for non-Reddit communities) |
| **Active Ecosystem Users (SAM)** | ~500K–2M globally (families with ≥1 technical member, ≥200GB of media, willing to self-host)                                                                                      |
| **Target Contributors (Year 1)** | 500–1,000 active installations; 10–50 code contributors                                                                                                                           |
| Annual growth rate               | ~20% per year (personal storage grows with mobile media production)                                                                                                               |
| Ecosystem maturity               | Growth — dominated by big tech incumbents, but growing dissatisfaction with cost and privacy                                                                                      |
| Geographic focus                 | Global (self-hosted, no geographic restriction); initial community: Brazil (dev's family) + r/selfhosted international                                                            |

**Evidence (from PRD):**

- Google Photos eliminated unlimited free storage in 2021; free tier reduced to 15GB
- HDDs last 5–10 years, SSDs ~10 years without migration — industry consensus
- ~102GB free storage available per person combining cloud providers
- 20–60% duplication in family photos (WhatsApp, cross-device sharing)
- Paid plan costs (Google One, Dropbox Plus, iCloud+) increase year over year

> The market is huge but dominated by incumbents. The opportunity is not to compete at scale, but to serve an underserved niche: technical families who want full control, privacy, and zero cost. OSS open-core model allows the core to be freely adopted while a managed service captures conversion from non-technical families.

---

## Ecosystem Alternatives

| Project               | Positioning                          | Strengths                                                      | Weaknesses                                                                             | License          | GitHub Stars / Downloads |
| --------------------- | ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- | ------------------------ |
| Google Photos / Drive | Mainstream consumer cloud storage    | 15GB free; excellent UX; AI search; Android integration        | Vendor lock-in; privacy concerns; rising prices above 15GB                             | Proprietary      | N/A (closed)             |
| iCloud                | Apple ecosystem                      | Native iOS/macOS integration; seamless for Apple users         | Apple-only; 5GB free (insufficient); expensive for families                            | Proprietary      | N/A (closed)             |
| Dropbox               | Professional/personal cloud storage  | Reliable sync; cross-platform; integrations                    | 2GB free (smallest on market); B2B focus; high price                                   | Proprietary      | N/A (closed)             |
| Syncthing             | P2P open-source sync between devices | Free; private; no cloud dependency; open-source                | No at-rest encryption; no media optimization; no cloud redundancy; no recovery         | MPL-2.0          | ~65K ⭐                  |
| Nextcloud             | Self-hosted personal cloud           | Self-hosted; open-source; app ecosystem                        | Complex to operate; no media optimization; no multi-provider distribution; performance | AGPL-3.0         | ~28K ⭐                  |
| Immich                | Self-hosted photo/video backup       | Excellent mobile apps; active community; Google Photos-like UX | No distributed storage; single-node; no multi-provider redundancy; no seed recovery    | AGPL-3.0         | ~55K ⭐                  |
| BorgBackup / Restic   | Incremental encrypted backup         | Excellent deduplication; strong encryption; open-source        | Backup only (no gallery, no sync); CLI-only; not distributed storage                   | BSD / Apache-2.0 | ~12K ⭐                  |

**Concorrentes indiretos (substitutos):**

- **HD externo manual** — backup esquecido em gaveta; sem verificação; degrada em 5-10 anos (40% das famílias usam apenas isso)
- **WhatsApp/Telegram** — fotos compartilhadas via chat; compressão severa; sem organização; sem backup confiável
- **NAS doméstico (Synology, QNAP)** — robusto mas caro (R$1500+); ponto único de falha; sem distribuição cloud; complexo para família
- **Impressão física** — fotos impressas; durável mas sem escalabilidade; custo alto por unidade

---

## Ecosystem Trends

| Trend                                                   | Type       | Impact on Project                                                                     | Horizon                        |
| ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- | ------------------------------ |
| Elimination of unlimited free cloud storage             | Market     | Directly positive — families seek alternatives to paid Google/Apple                   | Short-term (already happening) |
| Exponential growth of mobile media production           | Behavior   | Increases urgency — phones produce ~1GB/month of photos/videos per person             | Ongoing                        |
| Growing concern about digital privacy                   | Behavior   | Strengthens zero-knowledge encryption value proposition                               | Medium-term                    |
| AI-assisted contributions (GitHub Copilot, Claude Code) | OSS trend  | Lowers barrier to contribution; accelerates community PRs                             | Short-term (already available) |
| Modern codecs (WebP, AVIF, AV1) maturing                | Technology | Enables 10–20× reduction in photos and 3–5× in videos without perceptible loss        | Short-term (already available) |
| Decentralization and self-hosting gaining traction      | Technology | Growing self-hosting community (Nextcloud, Syncthing, Immich) validates demand        | Medium-term                    |
| Supply chain security (SBOM, signing, SLSA)             | OSS trend  | Requires signed releases, SBOM, verified dependencies — community expectation         | Short-term                     |
| Data protection regulations (LGPD, GDPR)                | Regulatory | Reinforces value of encryption and user data control                                  | Long-term                      |
| Corporate OSS adoption and sponsorship                  | OSS trend  | Companies adopting self-hosted solutions increasingly sponsor projects they depend on | Medium-term                    |
| Falling cloud storage costs (R2 zero egress, B2 cheap)  | Market     | Enables zero-cost model combining multiple providers' free tiers                      | Short-term                     |

---

## Opportunity

**Lacuna identificada:**

Não existe solução que combine: (1) distribuição de dados entre múltiplos provedores e dispositivos com auto-reparação, (2) criptografia ponta-a-ponta zero-knowledge, (3) otimização automática de mídia para reduzir 10-20x o espaço, (4) custo zero usando free tiers combinados, e (5) recovery completo com 12 palavras. Cada concorrente resolve 1-2 desses problemas; nenhum resolve todos.

**Por que agora?**

- Google eliminou storage gratuito ilimitado em 2021; preços de planos pagos crescem todo ano — famílias sentem o custo
- Codecs modernos (WebP, H.265, AV1) atingiram maturidade suficiente para otimização agressiva sem perda perceptível
- Provedores cloud com free tier generoso (R2 sem egress, B2 a $5/TB) e S3-compatible API viabilizam arquitetura multi-cloud
- NestJS atingiu maturidade (ecossistema NestJS maduro e estável) — permite produtividade alta com type-safety para sistema de storage
- Comunidade self-hosting em crescimento (Immich, Nextcloud, Syncthing) valida que existe demanda por alternativas às big techs
- ~102GB de free tier disponível por pessoa combinando provedores — uma família de 5 pessoas obtém ~500GB gratuitos

> **Por que ninguém fez isso antes?** A combinação de storage distribuído + criptografia + otimização de mídia + multi-cloud requer expertise em sistemas distribuídos, criptografia e processamento de mídia simultaneamente. É um projeto complexo para uma startup típica. O Alexandria é viável como projeto pessoal porque o tech lead (Douglas) tem experiência em todas essas áreas e o escopo familiar (5-10 usuários) reduz drasticamente os requisitos de escala.

---

## SWOT Analysis

|              | **Positive**                                                                                    | **Negative**                                                                |
| ------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Internal** | **Strengths**                                                                                   | **Weaknesses**                                                              |
|              | Tech lead with full-stack experience in distributed systems, cryptography, and media processing | Single-person team — limited development capacity; bus factor = 1           |
|              | TypeScript/NestJS stack: high productivity, type-safety, mature npm ecosystem                   | No user base yet; no brand recognition; no marketing budget                 |
|              | "Disposable orchestrator" architecture — resilience by design                                   | Learning curve for non-technical family members                             |
|              | Permissive MIT license maximizes adoption; active community, full transparency                  | No funding; no commercial runway in v1; personal project                    |
| **External** | **Opportunities**                                                                               | **Threats**                                                                 |
|              | Growing dissatisfaction with Google/Apple/Dropbox prices                                        | Maintainer burnout (high impact; prevention: funding + team growth)         |
|              | Self-hosting community growing (Immich 55K+ stars validates demand)                             | Hostile fork if project grows (prevention: strong governance + MIT license) |
|              | Modern codecs enable 10–20× reduction without perceptible loss                                  | Cloud providers eliminate free tiers or change S3 APIs                      |
|              | Open-core model: free OSS drives adoption; managed service captures non-technical segment       | Competing OSS projects (Immich, PhotoPrism) could add distribution features |
|              | Corporate OSS sponsorship as project gains production deployments                               | License compliance issues (prevention: CLA/DCO + SBOM)                      |

---

## Project Assumptions

| Premissa                                                              | Risco se falsa                                                           | Impacto | Como validar                                                                     | Status    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------- | --------- |
| Full HD (1920px) é qualidade suficiente para memórias familiares      | Usuários rejeitam qualidade otimizada; precisam de originais             | Alto    | Pesquisa com membros da família; teste A/B fotos originais vs otimizadas (H-01)  | A validar |
| Deduplicação reduz 30-70% do storage em acervos familiares            | Economia de espaço menor que esperada; modelo de custo zero inviável     | Médio   | Análise de acervo real piloto — fotos de WhatsApp, múltiplos dispositivos (H-02) | A validar |
| Família média tem 5+ dispositivos utilizáveis como nós                | Poucos nós disponíveis; replicação 3x difícil                            | Médio   | Pesquisa com famílias-alvo (H-03)                                                | A validar |
| Recovery via seed phrase funciona de forma confiável                  | Perda de dados em cenário de desastre; promessa core do produto quebrada | Alto    | Disaster drills mensais com reconstrução real (H-04)                             | A validar |
| ~500GB gratuitos (free tiers combinados) cobrem família por 5-10 anos | Espaço insuficiente; modelo de custo zero inviável                       | Alto    | Cálculo com acervo piloto: 100k fotos + 500h vídeo otimizados (H-07)             | A validar |
| Provedores cloud manterão free tiers e APIs S3 estáveis               | StorageProvider abstração quebra; migração forçada                       | Médio   | Monitorar políticas de provedores; diversificar em 3+ provedores                 | A validar |
| Usuários guardam seed phrase com segurança                            | Perda total de dados; sistema falha na promessa principal                | Alto    | Instruções claras; alerta persistente; recovery guardians em fase futura         | A validar |
| Membros não-técnicos da família conseguem usar o web client           | Baixa adoção; sistema usado apenas pelo admin                            | Médio   | Teste de usabilidade com 3-5 membros da família durante alpha                    | A validar |

> **Regulamentação aplicável:**
>
> - **LGPD:** Dados pessoais de membros (e-mail, nomes, GPS em fotos); consentimento implícito ao aceitar convite; direito ao esquecimento implementado
> - **Termos de provedores cloud:** Tokens OAuth em conformidade com políticas de Google, Microsoft, Dropbox
> - **Dados de menores:** Fotos de crianças protegidas pela criptografia zero-knowledge do cluster
