# Community Operations

<!-- updated: opensource — open-core -->This section details **how Alexandria operates day-to-day** as an open-core project. Defines core processes, contributor ladder, governance (BDFL), infrastructure, release timeline, risk register, and legal/compliance aspects.

> **Note:** Alexandria is operated by a solo maintainer (Douglas) in v1. Operations are minimalist: develop, document, respond to community. Team scaling only happens with revenue (managed service) or critical mass of contributors.

---

## Core Processes

| Process                         | Owner                  | Frequency                            | Tool/Method                                                                     |
| ------------------------------- | ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Development & releases (semver) | Douglas + contributors | Continuous; release every 2–4 weeks  | GitHub (PRs, CI/CD via Actions, semver tags, changelog)                         |
| Issue triage & PR review        | Douglas                | Weekly (2–3h)                        | GitHub Issues + PR review; priority labels; stale bot                           |
| RFC / proposal process          | Douglas + community    | Per feature                          | GitHub Discussions → issue → implementation                                     |
| Code review SLA                 | Douglas                | Target: first review within 48h      | GitHub notifications                                                            |
| Security response               | Douglas                | Continuous (alerts) + monthly review | Dependabot, GitHub Security Advisories, SECURITY.md                             |
| Release process                 | Douglas                | Every 2–4 weeks                      | semver; CHANGELOG.md; migration guides; release candidates for breaking changes |

> Se qualquer um desses processos parar por >2 semanas, o projeto perde momentum e confiança da comunidade. O processo de segurança é especialmente crítico — uma vulnerabilidade não corrigida em sistema de storage criptografado destrói a reputação do projeto.

---

## Contributor Ladder (Team Roadmap)

| Role                                    | Person                      | When      | Cost                                | Promotion Trigger                                                             |
| --------------------------------------- | --------------------------- | --------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| **Lead Maintainer / Architect** (BDFL)  | Douglas                     | Now       | $0 (personal project)               | —                                                                             |
| **Co-maintainer**                       | Open (promoted contributor) | Month 6–9 | $0 (volunteer)                      | 5+ merged PRs + consistent availability; required to raise bus factor above 1 |
| **Community Manager** (part-time)       | Open                        | Month 12+ | {{placeholder}} (if revenue allows) | >200 active clusters; >50 messages/week on Discord                            |
| **DevOps / SRE** (managed service)      | Open                        | Year 2+   | {{placeholder}}                     | Managed service launch; >50 cloud families                                    |
| **Technical Support** (managed service) | Open                        | Year 2+   | {{placeholder}}                     | >100 cloud families; >20 tickets/week                                         |

### BDFL Governance

Alexandria uses the **BDFL (Benevolent Dictator for Life)** governance model:

- **Douglas** has final decision authority on all architectural and product decisions
- **RFC process** is used for consultation on decisions affecting public API or major features: GitHub Discussion → open for 14 days → BDFL decision
- **Community input** is actively solicited but non-binding
- **Delegation**: Douglas can delegate authority to committers/maintainers for specific domains (e.g., security, docs)
- **Succession**: If Douglas becomes unavailable, the co-maintainer with the most contributions inherits BDFL status

> **Prioridade #1 de equipe:** encontrar um co-maintainer. Bus factor = 1 é o maior risco operacional do projeto. Investir em documentação interna e mentoria de contribuidores para viabilizar isso.

> Fornecedores e infraestrutura: ver [06-estrutura-custos.md](06-estrutura-custos.md)

---

## Digital Infrastructure

| Component                 | Tool / Service                              | Monthly Cost | Purpose                                           |
| ------------------------- | ------------------------------------------- | ------------ | ------------------------------------------------- |
| Demo orchestrator hosting | Contabo VPS (4GB RAM)                       | ~$6          | Public demo + CI runners                          |
| Repository + CI/CD        | GitHub (free for open-source)               | $0           | Code, issues, PRs, Actions, Discussions, Packages |
| DNS + CDN + Storage       | Cloudflare (free tier + R2)                 | $0           | DNS, cache, DDoS protection, asset storage        |
| Monitoring                | Grafana Cloud (free tier)                   | $0           | Public health dashboard; opt-in telemetry metrics |
| Documentation             | Vercel or Netlify (free tier)               | $0           | Docs site (Docusaurus or similar)                 |
| Community communication   | **Discord** (free) + **GitHub Discussions** | $0           | Support, feedback, contributor coordination       |
| Transactional email       | Resend (free tier: 3K/month)                | $0           | Security alerts, release notifications            |

