# E2E Testability — Auth, Pipeline, Download, Onboarding, Infra

**Data:** 2026-03-19
**Escopo:** Completar todos os gaps que impedem testar o fluxo end-to-end: criar cluster → adicionar nos → subir arquivo → ver na galeria → baixar
**Complementa:** [2026-03-19-frontend-restructure-design.md](./2026-03-19-frontend-restructure-design.md) (estrutura de pastas, componentes, data layer)

---

## Contexto

O backend (Rust/Axum) e frontend (Next.js) tem a maioria dos componentes implementados isoladamente, mas 6 gaps impedem o uso real:

1. **Sem autenticacao** — login e placeholder, member_ids hardcoded
2. **Sem UI para criar cluster** — API funciona, frontend nao tem form
3. **Media pipeline nao dispara** — scheduler nao processa uploads
4. **Download stub** — retorna 202 sem conteudo
5. **Node agents fora do docker-compose** — sem nos = sem replicacao
6. **Upload so recebe metadata** — nao recebe arquivo real

Este spec resolve todos os 6 gaps.

---

## Decisoes

### Auth completo (JWT + refresh + roles + guards)

Conforme blueprint [13-security.md](../../blueprint/13-security.md). Auth via convites com senha definida no aceite.

**Descartadas:**
- Admin unico via env var: nao escala para multi-user
- Auth basico sem refresh: UX ruim (relogin a cada 24h)

### Desvios intencionais do blueprint

1. **Introducao de senhas:** O blueprint diz "sem senhas — autenticacao via convites e JWT". Na pratica, apos o convite ser aceito, o membro precisa de forma de re-autenticar em visitas subsequentes. Sem senha, a unica opcao seria emitir JWTs de longa duracao (inseguro) ou exigir novo convite a cada sessao (inutilizavel). Portanto, introduzimos senha definida pelo membro no aceite do convite (e pelo admin na criacao do cluster). O blueprint deve ser atualizado para refletir essa decisao.

2. **JWT signing com HMAC-SHA256 em vez de Ed25519:** O blueprint especifica "JWT assinado com chave do cluster (Ed25519)". Para v1, usamos HMAC-SHA256 com `JWT_SECRET` global. Justificativa: v1 opera single-cluster por instancia, eliminando a necessidade de signing keys por cluster. Migracao para Ed25519 na v2 quando multi-cluster for suportado.

3. **Media pipeline via polling (nao Redis queue):** O blueprint (`06-system_architecture.md`, `07-critical_flows.md`) define Media Workers consumindo jobs de fila Redis. Para v1, scheduler faz polling de 10s em `files WHERE status='processing'`. Justificativa: volume familiar (~10 uploads/dia) nao justifica complexidade de Redis queue. Migracao para fila quando volume crescer.

4. **Token storage em localStorage (nao httpOnly cookies):** O blueprint e o `11-seguranca.md` dizem "Cookie httpOnly + Secure + SameSite=Strict". Para v1, usamos Zustand + localStorage para simplificar o desenvolvimento. O auth store armazena tokens client-side. **Risco aceito:** tokens acessiveis via XSS. Mitigacao: Next.js escapa output por padrao (React), CSP header via Caddy. Migracao para httpOnly cookies na v2 com BFF (Next.js Route Handlers como proxy).

5. **Single-cluster por instancia:** Login usa apenas email + senha (sem campo cluster_id). V1 assume uma unica instancia = um unico cluster. O endpoint de login busca o membro pelo email no unico cluster existente.

### Bootstrap token para auto-registro de nos

Nodes internos do docker-compose se auto-registram com token de bootstrap. Evita dependencia circular (node precisa de admin_id, mas admin ainda nao existe no primeiro boot).

---

## 1. Autenticacao (JWT + Refresh + Roles + Guards)

### 1.1 Backend — Novo modulo `auth`

**Localizacao:** `crates/orchestrator/src/auth/`

**Componentes:**

