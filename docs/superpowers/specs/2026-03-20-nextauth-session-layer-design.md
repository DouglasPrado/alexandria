# NextAuth como Camada de Sessão — Design Spec

**Data:** 2026-03-20
**Status:** Aprovado
**Problema:** F5 redireciona para login porque a proteção de rotas é client-side (useEffect + Zustand localStorage)
**Solução:** NextAuth v5 (Auth.js) com Credentials Provider + JWT strategy + middleware server-side

---

## Decisões de Design

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Lib de sessão | NextAuth v5 (Auth.js) | Padrão Next.js, cookie HttpOnly nativo |
| Session strategy | JWT (não database) | Backend Rust já gerencia refresh tokens; zero tabelas novas |
| Backend Rust | Sem alterações | Continua recebendo Bearer JWT normalmente |
| Unlock (seed phrase) | Separado do NextAuth | Dado sensível que não deve transitar em cookies |

---

## Arquitetura

```
Browser ──cookie HttpOnly──▶ Next.js Middleware (NextAuth auth())
                                    │
                              verifica sessão
                                    │
                            ┌───────┴────────┐
                            │ válida         │ inválida
                            ▼                ▼
                     renderiza página    rota pública?
                            │                │
                     API calls usam    ┌─────┴──────┐
                     accessToken da    │ sim         │ não
                     sessão NextAuth   ▼             ▼
                            │      passa adiante  redirect /login
                            ▼
                    Backend Rust (JWT Bearer) — sem alterações
```

---

## Novos Arquivos

### 1. `apps/web/auth.ts` — Configuração NextAuth

Configuração central do NextAuth v5 com:

**Credentials Provider:**
- Recebe `email` e `password` do formulário de login
- Chama `POST ${BACKEND_URL}/api/v1/auth/login` diretamente (server-side, sem apiClient)
- Retorna objeto user com `accessToken`, `refreshToken`, `accessTokenExpires`, `member`
- Em caso de erro (401, network), retorna `null`

**Callback `jwt`:**
```typescript
async jwt({ token, user }) {
  // Login inicial: user vem do authorize()
  if (user) {
    token.accessToken = user.accessToken;
    token.refreshToken = user.refreshToken;
    token.accessTokenExpires = user.accessTokenExpires;
    token.member = user.member;
    return token;
  }

  // Token ainda válido
  if (Date.now() < (token.accessTokenExpires as number)) {
    return token;
  }

  // Token expirado: refresh via backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    token.accessToken = data.access_token;
    token.refreshToken = data.refresh_token;
    token.accessTokenExpires = Date.now() + (data.expires_in * 1000);
    return token;
  } catch {
    token.error = "RefreshTokenExpired";
    return token;
  }
}
```

**Callback `session`:**
```typescript
async session({ session, token }) {
  session.user = {
    id: token.member.id,
    name: token.member.name,
    email: token.member.email,
    role: token.member.role,
    cluster_id: token.member.cluster_id,
  };
  session.accessToken = token.accessToken as string;
  session.error = token.error as string | undefined;
  return session;
}
```

**Pages:**
```typescript
pages: {
  signIn: "/login",
}
```

**Variáveis de ambiente necessárias:**
- `AUTH_SECRET` — secret para criptografia do cookie (gerar com `npx auth secret`)
- `BACKEND_URL` — URL interna do backend Rust (server-side only, ex: `http://localhost:3030`)
- `AUTH_TRUST_HOST=true` — para deploy em Docker

### 2. `apps/web/middleware.ts` — Middleware de Proteção

```typescript
export { auth as middleware } from "./auth";

export const config = {
  matcher: [
    // Protege tudo exceto rotas públicas e assets
    "/((?!login|setup|invite|recovery|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

O middleware `auth()` do NextAuth:
- Rota protegida sem sessão → redirect para `/login`
- Rota pública → passa adiante
- Rota protegida com sessão → passa adiante

### 3. `apps/web/src/types/next-auth.d.ts` — Type Augmentation

Extende os tipos do NextAuth para incluir campos customizados:

```typescript
import "next-auth";

declare module "next-auth" {
  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
      cluster_id: string;
    };
  }

  interface Session {
    accessToken: string;
    error?: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      cluster_id: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
      cluster_id: string;
    };
    error?: string;
  }
}
```

---

## Arquivos Modificados

### 4. `apps/web/src/services/api-client.ts` — Novo Source de Token

**Antes:** lê `accessToken` de `useAuthStore.getState()`
**Depois:** lê `accessToken` da sessão NextAuth

Para contexto **client-side** (hooks, componentes):
```typescript
import { getSession } from "next-auth/react";

async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (session?.error === "RefreshTokenExpired") {
    // signOut será chamado pelo SessionGuard
    return null;
  }
  return session?.accessToken ?? null;
}
```

Para contexto **server-side** (Server Components, Route Handlers):
```typescript
import { auth } from "@/auth";

