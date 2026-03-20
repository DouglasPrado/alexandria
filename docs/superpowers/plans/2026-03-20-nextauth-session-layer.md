# NextAuth Session Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Zustand localStorage auth with NextAuth v5 (cookie HttpOnly) so page refresh no longer redirects to login.

**Architecture:** NextAuth v5 Credentials Provider calls the existing Rust backend for login. JWT strategy stores session in an encrypted HttpOnly cookie. Server-side middleware protects routes. All other auth-store consumers migrate to `useSession()`.

**Tech Stack:** next-auth@5 (Auth.js), Next.js 16, React 19, existing Rust/Axum backend (unchanged)

**Spec:** `docs/superpowers/specs/2026-03-20-nextauth-session-layer-design.md`

---

### Task 1: Install next-auth and configure environment

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/.env.local` (create if not exists)

- [ ] **Step 1: Install next-auth**

```bash
cd apps/web && npm install next-auth@5
```

- [ ] **Step 2: Create .env.local with required variables**

```bash
cat > apps/web/.env.local << 'EOF'
AUTH_SECRET=dev-secret-change-in-production-min-32-chars!!
BACKEND_URL=http://localhost:3030
AUTH_TRUST_HOST=true
EOF
```

- [ ] **Step 3: Verify installation**

```bash
cd apps/web && node -e "require('next-auth'); console.log('next-auth OK')"
```

Expected: `next-auth OK`

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: install next-auth@5"
```

Note: do NOT commit `.env.local` (should be in `.gitignore`).

---

### Task 2: Create NextAuth type augmentation

**Files:**
- Create: `apps/web/src/types/next-auth.d.ts`

- [ ] **Step 1: Create type declaration file**