```
auth/
├── mod.rs          — re-exports
├── jwt.rs          — encode/decode/validate JWT (Ed25519 ou HMAC-SHA256)
├── middleware.rs    — AuthLayer (Axum middleware)
├── claims.rs       — AuthClaims struct
├── password.rs     — hash/verify com argon2id
└── refresh.rs      — refresh token logic
```

**AuthClaims:**

```rust
pub struct AuthClaims {
    pub member_id: Uuid,
    pub cluster_id: Uuid,
    pub role: String,       // "admin" | "membro" | "leitura"
    pub exp: i64,           // expiracao (24h)
    pub iat: i64,           // emissao
}
```

**JWT signing:** HMAC-SHA256 com `JWT_SECRET` env var. Ed25519 com chave do cluster e mais elegante mas adiciona complexidade de key management (cada cluster teria sua signing key). HMAC com secret global e suficiente para v1 (single-cluster por instancia).

**Middleware Axum:**

```rust
// Extrai JWT do header Authorization: Bearer <token>
// Injeta AuthClaims no request extensions
// Endpoints protegidos: Extension<AuthClaims>
// Endpoints publicos: sem middleware (rotas separadas no router)
```

**Role guards:**

```rust
pub fn require_admin(claims: &AuthClaims) -> Result<(), AuthError>;
pub fn require_member_or_above(claims: &AuthClaims) -> Result<(), AuthError>;
// "admin" > "membro" > "leitura"
```

**Password hashing:** argon2id via `argon2` crate. Hash armazenado no campo `members.password_hash`.

### 1.2 Novos endpoints

| Endpoint | Metodo | Auth | Descricao |
|----------|--------|------|-----------|
| `/api/v1/auth/login` | POST | Publico | Email + senha → access_token + refresh_token |
| `/api/v1/auth/refresh` | POST | Publico | Refresh token → novo par de tokens |
| `/api/v1/auth/logout` | POST | Autenticado | Invalida refresh token |
| `/api/v1/auth/me` | GET | Autenticado | Retorna dados do membro logado |

**Login request/response:**

```rust
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub member: MemberInfo,     // id, name, email, role, cluster_id
    pub expires_in: i64,        // segundos ate expiracao (86400 = 24h)
}
```

**Refresh request/response:**

```rust
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub struct RefreshResponse {
    pub access_token: String,
    pub refresh_token: String,   // novo refresh (rotacao)
    pub expires_in: i64,
}
// Na rotacao: o refresh_token anterior e marcado revoked=true na tabela refresh_tokens.
// Isso impede replay de tokens roubados apos rotacao legitima.
```

### 1.3 Nova migration (`014_add_auth.up.sql`)

```sql
-- Password hash para membros
ALTER TABLE members ADD COLUMN password_hash TEXT;

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,        -- SHA-256 do token
    expires_at TIMESTAMPTZ NOT NULL,        -- 30 dias
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_member ON refresh_tokens(member_id);
-- token_hash UNIQUE ja cria indice automaticamente

-- Invites (rastreamento de convites para validacao, single-use, expiracao)
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'leitura',
    token_hash TEXT NOT NULL UNIQUE,        -- SHA-256 do token de convite
    invited_by UUID NOT NULL REFERENCES members(id),
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,        -- 7 dias
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_token ON invites(token_hash);
```

**`014_add_auth.down.sql`:**

```sql
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS refresh_tokens;
ALTER TABLE members DROP COLUMN IF EXISTS password_hash;
```

### 1.4 Protecao de rotas existentes

Separar rotas em dois grupos no router:

