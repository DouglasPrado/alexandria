# Community Engagement

<!-- updated: opensource — open-core -->This section defines **how Alexandria builds and maintains lasting relationships with its community**. Covers activation, contributor lifecycle, retention, expansion, and recovery. As an open-core project, the focus is on **engagement**, **trust**, and **community contribution**.

> **Note:** Alexandria has no paying customers in v1. "Retention" means keeping the system running and the family using it. "Expansion" means adding nodes, members, and contributing to the community. "Churn" means abandoning the system.

---

## Contributor Lifecycle

`Newcomer` → `Contributor` → `Committer` → `Maintainer` → `TSC Member (future)`

| Stage | Criteria | Responsibilities | Recognition |
| ----- | -------- | ---------------- | ----------- |
| **Newcomer** | Filed an issue or asked a question | Explore the codebase; read CONTRIBUTING.md | Welcome message; good-first-issue label |
| **Contributor** | 1+ merged PR | Submit PRs; review others' PRs | Listed in CONTRIBUTORS file; release notes credit |
| **Committer** | 5+ quality PRs; consistent engagement | Review PRs; triage issues; mentor newcomers | GitHub org member; write access to non-critical branches |
| **Maintainer** | Sustained contribution over 3+ months; trusted judgment | Release management; architecture decisions; security response | Co-maintainer status; direct push access; README credit |

---

## Activation Definition

| Aspecto | Descrição |
| --- | --- |
| **Critério de ativação (admin)** | Completou setup do cluster + fez primeiro upload + confirmou 3 réplicas saudáveis |
| **Critério de ativação (membro)** | Acessou web client + visualizou fotos da família + sync automático configurado no celular |
| **Momento "aha!" (admin)** | Quando vê no dashboard "3/3 réplicas saudáveis" e percebe que seus dados estão genuinamente distribuídos e protegidos |
| **Momento "aha!" (membro)** | Quando abre o navegador e vê as fotos de todos os celulares da família em uma timeline unificada, carregando instantaneamente |
| **Prazo esperado** | Admin: até 48h após instalação. Membro: até 24h após convite. |
| **Taxa de ativação alvo** | 70% dos que instalam (admin); 80% dos convidados (membros) <!-- inferido do PRD --> |

> Todo o onboarding deve ser desenhado para chegar no "3/3 réplicas saudáveis" o mais rápido possível. Se o admin não vê isso nas primeiras 2 horas, algo deu errado.

---

## Community Lifecycle Strategy

| Fase | Objetivo | Modelo | Ação Principal | Métrica |
| --- | --- | --- | --- | --- |
| **Aquisição** | Converter visitante em instalação | Self-service | README claro, `docker compose up` de 1 comando, demo screenshots | GitHub stars → Docker pulls |
| **Ativação** | Admin atingir "3/3 réplicas saudáveis" | Self-service + Docs | Wizard de setup em 5 etapas; docs de cada provedor cloud | Taxa de ativação: 70% |
| **Retenção** | Manter sistema rodando e família usando | Automatizado | Dashboard de saúde; alertas automáticos; sync contínuo | Uptime do cluster; fotos/semana |
| **Contribuição** | Transformar usuário em contribuidor | Comunidade | CONTRIBUTING.md claro; issues "good first issue"; roadmap público | PRs/mês; issues resolvidas pela comunidade |
| **Advocacia** | Transformar em promotor | Orgânico | Disaster drills públicos; métricas de durabilidade; blog posts | Menções em Reddit/HN; forks; indicações |

> **Comunidade como motor de retenção:** Discord/GitHub Discussions para troca de experiências entre admins familiares. Quando um usuário resolve um problema e posta a solução, o valor da comunidade cresce para todos.

---

## Retention

**Churn signals (contributor):** inactivity for 60+ days, ignored PRs, frustrating code review, burnout.

**Churn signals (user cluster):**

| Sinal | Ação Preventiva | Automação |
| --- | --- | --- |
| Orquestrador offline por >24h sem motivo planejado | Alerta por e-mail/push ao admin: "Seu cluster está offline" | Sim — heartbeat monitoring (RF-008) |
| Replicação degradada (<3 réplicas em >5% dos chunks) por >48h | Alerta: "X chunks com replicação abaixo do mínimo" + guia de resolução | Sim — auto-healing (RF-040) + alerta (RF-071) |
| Nenhum upload novo em 30 dias (família parou de usar) | Notificação: "Dica: configure o sync automático no celular" + link para docs | Sim — telemetria opt-in |
| Issue/discussão aberta sem resposta em >7 dias | Mantenedor responde; se for bug, prioriza fix | Não — requer atenção manual |
| Token OAuth expirado sem renovação automática | Alerta: "Conta X precisa re-autorizar" + botão de re-auth | Sim — RF-020 |

**Retention strategies:**

- **Confiança pelo dashboard:** Dashboard de saúde sempre visível mostrando "seus dados estão seguros: X réplicas, Y nós online, Z% integridade"
- **Disaster drills automáticos:** Mensalmente, o sistema reconstrói um arquivo aleatório de réplicas para provar que o recovery funciona — admin recebe relatório
- **Relatório mensal de valor:** "Este mês: X fotos preservadas, Y GB otimizados, Z% de economia vs cloud pago"
- **Onboarding progressivo:** Após ativação básica, sugerir: "Próximo passo: adicionar um segundo provedor cloud para diversidade de nós"

