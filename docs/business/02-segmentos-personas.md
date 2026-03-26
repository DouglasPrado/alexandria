# OSS Segments & Personas

<!-- updated: opensource — open-core -->This section defines **who uses and contributes to Alexandria**. Segments the target audience (users, contributors, sponsors), sizes the adoption opportunity, defines ideal profiles, and creates detailed personas that guide product and community decisions.

> **Note:** Alexandria is open-core. Segments include both **individual users** (self-hosters), **companies** (adopters and sponsors), **maintainers**, and **occasional contributors**. Value is measured in **adoption**, **community contributions**, and **memories preserved**.

---

## OSS User Segments

> What distinct groups does Alexandria serve? Each segment has different needs, adoption patterns, and contribution potential.

| Segment                                  | Description                                                                                                                                          | Estimated Size                                                              | Adoption Complexity                                      | Time Investment                                        | Priority |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | -------- |
| **Individual Developers** (self-hosters) | Families with at least 1 technical member who already runs home services (NAS, Plex, Home Assistant). Want full data control.                        | ~2–5M globally (r/selfhosted, r/homelab communities)                        | Self-service — installs independently with documentation | High — willing to configure VPS, DNS, buckets          | P0       |
| **Data Hoarders / Preservationists**     | Digital preservation enthusiasts who accumulate TBs of media and care about bit rot, redundancy, and long-term durability.                           | ~500K–1M globally (r/datahoarder, Archive.org volunteers)                   | Self-service — above-average technical expertise         | High — already invest in hardware and backup solutions | P0       |
| **Companies (users)**                    | Small companies or teams adopting Alexandria for internal media/document archiving in production. Potential open-core conversion to managed service. | Emerging segment — bootstrapped startups, design agencies, small media orgs | Self-service with some support                           | Medium                                                 | P2       |
| **Companies (sponsors)**                 | Companies that benefit from Alexandria and fund development via GitHub Sponsors or OpenCollective. Typically use it in production.                   | Small — 5–20 companies in Year 1                                            | N/A (sponsorship, not adoption)                          | Low (financial only)                                   | P1       |
| **Maintainers**                          | Core team maintaining the project (currently Douglas). Responsible for releases, security, architecture decisions.                                   | 1 now; target 2–3 by Year 1                                                 | N/A (promoted from contributors)                         | Very High                                              | P0       |
| **Occasional Contributors**              | Developers who file issues, submit PRs for bug fixes, improve docs, or add integrations. May contribute 1–10 PRs.                                    | Target: 50–100 in Year 1                                                    | Low barrier (good-first-issue label, CONTRIBUTING.md)    | Low-Medium                                             | P1       |

> For the MVP, focus on **Individual Developers** (P0) and **Data Hoarders** (P0) — natural early adopters who tolerate manual setup and can contribute technical feedback and code.

---

## Market Sizing (Adoption)

> Three-level sizing to understand real adoption potential. Conservative numbers based on existing communities.

| Level                                   | Segment                                                                       | Value                                                   | Calculation Method                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Total Developer Market**              | All developers + self-hosters who could use or contribute to Alexandria       | ~10M globally                                           | r/selfhosted (1.5M), r/datahoarder (700K), r/degoogle (300K) + analogous non-Reddit communities; 2–3× multiplier                                  |
| **Reachable Community**                 | Self-hosters + data hoarders + privacy-conscious tech-savvy with ≥200GB media | ~2–5M potential users                                   | Subset with both technical ability and the specific pain Alexandria solves                                                                        |
| **Active Contributors Target (Year 1)** | Early adopters who install and actively use + those who submit PRs            | 500–1,000 active installations; 10–50 code contributors | Baseline: similar OSS projects (Immich: ~50K stars in 2 years; PhotoPrism: ~35K stars in 4 years). Conservative target for v1 with functional MVP |

---

## Ideal Adopter Profile + Ideal Contributor Profile

### Ideal Adopter Profile

> Qual é o perfil do usuário ideal — aquele que extrai mais valor do produto e tem maior probabilidade de adotar, reter e contribuir?

