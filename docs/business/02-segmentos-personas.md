# Segmentos e Personas

Esta seção define **quem são os usuários** do Alexandria. Segmenta o público-alvo, dimensiona a oportunidade de adoção, traça o perfil ideal de usuário e cria personas detalhadas que guiam decisões de produto e comunidade.

> **Nota:** O Alexandria é open-source e gratuito. "Segmentos" e "mercado" referem-se a grupos de adoção, não a clientes pagantes. O valor é medido em **adoção**, **contribuições da comunidade** e **dados preservados**.

---

## Segmentos de Usuário

> Quais grupos distintos de usuários o produto atende? Cada segmento tem necessidades suficientemente diferentes para justificar tratamento distinto.

| Segmento | Descrição | Tamanho Estimado | Complexidade de Adoção | Disposição a Investir Tempo | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Famílias técnicas (self-hosters) | Famílias com pelo menos 1 membro técnico que já roda serviços em casa (NAS, Plex, Home Assistant). Querem controle total sobre seus dados. | ~2-5M globalmente (comunidades r/selfhosted, r/homelab) | Self-service — instala sozinho com documentação | Alta — dispostos a configurar VPS, DNS, buckets | P0 |
| Data hoarders / preservacionistas | Entusiastas de preservação digital que acumulam TBs de mídia e se preocupam com bit rot, redundância e durabilidade de longo prazo. | ~500K-1M globalmente (r/datahoarder, Archive.org voluntários) | Self-service — expertise técnica acima da média | Alta — já investem em hardware e soluções de backup | P0 |
| Famílias não-técnicas preocupadas com privacidade | Famílias que desconfiam de Big Tech mas não sabem configurar alternativas. Precisam de setup simples ou de um membro técnico que faça por eles. | ~10-50M globalmente (movimento "degoogle") | Assistida — precisam de guia passo-a-passo ou ajuda de membro técnico | Baixa — querem que "simplesmente funcione" | P1 |
| Fotógrafos amadores / criadores de conteúdo | Pessoas que geram grandes volumes de fotos e vídeos (10-50GB/mês) e precisam de armazenamento barato com organização. | ~5-10M globalmente | Self-service a assistida | Média — dispostos a aprender se economizar dinheiro | P2 |

> Para o MVP, foco em **famílias técnicas** (P0) e **data hoarders** (P0) — são os early adopters naturais que toleram configuração manual e podem contribuir com feedback técnico e código.

---

## Dimensionamento de Mercado (Adoção)

> Dimensionamento em três níveis para entender o potencial real de adoção. Números conservadores baseados em comunidades existentes.

| Nível | Segmento | Valor | Método de Cálculo |
| --- | --- | --- | --- |
| **TAM** (Mercado Total) | Todas as famílias com >100GB de fotos/vídeos que gostariam de solução de backup distribuído | ~200M de domicílios globalmente <!-- inferido do PRD --> | Domicílios com smartphone + >100GB de mídia acumulada (estimativa conservadora: 10% dos 2B de smartphones) |
| **Mercado Alcançável** | Self-hosters + data hoarders + privacy-conscious tech-savvy | ~5-10M de usuários potenciais | r/selfhosted (1.5M), r/datahoarder (700K), r/degoogle (300K) + comunidades análogas em outras plataformas; multiplicador 2-3x para não-Reddit |
| **Meta Ano 1** | Early adopters que instalam e usam ativamente | ~500-1.000 instalações ativas | Base: projetos similares open-source (Immich: ~50K stars em 2 anos; Photoprism: ~35K stars). Meta conservadora para v1 com MVP funcional |

---

## ICP — Ideal User Profile

> Qual é o perfil do usuário ideal — aquele que extrai mais valor do produto e tem maior probabilidade de adotar, reter e contribuir?

| Atributo | Valor |
| --- | --- |
| Composição familiar | 2-6 membros, múltiplas gerações (pais, filhos, avós) |
| Volume de mídia | 200GB-5TB de fotos e vídeos acumulados |
| Nível técnico (do admin) | Sabe usar terminal, configurar VPS, gerenciar DNS |
| Infraestrutura existente | Pelo menos 1 dispositivo sempre ligado (NAS, mini-PC, VPS) + 2-3 contas cloud |
| Motivação primária | Preservação de longo prazo + independência de Big Tech |
| Investimento aceitável | R$25-50/mês em infraestrutura (VPS + domínio); tempo de setup: 1-2 horas |
| Tomador de decisão | O membro técnico da família (geralmente pai/mãe ou filho mais velho) |
| Ciclo de adoção | 1-7 dias (descobre → testa → instala → migra primeiras fotos) |

---

## Personas

### Persona 1: Douglas, o Admin Familiar

| Atributo | Descrição |
| --- | --- |
| **Nome** | Douglas, o Admin Familiar |
| **Idade** | 30-45 anos |
| **Localização** | Capitais ou cidades médias — Brasil, Europa, EUA |
| **Profissão** | Desenvolvedor de software, SRE, ou profissional de TI |
| **Renda mensal** | R$8.000-20.000 |
| **Escolaridade** | Superior completo em Computação ou área técnica |
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

### Persona 2: Maria, a Mãe que Usa

| Atributo | Descrição |
| --- | --- |
| **Nome** | Maria, a Mãe que Usa |
| **Idade** | 35-55 anos |
| **Localização** | Qualquer cidade — usa o sistema configurado pelo membro técnico da família |
| **Profissão** | Diversas — professora, administrativa, profissional de saúde |
| **Renda mensal** | R$3.000-8.000 |
| **Escolaridade** | Superior completo ou médio |
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

### Persona 3: Vovô João, o Guardião de Memórias

| Atributo | Descrição |
| --- | --- |
| **Nome** | Vovô João, o Guardião de Memórias |
| **Idade** | 60-80 anos |
| **Localização** | Interior ou capital — usa tablet ou computador em casa |
| **Profissão** | Aposentado |
| **Renda mensal** | R$2.000-5.000 (aposentadoria) |
| **Escolaridade** | Variável — fundamental a superior |
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

### Early Adopters

> Quem são os primeiros usuários que adotariam o produto? Early adopters sentem a dor mais intensamente e aceitam uma solução imperfeita.

| Característica | Descrição |
| --- | --- |
| **Perfil** | Desenvolvedores/SREs com família, que já rodam serviços self-hosted (Docker, VPS) e têm >500GB de mídia familiar |
| **Por que adotariam cedo** | Já tentaram Syncthing, Immich, Nextcloud e sentiram a limitação de nenhum resolver distribuição + criptografia + otimização + recovery em um único sistema |
| **Onde encontrá-los** | r/selfhosted, r/datahoarder, Hacker News (Show HN), comunidades Docker/homelab, grupos Telegram de self-hosting, GitHub Explore |
| **O que esperam** | CLI funcional, Docker Compose para setup, documentação técnica clara, API aberta |
| **O que toleram** | Interface web básica, setup manual de provedores cloud, bugs em edge cases, features incompletas (sem mobile app ainda) |
| **Quantidade alvo** | 50-100 instalações ativas no primeiro ano, com pelo menos 10 contribuidores de código |

> Early adopters do Alexandria são técnicos que vão ler o README inteiro, fazer fork, abrir issues detalhadas e potencialmente contribuir código. Não representam o mercado total — são os "build with us" iniciais.

> **Critério de validação:** Se 50 early adopters usarem o sistema por 6 meses sem perda de dados e com NPS > 8, o produto está pronto para expandir para o segmento P1 (famílias não-técnicas).
