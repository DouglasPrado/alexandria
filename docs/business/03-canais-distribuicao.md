# Canais e Distribuição

Esta seção define **como o Alexandria chega até o usuário** e como ele descobre, avalia, adota e expande o uso do sistema. Como projeto open-source, os canais são predominantemente orgânicos e comunitários.

> **Nota:** O Alexandria não tem orçamento de marketing pago. A estratégia é 100% orgânica e comunitária no ano 1. "CAC" aqui refere-se a **custo em tempo do mantenedor**, não investimento financeiro.

---

## Canais

| Canal | Tipo | Custo (Tempo) | Escalabilidade | Fase | Prioridade |
| --- | --- | --- | --- | --- | --- |
| GitHub (README, stars, Explore) | Orgânico | Baixo — manter README e docs atualizados | Alta — descoberta passiva via busca e trending | Lançamento | Alta |
| r/selfhosted, r/datahoarder, r/degoogle | Orgânico / Comunidade | Médio — posts, respostas, engajamento contínuo | Média — alcance limitado ao Reddit mas altamente qualificado | Lançamento | Alta |
| Hacker News (Show HN) | Orgânico | Baixo — 1 post bem escrito | Alta — viral potencial; atinge público técnico global | Lançamento | Alta |
| Blog técnico / Dev.to / Medium | Orgânico / Conteúdo | Alto — escrever artigos técnicos leva tempo | Alta — conteúdo evergreen com SEO | Crescimento | Média |
| YouTube (demos, tutorials) | Orgânico / Conteúdo | Alto — produção de vídeo | Alta — vídeos técnicos têm longa cauda | Crescimento | Média |
| Docker Hub / awesome-selfhosted | Orgânico / Diretório | Baixo — submeter e manter listagem | Alta — descoberta passiva por público-alvo exato | Lançamento | Alta |
| Boca-a-boca entre self-hosters | Orgânico / Viral | Zero — acontece naturalmente se o produto for bom | Média — cresce com a base de usuários | Crescimento | Alta |
| Conferências / meetups (FOSDEM, self-hosted meetups) | Orgânico / Presencial | Alto — viagem + preparação | Baixa — alcance limitado mas alta conversão | Escala | Baixa |

> **Canal principal no lançamento:** GitHub + Reddit (r/selfhosted) + Show HN. Esses três canais juntos atingem ~90% dos early adopters.

> **Atribuição:** Para projeto open-source, a métrica é `GitHub stars → Docker pulls → instalações ativas`. Rastrear via telemetria opt-in de uso.

---

## Product-Led Growth

| Aspecto | Descrição |
| --- | --- |
| **Open-source (100% gratuito)** | Sem barreira financeira. O código é o produto. Qualquer pessoa pode clonar, buildar e rodar. |
| **Viral loop** | Sim — cada membro da família adicionado ao cluster é um novo usuário. O admin "vende" para a família ao configurar o sistema. Famílias conversam entre si: "como vocês guardam fotos?" → "a gente usa o Alexandria". |
| **Self-service onboarding** | Sim, para o admin técnico: `docker compose up` + wizard de configuração. Para membros da família: convite via link + app web. |
| **Contribuição como growth** | Usuários técnicos que contribuem código/docs/traduções ampliam alcance e qualidade, atraindo mais usuários. |

**Funil PLG:**

`Descobre (GitHub/Reddit)` → `Instala (Docker)` → `Configura cluster` → `Adiciona família` → `Família usa diariamente` → `Contribui/Indica`

> O momento em que o admin vê "3 réplicas saudáveis" pela primeira vez e o membro da família vê as fotos aparecendo automaticamente no navegador são os dois "aha moments" — um técnico, outro emocional.

---

## Funil de Adoção

