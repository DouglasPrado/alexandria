# Plano Operacional

Esta seção detalha **como o Alexandria funciona no dia a dia**. Define processos, equipe, infraestrutura, timeline de lançamento, riscos e aspectos legais necessários para a operação.

> **Nota:** O Alexandria é operado por um mantenedor solo (Douglas) na v1. A operação é minimalista: desenvolver, documentar, responder comunidade. Escala de equipe só acontece com receita (serviço gerenciado) ou massa crítica de contribuidores.

---

## Processos Core

| Processo | Responsável | Frequência | Ferramenta/Método |
| --- | --- | --- | --- |
| Desenvolvimento e releases | Douglas + contribuidores | Contínua; release a cada 2-4 semanas | GitHub (PRs, CI/CD via Actions, tags semânticas) |
| Triagem de issues e revisão de PRs | Douglas | Semanal (2-3h) | GitHub Issues + PR review; labels de prioridade |
| Monitoramento de segurança | Douglas | Contínua (alertas) + revisão mensal | Dependabot, security advisories, responsible disclosure |

> Se qualquer um desses processos parar por >2 semanas, o projeto perde momentum e confiança da comunidade. O processo de segurança é especialmente crítico — uma vulnerabilidade não corrigida em sistema de storage criptografado destrói a reputação do projeto.

---

## Roadmap de Equipe

| Cargo | Pessoa | Quando | Custo Mensal (R$) | Trigger de Contratação/Adição |
| --- | --- | --- | --- | --- |
| Mantenedor principal / Arquiteto | Douglas | Atual | R$ 0 (projeto pessoal) | — |
| Co-maintainer | Aberto (contribuidor promovido) | Mês 6-9 | R$ 0 (voluntário) | >5 PRs mergeados + disponibilidade consistente; necessário para bus factor >1 |
| Community manager (part-time) | Aberto | Mês 12+ | R$ 2.000-3.000 (se receita permitir) | >200 clusters ativos; >50 mensagens/semana no Discord; mantenedor não consegue responder tudo |
| DevOps / SRE (serviço gerenciado) | Aberto | Ano 2+ | R$ 8.000-12.000 | Lançamento do serviço gerenciado; >50 famílias cloud |
| Suporte técnico (serviço gerenciado) | Aberto | Ano 2+ | R$ 4.000-6.000 | >100 famílias cloud; >20 tickets/semana |

> **Prioridade #1 de equipe:** encontrar um co-maintainer. Bus factor = 1 é o maior risco operacional do projeto. Investir em documentação interna e mentoria de contribuidores para viabilizar isso.

> Fornecedores e infraestrutura: ver [06-estrutura-custos.md](06-estrutura-custos.md)

---

## Infraestrutura Digital

| Componente | Ferramenta / Serviço | Custo Mensal (R$) | Finalidade |
| --- | --- | --- | --- |
| Hospedagem (orquestrador demo) | Contabo VPS (4GB RAM) | R$ 30 | Demo pública + CI runners |
| Repositório + CI/CD | GitHub (free for open-source) | R$ 0 | Código, issues, PRs, Actions, Discussions, Packages |
| DNS + CDN + Storage | Cloudflare (free tier + R2) | R$ 0 | DNS, cache, proteção DDoS, storage para assets |
| Monitoramento | Grafana Cloud (free tier) | R$ 0 | Dashboard público de saúde; métricas de telemetria opt-in |
| Documentação | Vercel ou Netlify (free tier) | R$ 0 | Site de docs (Docusaurus ou similar) |
| Comunicação da comunidade | Discord (free) + GitHub Discussions | R$ 0 | Suporte, feedback, coordenação de contribuidores |
| E-mail transacional | Resend (free tier: 3K/mês) | R$ 0 | Alertas de segurança, notificações de release |

**Infraestrutura Física:**

Operação 100% remota e cloud-native. Sem infraestrutura física necessária. O desenvolvimento acontece no laptop pessoal do Douglas; testes rodam em CI (GitHub Actions) e na VPS de demo.

---

## Disaster Recovery

> Disaster recovery do **projeto** (infra de desenvolvimento e comunidade), não do **produto** (que tem seu próprio DR via seed phrase — ver PRD seção de Recuperação).

| Parâmetro | Alvo | Detalhes |
| --- | --- | --- |
| RTO (Recovery Time Objective) | 4 horas | Tempo máximo para restaurar CI/CD, docs site e demo |
| RPO (Recovery Point Objective) | 0 (código) / 24h (configs) | Código no GitHub = cópia implícita; configs de infra em repo privado |

**Estratégia de backup:**

- Código-fonte versionado no GitHub (replicado para GitLab mirror automático como backup)
- Secrets e configs de infra em repositório privado separado (encrypted)
- VPS de demo reconstruível via Docker Compose em <30 minutos
- Domínio e DNS gerenciados via Cloudflare (IaC quando possível)
- Banco de metadados da demo: backup diário automatizado para R2

> Teste de restore: 1x por trimestre, reconstruir a VPS de demo do zero e confirmar que tudo funciona.

---

## Plano de Escala

| Área | 100 Clusters (Ano 1) | 1.000 Clusters (Ano 1-2) | 10.000 Clusters (Ano 2-3) |
| --- | --- | --- | --- |
| Infraestrutura | 1 VPS demo; telemetria opt-in básica | Grafana Cloud; telemetria agregada; infra do serviço gerenciado | Multi-region; auto-scaling; CDN dedicada para assets |
| Equipe | 1 mantenedor (Douglas) | 1 mantenedor + 1 co-maintainer + comunidade | 3-5 pessoas (eng + DevOps + suporte + community) |
| Processos | Manual; founder faz tudo; issues respondidas em <48h | Triagem estruturada; labels automatizados; contributing guidelines maduros | SRE on-call; suporte tier 1/2; release manager; governance de código |
| Custo/cluster | R$ 0 para o projeto (self-hosted) | R$ 0 self-hosted / R$18 gerenciado | R$ 0 self-hosted / R$14,50 gerenciado |