```typescript
// apps/web/src/types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    masterKeyStatus: string;
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
    masterKeyStatus: string;
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
    masterKeyStatus: string;
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

- [ ] **Step 2: Verify TypeScript picks up the declaration**

```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: no errors related to next-auth types (other pre-existing errors are OK).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/next-auth.d.ts
git commit -m "feat: add NextAuth type augmentation for custom session fields"
```

---

### Task 3: Create NextAuth configuration (`auth.ts`)

**Files:**
- Create: `apps/web/auth.ts`

**Docs to reference:**
- Spec sections: "Credentials Provider", "Callback jwt", "Callback session", "events.signOut"

- [ ] **Step 1: Create auth.ts**

```typescript
// apps/web/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3030";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();

          return {
            id: data.member.id,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpires: Date.now() + data.expires_in * 1000,
            masterKeyStatus: data.master_key_status ?? "ready",
            member: data.member,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial login: user comes from authorize()
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.masterKeyStatus = user.masterKeyStatus;
        token.member = user.member;
        return token;
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired: refresh via backend
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
        token.accessTokenExpires = Date.now() + data.expires_in * 1000;
        return token;
      } catch {
        token.error = "RefreshTokenExpired";
        return token;
      }
    },
    async session({ session, token }) {
      session.user = {
        id: token.member.id,
        name: token.member.name,
        email: token.member.email,
        role: token.member.role,
        cluster_id: token.member.cluster_id,
      };
      session.accessToken = token.accessToken as string;
      session.masterKeyStatus = token.masterKeyStatus as string;
      session.error = token.error as string | undefined;
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      // Public routes — allow even without session
      const publicPaths = ["/login", "/setup", "/invite", "/recovery"];
      const isPublic = publicPaths.some((p) => pathname.startsWith(p));

      if (isPublic) return true;
      if (isLoggedIn) return true;

      // Not logged in, not public → redirect to login
      return false;
    },
  },
  events: {
    async signOut({ token }) {
      // Revoke refresh token on backend (best-effort)
      if (token?.refreshToken) {
        await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.accessToken}`,
          },
          body: JSON.stringify({ refresh_token: token.refreshToken }),
        }).catch(() => {});
      }
    },
  },
});
```

- [ ] **Step 2: Verify file compiles**

```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | grep "auth.ts" || echo "No auth.ts errors"
```

Expected: `No auth.ts errors`

- [ ] **Step 3: Commit**

```bash
git add apps/web/auth.ts
git commit -m "feat: add NextAuth v5 configuration with Credentials Provider"
```

---

### Task 4: Create middleware and API route handler

**Files:**
- Create: `apps/web/middleware.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
// apps/web/middleware.ts
export { auth as middleware } from "./auth";

export const config = {
  matcher: [
    // Protect everything except public routes and static assets
    "/((?!login|setup|invite|recovery|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Create NextAuth API route handler**

```bash
mkdir -p apps/web/src/app/api/auth/\[...nextauth\]
```

```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/../auth";

export const { GET, POST } = handlers;
```

Note: the import path `@/../auth` resolves to `apps/web/auth.ts` (one level above `src/`). If `@` is aliased to `src/`, use the relative path `../../../../auth` instead. Check `tsconfig.json` paths to confirm.

- [ ] **Step 3: Verify build doesn't break**

```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing errors).

- [ ] **Step 4: Commit**

```bash
git add apps/web/middleware.ts apps/web/src/app/api/auth/
git commit -m "feat: add NextAuth middleware and API route handler"
```

---

### Task 5: Add SessionProvider to root layout

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

**Current state of file:**
```typescript
// lines 10-18
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 1: Add SessionProvider wrapping Providers**

Add `import { SessionProvider } from "next-auth/react";` at top.

Wrap `<Providers>` with `<SessionProvider>`:

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/lib/query-client";

export const metadata: Metadata = {
  title: "Alexandria — Armazenamento Familiar",
  description: "Sistema de armazenamento familiar distribuido com criptografia zero-knowledge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify no errors**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "layout.tsx" || echo "No layout errors"
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat: wrap root layout with NextAuth SessionProvider"
```

---

### Task 6: Create SessionGuard component

**Files:**
- Create: `apps/web/src/components/auth/SessionGuard.tsx`

- [ ] **Step 1: Create SessionGuard**

```typescript
// apps/web/src/components/auth/SessionGuard.tsx
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

- [ ] **Step 2: Commit**

```bash
mkdir -p apps/web/src/components/auth
git add apps/web/src/components/auth/SessionGuard.tsx
git commit -m "feat: add SessionGuard component for expired token detection"
```

---

### Task 7: Migrate api-client.ts to use NextAuth session

**Files:**
- Modify: `apps/web/src/services/api-client.ts`

**What changes:**
1. Remove `import { useAuthStore }` (line 2)
2. Replace `useAuthStore.getState().accessToken` with `getSession()` from `next-auth/react`
3. Remove auto-refresh logic (lines 44-85) — NextAuth handles this
4. Update `postMultipart` similarly

- [ ] **Step 1: Rewrite api-client.ts**

Replace the entire file content with:

```typescript
// apps/web/src/services/api-client.ts
import { ApiError } from "@/types/api.types";
import { getSession, signOut } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_TIMEOUT = 30_000;

async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (session?.error === "RefreshTokenExpired") {
    return null;
  }
  return session?.accessToken ?? null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  let fullPath = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) fullPath += `?${qs}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-Id": crypto.randomUUID(),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(fullPath, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (res.status === 401 && accessToken) {
      // Session expired and refresh failed — signOut handled by SessionGuard
      signOut({ redirectTo: "/login" });
      throw new ApiError(401, "Session expired");
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(
        res.status,
        errorBody.error ?? `API error: ${res.status}`,
        errorBody.code,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function postMultipart<T>(path: string, formData: FormData): Promise<T> {
  const fullPath = `${API_BASE}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "X-Request-Id": crypto.randomUUID(),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(fullPath, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    if (res.status === 401 && accessToken) {
      signOut({ redirectTo: "/login" });
      throw new ApiError(401, "Session expired");
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(
        res.status,
        errorBody.error ?? `API error: ${res.status}`,
        errorBody.code,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>("GET", path, undefined, params),

  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, body),

  put: <T>(path: string, body?: unknown) =>
    request<T>("PUT", path, body),

  delete: <T>(path: string, body?: unknown) =>
    request<T>("DELETE", path, body),

  postMultipart: <T>(path: string, formData: FormData) =>
    postMultipart<T>(path, formData),
};
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "api-client" || echo "No api-client errors"
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/api-client.ts
git commit -m "refactor: migrate api-client from Zustand auth to NextAuth session"
```

---

### Task 8: Migrate LoginForm to use NextAuth signIn

**Files:**
- Modify: `apps/web/src/features/auth/components/LoginForm.tsx`
- Delete: `apps/web/src/features/auth/hooks/useLogin.ts`

**What changes:**
1. Replace `useLogin()` mutation with `signIn("credentials", ...)` from `next-auth/react`
2. Use `redirect: false` to handle `master_key_status` before redirecting
3. After successful signIn, read `masterKeyStatus` from session via `useSession()`
4. Delete `useLogin.ts` hook (no longer needed)

- [ ] **Step 1: Rewrite LoginForm.tsx**

```typescript
// apps/web/src/features/auth/components/LoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { PasswordInput } from "./PasswordInput";
import { unlockMasterKey } from "../api/auth-api";

export function LoginForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
        return;
      }

      // Fetch updated session to check masterKeyStatus
      const session = await updateSession();
      if (session?.masterKeyStatus === "locked") {
        setShowUnlock(true);
      } else {
        router.push("/gallery");
      }
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockMasterKey(seedPhrase);
      router.push("/gallery");
    } catch {
      setError("Seed phrase inválida");
    }
  };

  if (showUnlock) {
    return (
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
        <h1 className="text-xl font-bold text-text text-center mb-1">Desbloquear Vault</h1>
        <p className="text-sm text-text-muted text-center mb-6">
          Digite sua seed phrase de 12 palavras para desbloquear o sistema.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Seed Phrase</label>
            <textarea
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="palavra1 palavra2 palavra3 ..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!seedPhrase.trim()}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Desbloquear
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUnlock(false);
              setError(null);
              setSeedPhrase("");
            }}
            className="w-full py-2 text-text-muted text-sm hover:text-text"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
      <h1 className="text-2xl font-bold text-text text-center mb-1">Alexandria</h1>
      <p className="text-sm text-text-muted text-center mb-6">Armazenamento Familiar</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Senha</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-xs text-text-muted text-center mt-4">
        Sem conta?{" "}
        <a href="/setup" className="text-primary hover:underline">
          Criar cluster
        </a>
      </p>
      <p className="text-xs text-text-muted text-center mt-2">
        Recebeu um convite?{" "}
        <a href="/invite" className="text-primary hover:underline">
          Aceitar convite
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Delete useLogin.ts**

