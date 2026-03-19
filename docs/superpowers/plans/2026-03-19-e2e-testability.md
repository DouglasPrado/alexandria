# E2E Testability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Alexandria testable end-to-end: create cluster → add nodes → upload file → see in gallery → download

**Architecture:** JWT auth (HMAC-SHA256) with refresh tokens + role guards as Axum middleware. Media pipeline triggered by 10s scheduler polling. 3 node-agents in docker-compose with bootstrap token auto-registration. Multipart file upload with temp storage. AppState holds master_key in Arc<RwLock<Option<MasterKey>>>.

**Tech Stack:** Rust/Axum 0.8, SQLx, PostgreSQL 18, jsonwebtoken, argon2, Next.js 16, Zustand, TanStack Query, Zod

**Spec:** [docs/superpowers/specs/2026-03-19-e2e-testability-design.md](../specs/2026-03-19-e2e-testability-design.md)

**Pre-requisite:** The [frontend restructure spec](../specs/2026-03-19-frontend-restructure-design.md) should be implemented first (folder structure, primitives, data layer). This plan assumes `features/`, `components/ui/`, `services/api-client.ts`, `store/`, and TanStack Query are in place.

**Testing note:** The spec lists "Testes automatizados" as out-of-scope. This plan includes unit tests for critical auth logic (password, JWT, refresh tokens) but defers integration tests to the next phase. Tasks that only have "Verify compilation" steps are intentionally test-light.

**Naming convention:** The existing codebase uses `AppState { db: PgPool }`. This plan preserves `db` as the field name (not `pool` as the spec shows). All code referencing the pool uses `state.db`.

**Node agent chunk API:** The node-agent already implements PUT/GET/DELETE `/chunks/{chunk_id}` + `/health` in `crates/node-agent/src/api.rs` (225 lines with tests). No new task needed for chunk endpoints.

---

## File Map

### New Files — Backend

| File | Responsibility |
|------|---------------|
| `migrations/014_add_auth.up.sql` | password_hash, refresh_tokens, invites tables |
| `migrations/014_add_auth.down.sql` | Rollback |
| `migrations/015_add_temp_path.up.sql` | files.temp_path column |
| `migrations/015_add_temp_path.down.sql` | Rollback |
| `crates/orchestrator/src/auth/mod.rs` | Module re-exports |
| `crates/orchestrator/src/auth/claims.rs` | AuthClaims struct |
| `crates/orchestrator/src/auth/password.rs` | argon2id hash/verify |
| `crates/orchestrator/src/auth/jwt.rs` | JWT encode/decode (HMAC-SHA256) |
| `crates/orchestrator/src/auth/middleware.rs` | Axum auth layer |
| `crates/orchestrator/src/auth/refresh.rs` | Refresh token create/validate/revoke |
| `crates/orchestrator/src/api/auth.rs` | Auth endpoints (login, refresh, logout, me, unlock) |
| `crates/orchestrator/src/services/auth_service.rs` | Auth business logic |
| `crates/orchestrator/src/services/invite_service.rs` | Invite create/validate/accept |
| `crates/orchestrator/src/scheduler/media_processing.rs` | File processing polling task |

### New Files — Frontend

| File | Responsibility |
|------|---------------|
| `apps/web/src/store/auth-store.ts` | Auth state (Zustand + persist) |
| `apps/web/src/features/auth/api/auth-api.ts` | Login, refresh, validate invite |
| `apps/web/src/features/auth/types/auth.types.ts` | Zod schemas |
| `apps/web/src/features/auth/hooks/useLogin.ts` | Login mutation |
| `apps/web/src/features/auth/hooks/useValidateInvite.ts` | Invite validation query |
| `apps/web/src/features/auth/components/LoginForm.tsx` | Email + password form |
| `apps/web/src/features/auth/components/SetupWizard.tsx` | Cluster creation wizard |
| `apps/web/src/features/auth/components/SeedPhraseDisplay.tsx` | 12-word grid |
| `apps/web/src/features/auth/components/InviteAcceptForm.tsx` | Accept invite form |
| `apps/web/src/features/auth/components/PasswordInput.tsx` | Password input with show/hide toggle |
| `apps/web/src/features/members/api/members-api.ts` | Members CRUD |
| `apps/web/src/features/members/types/members.types.ts` | Zod schemas |
| `apps/web/src/features/members/hooks/useMembers.ts` | Members query |
| `apps/web/src/features/members/hooks/useInviteMember.ts` | Invite mutation |
| `apps/web/src/features/members/components/MembersPage.tsx` | Members list + invite orchestrator |
| `apps/web/src/features/members/components/MemberList.tsx` | Table of members |
| `apps/web/src/features/members/components/MemberRow.tsx` | Single member row with actions |
| `apps/web/src/features/members/components/InviteModal.tsx` | Invite form modal |
| `apps/web/src/app/setup/page.tsx` | Setup route (public) |
| `apps/web/src/app/login/page.tsx` | Login route (rewrite existing) |
| `apps/web/src/app/invite/[token]/page.tsx` | Invite acceptance route |
| `apps/web/src/app/(protected)/members/page.tsx` | Members route |
| `apps/web/.env.local` | NEXT_PUBLIC_API_URL |