| Atributo                 | Valor                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| Composição familiar      | 2-6 membros, múltiplas gerações (pais, filhos, avós)                          |
| Volume de mídia          | 200GB-5TB de fotos e vídeos acumulados                                        |
| Nível técnico (do admin) | Sabe usar terminal, configurar VPS, gerenciar DNS                             |
| Infraestrutura existente | Pelo menos 1 dispositivo sempre ligado (NAS, mini-PC, VPS) + 2-3 contas cloud |
| Motivação primária       | Preservação de longo prazo + independência de Big Tech                        |
| Investimento aceitável   | R$25-50/mês em infraestrutura (VPS + domínio); tempo de setup: 1-2 horas      |
| Tomador de decisão       | O membro técnico da família (geralmente pai/mãe ou filho mais velho)          |
| Ciclo de adoção          | 1-7 dias (descobre → testa → instala → migra primeiras fotos)                 |

---

### Ideal Contributor Profile

| Attribute          | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| Technical profile  | Backend or full-stack developer; TypeScript/Node.js experience preferred                |
| Motivation         | Solves their own storage problem; wants to learn distributed systems or cryptography    |
| First contribution | Fixes a bug found while self-hosting, improves docs, or adds a storage provider adapter |
| Engagement         | Files detailed issues; reads existing code before asking questions; tests PRs locally   |
| Progression path   | First PR → regular contributor → committer → maintainer                                 |

---

## Personas

### Persona 1: Douglas, the Family Admin

| Atributo                  | Descrição                                                                      |
| ------------------------- | ------------------------------------------------------------------------------ |
| **Nome**                  | Douglas, o Admin Familiar                                                      |
| **Idade**                 | 30-45 anos                                                                     |
| **Localização**           | Capitais ou cidades médias — Brasil, Europa, EUA                               |
| **Profissão**             | Desenvolvedor de software, SRE, ou profissional de TI                          |
| **Renda mensal**          | R$8.000-20.000                                                                 |
| **Escolaridade**          | Superior completo em Computação ou área técnica                                |
| **Familiaridade digital** | Alta — roda containers Docker, gerencia VPS, contribui em projetos open-source |

**Comportamento:**

- Já usa Nextcloud, Syncthing ou Immich mas não está satisfeito com a durabilidade e redundância
- Tem 3-4 HDs com backups parciais espalhados pela casa, alguns sem verificar há anos
- Assina Google One 200GB para a família mas quer sair por questão de privacidade e custo
- Frequenta r/selfhosted, Hacker News e comunidades de homelab

**Objetivos:**

- Garantir que as fotos da família sobrevivam por décadas, mesmo em caso de desastre
- Eliminar dependência de Google/Apple/Dropbox para armazenamento
- Ter um sistema que se auto-repare e não precise de manutenção manual constante
- Envolver a família no uso sem exigir conhecimento técnico deles

**Frustrações:**

- Syncthing sincroniza mas não deduplica nem otimiza — espaço acaba rápido
- Immich é ótimo para galeria mas não distribui dados entre provedores cloud
- Nextcloud é lento e pesado para o que precisa (só quer fotos, não um Office completo)
- Já perdeu fotos de viagem porque o HD backup estava desatualizado

**Citação representativa:**

> "Eu tenho 500GB de fotos da família em 3 lugares diferentes, mas nenhum deles é realmente confiável a longo prazo. Preciso de algo que cuide disso sozinho."

---

### Persona 2: Maria, the Non-Technical Family Member

| Atributo                  | Descrição                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------- |
| **Nome**                  | Maria, a Mãe que Usa                                                                    |
| **Idade**                 | 35-55 anos                                                                              |
| **Localização**           | Qualquer cidade — usa o sistema configurado pelo membro técnico da família              |
| **Profissão**             | Diversas — professora, administrativa, profissional de saúde                            |
| **Renda mensal**          | R$3.000-8.000                                                                           |
| **Escolaridade**          | Superior completo ou médio                                                              |
| **Familiaridade digital** | Média — usa WhatsApp, Instagram e Google Fotos diariamente; não sabe o que é "terminal" |

**Comportamento:**

- Tira 10-30 fotos por dia (filhos, família, comida, passeios)
- Envia fotos pelo WhatsApp para o grupo da família (duplicação massiva)
- Celular sempre com "armazenamento quase cheio"; deleta fotos para liberar espaço
- Confia no Google Fotos como backup único

**Objetivos:**

- Tirar fotos sem se preocupar com espaço no celular
- Ver fotos antigas da família facilmente (Natal, aniversários, viagens)
- Saber que as fotos estão seguras sem precisar entender como

**Frustrações:**