async function getAccessTokenServer(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
}
```

A lógica de auto-refresh (linhas 44-85 do `api-client.ts` atual) é **removida** — o callback `jwt` do NextAuth cuida disso.

A referência a `useAuthStore` é **removida** deste arquivo.

### 5. `apps/web/src/app/(protected)/layout.tsx` — Simplificação

**Antes:** `useEffect` + `isAuthenticated` + redirect client-side
**Depois:** Apenas renderiza o `AppShell` — middleware server-side já protege a rota

```typescript
import { AppShell } from "@/components/layouts/AppShell";
import { SessionGuard } from "@/components/auth/SessionGuard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
```

Não precisa mais ser `"use client"`.

### 6. `apps/web/src/features/auth/components/LoginForm.tsx`

**Antes:** chama `login()` da auth-api → salva tokens no Zustand → redirect manual
**Depois:** chama `signIn("credentials", { email, password, redirectTo: "/gallery" })` do NextAuth

O `signIn` do NextAuth:
1. Envia credentials para o `authorize()` callback (server-side)
2. `authorize()` chama o backend Rust
3. Se sucesso: cookie criado automaticamente → redirect para `/gallery`
4. Se falha: retorna erro para o formulário exibir

### 7. `apps/web/src/features/auth/components/SetupWizard.tsx`

**Antes:** chama `createCluster()` → salva tokens no Zustand
**Depois:**
1. Chama `createCluster()` via API direta (sem auth, rota pública)
2. Exibe seed phrase
3. Após confirmação, chama `signIn("credentials", { email, password })` do NextAuth
4. Cookie criado → redirect para `/gallery`

### 8. `apps/web/src/features/auth/components/InviteAcceptForm.tsx`

**Antes:** chama `acceptInvite()` → salva tokens no Zustand
**Depois:**
1. Chama `acceptInvite()` via API direta (rota pública)
2. Após sucesso, chama `signIn("credentials", { email, password })`
3. Cookie criado → redirect para área protegida

---

## Novo Componente

### 9. `apps/web/src/components/auth/SessionGuard.tsx`

Componente client-side que monitora `session.error` e faz logout quando o refresh token expirou:

```typescript
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenExpired") {
      signOut({ redirectTo: "/login" });
    }
  }, [session?.error]);

  return <>{children}</>;
}
```

### 10. `apps/web/src/app/layout.tsx` — SessionProvider

Wrapa a app com `SessionProvider` do NextAuth para que `useSession()` funcione:

```typescript
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

---

## Arquivos Removidos

### 11. `apps/web/src/store/auth-store.ts`

Removido completamente. Todos os consumidores migram para `useSession()` do NextAuth.

**Consumidores a migrar:**
- `api-client.ts` → `getSession()` / `auth()`
- `(protected)/layout.tsx` → middleware + `SessionGuard`
- `LoginForm.tsx` → `signIn()`
- `SetupWizard.tsx` → `signIn()`
- `InviteAcceptForm.tsx` → `signIn()`
- `useLogin.ts` → removido ou simplificado (signIn já é o hook)
- Qualquer componente que lê `useAuthStore().member` → `useSession().data.user`

---

## Fluxos

### Login
```
LoginForm → signIn("credentials", {email, password})
  → NextAuth authorize() → POST backend/api/v1/auth/login
  → 200: {access_token, refresh_token, member, expires_in}
  → jwt callback: grava tokens no JWT cookie
  → redirect /gallery
```

### F5 / Refresh (o problema original)
```
Browser envia cookie HttpOnly automaticamente
  → middleware.ts: auth() verifica JWT no cookie
  → JWT válido → renderiza página (sem redirect)
  → JWT expirado → jwt callback: refresh via backend
  → Refresh OK → atualiza cookie → renderiza página
  → Refresh falhou → redirect /login
```

### Setup (criar cluster)
```
SetupWizard → POST /api/v1/clusters (sem auth)
  → Exibe seed phrase → Usuário confirma
  → signIn("credentials", {email, password})
  → Cookie criado → redirect /gallery
```

### Invite
```
InviteAcceptForm → POST /api/v1/invite/{token} (sem auth)
  → signIn("credentials", {email, password})
  → Cookie criado → redirect para área protegida
```

### Logout
```
Botão logout → POST /api/v1/auth/logout (revoga refresh token)
  → signOut() do NextAuth (limpa cookie)
  → redirect /login
```

### Unlock (inalterado)
```
Área protegida → verifica master_key_status
  → "locked" → mostra prompt de seed phrase
  → POST /api/v1/auth/unlock (usa accessToken da sessão NextAuth)
  → Sucesso → continua navegação normal
```

---

## Dependências

**Adicionar:**
- `next-auth@5` (Auth.js v5 para Next.js 16)

**Remover (após migração):**
- `zustand` — **apenas se** não for usado em mais nenhum lugar além do auth-store

**Variáveis de ambiente:**
- `AUTH_SECRET` — secret para cookie encryption
- `BACKEND_URL` — URL do backend Rust (server-side only)
- `AUTH_TRUST_HOST=true` — para Docker

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Credentials Provider não suporta refresh nativo | Implementado no callback `jwt` manualmente |
| Cookie size limit (~4KB) | JWT contém apenas IDs e tokens, não dados pesados |
| signIn() requer email+password (Setup/Invite já têm tokens) | Após create/accept, fazer signIn com as mesmas credenciais |
| Zustand pode ser usado em outros stores | Verificar antes de remover a dependência |

---

## O Que NÃO Muda

- Backend Rust: zero alterações em endpoints, JWT, ou refresh tokens
- Fluxo de unlock/seed phrase: permanece client-side
- Tipos de auth response do backend: inalterados
- Fluxo de invite (backend): inalterado
- Node agent auth: inalterado
