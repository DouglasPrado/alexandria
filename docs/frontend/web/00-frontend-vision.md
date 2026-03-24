# Visão do Frontend Web

Define o papel do frontend web no sistema, os princípios que guiam decisões técnicas e o stack tecnológico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o frontend web faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisões.

<!-- do blueprint: 00-context.md, 01-vision.md, 02-architecture_principles.md -->

---

## Objetivo do Frontend Web

> Qual é a responsabilidade principal do frontend web neste sistema?

| Responsabilidade | Descrição |
| --- | --- |
| Interface do usuário | Apresentar galeria de fotos/vídeos/documentos, painéis administrativos e fluxos de onboarding de forma responsiva e acessível |
| Renderização de dados | Transformar metadados do orquestrador (thumbnails, previews, status de arquivos, saúde de nós) em UI navegável com lazy loading e virtualização |
| Interação com APIs | Comunicação REST com o orquestrador via HTTPS/TLS 1.3 — upload multipart, polling de status, download sob demanda |
| Gerenciamento de estado | Manter estado de upload queue (Zustand), cache de servidor (TanStack Query) e estado de URL (query params) sincronizados |
| Experiência do usuário | Garantir navegação fluida em galerias com 10k+ itens, feedback imediato em uploads e operações administrativas responsivas |

O frontend web é o **cliente principal do Alexandria** (Fase 1). É a interface pela qual o administrador cria o cluster, gerencia nós e convida membros, e pela qual todos os membros fazem upload, navegam pela galeria e baixam arquivos. O web client delega toda criptografia e processamento ao orquestrador — não executa operações criptográficas no browser.

---

## Princípios Arquiteturais

> Quais regras fundamentais guiam as decisões do frontend web?

| Princípio | Descrição | Implicação Prática |
| --- | --- | --- |
| Frontend como camada de apresentação | O web client é thin client — toda criptografia, chunking e distribuição acontecem no orquestrador | Sem Web Crypto API ou processamento pesado no browser; foco em UX |
| Separação de responsabilidades | Cada camada tem função clara e não invade a outra | UI não contém lógica de negócio, hooks não fazem fetch direto |
| Orientação a features | Código organizado por domínio de negócio, não por tipo de arquivo | Pastas por feature (`features/gallery/`, `features/nodes/`, `features/settings/`) |
| Performance by default | Decisões de performance tomadas desde o início, não como otimização tardia | Code splitting automático, lazy loading de rotas, imagens via `next/image` |
| Resiliência a falhas de rede | Uploads podem falhar e ser retomados; galeria funciona com cache | Upload queue com retry automático, TanStack Query com stale-while-revalidate |
| Simplicidade operacional | Preferir soluções simples que um time de 1 pessoa consiga manter | Polling em vez de WebSocket na v1, monólito Next.js sem microfrontends |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Princípios em ação</summary>

- **Separação de responsabilidades:** Um componente `FileCard` recebe dados via props e não faz fetch. O hook `useFiles` busca os dados e o componente apenas renderiza.
- **Performance by default:** Todas as rotas usam `dynamic(() => import(...))` para code splitting automático. Galeria usa virtualização para 10k+ itens.
- **Resiliência a falhas:** Upload queue persiste estado no Zustand — se o JWT expirar, pausa uploads e retoma após re-autenticação.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o frontend web será executado?

- [x] Web Desktop
- [x] Web Mobile (responsivo)
- [ ] PWA
- [ ] App Nativo (React Native)

**Plataforma primária:** Web Desktop (admin e galeria completa)
**Plataforma secundária:** Web Mobile responsivo (galeria e upload)

O web client é responsivo mas não é PWA na v1. Clientes nativos (mobile Fase 3, desktop Fase 2) terão apps dedicados.

---

## Stack Tecnológico

> Qual o stack principal do frontend web?

<!-- do blueprint: 10-architecture_decisions.md (ADR-001, ADR-002), 00-context.md (restrições) -->

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | SSR, Server Components, otimização automática de imagens, deploy simples |
| UI Library | React 19 | Server Components nativo, Actions, `use()` hook, concurrent rendering |
| State Management | Zustand v5 | API simples, sem boilerplate, stores isoladas (upload queue, UI state) |
| Data Fetching | TanStack Query v5 | Cache automático, revalidação, polling, devtools, stale-while-revalidate |
| Styling | Tailwind CSS v4 | Engine reescrita, CSS-first config, zero-JS runtime, design system consistente |
| Build Tool | Turbopack | Builds incrementais, bundler nativo do Next.js, HMR rápido |
| Formulários | React Hook Form + Zod | Validação tipada, performance (uncontrolled inputs), integração com Server Actions |
| HTTP Client | Fetch API nativa | Suficiente para REST; sem overhead de Axios; streaming support nativo |

---

## Tipos de Usuários

> Quem são os usuários do frontend web? Quais perfis de acesso existem?

<!-- do blueprint: 00-context.md (atores), 13-security.md (RBAC) -->

| Perfil | Descrição | Nível de Acesso | Funcionalidades Principais |
| --- | --- | --- | --- |
| Administrador Familiar | Membro técnico que cria cluster, gerencia nós e membros, monitora saúde e executa recovery | Total (admin) | Criar cluster, seed phrase, convidar membros, adicionar/remover nós, painel de alertas, recovery |
| Membro Familiar | Pai/mãe, tios, avós que usam o sistema no dia-a-dia | Leitura + Escrita (member) | Upload de fotos/vídeos/documentos, navegar galeria, buscar, baixar arquivos |
| Membro Leitura | Membro convidado com acesso restrito | Somente leitura (reader) | Navegar galeria, buscar, visualizar previews, baixar arquivos |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticação e autorização: (ver [01-architecture.md](01-architecture.md))