### Modified Files — Backend

| File | Change |
|------|--------|
| `crates/orchestrator/Cargo.toml` | Add jsonwebtoken, argon2, axum-extra (multipart) |
| `crates/orchestrator/src/main.rs` | Build AppState, pass to scheduler + router |
| `crates/orchestrator/src/api/mod.rs` | Split public/protected routes, add auth routes |
| `crates/orchestrator/src/api/clusters.rs` | Return JWT on create, hash password, guard |
| `crates/orchestrator/src/api/nodes.rs` | Accept bootstrap token, change RegisterNodeRequest |
| `crates/orchestrator/src/api/files.rs` | Multipart upload, download impl, preview impl |
| `crates/orchestrator/src/services/mod.rs` | Add auth_service, invite_service |
| `crates/orchestrator/src/services/cluster_service.rs` | Hash password, return tokens |
| `crates/orchestrator/src/scheduler/mod.rs` | Accept AppState, add media_processing task |
| `crates/node-agent/src/main.rs` | Add auto_register on startup |
| `crates/node-agent/Cargo.toml` | Ensure reqwest with json feature |
| `docker-compose.yml` | Add 3 node-agents, volumes, env vars |
| `.env.example` | Add JWT_SECRET, BOOTSTRAP_TOKEN |

### Modified Files — Frontend

| File | Change |
|------|--------|
| `apps/web/src/services/api-client.ts` | Add postMultipart, auth interceptor |
| `apps/web/src/app/(protected)/layout.tsx` | Auth guard (redirect to /login) |

---

## Task 1: Auth Migrations

**Files:**
- Create: `migrations/014_add_auth.up.sql`
- Create: `migrations/014_add_auth.down.sql`
- Create: `migrations/015_add_temp_path.up.sql`
- Create: `migrations/015_add_temp_path.down.sql`

**Docs to read:** Spec section 1.3, 3.2. Check existing migrations in `migrations/` for naming convention.

- [ ] **Step 1: Write migration 014 (auth tables)**

```sql
-- 014_add_auth.up.sql
ALTER TABLE members ADD COLUMN password_hash TEXT;

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_member ON refresh_tokens(member_id);

CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'leitura',
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES members(id),
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_token ON invites(token_hash);
```

- [ ] **Step 2: Write migration 014 down**

```sql
-- 014_add_auth.down.sql
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS refresh_tokens;
ALTER TABLE members DROP COLUMN IF EXISTS password_hash;
```

- [ ] **Step 3: Write migration 015 (temp_path)**

```sql
-- 015_add_temp_path.up.sql
ALTER TABLE files ADD COLUMN temp_path TEXT;
```

```sql
-- 015_add_temp_path.down.sql
ALTER TABLE files DROP COLUMN IF EXISTS temp_path;
```

- [ ] **Step 4: Verify migrations compile**

Run: `cd /Users/douglasprado/www/alexandria && cargo build --bin orchestrator 2>&1 | head -20`
Expected: Build succeeds (migrations are applied at runtime via sqlx::migrate!)

- [ ] **Step 5: Commit**

```bash
git add migrations/014_* migrations/015_*
git commit -m "feat: add auth migrations — password_hash, refresh_tokens, invites, temp_path"
```

---

## Task 2: Auth Module — Password Hashing

**Files:**
- Create: `crates/orchestrator/src/auth/mod.rs`
- Create: `crates/orchestrator/src/auth/password.rs`
- Modify: `crates/orchestrator/Cargo.toml` (add argon2 dependency)
- Modify: `crates/orchestrator/src/main.rs` (add mod auth)

**Docs to read:** Spec section 1.1. Check `Cargo.toml` workspace deps.

- [ ] **Step 1: Add argon2 to orchestrator Cargo.toml**

Add `argon2 = "0.5"` under `[dependencies]` in `crates/orchestrator/Cargo.toml`.

- [ ] **Step 2: Create auth module with password hashing**

Create `crates/orchestrator/src/auth/mod.rs`:
```rust
pub mod password;
pub mod claims;
pub mod jwt;
pub mod middleware;
pub mod refresh;
```

Create `crates/orchestrator/src/auth/password.rs`:
- `pub fn hash_password(password: &str) -> Result<String, AuthError>` — uses argon2::Argon2 default with random salt, returns PHC string
- `pub fn verify_password(password: &str, hash: &str) -> Result<bool, AuthError>` — verifies against stored hash
- Unit tests: hash roundtrip, wrong password fails, empty password

- [ ] **Step 3: Add `mod auth` to main.rs**

Add `mod auth;` to `crates/orchestrator/src/main.rs` alongside existing `mod api`, `mod scheduler`, `mod services`.

- [ ] **Step 4: Run tests**

Run: `cargo test -p orchestrator --lib auth::password`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/
git commit -m "feat(auth): add password hashing with argon2id"
```

---

## Task 3: Auth Module — JWT + Claims

**Files:**
- Create: `crates/orchestrator/src/auth/claims.rs`
- Create: `crates/orchestrator/src/auth/jwt.rs`
- Modify: `crates/orchestrator/Cargo.toml` (add jsonwebtoken)

**Docs to read:** Spec section 1.1. AuthClaims struct definition.

- [ ] **Step 1: Add jsonwebtoken to Cargo.toml**

Add `jsonwebtoken = "9"` under `[dependencies]`.

- [ ] **Step 2: Create claims.rs**

```rust
// AuthClaims with Serialize/Deserialize for JWT
// Uses serde rename to map member_id → "sub" in JWT standard claim
#[derive(Debug, Serialize, Deserialize)]
pub struct AuthClaims {
    #[serde(rename = "sub")]
    pub member_id: Uuid,
    pub cluster_id: Uuid,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}
