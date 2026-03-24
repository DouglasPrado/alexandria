# Visao do Frontend Mobile

Define o papel do frontend mobile no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o app mobile faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend Mobile

> Qual e a responsabilidade principal do app mobile neste sistema?

| Responsabilidade        | Descricao                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| Interface do usuario    | {{Como o app apresenta informacoes ao usuario em iOS e Android}}  |
| Renderizacao de dados   | {{Como os dados do backend sao transformados em UI nativa}}       |
| Interacao com APIs      | {{Como o app se comunica com o backend}}                          |
| Gerenciamento de estado | {{Como o estado da aplicacao e mantido e sincronizado}}           |
| Experiencia do usuario  | {{Como o app garante fluidez, gestos nativos e performance}}      |

{{Descreva o papel do app mobile no contexto do produto}}

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes do app mobile?

| Principio                         | Descricao                                                                             | Implicacao Pratica                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mobile como sistema distribuido   | O app roda no dispositivo do usuario, sujeito a rede instavel e hardware variado      | Otimizar para offline-first, tratar falhas de rede como caso normal |
| Separacao de responsabilidades    | Cada camada tem uma funcao clara e nao invade a outra                                 | UI nao contem logica de negocio, hooks nao fazem fetch direto       |
| Orientacao a features             | O codigo e organizado por dominio de negocio, nao por tipo de arquivo                 | Pastas por feature (`features/auth/`, `features/billing/`)          |
| Performance by default            | Decisoes de performance sao tomadas desde o inicio, nao como otimizacao tardia        | Lazy screens, otimizacao de listas com FlatList, imagens cacheadas  |
| Experiencia nativa               | Respeitar as convencoes de cada plataforma (iOS e Android)                            | Gestos nativos, haptic feedback, navegacao nativa                   |
| {{Principio adicional}}           | {{Descricao}}                                                                         | {{Implicacao}}                                                      |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Separacao de responsabilidades:** Um componente `UserCard` recebe dados via props e nao faz fetch. O hook `useUser` busca os dados e o componente apenas renderiza.
- **Performance by default:** Todas as listas usam `FlatList` com `getItemLayout` para scroll performatico a 60fps.
- **Experiencia nativa:** Bottom tabs no iOS seguem o padrao HIG, enquanto no Android seguem Material Design.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o app sera executado?

- [ ] iOS (iPhone)
- [ ] iOS (iPad)
- [ ] Android (Telefone)
- [ ] Android (Tablet)
- [ ] Outro: {{especificar}}

**Plataforma primaria:** {{iOS e Android (telefone)}}
**Plataforma secundaria:** {{iPad e Android tablet}}

**Versoes minimas suportadas:**

| Plataforma | Versao Minima |
| ---------- | ------------- |
| iOS        | {{16.0}}      |
| Android    | {{API 24 (Android 7.0)}} |

---

## Stack Tecnologico

> Qual o stack principal do app mobile?

| Camada           | Tecnologia                                         | Justificativa                |
| ---------------- | -------------------------------------------------- | ---------------------------- |
| Framework        | {{React Native / Expo}}                            | {{Justificativa da escolha}} |
| Navegacao        | {{Expo Router / React Navigation}}                 | {{Justificativa da escolha}} |
| State Management | {{Zustand / Jotai / Redux Toolkit}}                | {{Justificativa da escolha}} |
| Data Fetching    | {{TanStack Query / SWR}}                           | {{Justificativa da escolha}} |
| Styling          | {{NativeWind / StyleSheet / Tamagui}}              | {{Justificativa da escolha}} |
| Build Tool       | {{EAS Build / Metro Bundler}}                      | {{Justificativa da escolha}} |
| JS Engine        | {{Hermes}}                                         | {{Justificativa da escolha}} |

<details>
<summary>Exemplo — Stack com Expo</summary>

| Camada           | Tecnologia              | Justificativa                                       |
| ---------------- | ----------------------- | --------------------------------------------------- |
| Framework        | Expo SDK 52             | Managed workflow, OTA updates, EAS Build             |
| Navegacao        | Expo Router v4          | File-based routing, deep linking, typed routes       |
| State Management | Zustand v5              | API simples, sem boilerplate, stores isoladas       |
| Data Fetching    | TanStack Query v5       | Cache automatico, revalidacao, devtools             |
| Styling          | NativeWind v4           | Tailwind CSS para React Native, estilizacao rapida  |
| Build Tool       | EAS Build               | Builds na nuvem, perfis por ambiente                |
| JS Engine        | Hermes                  | Startup rapido, bytecode pre-compilado, menor memoria |

</details>

## Tipos de Usuarios

> Quem sao os usuarios do app? Quais perfis de acesso existem?

| Perfil            | Descricao               | Nivel de Acesso | Funcionalidades Principais |
| ----------------- | ----------------------- | --------------- | -------------------------- |
| {{Administrador}} | {{Descricao do perfil}} | {{Total}}       | {{Funcionalidades}}        |
| {{Usuario comum}} | {{Descricao do perfil}} | {{Limitado}}    | {{Funcionalidades}}        |
| {{Visitante}}     | {{Descricao do perfil}} | {{Publico}}     | {{Funcionalidades}}        |
| {{Outro perfil}}  | {{Descricao do perfil}} | {{Nivel}}       | {{Funcionalidades}}        |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-architecture.md)