```bash
rm apps/web/src/features/auth/hooks/useLogin.ts
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "LoginForm|useLogin" || echo "No LoginForm errors"
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/auth/components/LoginForm.tsx
git rm apps/web/src/features/auth/hooks/useLogin.ts
git commit -m "refactor: migrate LoginForm to NextAuth signIn, remove useLogin hook"
```

---

### Task 9: Migrate SetupWizard to use NextAuth signIn

**Files:**
- Modify: `apps/web/src/features/auth/components/SetupWizard.tsx`

**What changes:**
1. Remove `import { useAuthStore }` and `authLogin` usage
2. Remove `PendingAuth` interface and `pendingAuthRef`
3. After seed phrase confirmation, call `signIn("credentials", { email, password })` instead of `authLogin()`

- [ ] **Step 1: Update SetupWizard.tsx**

Replace lines 1-8 (imports) with:
```typescript
"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { createCluster } from "../api/auth-api";
import { SeedPhraseDisplay } from "./SeedPhraseDisplay";
import { PasswordInput } from "./PasswordInput";
```

Remove `PendingAuth` interface (lines 12-16).

Remove `pendingAuthRef` (line 33) and `authLogin` (line 28).

Replace the `onSuccess` callback in `createMutation` (lines 51-67) — remove `pendingAuthRef` assignment:
```typescript
onSuccess: (data) => {
  setSeedPhrase(Array.isArray(data.seed_phrase) ? data.seed_phrase.join(" ") : data.seed_phrase);
  setStep("seed");
},
```

