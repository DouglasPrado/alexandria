# Community Channels & Distribution

<!-- updated: opensource — open-core -->This section defines **how Alexandria reaches users and contributors** and how they discover, evaluate, adopt, and expand their use of the system. As an open-core project, channels are predominantly organic and community-driven.

> **Note:** Alexandria has zero paid marketing budget. The strategy is 100% organic and community-driven in Year 1. "Acquisition Cost" refers to **maintainer time cost**, not financial investment.

---

## Channels

| Channel                                                 | Type                | Acquisition Cost                               | Scalability                                               | Phase  | Priority |
| ------------------------------------------------------- | ------------------- | ---------------------------------------------- | --------------------------------------------------------- | ------ | -------- |
| **GitHub** (README, stars, Explore, Discussions)        | Organic             | Low — maintain README and docs                 | High — passive discovery via search and trending          | Launch | High     |
| **Package registries** (Docker Hub, GHCR)               | Organic / Directory | Low — publish and maintain image               | High — passive discovery by exact target audience         | Launch | High     |
| **r/selfhosted, r/datahoarder, r/degoogle**             | Organic / Community | Medium — posts, replies, continuous engagement | Medium — limited to Reddit but highly qualified audience  | Launch | High     |
| **Hacker News** (Show HN)                               | Organic             | Low — 1 well-crafted post                      | High — viral potential; reaches global technical audience | Launch | High     |
| **awesome-selfhosted** listing                          | Organic / Directory | Low — submit and maintain listing              | High — passive discovery by exact target (180K+ stars)    | Launch | High     |
| **Documentation site** (SEO, Getting Started)           | Organic / Content   | Medium — write and maintain docs               | High — evergreen SEO long-tail                            | Launch | High     |
| **GitHub Discussions**                                  | Community           | Low — moderation only                          | High — self-sustaining with community growth              | Launch | High     |
| **Discord**                                             | Community           | Medium — active moderation + engagement        | High — real-time support, contributor coordination        | Launch | High     |
| **Technical blog** / Dev.to / site                      | Organic / Content   | High — writing technical articles takes time   | High — evergreen SEO content                              | Growth | Medium   |
| **Twitter/X, Reddit, Hacker News, Dev.to**              | Social              | Medium — posts + engagement                    | Medium                                                    | Growth | Medium   |
| **YouTube** (demos, tutorials)                          | Organic / Content   | High — video production                        | High — technical videos have long tail                    | Growth | Medium   |
| **Conferences / meetups** (FOSDEM, self-hosted meetups) | Organic / In-person | High — travel + preparation                    | Low — limited reach but high conversion                   | Scale  | Low      |

> **Canal principal no lançamento:** GitHub + Reddit (r/selfhosted) + Show HN. Esses três canais juntos atingem ~90% dos early adopters.

> **Atribuição:** Para projeto open-source, a métrica é `GitHub stars → Docker pulls → instalações ativas`. Rastrear via telemetria opt-in de uso.

---

## Product-Led & Community-Led Growth

| Aspecto                         | Descrição                                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open-source (100% gratuito)** | Sem barreira financeira. O código é o produto. Qualquer pessoa pode clonar, buildar e rodar.                                                                                                                         |
| **Viral loop**                  | Sim — cada membro da família adicionado ao cluster é um novo usuário. O admin "vende" para a família ao configurar o sistema. Famílias conversam entre si: "como vocês guardam fotos?" → "a gente usa o Alexandria". |
| **Self-service onboarding**     | Sim, para o admin técnico: `docker compose up` + wizard de configuração. Para membros da família: convite via link + app web.                                                                                        |
| **Contribuição como growth**    | Usuários técnicos que contribuem código/docs/traduções ampliam alcance e qualidade, atraindo mais usuários.                                                                                                          |

**Contribution Funnel:**

`Discovery (GitHub/Reddit)` → `First Use (Docker install)` → `First Issue (files a bug or question)` → `First PR (fixes something)` → `Regular Contributor` → `Committer / Maintainer`

**Adoption Funnel:**

`Discovery` → `Install` → `Use` → `File Issue` → `Submit PR` → `Review` → `Merge` → `Become Maintainer`

> O momento em que o admin vê "3 réplicas saudáveis" pela primeira vez e o membro da família vê as fotos aparecendo automaticamente no navegador são os dois "aha moments" — um técnico, outro emocional.

---

## Adoption Funnel

