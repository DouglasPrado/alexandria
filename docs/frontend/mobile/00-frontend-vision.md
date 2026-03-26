# Visao do Frontend Mobile

Define o papel do frontend mobile no sistema, os principios que guiam decisoes tecnicas e o stack tecnologico escolhido. Este documento serve como ponto de partida para qualquer pessoa que precise entender o que o app mobile faz, como ele se posiciona na arquitetura geral e quais tecnologias sustentam suas decisoes.

---

## Objetivo do Frontend Mobile

> Qual e a responsabilidade principal do app mobile neste sistema?

<!-- do blueprint: 00-context.md (atores), 01-vision.md (objetivo), 11-build_plan.md (Fase 3) -->

| Responsabilidade        | Descricao                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Interface do usuario    | App nativo para iOS e Android que permite salvar, visualizar e gerenciar a galeria de fotos, videos e documentos da familia   |
| Renderizacao de dados   | Transforma os dados do Orquestrador em galeria nativa com thumbnails leves, navegacao por timeline e visualizacao sob demanda |
| Interacao com APIs      | Comunica com o Orquestrador via REST API (HTTPS/TLS 1.3) para upload, listagem, download e gerenciamento do cluster           |
| Gerenciamento de estado | Estado local com Zustand; server state com TanStack Query; queue de upload persistida para retry offline                      |
| Experiencia do usuario  | Upload automatico em background, liberacao de espaco no dispositivo via placeholders, gestos nativos, haptic feedback         |

O app mobile e o ponto de entrada principal para membros da familia sem perfil tecnico — especialmente para o **Membro Familiar** e o **Fotografo Amador**, que precisam de upload automatico e acesso a galeria com minimo de configuracao. O **Sync Engine** roda como modulo background no proprio app, detectando novas midias no rolo da camera e enviando ao cluster de forma transparente. O app tambem expoe funcoes de administracao para o **Administrador Familiar** monitorar saude do cluster e gerenciar nos.

<!-- do blueprint: 00-context.md (Sync Engine como componente do dispositivo do membro, Fotografo Amador, Membro Familiar, Administrador Familiar) -->

---

## Principios Arquiteturais

> Quais regras fundamentais guiam as decisoes do app mobile?

<!-- do blueprint: 02-architecture_principles.md (Zero-Knowledge, Embrace Failure, Simplicidade Operacional, Eficiencia sobre Fidelidade) -->

| Principio                          | Descricao                                                                                                                | Implicacao Pratica                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Offline-first                      | O app funciona sem conexao: galeria local disponivel, upload enfileirado e sincronizado quando a rede retornar           | Queue de upload persistida em SQLite; thumbnails cacheados localmente; UI nunca bloqueia por falta de rede |
| Zero-Knowledge no dispositivo      | Criptografia AES-256-GCM acontece no dispositivo antes de qualquer transmissao — o Orquestrador nao ve o conteudo        | Core SDK roda no app; chaves derivadas da seed phrase; dados enviados ja cifrados                          |
| Upload automatico em background    | Sync Engine detecta novas midias no rolo da camera e envia ao cluster em background, sem interacao do usuario            | Usa expo-background-fetch + expo-media-library; upload progride mesmo com app fechado                      |
| Liberacao de espaco no dispositivo | Apos upload confirmado (3+ replicas), arquivos originais podem ser substituidos por placeholders leves (~50KB thumbnail) | UI de confirmacao explicita ao usuario; download sob demanda via tap na foto                               |
| Performance nativa                 | Listas com centenas de fotos devem rolar a 60fps; thumbnails carregam instantaneamente via cache local                   | FlatList com getItemLayout; expo-image para cache agressivo de thumbnails; skeleton loaders                |
| Experiencia nativa por plataforma  | Respeitar convencoes de iOS (HIG) e Android (Material Design 3) — gestos, navegacao e haptic feedback nativos            | Bottom Tabs no iOS, Navigation Drawer opcional no Android; Haptic API para feedback em acoes criticas      |
| Separacao de responsabilidades     | Camadas bem definidas: UI → hooks → services → api client; nenhuma camada invade a vizinha                               | Componentes recebem dados via props; hooks gerenciam estado; services contem logica de negocio             |

<!-- APPEND:principios -->

<details>
<summary>Exemplo — Principios em acao</summary>

- **Offline-first:** Usuario fotografa 50 fotos sem internet. Sync Engine enfileira os uploads. Quando o Wi-Fi reconecta, os uploads procedem em background na ordem da fila sem intervencao do usuario.
- **Zero-Knowledge no dispositivo:** Antes de chamar `POST /files/upload`, o Core SDK cifra o arquivo com AES-256-GCM usando a file key derivada da master key. O binario enviado ao Orquestrador e opaco.
- **Liberacao de espaco:** Apos 3 replicas confirmadas, o app exibe notificacao: "52 fotos salvas com segurança — liberar 1,2GB do dispositivo?" Usuario confirma e os originais sao substituidos por thumbnails.
- **Performance nativa:** A galeria usa `FlashList` (virtualizacao de alta performance) com thumbnails pre-carregados via `expo-image` e cache em disco de 500MB.