- Celular fica cheio e precisa deletar fotos (perde memórias)
- Não sabe se o backup está funcionando; tem medo de perder tudo
- Fotos espalhadas entre 3 celulares antigos, Google Fotos e um HD que "o marido" tem em algum lugar
- Google Fotos ficou pago e não quer pagar R$35/mês

**Citação representativa:**

> "Eu só quero que minhas fotos estejam seguras. Não preciso entender como funciona — só precisa funcionar."

---

### Persona 3: Grandpa João, the Memory Guardian

| Atributo                  | Descrição                                                                    |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Nome**                  | Vovô João, o Guardião de Memórias                                            |
| **Idade**                 | 60-80 anos                                                                   |
| **Localização**           | Interior ou capital — usa tablet ou computador em casa                       |
| **Profissão**             | Aposentado                                                                   |
| **Renda mensal**          | R$2.000-5.000 (aposentadoria)                                                |
| **Escolaridade**          | Variável — fundamental a superior                                            |
| **Familiaridade digital** | Baixa — usa WhatsApp e às vezes YouTube; precisa de ajuda para instalar apps |

**Comportamento:**

- Tem caixas de fotos impressas antigas que quer digitalizar
- Pede para os netos mostrarem fotos de eventos da família no celular
- Gosta de reviver memórias antigas, especialmente de netos pequenos e eventos familiares
- Não entende a diferença entre "nuvem" e "internet"

**Objetivos:**

- Ver fotos e vídeos antigos da família sem complicação
- Encontrar aquela foto específica do Natal de 2018 sem pedir para alguém
- Saber que as memórias da família estão preservadas para os netos

**Frustrações:**

- Não consegue encontrar fotos antigas; estão "em algum lugar no computador do Douglas"
- Precisa pedir ajuda para tudo relacionado a tecnologia
- Tem medo de "mexer em algo errado" e perder fotos

**Citação representativa:**

> "Eu só quero ver aquela foto do aniversário do Pedrinho. Não sei onde está... talvez no celular da Maria?"

---

### Persona 4: Lucas, the First-Time Contributor

| Attribute                | Description                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Name**                 | Lucas, the First-Time Contributor                                                                      |
| **Age**                  | 22–30 years old                                                                                        |
| **Location**             | Any city — works remotely as a junior/mid developer                                                    |
| **Role**                 | Junior/Mid developer, TypeScript/Node.js                                                               |
| **Motivation**           | Wants real OSS contributions for portfolio; interested in distributed systems                          |
| **Behavior**             | Finds Alexandria via r/selfhosted or GitHub Explore; installs it; hits a bug; opens an issue; fixes it |
| **Goal**                 | Merged PR on a real project; learn how distributed systems are built in practice                       |
| **Frustration**          | "Good first issues" that are stale or unclear; code review that never comes; complex local setup       |
| **Representative quote** | "I want to contribute to a real project, not just tutorial code. And I actually use this thing."       |

---

### Early Adopters

> Quem são os primeiros usuários que adotariam o produto? Early adopters sentem a dor mais intensamente e aceitam uma solução imperfeita.

| Característica             | Descrição                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perfil**                 | Desenvolvedores/SREs com família, que já rodam serviços self-hosted (Docker, VPS) e têm >500GB de mídia familiar                                           |
| **Por que adotariam cedo** | Já tentaram Syncthing, Immich, Nextcloud e sentiram a limitação de nenhum resolver distribuição + criptografia + otimização + recovery em um único sistema |
| **Onde encontrá-los**      | r/selfhosted, r/datahoarder, Hacker News (Show HN), comunidades Docker/homelab, grupos Telegram de self-hosting, GitHub Explore                            |
| **O que esperam**          | CLI funcional, Docker Compose para setup, documentação técnica clara, API aberta                                                                           |
| **O que toleram**          | Interface web básica, setup manual de provedores cloud, bugs em edge cases, features incompletas (sem mobile app ainda)                                    |
| **Quantidade alvo**        | 50-100 instalações ativas no primeiro ano, com pelo menos 10 contribuidores de código                                                                      |

> Alexandria early adopters are technical users who will read the entire README, fork the repo, open detailed issues, and potentially contribute code. They don't represent the total market — they are the "build with us" initial cohort.

> **Validation criterion:** If 50 early adopters use the system for 6 months without data loss and with NPS > 8, the product is ready to expand to the P1 segment (non-technical families via the managed service).