Replace `handleSeedConfirm` (lines 98-105):
```typescript
const handleSeedConfirm = async () => {
  await signIn("credentials", {
    email: form.email,
    password: form.password,
    redirectTo: "/gallery",
  });
};
```

- [ ] **Step 2: Verify no references to useAuthStore remain**

```bash
grep -n "useAuthStore\|authLogin\|pendingAuth\|PendingAuth" apps/web/src/features/auth/components/SetupWizard.tsx || echo "Clean"
```

Expected: `Clean`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/components/SetupWizard.tsx
git commit -m "refactor: migrate SetupWizard from Zustand to NextAuth signIn"
```

---

### Task 10: Migrate InviteAcceptForm to use NextAuth signIn

**Files:**
- Modify: `apps/web/src/features/auth/components/InviteAcceptForm.tsx`

**What changes:**
1. Remove `import { useAuthStore }` and `authLogin` usage
2. After `acceptInvite()` succeeds, call `signIn("credentials", { email, password })` instead of `authLogin()`

- [ ] **Step 1: Update imports**

Replace lines 1-8:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useValidateInvite } from "../hooks/useValidateInvite";
import { acceptInvite } from "../api/auth-api";
import { PasswordInput } from "./PasswordInput";
```

Remove line 16: `const authLogin = useAuthStore((s) => s.login);`

- [ ] **Step 2: Update acceptMutation onSuccess**

Replace the `onSuccess` callback (lines 33-39):
```typescript
onSuccess: async () => {
  await signIn("credentials", {
    email: email || invite?.email || "",
    password,
    redirectTo: "/gallery",
  });
},
```

Remove `useRouter` import and `router` variable if no longer used elsewhere in the component. Check: `router` is not used anywhere else, so remove `const router = useRouter();` (line 15) and the `useRouter` import.

- [ ] **Step 3: Verify no references to useAuthStore remain**

```bash
grep -n "useAuthStore\|authLogin" apps/web/src/features/auth/components/InviteAcceptForm.tsx || echo "Clean"
```

Expected: `Clean`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/auth/components/InviteAcceptForm.tsx
git commit -m "refactor: migrate InviteAcceptForm from Zustand to NextAuth signIn"
```

---

### Task 11: Simplify protected layout

**Files:**
- Modify: `apps/web/src/app/(protected)/layout.tsx`

**What changes:**
1. Remove `"use client"`, `useEffect`, `useRouter`, `useAuthStore` — middleware handles protection now
2. Add `SessionGuard` wrapper for expired token detection

- [ ] **Step 1: Rewrite layout.tsx**

```typescript
// apps/web/src/app/(protected)/layout.tsx
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/(protected)/layout.tsx
git commit -m "refactor: simplify protected layout, middleware handles auth guard"
```

---

### Task 12: Migrate useCluster hook

**Files:**
- Modify: `apps/web/src/hooks/useCluster.ts`

**Current state:** reads `member` and `isAuthenticated` from `useAuthStore`
**After:** reads from `useSession()`

- [ ] **Step 1: Rewrite useCluster.ts**

```typescript
// apps/web/src/hooks/useCluster.ts
"use client";

import { useSession } from "next-auth/react";

export function useCluster() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const cluster = user?.cluster_id
    ? { id: user.cluster_id, name: "" }
    : null;

  return {
    cluster,
    loading: status === "loading",
    error: null,
    needsSetup: status === "authenticated" && !cluster,
  };
}
```

- [ ] **Step 2: Verify no references to useAuthStore remain**

```bash
grep -n "useAuthStore" apps/web/src/hooks/useCluster.ts || echo "Clean"
```

Expected: `Clean`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useCluster.ts
git commit -m "refactor: migrate useCluster from Zustand to NextAuth useSession"
```