**Meta de retenção:**

| Métrica | Meta | Benchmark (open-source self-hosted) |
| --- | --- | --- |
| Instalações ativas após 1 mês (M1) | 80% | ~60-70% para projetos self-hosted <!-- inferido do PRD --> |
| Instalações ativas após 3 meses (M3) | 60% | ~40-50% para projetos self-hosted <!-- inferido do PRD --> |
| Instalações ativas após 12 meses (M12) | 40% | ~20-30% para projetos self-hosted <!-- inferido do PRD --> |
| Abandono mensal | < 8% | ~10-15% para projetos self-hosted <!-- inferido do PRD --> |

---

## Expansion

> Como expandir o uso de clusters existentes?

| Aspecto | Descrição |
| --- | --- |
| **Path de expansão** | 1 nó local → +1 bucket cloud → +2 membros da família → +2 nós cloud → todos os membros → nós em casas de parentes |
| **Sinais de readiness** | Cluster com >50% de capacidade usada; admin acessando docs de novos provedores; membros da família pedindo acesso |
| **Meta de expansão** | Clusters ativos passam de média 3 nós (mês 1) para 5+ nós (mês 6) <!-- inferido do PRD --> |

> Cada nó adicionado é um sinal de confiança. Se o admin adiciona um 4º e 5º nó, ele "comprou" a visão de longo prazo do Alexandria.

---

## Cluster Health Score

> Como medir a saúde de cada instalação de forma simples e acionável?

**Fórmula:**

| Componente | Peso | Como medir |
| --- | --- | --- |
| Saúde de replicação | 40% | % de chunks com 3+ réplicas (RF-042) |
| Atividade da família | 30% | Uploads/visualizações nos últimos 30 dias (telemetria opt-in) |
| Nós online | 20% | % de nós com heartbeat ativo vs total registrado |
| Integridade | 10% | Resultado do último scrubbing (RF-043) — 0 erros = 100% |

**Faixas:** Saudável (>80) / Atenção (50-80) / Risco (<50)

> Health Score visível no dashboard do admin. Quando cai abaixo de 80, mostrar banner com ação sugerida. Abaixo de 50, alerta por e-mail.

---

## Support

| Canal | Disponibilidade | Tempo de Primeira Resposta | Público |
| --- | --- | --- | --- |
| Documentação (docs site) | 24/7 | Imediato (self-service) | Todos |
| GitHub Discussions (Q&A) | Assíncrono | < 48h (comunidade + mantenedores) | Todos |
| GitHub Issues (bugs/features) | Assíncrono | < 7 dias (mantenedores) | Todos |
| Discord (chat da comunidade) | Assíncrono | < 24h (comunidade) | Todos |

**Tiers de suporte:**

| Tier | Descrição | Exemplos | Resolução |
| --- | --- | --- | --- |
| **Self-service** | Dúvidas de configuração, troubleshooting básico | "Como adicionar bucket R2", "Erro no Docker Compose", "Como configurar DNS" | Docs, FAQ, guias passo-a-passo |
| **Comunidade** | Problemas intermediários, integrações, otimizações | "Sync não funciona com OneDrive", "Performance lenta com muitos chunks" | GitHub Discussions, Discord — resolvido pela comunidade |
| **Mantenedor** | Bugs, falhas de segurança, perda de dados, design decisions | "Chunks corrompidos após scrubbing", "Seed phrase não recupera vaults dos membros", "Vulnerabilidade de segurança" | GitHub Issues → fix pelo mantenedor; segurança via responsible disclosure |

---

## Referral & Recognition Program

| Aspecto | Descrição |
| --- | --- |
| **Mecânica** | Orgânico — não há programa formal. Usuários satisfeitos compartilham naturalmente em comunidades (Reddit, Discord, blog pessoal). O README encoraja: "If you find Alexandria useful, tell a friend or star the repo." |
| **Incentivo** | Reconhecimento: contributors listados no README; top contributors destacados em releases. Não há incentivo financeiro (open-source). |
| **Quando ativar** | Naturalmente, após 3+ meses de uso estável. O disaster drill mensal gera confiança que motiva compartilhamento: "veja, funciona mesmo." |

> Para open-source, a melhor indicação é um projeto que funciona bem. Investir em qualidade > investir em programas de referral.

---

## Win-back (Re-engagement)

| Aspecto | Descrição |
| --- | --- |
| **Período de espera** | 60 dias após última atividade do cluster |
| **Estratégia** | E-mail (se opt-in) com changelog das últimas releases: "Desde que você parou de usar, adicionamos X, Y e Z. Seus dados ainda estão nos nós — basta reconectar o orquestrador." |
| **Vantagem estrutural** | Os dados do usuário continuam nos nós cloud/dispositivos mesmo sem o orquestrador rodando. Isso reduz drasticamente a barreira de retorno — não precisa re-upload de TBs. |

> O fato de os dados persistirem nos nós mesmo com orquestrador desligado é o maior trunfo de win-back: o custo de voltar é quase zero (subir o orquestrador de novo).

---

> Métricas detalhadas de relacionamento: ver [07-metricas-kpis.md](07-metricas-kpis.md)