| Etapa          | Ação do Usuário                                                          | Canal / Ferramenta                     | Taxa de Conversão Esperada                      |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------- |
| **Descoberta** | Vê post no Reddit, Show HN, ou encontra no GitHub/awesome-selfhosted     | Reddit, HN, GitHub, Docker Hub         | 100% (topo)                                     |
| **Avaliação**  | Lê README, docs, compara com alternativas (Immich, Syncthing, Nextcloud) | GitHub README, docs site, comparativos | ~30% dos que descobrem <!-- inferido do PRD --> |
| **Instalação** | Roda `docker compose up`, completa wizard de setup                       | Docker, CLI, docs de instalação        | ~40% dos que avaliam <!-- inferido do PRD -->   |
| **Ativação**   | Faz primeiro upload, vê thumbnail gerado, confirma réplicas              | Web client, dashboard de saúde         | ~70% dos que instalam <!-- inferido do PRD -->  |
| **Retenção**   | Adiciona família, configura sync automático, usa semanalmente            | Sync engine, convites, web client      | ~60% dos que ativam <!-- inferido do PRD -->    |
| **Advocacia**  | Indica para amigos, posta sobre o projeto, contribui código              | Reddit, GitHub, boca-a-boca            | ~20% dos retidos <!-- inferido do PRD -->       |

> **Maior gargalo previsto:** Avaliação → Instalação. O setup inicial (VPS + DNS + provedores cloud) é o maior ponto de atrito. Investir em documentação excelente e `docker compose` de 1 comando é crítico.

---

## Contributor Journey

| Etapa              | Ação do Usuário                                                               | Principal Dor                                             | Solução                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Descoberta**     | Vê post "I built a distributed family storage system" no Reddit/HN            | "Parece interessante mas será que funciona de verdade?"   | Demo rodando, screenshots reais, métricas de durabilidade (disaster drills públicos)                            |
| **Primeiro uso**   | Clona repo, roda Docker Compose, acessa wizard de setup                       | "Preciso configurar VPS, DNS, bucket S3... é muito passo" | Wizard guiado em 5 etapas; `docker compose up` funciona out-of-the-box com storage local; cloud opcional depois |
| **Uso recorrente** | Adiciona membros da família, sync automático rodando, visualiza fotos         | "Será que está realmente replicando? Posso confiar?"      | Dashboard de saúde visível; notificações de replicação; disaster drill automático mensal                        |
| **Expansão**       | Adiciona mais nós (NAS, novo bucket), digitaliza fotos antigas                | "Quero mais espaço e mais redundância"                    | Comando simples para adicionar nó; guia de digitalização de fotos                                               |
| **Advocacia**      | Posta no Reddit, abre issues, contribui código, indica para família de amigos | "Quero ajudar mas não sei por onde começar"               | CONTRIBUTING.md claro; issues tagueadas "good first issue"; roadmap público                                     |

> **Momento "aha!" do admin:** Roda o primeiro disaster drill — deleta o orquestrador, digita 12 palavras, e vê o sistema se reconstruir sozinho. "Funciona de verdade."

> **Momento "aha!" da família:** Abre o navegador e vê todas as fotos de todos os celulares da família em uma timeline unificada, carregando instantaneamente. "Cadê aquela foto do Natal? Ah, tá aqui!"

---

## Ecosystem Integrations & Partnerships

| Parceiro            | Tipo de Parceria          | Valor para Alexandria                                              | Valor para o Parceiro                                           | Status                        |
| ------------------- | ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| awesome-selfhosted  | Diretório / Listagem      | Descoberta passiva por público-alvo exato (~180K stars no GitHub)  | Mais uma opção de qualidade na lista                            | A submeter                    |
| Cloudflare (R2)     | Integração técnica        | Free tier generoso (10GB grátis/mês); CDN global; S3-compatible    | Showcase de uso inovador; potencial conversão para planos pagos | Integração planejada (RF-018) |
| Contabo             | Conteúdo / Guia           | VPS barata para guias de instalação (~€5/mês); público self-hoster | Tráfego e conversões via guias de setup                         | A prospectar                  |
| Immich / PhotoPrism | Integração / Complementar | Import de bibliotecas existentes; migração facilitada              | Opção de backup distribuído para seus usuários                  | A prospectar                  |
| LinuxServer.io      | Distribuição / Container  | Container oficial mantido pela comunidade; credibilidade           | Mais um container popular no portfólio                          | A prospectar                  |

> **Parceria crítica:** Listagem no awesome-selfhosted e integração com Cloudflare R2 são as duas parcerias mais importantes para o lançamento. O restante é "nice-to-have" para a fase de crescimento.