```rust
// Rotas publicas (sem auth)
let public = Router::new()
    .route("/api/v1/health", get(health_check))
    .route("/api/v1/auth/login", post(login))
    .route("/api/v1/auth/refresh", post(refresh))
    .route("/api/v1/clusters", post(create_cluster))        // onboarding (guard: rejeita se cluster ja existe)
    .route("/api/v1/invite/{token}", post(accept_invite))
    .route("/api/v1/invite/{token}/validate", get(validate_invite))
    .route("/api/v1/nodes/{id}/heartbeat", post(heartbeat))  // nodes usam bootstrap token (validado no handler)
    .route("/api/v1/nodes/register", post(register_node));    // bootstrap token

// Rotas protegidas (requerem JWT)
let protected = Router::new()
    .route("/api/v1/clusters", get(list_clusters))
    .route("/api/v1/clusters/{id}", get(get_cluster))
    // ... todas as outras rotas
    .layer(AuthLayer::new(jwt_secret));
```

### 1.5 Frontend — Auth store e interceptor

**`store/auth-store.ts` (Zustand + persist):**

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  member: MemberInfo | null;
  isAuthenticated: boolean;
  login: (tokens: LoginResponse) => void;
  logout: () => void;
  updateTokens: (tokens: RefreshResponse) => void;
}
```

Persistido em `localStorage`. Ao carregar, verifica se access_token ainda e valido (decodifica exp do JWT client-side).

**Auth interceptor no `api-client.ts`:**

```typescript
// Antes de cada request:
// 1. Injeta Authorization: Bearer <accessToken>
// 2. Se resposta 401:
//    a. Tenta POST /auth/refresh com refreshToken
//    b. Se sucesso: atualiza tokens, retry da request original
//    c. Se falha: logout + redirect para /login
```

**Login page (`app/login/page.tsx`):**
- Form email + senha
- Loading state durante chamada
- Erro inline se credenciais invalidas
- Link "Criar cluster" para `/setup`
- Apos sucesso: redirect para `/gallery`

**Route guard (`app/(protected)/layout.tsx`):**
- Verifica `authStore.isAuthenticated`
- Se nao: redirect para `/login`
- Se sim: renderiza `AppShell` + conteudo

---

## 2. Onboarding — Cluster Creation + Convites

### 2.1 Rota `/setup` (publica)

**Tela inicial:**
- "Bem-vindo ao Alexandria"
- Dois botoes: "Criar Cluster" / "Tenho um convite"
- Se ja existe cluster e usuario logado: redirect para `/gallery`

**Form de criacao:**
- Campos: nome do cluster, nome do admin, email, senha, confirmar senha
- Validacao client-side (Zod): email valido, senha min 8 chars, senhas iguais
- Submit: `POST /api/v1/clusters`

**Tela da seed phrase:**
- Grid 3x4 com as 12 palavras numeradas
- Background destacado, fonte monospacada
- Instrucoes: "Anote estas 12 palavras em papel. Esta e a UNICA vez que serao exibidas."
- Checkbox: "Anotei minha seed phrase em local seguro"
- Botao "Continuar" habilitado somente apos checkbox
- Ao continuar: JWT emitido (backend retorna tokens na criacao) → redirect para `/gallery`

**Ajuste no backend `create_cluster`:**
- Apos criar cluster + admin + vault, tambem:
  - Hashear senha do admin com argon2id → salvar em `members.password_hash`
  - Emitir access_token + refresh_token
  - Retornar tokens na resposta junto com seed_phrase

### 2.2 Rota `/invite/[token]` (publica)

**Ao carregar:**
- `GET /api/v1/invite/{token}/validate` (novo endpoint)
- Retorna: `{ valid: bool, cluster_name: string, role: string, email?: string }`

**Se valido:**
- Form: nome, email (pre-preenchido), senha, confirmar senha
- Submit: `POST /api/v1/invite/{token}` com dados → backend cria membro + hash senha + emite JWT
- Redirect para `/gallery`

**Se invalido/expirado:**
- Mensagem de erro: "Convite expirado ou invalido. Solicite novo convite ao administrador."

### 2.3 Novo endpoint de validacao

```rust
// GET /api/v1/invite/{token}/validate
pub struct ValidateInviteResponse {
    pub valid: bool,
    pub cluster_name: Option<String>,
    pub role: Option<String>,
    pub email: Option<String>,
    pub error: Option<String>,      // "expired" | "invalid_signature" | "already_used"
}
```

### 2.4 Pagina de membros (`/members`)

**Nova feature `features/members/`:**

```
features/members/
├── components/
│   ├── MembersPage.tsx        — orquestra lista + modal
│   ├── MemberList.tsx         — tabela de membros
│   ├── MemberRow.tsx          — linha: nome, email, role badge, acoes
│   └── InviteModal.tsx        — form de convite
├── hooks/
│   ├── useMembers.ts          — useQuery lista de membros
│   └── useInviteMember.ts     — useMutation convite
├── api/
│   └── members-api.ts         — fetch functions
└── types/
    └── members.types.ts       — Zod schemas