</details>

---

## Plataformas e Dispositivos

> Em quais plataformas o app sera executado?

<!-- do blueprint: 00-context.md (Dispositivos da familia), 11-build_plan.md (Fase 3 — Apple Developer Account, Google Play Developer Account) -->

- [x] iOS (iPhone)
- [x] iOS (iPad)
- [x] Android (Telefone)
- [x] Android (Tablet)

**Plataforma primaria:** iOS (iPhone) e Android (Telefone)
**Plataforma secundaria:** iPad e Android Tablet (layout adaptado, sem features exclusivas)

**Versoes minimas suportadas:**

| Plataforma | Versao Minima        | Justificativa                                                                       |
| ---------- | -------------------- | ----------------------------------------------------------------------------------- |
| iOS        | 16.0                 | Background tasks confiavel (BGTaskScheduler), suporte a Hermes, adocao >95% em 2024 |
| Android    | API 26 (Android 8.0) | WorkManager disponivel para background sync confiavel; adocao >95% em 2024          |

---

## Stack Tecnologico

> Qual o stack principal do app mobile?

<!-- do blueprint: 00-context.md (Monorepo com core-sdk), 11-build_plan.md (Fase 3 — React Native para iOS e Android) -->

| Camada              | Tecnologia                                 | Justificativa                                                                                                 |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Framework           | Expo SDK (React Native)                    | Managed workflow simplifica setup; OTA updates sem deploy na loja; acesso nativo via expo modules             |
| Navegacao           | Expo Router v4                             | File-based routing consistente com Next.js do web client; deep linking e typed routes out-of-the-box          |
| State Management    | Zustand v5                                 | API minimalista sem boilerplate; stores isoladas por dominio; consistente com o web client                    |
| Data Fetching       | TanStack Query v5                          | Cache automatico, revalidacao, optimistic updates; consistente com o web client; suporte a offline queries    |
| Styling             | NativeWind v4                              | Tailwind CSS para React Native; sistema de design compartilhado com web via tokens; sem duplicacao de estilos |
| Listas              | FlashList (Shopify)                        | Substitui FlatList para listas longas (galeria de fotos); virtualizacao de alta performance a 60fps           |
| Imagens             | expo-image                                 | Cache agressivo em disco e memoria; suporte a placeholders blurhash; animacoes de transicao nativas           |
| Upload/Sync         | expo-background-fetch + expo-media-library | Detecta novas midias no camera roll e enfileira uploads em background                                         |
| Armazenamento local | expo-secure-store + expo-sqlite            | Vault criptografado (secure-store para master key); queue de upload e cache de metadados (SQLite)             |
| Criptografia        | Core SDK (monorepo)                        | AES-256-GCM, envelope encryption e BIP-39 compartilhados entre todos os clientes via pnpm workspace           |
| Build Tool          | EAS Build                                  | Builds na nuvem; perfis por ambiente (dev, preview, production); sem necessidade de Mac para builds iOS       |
| JS Engine           | Hermes                                     | Startup rapido via bytecode pre-compilado; menor uso de memoria; padrao no Expo SDK                           |
| Notificacoes        | expo-notifications                         | Push notifications para alertas de cluster: no offline, replicacao baixa, upload concluido                    |

<details>
<summary>Versoes de referencia</summary>

| Tecnologia     | Versao |
| -------------- | ------ |
| Expo SDK       | 53+    |
| React Native   | 0.79+  |
| Expo Router    | v4     |
| Zustand        | v5     |
| TanStack Query | v5     |
| NativeWind     | v4     |
| FlashList      | v1     |
| expo-image     | v2     |
| Hermes         | padrao |

> Consultar context7 para versoes atualizadas antes de iniciar implementacao.

</details>

---

## Tipos de Usuarios

> Quem sao os usuarios do app? Quais perfis de acesso existem?

<!-- do blueprint: 00-context.md (atores), 01-vision.md (personas e frequencia de uso) -->

| Perfil                 | Descricao                                                                                       | Nivel de Acesso | Funcionalidades Principais no App Mobile                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| Administrador Familiar | Membro tecnico que cria e gerencia o cluster, convida membros e monitora saude do sistema       | Total           | Criar cluster, convidar membros, monitorar nos, visualizar alertas, gerenciar vault, iniciar recovery via seed |
| Membro Familiar        | Pai/mae, tios, avos — usa o app para salvar e visualizar fotos sem conhecimento tecnico         | Membro          | Galeria compartilhada, upload manual, visualizar fotos/videos, download sob demanda, receber notificacoes      |
| Fotografo Amador       | Membro com alto volume de midias; precisa de upload automatico e liberacao de espaco no celular | Membro          | Sync Engine automatico, visualizacao de quota, confirmacao de liberacao de espaco, historico de uploads        |
| Guardiao de Memorias   | Membro mais velho, curador do acervo; acessa fotos antigas e navega por timeline                | Membro          | Timeline cronologica, busca por data/evento, navegacao por album, visualizacao em tela cheia, download em lote |

<!-- APPEND:usuarios -->

> Detalhes sobre autenticacao e autorizacao: (ver 01-architecture.md)