**Infraestrutura Física:**

Operação 100% remota e cloud-native. Sem infraestrutura física necessária. O desenvolvimento acontece no laptop pessoal do Douglas; testes rodam em CI (GitHub Actions) e na VPS de demo.

---

## Project Disaster Recovery

> Disaster recovery do **projeto** (infra de desenvolvimento e comunidade), não do **produto** (que tem seu próprio DR via seed phrase — ver PRD seção de Recuperação).

| Parâmetro                      | Alvo                       | Detalhes                                                             |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------- |
| RTO (Recovery Time Objective)  | 4 horas                    | Tempo máximo para restaurar CI/CD, docs site e demo                  |
| RPO (Recovery Point Objective) | 0 (código) / 24h (configs) | Código no GitHub = cópia implícita; configs de infra em repo privado |

**Estratégia de backup:**

- Código-fonte versionado no GitHub (replicado para GitLab mirror automático como backup)
- Secrets e configs de infra em repositório privado separado (encrypted)
- VPS de demo reconstruível via Docker Compose em <30 minutos
- Domínio e DNS gerenciados via Cloudflare (IaC quando possível)
- Banco de metadados da demo: backup diário automatizado para R2

> Teste de restore: 1x por trimestre, reconstruir a VPS de demo do zero e confirmar que tudo funciona.

---

## Scale Plan

| Área           | 100 Clusters (Ano 1)                                 | 1.000 Clusters (Ano 1-2)                                                   | 10.000 Clusters (Ano 2-3)                                            |
| -------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Infraestrutura | 1 VPS demo; telemetria opt-in básica                 | Grafana Cloud; telemetria agregada; infra do serviço gerenciado            | Multi-region; auto-scaling; CDN dedicada para assets                 |
| Equipe         | 1 mantenedor (Douglas)                               | 1 mantenedor + 1 co-maintainer + comunidade                                | 3-5 pessoas (eng + DevOps + suporte + community)                     |
| Processos      | Manual; founder faz tudo; issues respondidas em <48h | Triagem estruturada; labels automatizados; contributing guidelines maduros | SRE on-call; suporte tier 1/2; release manager; governance de código |
| Custo/cluster  | R$ 0 para o projeto (self-hosted)                    | R$ 0 self-hosted / R$18 gerenciado                                         | R$ 0 self-hosted / R$14,50 gerenciado                                |

---

## Release Milestones (Alpha → Beta → v1.0 → LTS)

| Marco                                                                                       | Data Prevista | Responsável              | Critério de Sucesso                                                               | Critério Go/No-Go                                                            |
| ------------------------------------------------------------------------------------------- | ------------- | ------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Alpha funcional** (core pipeline: upload → otimizar → criptografar → replicar → recovery) | 2026-06-15    | Douglas                  | Pipeline end-to-end funciona; 1 disaster drill bem-sucedido; Família Prado usando | Se pipeline falha em >5% dos uploads, não avançar para beta                  |
| **Beta pública** (Docker Compose + README + Show HN)                                        | 2026-08-01    | Douglas                  | 50 stars; 20 Docker pulls/semana; 10 clusters de early adopters                   | Se <5 clusters ativos após 2 semanas do Show HN, revisar docs/UX             |
| **v1.0 estável** (todos os Must-have implementados)                                         | 2026-11-01    | Douglas + contribuidores | 200+ clusters ativos; 0 bugs críticos abertos; 0 perdas de dados reportadas       | Se >2 bugs de perda de dados, reverter para beta; priorizar estabilidade     |
| **Serviço gerenciado (beta)**                                                               | 2027-03-01    | Douglas + equipe         | 20 famílias pagantes no primeiro mês; break-even em 3 meses                       | Se <10 famílias após lista de espera, validar demanda antes de investir mais |