---

### Task 13: Migrate remaining auth-store consumers

**Files:**
- Modify: `apps/web/src/features/nodes/components/NodesPage.tsx`
- Modify: `apps/web/src/app/(protected)/nodes/add/page.tsx`
- Modify: `apps/web/src/features/members/components/MembersPage.tsx`

All three files follow the same pattern: `useAuthStore((s) => s.member)` → `useSession().data?.user`

- [ ] **Step 1: Migrate NodesPage.tsx**

Replace line 6: `import { useAuthStore } from "@/store/auth-store";`
With: `import { useSession } from "next-auth/react";`

Replace line 15: `const member = useAuthStore((s) => s.member);`
With: `const { data: session } = useSession(); const member = session?.user;`

Note: `member.role` and `member.cluster_id` are available on `session.user` via our type augmentation.

- [ ] **Step 2: Migrate AddNodePage**

Replace line 5: `import { useAuthStore } from "@/store/auth-store";`
With: `import { useSession } from "next-auth/react";`

Replace line 9: `const { member } = useAuthStore();`
With: `const { data: session } = useSession(); const member = session?.user;`

- [ ] **Step 3: Migrate MembersPage.tsx**

Replace line 5: `import { useAuthStore } from "@/store/auth-store";`
With: `import { useSession } from "next-auth/react";`

Replace line 15: `const { member } = useAuthStore();`
With: `const { data: session } = useSession(); const member = session?.user;`

- [ ] **Step 4: Verify no auth-store imports remain (except auth-store.ts itself)**

```bash
grep -rn "useAuthStore\|auth-store" apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "auth-store.ts" || echo "All consumers migrated"
```

Expected: `All consumers migrated`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/nodes/components/NodesPage.tsx apps/web/src/app/(protected)/nodes/add/page.tsx apps/web/src/features/members/components/MembersPage.tsx
git commit -m "refactor: migrate remaining components from Zustand auth to useSession"
```

---

### Task 14: Delete auth-store.ts

**Files:**
- Delete: `apps/web/src/store/auth-store.ts`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -rn "auth-store" apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "auth-store.ts" || echo "Safe to delete"
```

Expected: `Safe to delete`

- [ ] **Step 2: Delete the file**

```bash
rm apps/web/src/store/auth-store.ts
```

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no errors referencing `auth-store`

- [ ] **Step 4: Commit**

```bash
git rm apps/web/src/store/auth-store.ts
git commit -m "chore: remove Zustand auth-store, fully replaced by NextAuth"
```

---

### Task 15: Smoke test full flow

**Files:** none (manual verification)

- [ ] **Step 1: Start the dev server**

```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Test login flow**

1. Open `http://localhost:3000/login`
2. Enter valid credentials → should redirect to `/gallery`
3. Press F5 → should stay on `/gallery` (the original bug)
4. Open DevTools → Application → Cookies → verify `authjs.session-token` cookie exists (HttpOnly)

- [ ] **Step 3: Test middleware protection**

1. Open incognito window
2. Navigate to `http://localhost:3000/gallery` → should redirect to `/login`
3. Navigate to `http://localhost:3000/setup` → should load (public route)

- [ ] **Step 4: Test logout**

1. Log in, then trigger logout
2. Verify cookie is cleared
3. Verify navigating to `/gallery` redirects to `/login`

- [ ] **Step 5: Test unlock flow (if applicable)**

1. Log in with an account that has `master_key_status === "locked"`
2. Verify unlock prompt appears after login
3. Enter seed phrase → should redirect to `/gallery`

- [ ] **Step 6: Commit final state if any adjustments were made**

```bash
git add -A && git status
# Only commit if there are changes
git commit -m "fix: adjustments from smoke testing NextAuth integration"
```