| Etapa | Ação do Usuário | Canal / Ferramenta | Taxa de Conversão Esperada |
| --- | --- | --- | --- |
| **Descoberta** | Vê post no Reddit, Show HN, ou encontra no GitHub/awesome-selfhosted | Reddit, HN, GitHub, Docker Hub | 100% (topo) |
| **Avaliação** | Lê README, docs, compara com alternativas (Immich, Syncthing, Nextcloud) | GitHub README, docs site, comparativos | ~30% dos que descobrem <!-- inferido do PRD --> |
| **Instalação** | Roda `docker compose up`, completa wizard de setup | Docker, CLI, docs de instalação | ~40% dos que avaliam <!-- inferido do PRD --> |
| **Ativação** | Faz primeiro upload, vê thumbnail gerado, confirma réplicas | Web client, dashboard de saúde | ~70% dos que instalam <!-- inferido do PRD --> |
| **Retenção** | Adiciona família, configura sync automático, usa semanalmente | Sync engine, convites, web client | ~60% dos que ativam <!-- inferido do PRD --> |
| **Advocacia** | Indica para amigos, posta sobre o projeto, contribui código | Reddit, GitHub, boca-a-boca | ~20% dos retidos <!-- inferido do PRD --> |

> **Maior gargalo previsto:** Avaliação → Instalação. O setup inicial (VPS + DNS + provedores cloud) é o maior ponto de atrito. Investir em documentação excelente e `docker compose` de 1 comando é crítico.

---

## Jornada do Usuário

| Etapa | Ação do Usuário | Principal Dor | Solução |
| --- | --- | --- | --- |
| **Descoberta** | Vê post "I built a distributed family storage system" no Reddit/HN | "Parece interessante mas será que funciona de verdade?" | Demo rodando, screenshots reais, métricas de durabilidade (disaster drills públicos) |
| **Primeiro uso** | Clona repo, roda Docker Compose, acessa wizard de setup | "Preciso configurar VPS, DNS, bucket S3... é muito passo" | Wizard guiado em 5 etapas; `docker compose up` funciona out-of-the-box com storage local; cloud opcional depois |
| **Uso recorrente** | Adiciona membros da família, sync automático rodando, visualiza fotos | "Será que está realmente replicando? Posso confiar?" | Dashboard de saúde visível; notificações de replicação; disaster drill automático mensal |
| **Expansão** | Adiciona mais nós (NAS, novo bucket), digitaliza fotos antigas | "Quero mais espaço e mais redundância" | Comando simples para adicionar nó; guia de digitalização de fotos |
| **Advocacia** | Posta no Reddit, abre issues, contribui código, indica para família de amigos | "Quero ajudar mas não sei por onde começar" | CONTRIBUTING.md claro; issues tagueadas "good first issue"; roadmap público |

> **Momento "aha!" do admin:** Roda o primeiro disaster drill — deleta o orquestrador, digita 12 palavras, e vê o sistema se reconstruir sozinho. "Funciona de verdade."

> **Momento "aha!" da família:** Abre o navegador e vê todas as fotos de todos os celulares da família em uma timeline unificada, carregando instantaneamente. "Cadê aquela foto do Natal? Ah, tá aqui!"

---

## Parcerias Estratégicas

| Parceiro | Tipo de Parceria | Valor para Alexandria | Valor para o Parceiro | Status |
| --- | --- | --- | --- | --- |
| awesome-selfhosted | Diretório / Listagem | Descoberta passiva por público-alvo exato (~180K stars no GitHub) | Mais uma opção de qualidade na lista | A submeter |
| Cloudflare (R2) | Integração técnica | Free tier generoso (10GB grátis/mês); CDN global; S3-compatible | Showcase de uso inovador; potencial conversão para planos pagos | Integração planejada (RF-018) |
| Hetzner / Contabo | Conteúdo / Guia | VPS barata para guias de instalação (~€5/mês); público self-hoster | Tráfego e conversões via guias de setup | A prospectar |
| Immich / PhotoPrism | Integração / Complementar | Import de bibliotecas existentes; migração facilitada | Opção de backup distribuído para seus usuários | A prospectar |
| LinuxServer.io | Distribuição / Container | Container oficial mantido pela comunidade; credibilidade | Mais um container popular no portfólio | A prospectar |

> **Parceria crítica:** Listagem no awesome-selfhosted e integração com Cloudflare R2 são as duas parcerias mais importantes para o lançamento. O restante é "nice-to-have" para a fase de crescimento.