```

All handlers and middleware reference `claims.member_id` (not `sub`).

- [ ] **Step 3: Create jwt.rs**

- `pub fn encode_access_token(claims: &AuthClaims, secret: &str) -> Result<String>` — 24h expiry
- `pub fn decode_token(token: &str, secret: &str) -> Result<AuthClaims>` — validates expiry + signature
- `pub fn encode_refresh_token() -> (String, String)` — generates random token + its SHA-256 hash (for DB storage)
- Unit tests: encode-decode roundtrip, expired token fails, invalid signature fails

- [ ] **Step 4: Run tests**

Run: `cargo test -p orchestrator --lib auth::jwt`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/src/auth/
git commit -m "feat(auth): add JWT encode/decode with HMAC-SHA256"
```

---

## Task 4: Auth Module — Middleware + Refresh

**Files:**
- Create: `crates/orchestrator/src/auth/middleware.rs`
- Create: `crates/orchestrator/src/auth/refresh.rs`

**Docs to read:** Spec section 1.1, 1.4. Axum middleware patterns — check existing Tower layers in api/mod.rs.

- [ ] **Step 1: Create middleware.rs**

Axum middleware that:
1. Extracts `Authorization: Bearer <token>` header
2. Decodes JWT using `jwt::decode_token`
3. Inserts `AuthClaims` into request extensions
4. Returns 401 if missing/invalid/expired

Also add role guard helpers:
- `pub fn require_admin(claims: &AuthClaims) -> Result<(), StatusCode>`
- `pub fn require_member_or_above(claims: &AuthClaims) -> Result<(), StatusCode>`

- [ ] **Step 2: Create refresh.rs**

- `pub async fn create_refresh_token(pool: &PgPool, member_id: Uuid) -> Result<String>` — generates token, stores SHA-256 hash in DB, returns raw token
- `pub async fn validate_and_rotate(pool: &PgPool, raw_token: &str) -> Result<Uuid>` — finds by hash, checks not revoked + not expired, marks old as revoked, returns member_id
- `pub async fn revoke_token(pool: &PgPool, raw_token: &str) -> Result<()>` — marks as revoked