---

## OSS Risk Register

| Risco                                                                                                | Categoria | Probabilidade | Impacto | Mitigação                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bus factor = 1** — Douglas fica indisponível (doença, burnout, mudança de prioridade)              | Time      | Média         | Crítico | Documentação excelente; buscar co-maintainer ativamente; código legível e bem testado; seed phrase garante que dados dos usuários sobrevivem independentemente                            |
| **Perda de dados de usuário** — bug no replicação, criptografia ou recovery                          | Produto   | Baixa         | Crítico | Testes extensivos; disaster drills mensais; scrubbing automático; alpha com dados próprios (Família Prado) antes de abrir; responsible disclosure policy                                  |
| **Provedores cloud mudam free tiers** — Google, Cloudflare, etc. removem ou reduzem planos gratuitos | Mercado   | Média         | Alto    | StorageProvider interface permite trocar provedores facilmente; diversificação obrigatória (3+ provedores); alertas de mudança de pricing                                                 |
| **Concorrente forte surge** — Immich adiciona distribuição, ou Google lança "family vault"           | Mercado   | Média         | Médio   | Diferencial é a combinação completa (distribuição + criptografia + recovery + otimização); comunidade e switching cost protegem; foco em durabilidade vs features                         |
| **Burnout do mantenedor** — projeto pessoal exige tempo constante sem remuneração                    | Time      | Alta          | Alto    | Limitar a 15-20h/semana; aceitar que progresso será lento; celebrar milestones; buscar sponsors para motivação; se burnout iminente, pausar features e manter apenas segurança            |
| **Vulnerabilidade de segurança** — falha na criptografia ou nos vaults dos membros compromete dados  | Produto   | Baixa         | Crítico | Usar primitivas criptográficas padrão (AES-256-GCM, BIP-39); não reinventar crypto; code review rigoroso em código de segurança; responsible disclosure; auditoria quando houver recursos |
| **Adoção insuficiente** — <50 clusters após 6 meses                                                  | Mercado   | Média         | Médio   | Validar com Show HN e Reddit antes de investir meses; se adoção baixa, investigar: setup complexo? Docs ruins? Problema errado? Pivotar antes de insistir                                 |

---

## Legal & Compliance

- [x] Open-source license defined: **MIT** — permissive, maximizes adoption
- [ ] CLA vs DCO: **DCO (Developer Certificate of Origin)** recommended — lighter than CLA, no legal friction for contributors
- [ ] Trademark policy — define what can/cannot use the "Alexandria" name
- [ ] Terms of Use (for website and future managed service)
- [ ] Privacy Policy (for opt-in telemetry and managed service)
- [ ] LGPD/GDPR compliance (opt-in telemetry; user data stays on their own nodes/devices)
- [ ] Responsible Disclosure Policy → SECURITY.md ✅ (generated by /opensource)
- [ ] CONTRIBUTING.md ✅ (generated by /opensource)
- [ ] Tax structure (when revenue starts — sole proprietor → company as revenue scales)

**Estrutura jurídica:**

| Item              | Status                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Tipo de empresa   | Não constituída (projeto pessoal open-source)                                                 |
| Regime tributário | N/A — sem receita na v1. MEI quando iniciar doações; Simples Nacional para serviço gerenciado |
| CNPJ              | Não constituído — constituir quando receita recorrente >R$1.000/mês                           |

> **Nota sobre LGPD:** O Alexandria armazena dados nos dispositivos e nós do próprio usuário. O projeto não hospeda, processa ou acessa dados pessoais de terceiros na v1 (self-hosted). A telemetria é opt-in e anonimizada. Para o serviço gerenciado (ano 2+), será necessário DPO, políticas formais e adequação completa à LGPD/GDPR.

> **Nota sobre licença:** A escolha de licença (AGPL vs MIT vs Apache) tem impacto direto na defensabilidade do negócio. AGPL protege contra competidores que usam o código sem contribuir; MIT/Apache maximizam adoção mas permitem forks comerciais. Decisão pendente — avaliar com base na estratégia de monetização.
