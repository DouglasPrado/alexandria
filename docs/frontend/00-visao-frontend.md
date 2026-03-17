# Visao do Frontend

Define o papel do frontend no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o frontend faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend

> Qual e a responsabilidade principal do frontend neste sistema?

| Responsabilidade        | Descricao                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface do usuario    | Apresentar galeria de fotos/videos com thumbnails instantaneos, timeline cronologica, busca por metadados e feedback visual de sync/upload/replicacao |
| Renderizacao de dados   | Transformar metadados do orquestrador (manifests, status de nos, saude do cluster) em dashboards, galerias e indicadores visuais de estado            |
| Interacao com APIs      | Comunicar-se com a API REST do orquestrador para metadata, e diretamente com nos de armazenamento para upload/download de chunks criptografados       |
| Gerenciamento de estado | Manter estado local de sync engine, fila de uploads, cache de thumbnails e estado de conexao com nos, com suporte a operacao offline-first            |
| Experiencia do usuario  | Garantir thumbnails carregando em <1s, busca em <1s, inicio de video em <3s, com estados de loading/vazio/erro/sucesso em todas as telas             |

O frontend do Alexandria e a camada de interacao entre a familia e o sistema de armazenamento distribuido. Ele funciona como a "porta de entrada" que abstrai toda a complexidade de criptografia, chunking, replicacao e distribuicao por tras de uma experiencia simples e fluida. Membros da familia com qualquer nivel tecnico devem conseguir salvar, visualizar e recuperar memorias sem entender a infraestrutura subjacente. O frontend tambem e responsavel por executar operacoes criticas no lado do cliente — como criptografia AES-256-GCM antes do upload (zero-knowledge) — garantindo que dados nunca saiam do dispositivo em texto puro.

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes de frontend?

| Principio                         | Descricao                                                                                                       | Implicacao Pratica                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Frontend como sistema distribuido | O frontend roda no dispositivo do usuario, sujeito a rede instavel e hardware variado                           | Otimizar para offline-first, tratar falhas de rede como caso normal, enfileirar operacoes localmente   |
| Separacao de responsabilidades    | Cada camada tem uma funcao clara e nao invade a outra                                                           | UI nao contem logica de negocio, hooks nao fazem fetch direto, criptografia isolada em modulo dedicado |
| Orientacao a features             | O codigo e organizado por dominio de negocio, nao por tipo de arquivo                                           | Pastas por feature (`features/gallery/`, `features/cluster/`, `features/recovery/`)                    |
| Performance by default            | Decisoes de performance sao tomadas desde o inicio, nao como otimizacao tardia                                  | Code splitting automatico, lazy loading de imagens, thumbnails pre-gerados, virtualizacao de listas    |
| Encrypt before render             | Dados sensiveis (tokens, chaves, credenciais) existem apenas em memoria e nunca sao persistidos no lado cliente | Vault descriptografado apenas em sessao ativa; tokens OAuth usados em memoria e descartados apos uso   |
| Graceful degradation              | O sistema continua funcional mesmo com nos offline ou orquestrador temporariamente indisponivel                  | Cache local de thumbnails, fila de uploads com retry, indicadores visuais de conectividade             |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Separacao de responsabilidades:** Um componente `PhotoCard` recebe dados via props e nao faz fetch. O hook `useGallery` busca os dados e o componente apenas renderiza o thumbnail.
- **Performance by default:** A galeria usa virtualizacao para renderizar apenas fotos visiveis no viewport, mesmo com acervos de 100k+ itens.
- **Encrypt before render:** A funcao de upload chama `encryptChunk(data, key)` no worker thread antes de enviar; a chave derivada e descartada da memoria apos o upload.
- **Graceful degradation:** Se o orquestrador estiver offline, o sync engine enfileira manifests localmente e envia quando reconectar.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o frontend sera executado?

- [x] Web Desktop
- [x] Web Mobile (responsivo)
- [ ] PWA <!-- candidato para fase 2 — avaliacao pendente -->
- [x] App Nativo (React Native) <!-- fase 3 — iOS e Android -->
- [x] Outro: Desktop nativo via Tauri <!-- fase 2 — macOS, Windows, Linux -->

**Plataforma primaria:** Web (Next.js) — responsivo para desktop e mobile, Chrome/Firefox/Safari ultimas 2 versoes
**Plataforma secundaria:** Desktop nativo (Tauri) na fase 2 e Mobile nativo (React Native) na fase 3

| Plataforma       | Tecnologia   | Fase | Observacao                                                |
| ---------------- | ------------ | ---- | --------------------------------------------------------- |
| Web Desktop      | Next.js      | 1    | Cliente principal do MVP; responsivo                      |
| Web Mobile       | Next.js      | 1    | Mesmo build do web desktop, layout responsivo             |
| Desktop nativo   | Tauri         | 2    | macOS, Windows, Linux; compartilha core-sdk com o web    |
| Mobile nativo    | React Native | 3    | iOS e Android; sync engine nativo para upload automatico |

---

## Stack Tecnologico

> Qual o stack principal do frontend?

| Camada           | Tecnologia              | Justificativa                                                                                  |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router) | SSR para SEO de paginas publicas, Server Components para dashboard, API routes para proxy seguro |
| UI Library       | React 19                | Server Components nativo, Suspense boundaries para loading states, ecossistema maduro          |
| State Management | Zustand v5              | API minimalista sem boilerplate, stores isoladas por dominio, compativel com SSR               |
| Data Fetching    | TanStack Query v5       | Cache automatico de metadata, revalidacao em background, retry com backoff, devtools           |
| Styling          | Tailwind CSS v4         | Utility-first sem runtime JS, temas via CSS custom properties, design system consistente       |
| Build Tool       | Turbopack               | Build incremental nativo do Next.js, otimizado para monorepo                                   |
| Monorepo         | Turborepo               | Compartilhamento de core-sdk entre web, desktop (Tauri) e mobile (React Native)                |
| Criptografia     | Web Crypto API          | AES-256-GCM nativo do browser, execucao em Web Workers para nao bloquear UI                    |
| Testes           | Vitest + Playwright     | Testes unitarios rapidos (Vitest) e E2E cross-browser (Playwright)                             |

---

## Tipos de Usuarios

> Quem sao os usuarios do frontend? Quais perfis de acesso existem?

| Perfil               | Descricao                                                         | Nivel de Acesso | Funcionalidades Principais                                                                                          |
| -------------------- | ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Administrador Familiar | Pai/mae tecnico que configura e mantem o sistema                 | Total           | Criar cluster, convidar membros, gerenciar nos, dashboard de saude, configurar quotas, recovery via seed phrase     |
| Membro Familiar       | Mae/pai, tios, avos que usam o sistema no dia-a-dia              | Padrao          | Upload de fotos/videos, visualizar galeria, download sob demanda, gerenciar seus dispositivos como nos              |
| Fotografo Amador      | Membro da familia que tira muitas fotos e grava videos           | Padrao          | Upload automatico via sync engine, visualizar status de processamento, liberar espaco no celular com placeholders   |
| Guardiao de Memorias  | Avo/avo ou membro mais velho, curador do acervo                  | Leitura         | Navegar timeline cronologica, buscar por data/evento/pessoa, visualizar fotos antigas com thumbnails instantaneos   |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-arquitetura.md)