- [ ] **Step 3: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles (middleware won't be wired yet)

- [ ] **Step 4: Commit**

```bash
git add crates/orchestrator/src/auth/
git commit -m "feat(auth): add Axum auth middleware and refresh token logic"
```

---

## Task 5: AppState Refactor

**Files:**
- Modify: `crates/orchestrator/src/main.rs`
- Modify: `crates/orchestrator/src/api/mod.rs`

**Docs to read:** Spec section 3.3 (AppState definition). Current `main.rs` uses `AppState { db: PgPool }`.

- [ ] **Step 1: Update AppState struct**

In `api/mod.rs`, change `AppState` to:
```rust
pub struct AppState {
    pub db: PgPool,                                                    // existing
    pub jwt_secret: String,                                            // new
    pub bootstrap_token: Option<String>,                               // new
    pub master_key: Arc<tokio::sync::RwLock<Option<alexandria_core::crypto::envelope::MasterKey>>>,
    pub hash_ring: Arc<tokio::sync::RwLock<alexandria_core::consistent_hashing::HashRing>>,
    pub storage_providers: Arc<tokio::sync::RwLock<std::collections::HashMap<uuid::Uuid, Box<dyn alexandria_core::storage::StorageProvider>>>>,
}
```

Derive `Clone` (all fields are Arc or Clone types).

- [ ] **Step 2: Update main.rs to build new AppState**

Read `JWT_SECRET` and `BOOTSTRAP_TOKEN` from env vars. Initialize master_key as None, hash_ring as empty, storage_providers as empty HashMap.

- [ ] **Step 3: Update all handlers that use `State(state): State<AppState>`**

Change `state.db` references — existing handlers use `state.db` as the pool. This should still work since `db` field is preserved.

- [ ] **Step 4: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/src/
git commit -m "refactor: expand AppState with jwt_secret, master_key, hash_ring, storage_providers"
```

---

## Task 6: Auth Endpoints (login, refresh, logout, me)

**Files:**
- Create: `crates/orchestrator/src/api/auth.rs`
- Create: `crates/orchestrator/src/services/auth_service.rs`
- Modify: `crates/orchestrator/src/api/mod.rs` (add auth routes)
- Modify: `crates/orchestrator/src/services/mod.rs` (add auth_service)

**Docs to read:** Spec section 1.2 (request/response structs). Current `api/clusters.rs` for pattern reference.

- [ ] **Step 1: Create auth_service.rs**

- `pub async fn login(pool, email, password, jwt_secret, master_key_loaded: bool) -> Result<LoginResponse>` — find member by email (single-cluster assumption), verify password hash, generate access + refresh tokens. Include `master_key_status: "locked" | "ready"` in response (or set `X-Master-Key-Status` header)
- `pub async fn refresh(pool, raw_refresh_token, jwt_secret) -> Result<RefreshResponse>` — validate+rotate refresh token, issue new access token
- `pub async fn logout(pool, raw_refresh_token) -> Result<()>` — revoke refresh token

- [ ] **Step 2: Create api/auth.rs**

Handlers:
- `pub async fn login(State, Json<LoginRequest>) -> Result<Json<LoginResponse>, StatusCode>`
- `pub async fn refresh_token(State, Json<RefreshRequest>) -> Result<Json<RefreshResponse>, StatusCode>`
- `pub async fn logout(Extension<AuthClaims>, State, Json<LogoutRequest>) -> StatusCode`
- `pub async fn me(Extension<AuthClaims>, State) -> Result<Json<MemberInfo>, StatusCode>`

- [ ] **Step 3: Wire auth routes in api/mod.rs**

Add to public routes: `/api/v1/auth/login`, `/api/v1/auth/refresh`
Add to protected routes: `/api/v1/auth/logout`, `/api/v1/auth/me`

- [ ] **Step 4: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/src/
git commit -m "feat(auth): add login, refresh, logout, me endpoints"
```

---

## Task 7: Route Protection — Split Public/Protected

**Files:**
- Modify: `crates/orchestrator/src/api/mod.rs`

**Docs to read:** Spec section 1.4. Current router in `api/mod.rs` has all routes in one flat Router.

- [ ] **Step 1: Split routes into public and protected groups**

Move the existing flat router into two separate `Router::new()` blocks:
- Public: health, metrics, auth/login, auth/refresh, clusters POST, invite POST, invite validate GET, nodes heartbeat, nodes register
- Protected: everything else — with `.layer(auth_middleware)`

Merge both into the final app: `let app = public.merge(protected)`

- [ ] **Step 2: Add auth middleware layer to protected routes**

Use `from_fn` middleware or Tower layer. The middleware calls `jwt::decode_token` and injects `AuthClaims`.

- [ ] **Step 3: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 4: Commit**

```bash
git add crates/orchestrator/src/api/mod.rs
git commit -m "feat(auth): split routes into public/protected with JWT middleware"
```

---

## Task 8: Update Cluster Creation (return JWT, hash password, guard)

**Files:**
- Modify: `crates/orchestrator/src/api/clusters.rs` (CreateClusterRequest, create_cluster handler)
- Modify: `crates/orchestrator/src/services/cluster_service.rs`

**Docs to read:** Spec section 2.1. UC-001 in `docs/blueprint/08-use_cases.md`. Current `CreateClusterRequest` in `api/clusters.rs`.

- [ ] **Step 1: Add password field to CreateClusterRequest**

Add `password: String` to the existing struct.

- [ ] **Step 2: Update cluster_service::create_cluster**

After creating member, hash password and store in `members.password_hash`. After creating cluster, generate JWT access_token + refresh_token.

- [ ] **Step 3: Update CreateClusterResponse**

Add `access_token`, `refresh_token`, `expires_in` fields alongside existing `seed_phrase`, `cluster_id`, `crypto_cluster_id`.

- [ ] **Step 4: Add guard — reject if cluster already exists**

At start of `create_cluster` handler, check `SELECT COUNT(*) FROM clusters`. If > 0, return 403 "Cluster already exists".

- [ ] **Step 5: Store master_key in AppState**

After deriving master_key from seed in `create_cluster`, write it to `state.master_key` via write lock.

- [ ] **Step 6: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 7: Commit**

```bash
git add crates/orchestrator/src/
git commit -m "feat(auth): cluster creation returns JWT, hashes password, guards single-cluster"
```

---

## Task 9: Invite System (create, validate, accept with JWT)

**Files:**
- Create: `crates/orchestrator/src/services/invite_service.rs`
- Modify: `crates/orchestrator/src/api/clusters.rs` (invite_member, accept_invite handlers)
- Modify: `crates/orchestrator/src/services/mod.rs`

**Docs to read:** Spec sections 2.2, 2.3. UC-002 in blueprint.

- [ ] **Step 1: Create invite_service.rs**

- `pub async fn create_invite(pool, cluster_id, email, role, invited_by) -> Result<String>` — generates random token, stores SHA-256 hash in `invites` table, returns raw token
- `pub async fn validate_invite(pool, raw_token) -> Result<ValidateInviteResponse>` — finds by hash, checks expiry + accepted status
- `pub async fn accept_invite(pool, raw_token, name, email, password, jwt_secret) -> Result<AcceptInviteResponse>` — validates token, creates member with hashed password, marks invite accepted, returns JWT

- [ ] **Step 2: Update invite_member handler**

Use `invite_service::create_invite` instead of current logic. Return invite link/token.

- [ ] **Step 3: Add validate_invite endpoint**

`GET /api/v1/invite/{token}/validate` → calls `invite_service::validate_invite`

- [ ] **Step 4: Update accept_invite handler**

Add `password` field to `AcceptInviteRequest`. Use `invite_service::accept_invite`. Return JWT tokens in response.

- [ ] **Step 5: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 6: Commit**

```bash
git add crates/orchestrator/src/
git commit -m "feat(auth): invite system with token validation and JWT on accept"
```

---

## Task 10: Unlock Endpoint

**Files:**
- Modify: `crates/orchestrator/src/api/auth.rs`

**Docs to read:** Spec section 3.3 (unlock endpoint).

- [ ] **Step 1: Add unlock handler**

```rust
pub async fn unlock(
    Extension(claims): Extension<AuthClaims>,
    State(state): State<AppState>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<UnlockResponse>, StatusCode>
```

Validate admin role, parse BIP-39 seed, derive master_key, write to `state.master_key`.

- [ ] **Step 2: Add route**

Add `POST /api/v1/auth/unlock` to protected routes (admin only).

- [ ] **Step 3: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 4: Commit**

```bash
git add crates/orchestrator/src/api/auth.rs crates/orchestrator/src/api/mod.rs
git commit -m "feat(auth): add unlock endpoint for master_key derivation"
```

---

## Task 11: Node Registration — Bootstrap Token

**Files:**
- Modify: `crates/orchestrator/src/api/nodes.rs`
- Modify: `crates/orchestrator/src/services/node_service.rs`

**Docs to read:** Spec section 4.2. Current `RegisterNodeRequest` in `api/nodes.rs`.

- [ ] **Step 1: Update RegisterNodeRequest**

```rust
pub struct RegisterNodeRequest {
    pub node_id: Option<Uuid>,      // new — if provided, use as ID
    pub name: String,               // existing
    pub node_type: String,          // existing
    pub endpoint: Option<String>,   // new — node agent URL
    pub total_capacity: i64,        // existing
}
// Removed: cluster_id, owner_id (resolved server-side)
```

- [ ] **Step 2: Update register_node handler**

Check for `X-Bootstrap-Token` header. If present and matches `BOOTSTRAP_TOKEN` env var:
- Find first cluster + its admin → use as cluster_id + owner_id
- If no cluster exists, return 503
If no bootstrap token, require JWT auth (get cluster_id + owner_id from claims).

- [ ] **Step 3: Add endpoint column to nodes table if needed**

Check `migrations/003_create_nodes.up.sql` for `endpoint` column. If missing, create `migrations/016_add_node_endpoint.up.sql` and `016_add_node_endpoint.down.sql`:
```sql
-- 016_add_node_endpoint.up.sql
ALTER TABLE nodes ADD COLUMN endpoint TEXT;
-- 016_add_node_endpoint.down.sql
ALTER TABLE nodes DROP COLUMN IF EXISTS endpoint;
```

- [ ] **Step 4: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/src/
git commit -m "feat: node registration with bootstrap token for auto-register"
```

---

## Task 12: Node Agent — Auto-Register on Startup

**Files:**
- Modify: `crates/node-agent/src/main.rs`
- Modify: `crates/node-agent/Cargo.toml` (if reqwest json feature missing)

**Docs to read:** Spec section 4.2.

- [ ] **Step 1: Add new fields to NodeConfig**

Read from env vars: `BOOTSTRAP_TOKEN`, `NODE_NAME`, `NODE_HOSTNAME` (Docker sets HOSTNAME env var automatically — the docker service name e.g. "node-agent-1"). This is used for the `endpoint` field in auto-register (`http://{hostname}:{port}`).

- [ ] **Step 2: Add auto_register function**

Async function that loops: POST /api/v1/nodes/register with X-Bootstrap-Token header. Break on 200 (registered) or 409 (already registered). Retry with 10s delay on failure/503.

- [ ] **Step 3: Call auto_register before heartbeat loop**

In main(), after storage provider init, call auto_register. Then start heartbeat loop.

- [ ] **Step 4: Verify compilation**

Run: `cargo check -p node-agent`
Expected: Compiles

- [ ] **Step 5: Commit**

```bash
git add crates/node-agent/
git commit -m "feat: node-agent auto-registers with orchestrator on startup"
```

---

## Task 13: Media Pipeline Scheduler Task

**Files:**
- Create: `crates/orchestrator/src/scheduler/media_processing.rs`
- Modify: `crates/orchestrator/src/scheduler/mod.rs`

**Docs to read:** Spec section 3.1. Current `scheduler/mod.rs` for task pattern. `services/media_pipeline.rs` for `process_file` signature.

- [ ] **Step 1: Create media_processing.rs**

```rust
pub async fn run(state: &AppState) {
    // Query files WHERE status = 'processing' ORDER BY created_at LIMIT 1
    // Read master_key from state (skip if None)
    // Read temp_path, load file bytes from disk
    // Call media_pipeline::process_file(pool, file_id, data, master_key, hash_ring, storage_providers)
    // On success: remove temp file
    // On error: process_file already marks status="error"
}
```

- [ ] **Step 2: Update SchedulerConfig**

Add `media_processing_interval: Duration` with default 10 seconds.

- [ ] **Step 3: Update scheduler::start signature**

Change from `start(pool: PgPool, config: SchedulerConfig)` to `start(state: AppState, config: SchedulerConfig)`.

The current code clones `pool` into 6 variables (`let pool_hb = pool.clone()` etc.) for each task. Change to clone `state` instead: `let state_hb = state.clone()`. Each existing task spawns with `&state_hb.db` instead of `&pool_hb`. The new media_processing task gets `&state_media` (full AppState).

```rust
// Example for heartbeat task (pattern for all 6 existing tasks):
let state_hb = state.clone();
tokio::spawn(async move {
    loop {
        heartbeat::run(&state_hb.db).await;  // was: run(&pool_hb)
        tokio::time::sleep(config.heartbeat_interval).await;
    }
});

// New media_processing task:
let state_media = state.clone();
tokio::spawn(async move {
    loop {
        media_processing::run(&state_media).await;
        tokio::time::sleep(config.media_processing_interval).await;
    }
});
```

- [ ] **Step 4: Update main.rs**

Build `AppState` before `scheduler::start()`. Pass `state.clone()` to scheduler and `state` to the Axum router.

- [ ] **Step 5: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 6: Commit**

```bash
git add crates/orchestrator/src/scheduler/ crates/orchestrator/src/main.rs
git commit -m "feat: add media processing scheduler task (10s polling)"
```

---

## Task 14: Multipart File Upload

**Files:**
- Modify: `crates/orchestrator/src/api/files.rs`
- Modify: `crates/orchestrator/Cargo.toml` (add axum multipart feature)

**Docs to read:** Spec section 3.2. Axum multipart docs. Current `upload_file` handler in `api/files.rs`.

- [ ] **Step 1: Enable axum multipart**

In `crates/orchestrator/Cargo.toml`, ensure axum has `features = ["multipart"]`.

- [ ] **Step 2: Rewrite upload_file handler**

Accept `Multipart` instead of `Json<UploadRequest>`. Extract:
- `file` field → bytes + filename
- `cluster_id` field → UUID
- `media_type` field → "foto" | "video" | "documento"
Get `uploaded_by` from `Extension<AuthClaims>.sub`.
Save file to `/tmp/alexandria/uploads/{file_id}`.
Create DB record with `status="processing"` and `temp_path`.

- [ ] **Step 3: Add temp dir creation on startup**

In `main.rs`, create `/tmp/alexandria/uploads/` directory if it doesn't exist. Add cleanup routine for files older than 1h.

- [ ] **Step 4: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 5: Commit**

```bash
git add crates/orchestrator/
git commit -m "feat: multipart file upload with temp storage for pipeline processing"
```

---

## Task 15: File Download + Preview Implementation

**Files:**
- Modify: `crates/orchestrator/src/api/files.rs` (download_file, get_preview handlers)
- Modify: `crates/orchestrator/src/services/media_pipeline.rs` (remove #[allow(dead_code)] from download_file)

**Docs to read:** Spec sections 3.3, 3.4. Current `download_file` stub returns 202. `media_pipeline::download_file` signature.

- [ ] **Step 1: Implement download_file handler**

Replace 202 stub with:
1. Verify file belongs to member's cluster
2. Check status == "ready"
3. Read master_key from AppState
4. Call `media_pipeline::download_file(pool, file_id, master_key, storage_providers)`
5. Return bytes with Content-Type and Content-Disposition headers

- [ ] **Step 2: Remove #[allow(dead_code)] from media_pipeline::download_file**

- [ ] **Step 3: Implement get_preview handler**

Replace 204 stub with:
1. Check if `/data/previews/{file_id}.webp` exists
2. If yes: serve with Content-Type: image/webp
3. If no: return 404

- [ ] **Step 4: Update media_pipeline::process_file to save previews**

After generating preview (already done in pipeline), save to `/data/previews/{file_id}.webp`.

- [ ] **Step 5: Add preview volume in docker-compose**

Add `previewdata:/data/previews` to orchestrator service volumes.

- [ ] **Step 6: Verify compilation**

Run: `cargo check -p orchestrator`
Expected: Compiles

- [ ] **Step 7: Commit**

```bash
git add crates/orchestrator/ docker-compose.yml
git commit -m "feat: implement file download (chunk reassembly) and preview serving"
```

---

## Task 16: Docker Compose — 3 Node Agents + Env

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Create: `apps/web/.env.local`

**Docs to read:** Spec sections 4.1, 4.4. Current `docker-compose.yml`.

- [ ] **Step 1: Add 3 node-agent services to docker-compose.yml**

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
    NODE_PORT: "9090"
    NODE_HOSTNAME: "node-agent-1"
  volumes:
    - node1data:/data/alexandria
  depends_on:
    orchestrator:
      condition: service_healthy
```

Repeat for node-agent-2 (UUID ...0002, node2data, NODE_HOSTNAME: "node-agent-2") and node-agent-3 (UUID ...0003, node3data, NODE_HOSTNAME: "node-agent-3").

Add volumes: `node1data`, `node2data`, `node3data`, `previewdata`.

- [ ] **Step 2: Update orchestrator service env vars**

Add `JWT_SECRET: "${JWT_SECRET}"` and `BOOTSTRAP_TOKEN: "${BOOTSTRAP_TOKEN}"` to orchestrator environment.
Add `previewdata:/data/previews` to orchestrator volumes.

- [ ] **Step 3: Update .env.example**

Add `JWT_SECRET=change-me-generate-with-openssl-rand-base64-32` and `BOOTSTRAP_TOKEN=change-me-generate-with-openssl-rand-hex-32`.

- [ ] **Step 4: Create apps/web/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example apps/web/.env.local
git commit -m "infra: add 3 node-agents to docker-compose, configure auth env vars"
```

---

## Task 17: Frontend — Auth Store + API Client Interceptor

**Files:**
- Create: `apps/web/src/store/auth-store.ts`
- Modify: `apps/web/src/services/api-client.ts`

**Docs to read:** Spec section 1.5. Current `api-client.ts` (62 lines). Zustand persist middleware.

- [ ] **Step 1: Create auth-store.ts**

Zustand store with `persist` middleware (localStorage):
- State: `accessToken`, `refreshToken`, `member` (MemberInfo | null), computed `isAuthenticated`
- Actions: `login(response)`, `logout()`, `updateTokens(response)`

- [ ] **Step 2: Add auth interceptor to api-client.ts**

Modify the `request()` function to:
1. Read `accessToken` from auth store
2. Add `Authorization: Bearer <token>` header if present
3. On 401: try `POST /api/v1/auth/refresh` with refreshToken
4. On refresh success: update tokens, retry original request
5. On refresh failure: call `logout()`, redirect to `/login`

- [ ] **Step 3: Add postMultipart method**

```typescript
async postMultipart<T>(path: string, formData: FormData): Promise<T>
```

Like `post` but uses FormData body without Content-Type header (browser sets boundary).

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/store/ apps/web/src/services/
git commit -m "feat(frontend): add auth store with Zustand persist and API interceptor"
```

---

## Task 18: Frontend — Auth Types + API

**Files:**
- Create: `apps/web/src/features/auth/types/auth.types.ts`
- Create: `apps/web/src/features/auth/api/auth-api.ts`
- Create: `apps/web/src/features/auth/hooks/useLogin.ts`
- Create: `apps/web/src/features/auth/hooks/useValidateInvite.ts`

**Docs to read:** Spec section 5.3. Data layer patterns from frontend restructure spec.

- [ ] **Step 1: Create auth.types.ts with Zod schemas**

Schemas for: `LoginRequest`, `LoginResponse`, `RefreshRequest`, `RefreshResponse`, `MemberInfo`, `ValidateInviteResponse`, `CreateClusterRequest`, `CreateClusterResponse` (with seed_phrase + tokens).

- [ ] **Step 2: Create auth-api.ts**

Pure fetch functions using `apiClient`:
- `login(email, password)` → LoginResponse
- `refreshTokens(refreshToken)` → RefreshResponse
- `validateInvite(token)` → ValidateInviteResponse
- `acceptInvite(token, data)` → LoginResponse
- `createCluster(data)` → CreateClusterResponse
- `unlockMasterKey(seedPhrase)` → UnlockResponse

- [ ] **Step 3: Create useLogin.ts**

TanStack Query `useMutation` wrapping `auth-api.login`. On success: call `authStore.login()`.

- [ ] **Step 4: Create useValidateInvite.ts**

TanStack Query `useQuery` wrapping `auth-api.validateInvite(token)`. Enabled only when token is present.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/auth/
git commit -m "feat(frontend): auth types, API functions, and hooks"
```

---

## Task 19: Frontend — Login Page

**Files:**
- Create: `apps/web/src/features/auth/components/PasswordInput.tsx`
- Create: `apps/web/src/features/auth/components/LoginForm.tsx`
- Modify: `apps/web/src/app/login/page.tsx` (rewrite existing)

**Docs to read:** Spec section 1.5. Existing login page (66 lines with TODO). UI primitives from components/ui/.

- [ ] **Step 0: Create PasswordInput.tsx**

Reusable password input with show/hide toggle (eye icon from lucide-react). Wraps the `Input` primitive. Used by LoginForm, SetupWizard, InviteAcceptForm.

```tsx
interface PasswordInputProps extends Omit<InputProps, 'type'> {
  // inherits error, className from Input
}
```

- [ ] **Step 1: Create LoginForm.tsx**

Feature component: email + password form using UI primitives (Input, Button).
Uses `useLogin()` hook. On success: check `master_key_status` in response. If `"locked"` and role is admin, show SeedPhraseUnlockModal (calls `/api/v1/auth/unlock`). Then redirect to `/gallery`. On error: show inline error.
Link to `/setup` for "Criar cluster".

- [ ] **Step 2: Rewrite login/page.tsx as thin shell**

```tsx
import { LoginForm } from "@/features/auth/components/LoginForm";
export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 3: Verify in browser**

Run: `cd apps/web && npm run dev`
Navigate to `http://localhost:3000/login`
Expected: Login form renders (API calls will fail without backend — that's ok)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(frontend): rewrite login page with auth hooks"
```

---

## Task 20: Frontend — Setup (Cluster Creation) Page

**Files:**
- Create: `apps/web/src/features/auth/components/SetupWizard.tsx`
- Create: `apps/web/src/features/auth/components/SeedPhraseDisplay.tsx`
- Create: `apps/web/src/app/setup/page.tsx`

**Docs to read:** Spec section 2.1. UC-001 (create cluster flow).

- [ ] **Step 1: Create SeedPhraseDisplay.tsx**

Grid 3x4 showing 12 numbered words. Monospace font. Warning text. Checkbox "Anotei minha seed phrase". Button "Continuar" disabled until checkbox checked.

- [ ] **Step 2: Create SetupWizard.tsx**

Multi-step wizard:
1. Welcome screen: "Criar Cluster" / "Tenho um convite" buttons
2. Cluster form: name, admin name, email, password, confirm password (Zod validation)
3. Seed phrase display (uses SeedPhraseDisplay)
4. On confirm: store tokens in auth store → redirect to /gallery

Uses `useMutation` wrapping `auth-api.createCluster`.

- [ ] **Step 3: Create setup/page.tsx**

```tsx
import { SetupWizard } from "@/features/auth/components/SetupWizard";
export default function SetupPage() {
  return <SetupWizard />;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(frontend): add setup page with cluster creation wizard"
```

---

## Task 21: Frontend — Invite Acceptance Page

**Files:**
- Create: `apps/web/src/features/auth/components/InviteAcceptForm.tsx`
- Create: `apps/web/src/app/invite/[token]/page.tsx`

**Docs to read:** Spec section 2.2. UC-002.

- [ ] **Step 1: Create InviteAcceptForm.tsx**

Takes `token` prop. Uses `useValidateInvite(token)` to check validity.
If valid: form with name, email (pre-filled), password, confirm password.
If invalid: error message.
On submit: call `auth-api.acceptInvite(token, data)` → store tokens → redirect to /gallery.

- [ ] **Step 2: Create invite/[token]/page.tsx**

```tsx
export default function InvitePage({ params }: { params: { token: string } }) {
  return <InviteAcceptForm token={params.token} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat(frontend): add invite acceptance page"
```

---

## Task 22: Frontend — Protected Layout (Auth Guard)

**Files:**
- Modify: `apps/web/src/app/(protected)/layout.tsx`

**Docs to read:** Spec section 1.5. Current protected layout.

- [ ] **Step 1: Add auth guard to protected layout**

```tsx
"use client";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null; // or skeleton
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(protected\)/layout.tsx
git commit -m "feat(frontend): add auth guard to protected layout"
```

---

## Task 23: Frontend — Members Page

**Files:**
- Create: `apps/web/src/features/members/types/members.types.ts`
- Create: `apps/web/src/features/members/api/members-api.ts`
- Create: `apps/web/src/features/members/hooks/useMembers.ts`
- Create: `apps/web/src/features/members/hooks/useInviteMember.ts`
- Create: `apps/web/src/features/members/components/MembersPage.tsx`
- Create: `apps/web/src/features/members/components/InviteModal.tsx`
- Create: `apps/web/src/app/(protected)/members/page.tsx`

**Docs to read:** Spec section 2.4. Existing member-related API contracts.

- [ ] **Step 1: Create types + API**

Zod schemas for MemberResponse, InviteRequest. API functions for listing members + creating invite.

- [ ] **Step 2: Create hooks**

`useMembers(clusterId)` — useQuery. `useInviteMember()` — useMutation.

- [ ] **Step 3: Create MemberRow, MemberList, MembersPage, InviteModal**

- `MemberRow.tsx`: single row with name, email, role Badge, actions (change role, remove)
- `MemberList.tsx`: table composing MemberRow instances
- `MembersPage.tsx`: orchestrates MemberList + useMembers hook + InviteModal trigger
- `InviteModal.tsx`: form with email + role select (membro/leitura dropdown)

Admin-only guard (check auth store role — hide page and sidebar item for non-admin).

- [ ] **Step 4: Create route page**

```tsx
import { MembersPage } from "@/features/members/components/MembersPage";
export default function MembersRoute() { return <MembersPage />; }
```

- [ ] **Step 5: Add "Membros" to sidebar navigation**

In sidebar component, add nav item visible only for admin role.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/members/ apps/web/src/app/\(protected\)/members/
git commit -m "feat(frontend): add members page with invite modal (admin only)"
```

---

## Task 24: Frontend — Upload Multipart Update

**Files:**
- Modify upload feature API to use FormData instead of JSON
- Modify upload components to use member_id from auth store

**Docs to read:** Spec sections 5.1, 5.4. Current upload feature components.

- [ ] **Step 1: Update upload API**

Change `uploadFile()` to use `apiClient.postMultipart` with FormData. Add `detectMediaType(mimeType)` helper: image/* → "foto", video/* → "video", else → "documento".

- [ ] **Step 2: Remove hardcoded uploaded_by**

In upload components, get member_id from `useAuthStore()` instead of hardcoded UUID.

- [ ] **Step 3: Similarly fix any hardcoded member_id in nodes feature**

Check nodes add form for hardcoded `owner_id`.

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat(frontend): multipart upload + remove hardcoded member IDs"
```

---

## Task 25: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Build Rust workspace**

Run: `cargo build --workspace`
Expected: All 3 crates compile

- [ ] **Step 2: Build frontend**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Verify docker-compose config**

Run: `docker compose config --quiet`
Expected: No errors

- [ ] **Step 4: Run existing tests**

Run: `cargo test --workspace`
Expected: Existing tests pass (new features may not have tests yet — that's ok for this spec)

- [ ] **Step 5: Final commit tag**

```bash
git tag e2e-testability-v1
```
