# Visao do Frontend

Define o papel do frontend no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o frontend faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend

> Qual e a responsabilidade principal do frontend neste sistema?

| Responsabilidade        | Descricao                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| Interface do usuario    | {{Como o frontend apresenta informacoes ao usuario}}              |
| Renderizacao de dados   | {{Como os dados do backend sao transformados em UI}}              |
| Interacao com APIs      | {{Como o frontend se comunica com o backend}}                     |
| Gerenciamento de estado | {{Como o estado da aplicacao e mantido e sincronizado}}           |
| Experiencia do usuario  | {{Como o frontend garante fluidez, acessibilidade e performance}} |

{{Descreva o papel do frontend no contexto do produto}}

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes de frontend?

| Principio                         | Descricao                                                                             | Implicacao Pratica                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Frontend como sistema distribuido | O frontend roda no dispositivo do usuario, sujeito a rede instavel e hardware variado | Otimizar para offline-first, tratar falhas de rede como caso normal |
| Separacao de responsabilidades    | Cada camada tem uma funcao clara e nao invade a outra                                 | UI nao contem logica de negocio, hooks nao fazem fetch direto       |
| Orientacao a features             | O codigo e organizado por dominio de negocio, nao por tipo de arquivo                 | Pastas por feature (`features/auth/`, `features/billing/`)          |
| Performance by default            | Decisoes de performance sao tomadas desde o inicio, nao como otimizacao tardia        | Code Splitting automatico, lazy loading, imagens otimizadas         |
| {{Principio adicional}}           | {{Descricao}}                                                                         | {{Implicacao}}                                                      |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Separacao de responsabilidades:** Um componente `UserCard` recebe dados via props e nao faz fetch. O hook `useUser` busca os dados e o componente apenas renderiza.
- **Performance by default:** Todas as rotas usam `dynamic(() => import(...))` para Code Splitting automatico.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o frontend sera executado?

- [ ] Web Desktop
- [ ] Web Mobile (responsivo)
- [ ] PWA
- [ ] App Nativo (React Native)
- [ ] Outro: {{especificar}}

**Plataforma primaria:** {{plataforma primaria}}
**Plataforma secundaria:** {{plataforma secundaria}}

---

## Stack Tecnologico

> Qual o stack principal do frontend?

| Camada           | Tecnologia                                         | Justificativa                |
| ---------------- | -------------------------------------------------- | ---------------------------- |
| Framework        | {{Next.js / Remix / Vite + React}}                 | {{Justificativa da escolha}} |
| UI Library       | {{React / Vue / Svelte}}                           | {{Justificativa da escolha}} |
| State Management | {{Zustand / Jotai / Redux Toolkit}}                | {{Justificativa da escolha}} |
| Data Fetching    | {{TanStack Query / SWR}}                           | {{Justificativa da escolha}} |
| Styling          | {{Tailwind CSS / Styled Components / CSS Modules}} | {{Justificativa da escolha}} |
| Build Tool       | {{Turbopack / Vite / Webpack}}                     | {{Justificativa da escolha}} |

<details>
<summary>Exemplo — Stack com Next.js</summary>

| Camada           | Tecnologia              | Justificativa                                       |
| ---------------- | ----------------------- | --------------------------------------------------- |
| Framework        | Next.js 16 (App Router) | SSR, SSG, Server Actions, otimizacao automatica     |
| UI Library       | React 19                | Server Components nativo, Actions, use() hook       |
| State Management | Zustand v5              | API simples, sem boilerplate, stores isoladas       |
| Data Fetching    | TanStack Query v5       | Cache automatico, revalidacao, devtools             |
| Styling          | Tailwind CSS v4         | Engine reescrita, CSS-first config, zero-JS runtime |
| Build Tool       | Turbopack               | Builds incrementais, bundler nativo do Next.js      |

## </details>

## Tipos de Usuarios

> Quem sao os usuarios do frontend? Quais perfis de acesso existem?

| Perfil            | Descricao               | Nivel de Acesso | Funcionalidades Principais |
| ----------------- | ----------------------- | --------------- | -------------------------- |
| {{Administrador}} | {{Descricao do perfil}} | {{Total}}       | {{Funcionalidades}}        |
| {{Usuario comum}} | {{Descricao do perfil}} | {{Limitado}}    | {{Funcionalidades}}        |
| {{Visitante}}     | {{Descricao do perfil}} | {{Publico}}     | {{Funcionalidades}}        |
| {{Outro perfil}}  | {{Descricao do perfil}} | {{Nivel}}       | {{Funcionalidades}}        |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-arquitetura.md)
