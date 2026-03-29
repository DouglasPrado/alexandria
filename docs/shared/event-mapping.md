# Mapeamento de Eventos — Backend → Frontend

> Conecta eventos de dominio do backend com acoes no frontend. Este documento e a fonte unica para entender como mudancas no servidor impactam o estado do cliente.

---

## Mapa de Eventos

> Para CADA evento do backend, documente como o frontend reage.

| Evento Backend   | Origem (Service)        | Canal                  | Acao Frontend                                       | Store/State Impactado          | UI Update                                 |
| ---------------- | ----------------------- | ---------------------- | --------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| ClusterCreated   | ClusterService          | REST response          | Redirect para /setup/seed (exibir seed phrase)      | authStore                      | Toast "Cluster criado com sucesso"        |
| ClusterRecovered | RecoveryService         | REST response          | Redirect para dashboard com relatorio de recovery   | authStore                      | Toast "Cluster recuperado"                |
| MemberJoined     | MemberService           | REST response + email  | Atualizar lista de membros                          | TanStack Query (members)       | Toast "Novo membro: {name}"              |
| MemberRemoved    | MemberService           | REST response          | Remover membro da lista; se proprio, redirect login | TanStack Query (members)       | Toast "Membro removido"                  |
| NodeRegistered   | NodeService             | REST response          | Atualizar lista de nos                              | TanStack Query (nodes)         | Toast "No registrado: {name}"            |
| NodeSuspect      | SchedulerService        | Polling / TanStack     | Atualizar NodeStatusBadge para amarelo              | TanStack Query (nodes, alerts) | AlertBanner warning                       |
| NodeLost         | SchedulerService        | Polling / TanStack     | Atualizar NodeStatusBadge para vermelho             | TanStack Query (nodes, alerts) | AlertBanner critical + Toast              |
| NodeDrained      | NodeService             | REST response          | Atualizar status do no para disconnected            | TanStack Query (nodes)         | Toast "Drain concluido"                  |
| FileUploaded     | FileService             | REST response          | Adicionar item ao UploadQueue                       | uploadStore (Zustand)          | UploadQueue item: "uploading"             |
| FileProcessed    | PhotoWorker/VideoWorker | Polling (3s staleTime) | Atualizar status do arquivo para ready              | TanStack Query (files)         | Thumbnail aparece na galeria              |
| FileError        | PhotoWorker/VideoWorker | Polling (3s staleTime) | Atualizar status do arquivo para error              | TanStack Query (files)         | Toast erro + icone de erro na galeria     |
| FileCorrupted    | HealthService           | Polling / TanStack     | Marcar arquivo como corrupted na galeria            | TanStack Query (files, alerts) | AlertBanner critical                      |
| AlertCreated     | HealthService           | Polling / TanStack     | Incrementar contador de alertas                     | TanStack Query (alerts)        | AlertBell badge count + Toast se critical |
| AlertResolved    | HealthService           | REST response / Polling| Decrementar contador de alertas                     | TanStack Query (alerts)        | Toast "Alerta resolvido"                  |

<!-- APPEND:eventos -->

---

## Canais de Comunicacao

> Como o frontend recebe eventos do backend?

| Canal              | Tecnologia           | Quando Usar                                                              | Latencia       |
| ------------------ | -------------------- | ------------------------------------------------------------------------ | -------------- |
| REST Response      | HTTP (TanStack Query)| Resposta imediata a acao do usuario (create, update, delete)            | < 200ms        |
| Polling            | TanStack Query refetch | Atualizacoes de status (file processing, node heartbeat, alerts)      | 3s-30s (staleTime) |
| Redis pub/sub      | BullMQ + Redis       | Notificacoes internas backend (FileProcessed, NodeLost, AlertResolved)  | < 100ms (backend) |
| Email              | Resend               | Notificacoes fora da app (convites, alertas critical, recovery)         | Segundos        |

> **Nota:** Atualmente o frontend usa exclusivamente REST + TanStack Query polling. WebSocket/SSE para real-time esta planejado mas nao implementado.

---

## Impacto de Mudanca de Payload

> Se o payload de um evento mudar no backend, quais frontends quebram?

| Evento          | Campo            | Frontend que Consome              | Impacto se Removido                                      |
| --------------- | ---------------- | --------------------------------- | -------------------------------------------------------- |
| FileProcessed   | fileId           | TanStack Query (files), GalleryGrid | Thumbnail nao aparece na galeria                       |
| FileProcessed   | status           | TanStack Query (files)            | Polling nao detecta transicao processing→ready           |
| NodeLost        | nodeId           | TanStack Query (nodes), NodeList  | NodeStatusBadge nao atualiza para vermelho               |
| AlertCreated    | severity         | TanStack Query (alerts), AlertBell | Badge de alertas nao distingue criticidade              |
| AlertCreated    | type             | AlertCard                         | Card de alerta sem tipo (node_offline, space_low, etc.)  |
| MemberJoined    | memberId, name   | TanStack Query (members)          | Lista de membros desatualizada                           |
| ClusterRecovered| nodesRestored    | RecoveryReport                    | Relatorio de recovery incompleto                         |

<!-- APPEND:impacto -->

> Referenciado por:
>
> - `docs/backend/12-events.md` (produtor)
> - `docs/frontend/05-state.md` (consumidor — stores)
> - `docs/frontend/06-data-layer.md` (API client)
> - `docs/frontend/08-flows.md` (consumidor — fluxos de UI dirigidos por eventos)
