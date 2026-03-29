Gaps Restantes — Documentado mas Não Implementado
P0 — Críticos (quebram promessas core do sistema)
#	Gap	Origem	Impacto
1	Envelope encryption real — master key hardcoded 0xAB em media-processor e file.service	blueprint/07, backend/06	Zero-knowledge comprometido; chunks não protegidos por vault
2	Recovery completo (DB rebuild from manifests) — seed só valida, não reconstrói	blueprint/07, UC-007	"Orquestrador descartável" não funciona
3	Manifest replication para storage nodes — manifests só no PostgreSQL	blueprint/04 (RN-MA4)	Recovery impossível se PostgreSQL perdido
P1 — Altos (Fase 1 MVP incompleta)
#	Gap	Origem
4	Placeholder files + download sob demanda (UC-009)	blueprint/08, backend/06
5	Chunk fallback on download — só tenta 1 replica, sem retry	blueprint/07 (download flow)
6	Email templates faltando — chunks irrecuperáveis, recovery completo, onboarding 1st upload	blueprint/17
7	Domain events no MemberService — MemberJoined, MemberRemoved, InviteSent não emitidos	backend/12
8	LoginDto sem sanitização — falta @Transform email + @Matches password	backend/10
9	ParseUUIDPipe no MemberController — clusterId/memberId sem validação	backend/07
10	node_token não documentado em 05-data-model.md	blueprint/05
P2 — Médios (Queues, Workers, Infra)
#	Gap	Origem
11	BullMQ queues separadas — email.send, healing.process, media.photos, media.videos	backend/12
12	EmailWorker + AutoHealWorker — processamento async	backend/12
13	DLQs — dead letter queues para retry	backend/12
14	CircuitBreaker não wired — classe existe mas não usada em StorageProvider/Resend	backend/13
15	Redis pub/sub para notificações real-time ao frontend	backend/12
16	Response serializers (9 funções toXxxResponse)	backend/07
17	AlertController separado (atualmente dentro do HealthController)	backend/07
18	console.log → pino Logger em vários services	blueprint/15
P3 — Frontend (componentes + stores + hooks)
#	Gap	Origem
19	16 Primitive components (Button, Input, Select, Card, Dialog, etc.)	frontend/web/04
20	12 Composite components (FormField, AppShell, Sidebar, Header, etc.)	frontend/web/04
21	13 Feature components restantes (UploadQueueItem, FileMetadata, DownloadButton, AlertCard, RecoveryProgress, RecoveryReport, InviteLinkCopy, AcceptInviteForm, RoleSelector, etc.)	frontend/web/04
22	2 Stores Zustand — recoveryStore, uiStore	frontend/web/05
23	4 Hooks — useDownloadFile, useInviteMember, useAcceptInvite, useRecoveryStatus	frontend/shared/06
24	3 Layouts — AuthLayout, SetupLayout, RecoveryLayout	frontend/web/07
25	Missing service methods — MemberService.findById, createAdmin, StorageService.createManifest, reassembleFile	backend/06
P4 — Fase 2/3 (roadmap futuro)
#	Gap	Origem
26	Prometheus + Grafana observability stack	blueprint/15
27	OpenTelemetry tracing	blueprint/15
28	OAuth integration (Google Drive, Dropbox, OneDrive)	blueprint/11 (Fase 2)
29	Desktop client (Tauri)	blueprint/11 (Fase 2)
30	Mobile client (React Native)	blueprint/11 (Fase 3)
31	EXIF search via GIN index	blueprint/11 (Fase 2)
32	Disaster drills automatizados	blueprint/11 (Fase 3)
33	Ransomware protection	blueprint/11 (Fase 3)
Resumo por Contagem
Prioridade	Items	Contexto
P0 — Crítico	3	Envelope encryption, recovery rebuild, manifest replication
P1 — Alto	7	Placeholder files, chunk fallback, emails, events, validação
P2 — Médio	8	Queues, workers, DLQ, circuit breaker, serializers, logging
P3 — Frontend	7	Primitives, composites, feature components, stores, hooks
P4 — Futuro	8	Prometheus, OAuth, desktop, mobile, EXIF, drills
Total	33