```

**Visibilidade:** Apenas role `admin` ve o item "Membros" na sidebar e acessa a pagina. Guard no frontend (esconde nav item) + backend (endpoint ja verifica role).

---

## 3. Media Pipeline no Scheduler + Upload Real + Download

### 3.1 Nova task no scheduler: `media_processing`

**Localizacao:** `crates/orchestrator/src/scheduler/media_processing.rs`

**Config:**
- Intervalo: 10 segundos
- Batch: 1 arquivo por vez (v1 — evita sobrecarga)

**Logica:**

```rust
pub async fn run(pool: &PgPool, state: &AppState) {
    // 1. Busca proximo arquivo pendente (inclui temp_path para ler bytes)
    let file = sqlx::query!("SELECT id, cluster_id, temp_path FROM files WHERE status = 'processing' ORDER BY created_at LIMIT 1")
        .fetch_optional(pool).await;

    if let Some(file) = file {
        let Some(ref master_key) = state.master_key else {
            warn!("No master_key in AppState — skipping processing");
            return;
        };

        // 2. Le bytes do arquivo temporario
        let temp_path = file.temp_path.unwrap_or_default();
        let data = match std::fs::read(&temp_path) {
            Ok(d) => d,
            Err(e) => { error!("Cannot read temp file {}: {}", temp_path, e); return; }
        };

        // 3. Processa via media_pipeline (signature completa)
        match media_pipeline::process_file(
            pool, file.id, &data, master_key,
            &state.hash_ring, &state.storage_providers,
        ).await {
            Ok(_) => {
                info!("File {} processed successfully", file.id);
                // Remove arquivo temporario
                let _ = std::fs::remove_file(&temp_path);
            }
            Err(e) => {
                error!("File {} processing failed: {}", file.id, e);
                // process_file ja marca status="error" internamente
            }
        }
    }
}
```

**Dependencias do scheduler:** `run()` recebe `&AppState` que contem `pool`, `master_key`, `hash_ring` e `storage_providers`.

**Mudanca de assinatura do scheduler:** `scheduler::start()` atualmente recebe `(PgPool, SchedulerConfig)`. Deve mudar para `(AppState, SchedulerConfig)`. As 6 tasks existentes que usam apenas `&PgPool` passam a receber `&state.pool`. A nova task `media_processing` usa `&AppState` completo. Adicionar `media_processing_interval: Duration` (default 10s) ao `SchedulerConfig`. Atualizar `main.rs` para construir `AppState` antes de `scheduler::start()`.

**Registro no scheduler:** Adicionar como 7a task em `scheduler::start()`.

### 3.2 Upload de arquivo real (multipart)

**Ajuste em `POST /api/v1/files/upload`:**

Hoje recebe JSON com metadata. Passa a aceitar `multipart/form-data`:

```rust
// Request: multipart/form-data
// Fields:
//   - file: arquivo binario
//   - cluster_id: UUID
//   - media_type: "foto" | "video" | "documento"  (match DB CHECK constraint)
//
// O backend extrai metadata do arquivo:
//   - original_name: do campo filename
//   - mime_type: do content-type ou deteccao
//   - file_extension: da extensao do filename
//   - original_size: do tamanho do body
//   - uploaded_by: do JWT (AuthClaims.member_id)
```

**Fluxo:**
1. Recebe multipart → extrai arquivo + metadata
2. Valida auth (JWT) + role (admin ou membro)
3. Valida quota (`quota_service::check_quota`)
4. Salva arquivo em `/tmp/alexandria/uploads/{file_id}` (diretorio temporario)
5. Cria registro em `files` com `status="processing"` + `temp_path`
6. Retorna `{ file_id, status: "processing" }`
7. Scheduler pega → `media_pipeline::process_file()` le do `temp_path`
8. Apos processamento, remove arquivo temporario

**Nova coluna na tabela `files`:** `temp_path TEXT` (nullable, limpo apos processamento).

**Migration (`015_add_temp_path.up.sql`):**

```sql
ALTER TABLE files ADD COLUMN temp_path TEXT;
```

**`015_add_temp_path.down.sql`:**

```sql
ALTER TABLE files DROP COLUMN IF EXISTS temp_path;
```

**Limpeza de temp files:** No startup do orchestrator, remover arquivos orfaos em `/tmp/alexandria/uploads/` (crash recovery). Adicionar rotina simples: deletar arquivos com mais de 1h de idade.

### 3.3 Download completo (UC-005)

**Handler `GET /api/v1/files/{id}/download`:**

```rust
pub async fn download_file(
    Extension(claims): Extension<AuthClaims>,
    Path(file_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, ApiError> {
    // 1. Busca arquivo + valida que pertence ao cluster do membro
    // 2. Verifica status == "ready"
    // 3. Obtem master_key do state (read lock)
    let master_key = state.master_key.read().await;
    let master_key = master_key.as_ref().ok_or(ApiError::ServiceUnavailable("Master key not loaded"))?;
    // 4. Chama media_pipeline::download_file(&state.pool, file_id, master_key, &state.storage_providers)
    //    → busca manifest → para cada chunk: fetch de replica → decrypt → reassembla
    // 5. Retorna com headers:
    //    Content-Type: <mime_type>
    //    Content-Disposition: attachment; filename="<original_name>"
    //    Content-Length: <optimized_size>
}
```

O `media_pipeline::download_file()` ja esta implementado (linhas 257-318 de `media_pipeline.rs`, marcado `#[allow(dead_code)]`). Basta remover o allow e conectar ao handler.

**Dependencia:** Precisa de `master_key` em memoria para derivar file_key. Na v1, o orchestrator mantem master_key em memoria (derivada na criacao do cluster ou no login do admin). Armazenar em `AppState`:

```rust
pub struct AppState {
    pub pool: PgPool,
    pub master_key: Arc<RwLock<Option<MasterKey>>>,  // Arc<RwLock> porque: (1) MasterKey nao implementa Clone (zeroize on Drop), (2) precisa ser mutavel (unlock endpoint escreve apos startup), (3) Axum State requer Clone
    pub hash_ring: Arc<RwLock<HashRing>>,
    pub storage_providers: Arc<RwLock<HashMap<Uuid, Box<dyn StorageProvider>>>>,
}
```

**Ciclo de vida da master_key:** Conforme blueprint, master_key nunca e persistida em disco. Ela e `None` no startup e populada quando:
- Admin cria cluster (derivada da seed na criacao)
- Admin faz login (derivada da seed armazenada no vault — **nao**: vault precisa de master_key para decriptar, logo master_key so e recuperavel via seed phrase)
- Admin executa recovery (insere seed phrase)

**Implicacao para v1:** Apos restart do orchestrator, uploads e downloads falham ate o admin fornecer a seed phrase. Na pratica, o orchestrator roda continuamente no Docker. Para resolver restarts, adicionar endpoint de unlock.

**Endpoint `POST /api/v1/auth/unlock`:**

```rust
// Requer JWT com role "admin"
pub struct UnlockRequest {
    pub seed_phrase: String,   // 12 palavras separadas por espaco
}

pub struct UnlockResponse {
    pub success: bool,
    pub message: String,       // "Master key derived successfully"
}

// Fluxo:
// 1. Valida JWT (admin only)
// 2. Valida seed phrase (BIP-39)
// 3. Deriva master_key via PBKDF2-HMAC-SHA512
// 4. Escreve em state.master_key (write lock)
// 5. Retorna sucesso
//
// Erros:
// - 401: JWT invalido ou expirado
// - 403: role != "admin"
// - 400: seed phrase invalida (palavras fora da wordlist BIP-39, quantidade != 12)
// - 409: master_key ja carregada (nao sobrescreve — admin deve reiniciar orchestrator se quiser trocar)
```

**Frontend:** Na pagina de login, se admin faz login com sucesso mas o backend retorna header `X-Master-Key-Status: locked`, o frontend exibe modal solicitando seed phrase e chama `/auth/unlock`. Operacao unica apos restart.

### 3.4 Preview

**Armazenamento:** `/data/previews/{file_id}.webp` no filesystem local do orchestrator.

**Geracao:** `media_pipeline::process_file()` ja gera preview via `core-sdk::preview`. Adicionar passo de salvar o preview no path acima. V1 gera previews apenas para fotos (WebP thumbnail ~50KB). Video previews (480p MP4) requerem FFmpeg e sao deferidos para v2.

**Endpoint `GET /api/v1/files/{id}/preview`:**
- Le `/data/previews/{file_id}.webp`
- Retorna com `Content-Type: image/webp`
- Se preview nao existe: retorna 404

**Volume Docker:** Adicionar volume `previewdata` no orchestrator service.

---

## 4. Node Agent no Docker Compose

### 4.1 Tres instancias

```yaml
node-agent-1:
  build:
    context: .
    dockerfile: Dockerfile.node-agent
  environment:
    NODE_ID: "a1b2c3d4-0001-0000-0000-000000000001"
    NODE_NAME: "node-local-1"
    STORAGE_PATH: "/data/alexandria"
    MAX_CAPACITY_GB: "50"
    ORCHESTRATOR_URL: "http://orchestrator:8080"
    HEARTBEAT_INTERVAL_SECS: "60"
    BOOTSTRAP_TOKEN: "${BOOTSTRAP_TOKEN}"
  volumes:
    - node1data:/data/alexandria
  depends_on:
    orchestrator:
      condition: service_healthy

node-agent-2:
  # identico, NODE_ID: "...0002", node2data

node-agent-3:
  # identico, NODE_ID: "...0003", node3data
```

**Novos volumes:** `node1data`, `node2data`, `node3data`.

### 4.2 Auto-registro com bootstrap token

**Logica no node-agent startup:**

```rust
async fn auto_register(config: &NodeConfig) {
    loop {
        let res = reqwest::Client::new()
            .post(&format!("{}/api/v1/nodes/register", config.orchestrator_url))
            .header("X-Bootstrap-Token", &config.bootstrap_token)
            .json(&RegisterNodeRequest {
                node_id: config.node_id,            // UUID fixo do docker-compose
                name: config.node_name.clone(),
                node_type: "local".to_string(),
                endpoint: format!("http://{}:{}", config.hostname, config.port),
                total_capacity: config.max_capacity_bytes,
            })
            .send().await;

        match res {
            Ok(r) if r.status().is_success() => { info!("Node registered"); break; }
            Ok(r) if r.status() == 409 => { info!("Already registered"); break; }
            _ => {
                warn!("Registration failed, retrying in 10s");
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
        }
    }
}
```

**Ajuste no backend `register_node`:**
- Aceitar `X-Bootstrap-Token` header como alternativa ao JWT
- Validar token contra `BOOTSTRAP_TOKEN` env var
- Se valido: buscar admin do primeiro cluster existente e usar como `owner_id` (coluna e NOT NULL no banco). Se nenhum cluster existe ainda, retorna 503 e node fica em retry loop.
- O `cluster_id` e resolvido server-side: v1 assume single-cluster, usa o unico cluster existente.
- Se nem JWT nem bootstrap token: 401

**Mudancas no `RegisterNodeRequest` existente:**
- Adicionar campo `node_id: Option<Uuid>` — se fornecido (auto-registro), usar como ID; se nao, gerar novo
- Adicionar campo `endpoint: String` — URL do node agent para o orchestrator se comunicar
- Remover `owner_id` do request — resolvido server-side (do JWT ou do primeiro admin para bootstrap)
- Remover `cluster_id` do request — resolvido server-side (v1 single-cluster)

### 4.3 Node agent — chunk API

O node-agent precisa servir chunks para o orchestrator buscar durante download/scrubbing. Endpoints necessarios:

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/chunks/{chunk_id}` | PUT | Receber chunk do orchestrator |
| `/chunks/{chunk_id}` | GET | Servir chunk ao orchestrator |
| `/chunks/{chunk_id}` | HEAD | Verificar existencia |
| `/chunks/{chunk_id}` | DELETE | Remover chunk (GC/drain) |
| `/health` | GET | Health check |

Estes endpoints usam `LocalStorageProvider` para ler/escrever no filesystem. O orchestrator se comunica com nodes via HTTP (nao via StorageProvider trait diretamente — nodes sao servicos remotos).

### 4.4 `.env.example` atualizado

```env
# PostgreSQL
DATABASE_URL=postgres://alexandria:alexandria@postgres:5432/alexandria

# Redis
REDIS_URL=redis://redis:6379

# Orchestrator
HOST=0.0.0.0
PORT=8080
RUST_LOG=info

# Auth
JWT_SECRET=change-me-generate-with-openssl-rand-base64-32

# Node auto-registration
BOOTSTRAP_TOKEN=change-me-generate-with-openssl-rand-hex-32

# Frontend (apps/web/.env.local)
# NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 5. Ajustes no Frontend

### 5.1 Member IDs do auth store

Todos os forms que usam `uploaded_by`, `owner_id`, `inviter_id` passam a ler de `authStore.member.id`:

```typescript
// Antes (hardcoded):
uploaded_by: "00000000-0000-0000-0000-000000000000"

// Depois:
const { member } = useAuthStore();
uploaded_by: member.id
```

### 5.2 Novas rotas

| Rota | Layout | Guard |
|------|--------|-------|
| `app/setup/page.tsx` | Sem layout (fullscreen) | Publico; redirect se ja logado |
| `app/login/page.tsx` | Sem layout (fullscreen) | Publico; redirect se ja logado |
| `app/invite/[token]/page.tsx` | Sem layout (fullscreen) | Publico |
| `app/(protected)/members/page.tsx` | AppShell | Admin only |

### 5.3 Nova feature `auth`

```
features/auth/
├── components/
│   ├── LoginForm.tsx           — email + senha
│   ├── SetupWizard.tsx         — criar cluster (multi-step)
│   ├── SeedPhraseDisplay.tsx   — grid 3x4 com 12 palavras
│   ├── InviteAcceptForm.tsx    — aceitar convite
│   └── PasswordInput.tsx       — input com toggle show/hide
├── hooks/
│   ├── useLogin.ts             — useMutation login
│   └── useValidateInvite.ts    — useQuery validacao de token
├── api/
│   └── auth-api.ts             — login, refresh, validate invite
└── types/
    └── auth.types.ts           — Zod schemas
```

### 5.4 Upload multipart

Atualizar `features/upload/api/upload-api.ts`:

```typescript
// Antes: JSON com metadata
// Depois: FormData com arquivo + metadata extraida automaticamente
export async function uploadFile(file: File, clusterId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("cluster_id", clusterId);
  formData.append("media_type", detectMediaType(file.type));

  return apiClient.postMultipart("/api/v1/files/upload", formData);
}
```

Adicionar metodo `postMultipart` no `api-client.ts` (sem `Content-Type` header — browser define automaticamente com boundary).

**`detectMediaType` helper:** mapeia MIME type para enum do banco:
- `image/*` → `"foto"`
- `video/*` → `"video"`
- Demais → `"documento"`

### 5.5 Relacao com frontend restructure spec

Este spec **complementa** o [frontend restructure spec](./2026-03-19-frontend-restructure-design.md):

| Aspecto | Frontend Restructure | Este Spec |
|---------|---------------------|-----------|
| Estrutura de pastas | Define nova estrutura | Adiciona `features/auth/` e `features/members/` |
| Componentes UI | 8 primitivos + EmptyState | Reutiliza os mesmos |
| Data layer | TanStack Query + Zustand + Zod | Adiciona auth store + auth interceptor |
| Rotas existentes | Migra 5 features | Adiciona `/setup`, `/login`, `/invite/[token]`, `/members` |
| API client | Novo `api-client.ts` | Adiciona `postMultipart` + auth interceptor |

A ordem de implementacao e: frontend restructure primeiro (fundacao), depois este spec (auth + wiring).

---

## 6. Resumo de Entregas

### Novas migrations

| Migration | Conteudo |
|-----------|----------|
| `014_add_auth.up.sql` | `members.password_hash`, tabelas `refresh_tokens` e `invites` |
| `014_add_auth.down.sql` | Rollback das 3 mudancas acima |
| `015_add_temp_path.up.sql` | `files.temp_path` |
| `015_add_temp_path.down.sql` | Rollback |

### Novos modulos Rust

| Modulo | Descricao |
|--------|-----------|
| `orchestrator/src/auth/` | JWT, middleware, password, refresh |
| `orchestrator/src/scheduler/media_processing.rs` | Polling de arquivos pendentes |

### Endpoints novos

| Endpoint | Metodo |
|----------|--------|
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/refresh` | Refresh token |
| `POST /api/v1/auth/logout` | Logout |
| `GET /api/v1/auth/me` | Membro atual |
| `POST /api/v1/auth/unlock` | Admin fornece seed phrase para re-derivar master_key |
| `GET /api/v1/invite/{token}/validate` | Validar convite |

### Endpoints modificados

| Endpoint | Mudanca |
|----------|---------|
| `POST /api/v1/clusters` | Retorna JWT + hasheia senha + guard (rejeita se cluster ja existe) |
| `POST /api/v1/invite/{token}` | Retorna JWT + hasheia senha |
| `POST /api/v1/files/upload` | Aceita multipart + arquivo real |
| `GET /api/v1/files/{id}/download` | Implementacao completa (reassembly) |
| `GET /api/v1/files/{id}/preview` | Serve preview do filesystem |
| `POST /api/v1/nodes/register` | Aceita bootstrap token |
| Todas as rotas protegidas | Middleware JWT |

### Frontend — novos componentes

| Feature | Componentes |
|---------|------------|
| `features/auth/` | LoginForm, SetupWizard, SeedPhraseDisplay, InviteAcceptForm |
| `features/members/` | MembersPage, MemberList, MemberRow, InviteModal |
| `store/auth-store.ts` | Auth state + persist |

### Docker Compose

| Servico | Mudanca |
|---------|---------|
| `node-agent-1/2/3` | 3 novas instancias |
| `orchestrator` | Novos env vars (JWT_SECRET, BOOTSTRAP_TOKEN) |
| Volumes | `node1data`, `node2data`, `node3data`, `previewdata` |

---

## Fora do Escopo

- Video transcoding (FFmpeg) — v2; fotos funcionam com WebP via core-sdk
- OAuth integration (Google Drive, Dropbox, OneDrive) — Fase 2
- Desktop client (Tauri) — Fase 2
- Testes automatizados — fase seguinte
- Dark mode toggle — tokens preparados, UI depois
- Recovery completo (rebuild de VPS distribuido) — v2
- mTLS entre orchestrator e nodes — v2
- Rate limiting — v2