---

## Timeline de Lançamento

| Marco | Data Prevista | Responsável | Critério de Sucesso | Critério Go/No-Go |
| --- | --- | --- | --- | --- |
| **Alpha funcional** (core pipeline: upload → otimizar → criptografar → replicar → recovery) | 2026-06-15 | Douglas | Pipeline end-to-end funciona; 1 disaster drill bem-sucedido; Família Prado usando | Se pipeline falha em >5% dos uploads, não avançar para beta |
| **Beta pública** (Docker Compose + README + Show HN) | 2026-08-01 | Douglas | 50 stars; 20 Docker pulls/semana; 10 clusters de early adopters | Se <5 clusters ativos após 2 semanas do Show HN, revisar docs/UX |
| **v1.0 estável** (todos os Must-have implementados) | 2026-11-01 | Douglas + contribuidores | 200+ clusters ativos; 0 bugs críticos abertos; 0 perdas de dados reportadas | Se >2 bugs de perda de dados, reverter para beta; priorizar estabilidade |
| **Serviço gerenciado (beta)** | 2027-03-01 | Douglas + equipe | 20 famílias pagantes no primeiro mês; break-even em 3 meses | Se <10 famílias após lista de espera, validar demanda antes de investir mais |

---

## Riscos e Mitigações

| Risco | Categoria | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- | --- |
| **Bus factor = 1** — Douglas fica indisponível (doença, burnout, mudança de prioridade) | Time | Média | Crítico | Documentação excelente; buscar co-maintainer ativamente; código legível e bem testado; seed phrase garante que dados dos usuários sobrevivem independentemente |
| **Perda de dados de usuário** — bug no replicação, criptografia ou recovery | Produto | Baixa | Crítico | Testes extensivos; disaster drills mensais; scrubbing automático; alpha com dados próprios (Família Prado) antes de abrir; responsible disclosure policy |
| **Provedores cloud mudam free tiers** — Google, Cloudflare, etc. removem ou reduzem planos gratuitos | Mercado | Média | Alto | StorageProvider interface permite trocar provedores facilmente; diversificação obrigatória (3+ provedores); alertas de mudança de pricing |
| **Concorrente forte surge** — Immich adiciona distribuição, ou Google lança "family vault" | Mercado | Média | Médio | Diferencial é a combinação completa (distribuição + criptografia + recovery + otimização); comunidade e switching cost protegem; foco em durabilidade vs features |
| **Burnout do mantenedor** — projeto pessoal exige tempo constante sem remuneração | Time | Alta | Alto | Limitar a 15-20h/semana; aceitar que progresso será lento; celebrar milestones; buscar sponsors para motivação; se burnout iminente, pausar features e manter apenas segurança |
| **Vulnerabilidade de segurança** — falha na criptografia ou nos vaults dos membros compromete dados | Produto | Baixa | Crítico | Usar primitivas criptográficas padrão (AES-256-GCM, BIP-39); não reinventar crypto; code review rigoroso em código de segurança; responsible disclosure; auditoria quando houver recursos |
| **Adoção insuficiente** — <50 clusters após 6 meses | Mercado | Média | Médio | Validar com Show HN e Reddit antes de investir meses; se adoção baixa, investigar: setup complexo? Docs ruins? Problema errado? Pivotar antes de insistir |

---

## Aspectos Legais e Regulatórios

- [x] Licença open-source definida (AGPL-3.0 ou similar — protege contra uso comercial sem contribuição)
- [ ] Termos de Uso (para site e serviço gerenciado futuro)
- [ ] Política de Privacidade (para telemetria opt-in e serviço gerenciado)
- [ ] LGPD/GDPR compliance (telemetria opt-in; dados do usuário ficam nos dispositivos/nós dele, não nos nossos)
- [ ] Responsible Disclosure Policy (segurança)
- [ ] CONTRIBUTING.md + CLA ou DCO (contribuições de código)
- [ ] Regime tributário (quando houver receita — MEI se <R$81K/ano, ME/Simples se acima)
- [ ] Contratos com fornecedores (quando serviço gerenciado)

**Estrutura jurídica:**

| Item | Status |
| --- | --- |
| Tipo de empresa | Não constituída (projeto pessoal open-source) |
| Regime tributário | N/A — sem receita na v1. MEI quando iniciar doações; Simples Nacional para serviço gerenciado |
| CNPJ | Não constituído — constituir quando receita recorrente >R$1.000/mês |

> **Nota sobre LGPD:** O Alexandria armazena dados nos dispositivos e nós do próprio usuário. O projeto não hospeda, processa ou acessa dados pessoais de terceiros na v1 (self-hosted). A telemetria é opt-in e anonimizada. Para o serviço gerenciado (ano 2+), será necessário DPO, políticas formais e adequação completa à LGPD/GDPR.

> **Nota sobre licença:** A escolha de licença (AGPL vs MIT vs Apache) tem impacto direto na defensabilidade do negócio. AGPL protege contra competidores que usam o código sem contribuir; MIT/Apache maximizam adoção mas permitem forks comerciais. Decisão pendente — avaliar com base na estratégia de monetização.
