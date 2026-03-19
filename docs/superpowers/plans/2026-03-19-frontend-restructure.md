# Frontend Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `apps/web/src/` from flat MVP to feature-based architecture following the frontend blueprint, migrating 5 existing features.

**Architecture:** Feature-based organization with Clean Architecture layers. Each feature (gallery, upload, nodes, health, recovery) owns its components, hooks, API functions, and Zod types. Shared primitives in `components/ui/`, global state in Zustand stores, server state in TanStack Query.

**Tech Stack:** Next.js 16 (App Router), React 19, TanStack Query 5, Zustand 5, Zod 3, Tailwind CSS 4, Lucide React, clsx + tailwind-merge.

**Spec:** `docs/superpowers/specs/2026-03-19-frontend-restructure-design.md`

**Note on tests:** Test runner (Vitest) is not configured yet — tests are explicitly out of scope per the spec. Each task verifies by `npm run build`. Full test setup is a separate phase.

---

## File Map

### New files to create (41 files)

```
src/utils/cn.ts                                    # clsx + tailwind-merge helper
src/utils/format.ts                                # formatBytes, timeAgo, formatDate
src/lib/query-client.ts                            # QueryClient config + provider
src/services/api-client.ts                         # Fetch wrapper with timeout
src/types/api.types.ts                             # Base types (ApiError, ClusterDTO)
src/store/preferences-store.ts                     # Zustand: sidebar, layout
src/store/event-bus.ts                             # Zustand: pub/sub cross-feature
src/hooks/useCluster.ts                            # TanStack Query cluster detection
src/components/ui/Button.tsx                       # Primitive
src/components/ui/Input.tsx                        # Primitive
src/components/ui/Card.tsx                         # Primitive (compound)
src/components/ui/Badge.tsx                        # Primitive
src/components/ui/Modal.tsx                        # Primitive
src/components/ui/Progress.tsx                     # Primitive
src/components/ui/Skeleton.tsx                     # Primitive
src/components/ui/Alert.tsx                        # Primitive
src/components/ui/index.ts                         # Barrel export
src/components/feedback/EmptyState.tsx             # Feedback component
src/components/layouts/AppShell.tsx                # Sidebar + content grid
src/components/layouts/Sidebar.tsx                 # Navigation sidebar
src/components/layouts/Header.tsx                  # Page header
src/features/gallery/types/gallery.types.ts        # Zod schemas
src/features/gallery/api/gallery-api.ts            # Fetch functions
src/features/gallery/hooks/useGallery.ts           # TanStack Query hook
src/features/gallery/components/GalleryPage.tsx    # Page component
src/features/gallery/components/GalleryGrid.tsx    # Responsive grid
src/features/gallery/components/PhotoCard.tsx      # File card
src/features/nodes/types/nodes.types.ts            # Zod schemas
src/features/nodes/api/nodes-api.ts                # Fetch functions
src/features/nodes/hooks/useNodes.ts               # TanStack Query hook
src/features/nodes/components/NodesPage.tsx        # Page component
src/features/nodes/components/NodeList.tsx          # Node list
src/features/nodes/components/NodeCard.tsx          # Individual node card
src/features/nodes/components/CapacityBar.tsx       # Progress wrapper
src/features/health/types/health.types.ts          # Zod schemas
src/features/health/api/health-api.ts              # Fetch functions
src/features/health/hooks/useAlerts.ts             # TanStack Query hook
src/features/health/components/HealthPage.tsx      # Page component
src/features/health/components/HealthSummary.tsx   # Stats cards
src/features/health/components/AlertList.tsx        # Alert list
src/features/upload/types/upload.types.ts          # Zod schemas
src/features/upload/api/upload-api.ts              # Fetch functions
src/features/upload/hooks/useUploadFile.ts         # TanStack Query mutation
src/features/upload/hooks/useUploadQueue.ts        # Local state hook
src/features/upload/components/UploadPage.tsx      # Page component
src/features/upload/components/UploadDropzone.tsx  # Drag-drop area
src/features/upload/components/UploadQueue.tsx     # Queue list
src/features/recovery/types/recovery.types.ts      # Zod schemas
src/features/recovery/api/recovery-api.ts          # Fetch functions
src/features/recovery/hooks/useRecovery.ts         # TanStack Query mutation
src/features/recovery/components/RecoveryPage.tsx  # Page component
src/features/recovery/components/SeedPhraseInput.tsx # 12-word input
src/features/recovery/components/RecoveryReport.tsx  # Results display
src/app/(protected)/layout.tsx                     # AppShell layout
src/app/(protected)/gallery/page.tsx               # Thin shell
src/app/(protected)/upload/page.tsx                # Thin shell
src/app/(protected)/nodes/page.tsx                 # Thin shell
src/app/(protected)/health/page.tsx                # Thin shell
```

### Files to modify (3 files)

```
apps/web/package.json                              # Add dependencies
src/app/layout.tsx                                 # Add QueryClientProvider, remove AppLayout
src/app/recovery/page.tsx                          # Replace with thin shell (public route)
```

### Files to delete after migration (6 files)

```
src/lib/api.ts                                     # Replaced by services/api-client.ts + feature APIs
src/lib/useCluster.ts                              # Moved to hooks/useCluster.ts
src/components/layouts/AppLayout.tsx                # Replaced by AppShell + Sidebar + Header
src/app/gallery/page.tsx                           # Moved to (protected)/gallery/
src/app/upload/page.tsx                            # Moved to (protected)/upload/
src/app/nodes/page.tsx                             # Moved to (protected)/nodes/
src/app/health/page.tsx                            # Moved to (protected)/health/
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd apps/web && npm install @tanstack/react-query@^5 zustand@^5 zod@^3 lucide-react clsx tailwind-merge next-intl@^4 @tanstack/react-virtual@^3
```

- [ ] **Step 2: Verify build still works**

```bash
cd apps/web && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore(web): add TanStack Query, Zustand, Zod, Lucide, clsx, tailwind-merge, next-intl, react-virtual"
```

---

## Task 2: Create Utility Files

**Files:**
- Create: `src/utils/cn.ts`
- Create: `src/utils/format.ts`

- [ ] **Step 1: Create `cn` helper**

```ts
// src/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create format utilities**

Extract `formatSize` and `timeAgo` from existing pages into a shared module:

```ts
// src/utils/format.ts
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

export function formatCapacity(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}
```

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/utils/
git commit -m "feat(web): add cn() helper and format utilities"
```

---

## Task 3: Create API Client

**Files:**
- Create: `src/services/api-client.ts`
- Create: `src/types/api.types.ts`

- [ ] **Step 1: Create base API types**

```ts
// src/types/api.types.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

- [ ] **Step 2: Create API client**

```ts
// src/services/api-client.ts
import { ApiError } from "@/types/api.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_TIMEOUT = 30_000;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  // Build URL without window.location.origin (SSR-safe)
  let fullPath = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) fullPath += `?${qs}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(fullPath, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

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

  delete: <T>(path: string) =>
    request<T>("DELETE", path),
};
```

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/ apps/web/src/types/
git commit -m "feat(web): add API client with timeout and base types"
```

---

## Task 4: Create TanStack Query Provider

**Files:**
- Create: `src/lib/query-client.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create QueryClient config**

```tsx
// src/lib/query-client.ts
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update RootLayout — add Providers, keep AppLayout for now**

The old pages still exist and rely on `AppLayout` for sidebar rendering. We keep `AppLayout` wrapped inside `Providers` during the migration. It gets removed in Task 17 when all pages are migrated to `(protected)/`.

Replace `src/app/layout.tsx` with:

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/query-client";
import AppLayout from "@/components/layouts/AppLayout";

export const metadata: Metadata = {
  title: "Alexandria — Armazenamento Familiar",
  description: "Sistema de armazenamento familiar distribuido com criptografia zero-knowledge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/query-client.ts apps/web/src/app/layout.tsx
git commit -m "feat(web): add TanStack Query provider to root layout"
```

---

## Task 5: Create Zustand Stores

**Files:**
- Create: `src/store/preferences-store.ts`
- Create: `src/store/event-bus.ts`

- [ ] **Step 1: Create preferences store**

```ts
// src/store/preferences-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  sidebarCollapsed: boolean;
  galleryLayout: "grid" | "list";
  toggleSidebar: () => void;
  setGalleryLayout: (layout: "grid" | "list") => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      galleryLayout: "grid",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setGalleryLayout: (layout) => set({ galleryLayout: layout }),
    }),
    { name: "alexandria-preferences" },
  ),
);
```

- [ ] **Step 2: Create event bus store**

```ts
// src/store/event-bus.ts
import { create } from "zustand";

type EventMap = {
  "upload:complete": { fileId: string };
  "node:status-changed": { nodeId: string; status: string };
};

type Handler<T> = (payload: T) => void;

interface EventBusState {
  listeners: Map<string, Set<Handler<unknown>>>;
  subscribe: <K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>,
  ) => () => void;
  emit: <K extends keyof EventMap>(event: K, payload: EventMap[K]) => void;
}

export const useEventBus = create<EventBusState>()((set, get) => ({
  listeners: new Map(),

  subscribe: (event, handler) => {
    const { listeners } = get();
    if (!listeners.has(event as string)) {
      listeners.set(event as string, new Set());
    }
    listeners.get(event as string)!.add(handler as Handler<unknown>);

    return () => {
      listeners.get(event as string)?.delete(handler as Handler<unknown>);
    };
  },

  emit: (event, payload) => {
    const { listeners } = get();
    listeners.get(event as string)?.forEach((handler) => handler(payload));
  },
}));
```

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/store/
git commit -m "feat(web): add Zustand preferences store and event bus"
```

---

## Task 6: Create UI Primitives — Button, Input, Skeleton

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Create Button**

```tsx
// src/components/ui/Button.tsx
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const variants = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-white hover:bg-secondary/90",
  ghost: "bg-transparent text-text hover:bg-surface",
  destructive: "bg-error text-white hover:bg-error/90",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
```

- [ ] **Step 2: Create Input**

```tsx
// src/components/ui/Input.tsx
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, type, className, ...props }, ref) => (
    <div className="w-full">
      <div className="relative">
        {type === "search" && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-lg border bg-surface-elevated px-3 py-2 text-sm text-text",
            "placeholder:text-text-muted/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            type === "search" && "pl-9",
            error ? "border-error" : "border-border",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
```

- [ ] **Step 3: Create Skeleton**

```tsx
// src/components/ui/Skeleton.tsx
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-border/50", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/Button.tsx apps/web/src/components/ui/Input.tsx apps/web/src/components/ui/Skeleton.tsx
git commit -m "feat(web): add Button, Input, Skeleton UI primitives"
```

---

## Task 7: Create UI Primitives — Card, Badge, Progress, Alert, Modal

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Progress.tsx`
- Create: `src/components/ui/Alert.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/index.ts`

- [ ] **Step 1: Create Card (compound component)**

```tsx
// src/components/ui/Card.tsx
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

function CardRoot({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-surface-elevated border border-border rounded-lg shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4 border-b border-border", className)} {...props} />;
}

function CardBody({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4 border-t border-border", className)} {...props} />;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
```

- [ ] **Step 2: Create Badge**

```tsx
// src/components/ui/Badge.tsx
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

const variants = {
  default: "bg-border text-text-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
} as const;

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Badge({ variant = "default", size = "md", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Create Progress**

```tsx
// src/components/ui/Progress.tsx
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

interface ProgressProps extends ComponentPropsWithoutRef<"div"> {
  value: number;
  max?: number;
  label?: string;
  variant?: "default" | "success" | "warning" | "error";
}

const barColors = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

export function Progress({
  value,
  max = 100,
  label,
  variant = "default",
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {label && (
        <p className="text-xs text-text-muted mb-1">{label}</p>
      )}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Alert**

```tsx
// src/components/ui/Alert.tsx
import { type ComponentPropsWithoutRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

const config = {
  success: { icon: CheckCircle, bg: "bg-success/5 border-success/20", text: "text-success" },
  warning: { icon: AlertTriangle, bg: "bg-warning/5 border-warning/20", text: "text-warning" },
  error: { icon: XCircle, bg: "bg-error/5 border-error/20", text: "text-error" },
  info: { icon: Info, bg: "bg-info/5 border-info/20", text: "text-info" },
} as const;

interface AlertProps extends ComponentPropsWithoutRef<"div"> {
  variant: keyof typeof config;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant,
  title,
  dismissible,
  onDismiss,
  children,
  className,
  ...props
}: AlertProps) {
  const { icon: Icon, bg, text } = config[variant];

  return (
    <div
      className={cn("flex gap-3 rounded-lg border p-4", bg, className)}
      role="alert"
      {...props}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", text)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn("text-sm font-medium", text)}>{title}</p>}
        <div className="text-sm text-text">{children}</div>
      </div>
      {dismissible && (
        <button onClick={onDismiss} className="shrink-0 text-text-muted hover:text-text">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create Modal**

```tsx
// src/components/ui/Modal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "bg-surface-elevated rounded-xl shadow-lg max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto",
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 6: Create barrel export**

```ts
// src/components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Badge } from "./Badge";
export { Modal } from "./Modal";
export { Progress } from "./Progress";
export { Skeleton } from "./Skeleton";
export { Alert } from "./Alert";
```

- [ ] **Step 7: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat(web): add Card, Badge, Progress, Alert, Modal primitives and barrel export"
```

---

## Task 8: Create EmptyState Feedback Component

**Files:**
- Create: `src/components/feedback/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState**

```tsx
// src/components/feedback/EmptyState.tsx
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {Icon && <Icon className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />}
      <p className="text-lg font-medium text-text">{title}</p>
      {description && (
        <p className="text-sm text-text-muted mt-1">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/feedback/
git commit -m "feat(web): add EmptyState feedback component"
```

---

## Task 9: Create Layout Components — AppShell, Sidebar, Header

**Files:**
- Create: `src/components/layouts/AppShell.tsx`
- Create: `src/components/layouts/Sidebar.tsx`
- Create: `src/components/layouts/Header.tsx`

- [ ] **Step 1: Create Sidebar**

```tsx
// src/components/layouts/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, Upload, HardDrive, Activity, KeyRound } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePreferencesStore } from "@/store/preferences-store";

const NAV_ITEMS = [
  { href: "/gallery", label: "Galeria", icon: Images },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/nodes", label: "Nos", icon: HardDrive },
  { href: "/health", label: "Saude", icon: Activity },
  { href: "/recovery", label: "Recovery", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  // Default to false on server, reads from localStorage after hydration
  const collapsed = usePreferencesStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-surface flex flex-col transition-all",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="p-4 border-b border-border">
        <h1 className={cn("font-bold text-text", collapsed ? "text-sm text-center" : "text-xl")}>
          {collapsed ? "A" : "Alexandria"}
        </h1>
        {!collapsed && (
          <p className="text-xs text-text-muted mt-1">Armazenamento Familiar</p>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                collapsed && "justify-center",
                active
                  ? "bg-[#EFF6FF] text-primary font-medium"
                  : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create Header**

```tsx
// src/components/layouts/Header.tsx
interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">{title}</h2>
        {description && (
          <p className="text-sm text-text-muted mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Create AppShell**

```tsx
// src/components/layouts/AppShell.tsx
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layouts/AppShell.tsx apps/web/src/components/layouts/Sidebar.tsx apps/web/src/components/layouts/Header.tsx
git commit -m "feat(web): add AppShell, Sidebar, Header layout components with Lucide icons"
```

---

## Task 10: Create Zod Schemas Per Feature

**Files:**
- Create: `src/features/gallery/types/gallery.types.ts`
- Create: `src/features/nodes/types/nodes.types.ts`
- Create: `src/features/health/types/health.types.ts`
- Create: `src/features/upload/types/upload.types.ts`
- Create: `src/features/recovery/types/recovery.types.ts`

- [ ] **Step 1: Gallery types**

```ts
// src/features/gallery/types/gallery.types.ts
import { z } from "zod";

export const FileSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  original_name: z.string(),
  media_type: z.string(),
  mime_type: z.string(),
  file_extension: z.string(),
  original_size: z.number(),
  optimized_size: z.number(),
  status: z.string(),
  created_at: z.string(),
});
export type FileDTO = z.infer<typeof FileSchema>;

export const GalleryResponseSchema = z.object({
  files: z.array(FileSchema),
  next_cursor: z.string().nullable(),
});
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>;
```

- [ ] **Step 2: Nodes types**

```ts
// src/features/nodes/types/nodes.types.ts
import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  node_type: z.string(),
  status: z.string(),
  total_capacity: z.number(),
  used_capacity: z.number(),
  last_heartbeat: z.string(),
});
export type NodeDTO = z.infer<typeof NodeSchema>;
```

- [ ] **Step 3: Health types**

```ts
// src/features/health/types/health.types.ts
import { z } from "zod";

export const AlertSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  alert_type: z.string(),
  message: z.string(),
  severity: z.string(),
  resource_type: z.string().nullable(),
  resource_id: z.string().nullable(),
  created_at: z.string(),
});
export type AlertDTO = z.infer<typeof AlertSchema>;
```

- [ ] **Step 4: Upload types**

```ts
// src/features/upload/types/upload.types.ts
import { z } from "zod";

export const UploadResponseSchema = z.object({
  file_id: z.string().uuid(),
  status: z.string(),
});
export type UploadResponseDTO = z.infer<typeof UploadResponseSchema>;

export interface UploadRequest {
  cluster_id: string;
  uploaded_by: string;
  original_name: string;
  media_type: string;
  mime_type: string;
  file_extension: string;
  original_size: number;
}
```

- [ ] **Step 5: Recovery types**

```ts
// src/features/recovery/types/recovery.types.ts
import { z } from "zod";

export const RecoveryReportSchema = z.object({
  seed_valid: z.boolean(),
  master_key_derived: z.boolean(),
  vaults_recovered: z.number(),
  manifests_found: z.number(),
  files_recovered: z.number(),
  chunks_missing: z.number(),
  nodes_reconnected: z.number(),
  status: z.string(),
});
export type RecoveryReportDTO = z.infer<typeof RecoveryReportSchema>;
```

- [ ] **Step 6: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/
git commit -m "feat(web): add Zod schemas for all 5 features"
```

---

## Task 11: Create Feature API Functions + Hooks

**Files:**
- Create: `src/features/gallery/api/gallery-api.ts`
- Create: `src/features/gallery/hooks/useGallery.ts`
- Create: `src/features/nodes/api/nodes-api.ts`
- Create: `src/features/nodes/hooks/useNodes.ts`
- Create: `src/features/health/api/health-api.ts`
- Create: `src/features/health/hooks/useAlerts.ts`
- Create: `src/features/upload/api/upload-api.ts`
- Create: `src/features/upload/hooks/useUploadFile.ts`
- Create: `src/features/upload/hooks/useUploadQueue.ts`
- Create: `src/features/recovery/api/recovery-api.ts`
- Create: `src/features/recovery/hooks/useRecovery.ts`
- Create: `src/hooks/useCluster.ts`

- [ ] **Step 1: Gallery API + hook**

```ts
// src/features/gallery/api/gallery-api.ts
import { apiClient } from "@/services/api-client";
import { GalleryResponseSchema, type GalleryResponse } from "../types/gallery.types";

export async function getFiles(
  clusterId: string,
  cursor?: string,
  limit = 20,
): Promise<GalleryResponse> {
  const params: Record<string, string> = { limit: String(limit) };
  if (cursor) params.cursor = cursor;
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/files`, params);
  return GalleryResponseSchema.parse(raw);
}
```

```ts
// src/features/gallery/hooks/useGallery.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getFiles } from "../api/gallery-api";

export function useGallery(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["gallery", clusterId],
    queryFn: () => getFiles(clusterId!),
    enabled: !!clusterId,
    staleTime: 10 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Nodes API + hook**

```ts
// src/features/nodes/api/nodes-api.ts
import { apiClient } from "@/services/api-client";
import { NodeSchema, type NodeDTO } from "../types/nodes.types";
import { z } from "zod";

export async function getNodes(clusterId: string): Promise<NodeDTO[]> {
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/nodes`);
  return z.array(NodeSchema).parse(raw);
}
```

```ts
// src/features/nodes/hooks/useNodes.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getNodes } from "../api/nodes-api";

export function useNodes(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["nodes", clusterId],
    queryFn: () => getNodes(clusterId!),
    enabled: !!clusterId,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 3: Health API + hook**

```ts
// src/features/health/api/health-api.ts
import { apiClient } from "@/services/api-client";
import { AlertSchema, type AlertDTO } from "../types/health.types";
import { z } from "zod";

export async function getAlerts(clusterId: string): Promise<AlertDTO[]> {
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/alerts`);
  return z.array(AlertSchema).parse(raw);
}
```

```ts
// src/features/health/hooks/useAlerts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../api/health-api";

export function useAlerts(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["alerts", clusterId],
    queryFn: () => getAlerts(clusterId!),
    enabled: !!clusterId,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 4: Upload API + hooks**

```ts
// src/features/upload/api/upload-api.ts
import { apiClient } from "@/services/api-client";
import { UploadResponseSchema, type UploadResponseDTO, type UploadRequest } from "../types/upload.types";

export async function uploadFile(data: UploadRequest): Promise<UploadResponseDTO> {
  const raw = await apiClient.post("/api/v1/files/upload", data);
  return UploadResponseSchema.parse(raw);
}
```

```ts
// src/features/upload/hooks/useUploadFile.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "../api/upload-api";
import { useEventBus } from "@/store/event-bus";

export function useUploadFile() {
  const queryClient = useQueryClient();
  const emit = useEventBus((s) => s.emit);

  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      emit("upload:complete", { fileId: data.file_id });
    },
  });
}
```

```ts
// src/features/upload/hooks/useUploadQueue.ts
"use client";

import { useCallback, useState } from "react";

export interface QueueItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function useUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);

  const addFiles = useCallback((fileList: FileList) => {
    const newItems: QueueItem[] = Array.from(fileList).map((f) => ({
      file: f,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const updateStatus = useCallback(
    (index: number, status: QueueItem["status"], error?: string) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status, error } : item)),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, addFiles, updateStatus, clear };
}
```

- [ ] **Step 5: Recovery API + hook**

```ts
// src/features/recovery/api/recovery-api.ts
import { apiClient } from "@/services/api-client";
import { RecoveryReportSchema, type RecoveryReportDTO } from "../types/recovery.types";

export async function startRecovery(seedPhrase: string): Promise<RecoveryReportDTO> {
  const raw = await apiClient.post("/api/v1/recovery", { seed_phrase: seedPhrase });
  return RecoveryReportSchema.parse(raw);
}
```

```ts
// src/features/recovery/hooks/useRecovery.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { startRecovery } from "../api/recovery-api";

export function useRecovery() {
  return useMutation({
    mutationFn: startRecovery,
  });
}
```

- [ ] **Step 6: Migrate useCluster to TanStack Query**

```ts
// src/hooks/useCluster.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { z } from "zod";

const ClusterSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
});
type ClusterDTO = z.infer<typeof ClusterSchema>;

async function getClusters(): Promise<ClusterDTO[]> {
  const raw = await apiClient.get("/api/v1/clusters");
  return z.array(ClusterSchema).parse(raw);
}

export function useCluster() {
  const envId = process.env.NEXT_PUBLIC_CLUSTER_ID;

  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ["clusters"],
    queryFn: getClusters,
    staleTime: 5 * 60 * 1000,
    enabled: !envId,
  });

  const cluster = envId
    ? { id: envId, cluster_id: envId, name: "", created_at: "" }
    : clusters?.[0] ?? null;

  return {
    cluster,
    loading: !envId && isLoading,
    error: error?.message ?? null,
    needsSetup: !envId && !isLoading && !cluster,
  };
}
```

- [ ] **Step 7: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/features/ apps/web/src/hooks/useCluster.ts
git commit -m "feat(web): add feature API functions, TanStack Query hooks, and migrate useCluster"
```

---

## Task 12: Create Gallery Feature Components

**Files:**
- Create: `src/features/gallery/components/PhotoCard.tsx`
- Create: `src/features/gallery/components/GalleryGrid.tsx`
- Create: `src/features/gallery/components/GalleryPage.tsx`

**Note:** Thin shell pages are NOT created here. They are all created together in Task 17 (atomic route swap) to avoid route conflicts with existing pages.

- [ ] **Step 1: Create PhotoCard**

```tsx
// src/features/gallery/components/PhotoCard.tsx
import { Images, Film, FileText } from "lucide-react";
import { formatBytes, timeAgo } from "@/utils/format";
import type { FileDTO } from "../types/gallery.types";

function FileIcon({ mediaType }: { mediaType: string }) {
  switch (mediaType) {
    case "foto": return <Images className="h-8 w-8" />;
    case "video": return <Film className="h-8 w-8" />;
    default: return <FileText className="h-8 w-8" />;
  }
}

interface PhotoCardProps {
  file: FileDTO;
}

export function PhotoCard({ file }: PhotoCardProps) {
  return (
    <div className="group relative aspect-square bg-surface-elevated border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <div className="absolute inset-0 flex items-center justify-center text-text-muted/40">
        <FileIcon mediaType={file.media_type} />
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-xs font-medium truncate">{file.original_name}</p>
        <p className="text-white/70 text-xs">
          {formatBytes(file.original_size)} · {timeAgo(file.created_at)}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create GalleryGrid**

```tsx
// src/features/gallery/components/GalleryGrid.tsx
import type { FileDTO } from "../types/gallery.types";
import { PhotoCard } from "./PhotoCard";

interface GalleryGridProps {
  files: FileDTO[];
}

export function GalleryGrid({ files }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {files.map((file) => (
        <PhotoCard key={file.id} file={file} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create GalleryPage**

```tsx
// src/features/gallery/components/GalleryPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { Button } from "@/components/ui";
import { Alert } from "@/components/ui";
import { useGallery } from "../hooks/useGallery";
import { GalleryGrid } from "./GalleryGrid";

export function GalleryPage() {
  const router = useRouter();
  const { cluster, loading: clusterLoading, needsSetup } = useCluster();
  const { data, isLoading, error } = useGallery(cluster?.id);

  const loading = clusterLoading || isLoading;

  if (needsSetup) {
    return (
      <EmptyState
        icon={Camera}
        title="Nenhum cluster configurado"
        description="Crie um cluster para comecar"
        action={{ label: "Configurar", onClick: () => router.push("/recovery") }}
      />
    );
  }

  return (
    <div>
      <Header title="Galeria">
        <Button onClick={() => router.push("/upload")}>Enviar Arquivos</Button>
      </Header>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="error">{error.message}</Alert>
      )}

      {!loading && !error && data && data.files.length === 0 && (
        <EmptyState
          icon={Camera}
          title="Nenhum arquivo ainda"
          description="Envie fotos e videos para comecar"
          action={{ label: "Enviar Arquivos", onClick: () => router.push("/upload") }}
        />
      )}

      {!loading && data && data.files.length > 0 && (
        <GalleryGrid files={data.files} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build** (components only — thin shell page created in Task 17)

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/gallery/components/
git commit -m "feat(web): create gallery feature components"
```

---

## Task 13: Create Nodes Feature Components

**Files:**
- Create: `src/features/nodes/components/CapacityBar.tsx`
- Create: `src/features/nodes/components/NodeCard.tsx`
- Create: `src/features/nodes/components/NodeList.tsx`
- Create: `src/features/nodes/components/NodesPage.tsx`

- [ ] **Step 1: Create CapacityBar**

```tsx
// src/features/nodes/components/CapacityBar.tsx
import { Progress } from "@/components/ui";
import { formatCapacity } from "@/utils/format";

interface CapacityBarProps {
  used: number;
  total: number;
}

export function CapacityBar({ used, total }: CapacityBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const variant = pct > 90 ? "error" : pct > 75 ? "warning" : "default";

  return (
    <div className="flex items-center gap-4">
      <Progress className="flex-1" value={pct} variant={variant} />
      <span className="text-xs text-text-muted whitespace-nowrap">
        {formatCapacity(used)} / {formatCapacity(total)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create NodeCard**

```tsx
// src/features/nodes/components/NodeCard.tsx
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import { CapacityBar } from "./CapacityBar";
import type { NodeDTO } from "../types/nodes.types";

const statusVariant = {
  online: "success",
  suspect: "warning",
  lost: "error",
  draining: "info",
} as const;

interface NodeCardProps {
  node: NodeDTO;
}

export function NodeCard({ node }: NodeCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-text">{node.name}</h3>
          <Badge variant={statusVariant[node.status as keyof typeof statusVariant] ?? "default"}>
            {node.status}
          </Badge>
        </div>
        <span className="text-xs text-text-muted font-mono">{node.node_type}</span>
      </div>
      <CapacityBar used={node.used_capacity} total={node.total_capacity} />
    </Card>
  );
}
```

- [ ] **Step 3: Create NodeList**

```tsx
// src/features/nodes/components/NodeList.tsx
import type { NodeDTO } from "../types/nodes.types";
import { NodeCard } from "./NodeCard";

interface NodeListProps {
  nodes: NodeDTO[];
}

export function NodeList({ nodes }: NodeListProps) {
  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create NodesPage**

```tsx
// src/features/nodes/components/NodesPage.tsx
"use client";

import { HardDrive } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton, Alert } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { useNodes } from "../hooks/useNodes";
import { NodeList } from "./NodeList";

export function NodesPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const { data: nodes, isLoading, error } = useNodes(cluster?.id);

  const loading = clusterLoading || isLoading;

  return (
    <div>
      <Header title="Nos de Armazenamento" />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error.message}</Alert>}

      {!loading && !error && nodes && nodes.length === 0 && (
        <EmptyState
          icon={HardDrive}
          title="Nenhum no registrado"
          description="Registre nos para armazenar dados da familia"
        />
      )}

      {!loading && nodes && nodes.length > 0 && <NodeList nodes={nodes} />}
    </div>
  );
}
```

- [ ] **Step 5: Verify build** (components only — thin shell page created in Task 17)

```bash
cd apps/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/nodes/components/
git commit -m "feat(web): create nodes feature components"
```

---

## Task 14: Create Health Feature Components

**Files:**
- Create: `src/features/health/components/HealthSummary.tsx`
- Create: `src/features/health/components/AlertList.tsx`
- Create: `src/features/health/components/HealthPage.tsx`

- [ ] **Step 1: Create HealthSummary**

```tsx
// src/features/health/components/HealthSummary.tsx
import { Card } from "@/components/ui";
import type { AlertDTO } from "../types/health.types";

interface HealthSummaryProps {
  alerts: AlertDTO[];
}

export function HealthSummary({ alerts }: HealthSummaryProps) {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-text">{alerts.length}</p>
        <p className="text-xs text-text-muted mt-1">Alertas Ativos</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-error">{critical}</p>
        <p className="text-xs text-text-muted mt-1">Criticos</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-warning">{warning}</p>
        <p className="text-xs text-text-muted mt-1">Avisos</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create AlertList**

```tsx
// src/features/health/components/AlertList.tsx
import { Badge } from "@/components/ui";
import { timeAgo } from "@/utils/format";
import type { AlertDTO } from "../types/health.types";

const severityVariant = {
  critical: "error",
  warning: "warning",
  info: "info",
} as const;

const severityBorder = {
  critical: "border-l-error bg-error/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-info bg-info/5",
} as const;

interface AlertListProps {
  alerts: AlertDTO[];
}

export function AlertList({ alerts }: AlertListProps) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 border-l-4 rounded-lg ${
            severityBorder[alert.severity as keyof typeof severityBorder] ?? "border-l-info bg-info/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={severityVariant[alert.severity as keyof typeof severityVariant] ?? "info"}
              >
                {alert.severity}
              </Badge>
              <span className="text-xs text-text-muted font-mono">{alert.alert_type}</span>
            </div>
            <span className="text-xs text-text-muted">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="text-sm text-text mt-2">{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create HealthPage**

```tsx
// src/features/health/components/HealthPage.tsx
"use client";

import { ShieldCheck } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton, Alert } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { useAlerts } from "../hooks/useAlerts";
import { HealthSummary } from "./HealthSummary";
import { AlertList } from "./AlertList";

export function HealthPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const { data: alerts, isLoading, error } = useAlerts(cluster?.id);

  const loading = clusterLoading || isLoading;

  return (
    <div>
      <Header title="Saude do Cluster" />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error.message}</Alert>}

      {!loading && !error && alerts && (
        <>
          <HealthSummary alerts={alerts} />
          {alerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Cluster saudavel"
              description="Nenhum alerta ativo"
            />
          ) : (
            <AlertList alerts={alerts} />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build** (components only — thin shell page created in Task 17)

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/health/components/
git commit -m "feat(web): create health feature components"
```

---

## Task 15: Create Upload Feature Components

**Files:**
- Create: `src/features/upload/components/UploadDropzone.tsx`
- Create: `src/features/upload/components/UploadQueue.tsx`
- Create: `src/features/upload/components/UploadPage.tsx`

- [ ] **Step 1: Create UploadDropzone**

```tsx
// src/features/upload/components/UploadDropzone.tsx
"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

interface UploadDropzoneProps {
  onFiles: (files: FileList) => void;
}

export function UploadDropzone({ onFiles }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <Card
      onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-text-muted/50 mb-3" />
      <p className="text-text font-medium">Arraste arquivos aqui</p>
      <p className="text-text-muted text-sm mt-1">ou clique para selecionar</p>
      <input
        type="file"
        multiple
        className="absolute inset-0 opacity-0 cursor-pointer"
        style={{ position: "relative" }}
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </Card>
  );
}
```

- [ ] **Step 2: Create UploadQueue**

```tsx
// src/features/upload/components/UploadQueue.tsx
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import type { QueueItem } from "../hooks/useUploadQueue";

const statusConfig = {
  pending: { label: "Pendente", variant: "default" as const },
  uploading: { label: "Enviando...", variant: "info" as const },
  done: { label: "Concluido", variant: "success" as const },
  error: { label: "Erro", variant: "error" as const },
};

interface UploadQueueProps {
  items: QueueItem[];
}

export function UploadQueue({ items }: UploadQueueProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const config = statusConfig[item.status];
        return (
          <Card key={i} className="flex items-center justify-between p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{item.file.name}</p>
              <p className="text-xs text-text-muted">
                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <Badge variant={config.variant}>
              {item.status === "error" ? item.error ?? config.label : config.label}
            </Badge>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create UploadPage**

```tsx
// src/features/upload/components/UploadPage.tsx
"use client";

import { useCluster } from "@/hooks/useCluster";
import { Button } from "@/components/ui";
import { Header } from "@/components/layouts/Header";
import { useUploadFile } from "../hooks/useUploadFile";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { UploadDropzone } from "./UploadDropzone";
import { UploadQueue } from "./UploadQueue";

function getMediaType(mime: string): string {
  if (mime.startsWith("image/")) return "foto";
  if (mime.startsWith("video/")) return "video";
  return "documento";
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function UploadPage() {
  const { cluster } = useCluster();
  const { items, addFiles, updateStatus } = useUploadQueue();
  const uploadFile = useUploadFile();

  const handleUploadAll = async () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;
      updateStatus(i, "uploading");

      try {
        await uploadFile.mutateAsync({
          cluster_id: cluster?.id ?? "",
          uploaded_by: "00000000-0000-0000-0000-000000000000",
          original_name: items[i].file.name,
          media_type: getMediaType(items[i].file.type),
          mime_type: items[i].file.type || "application/octet-stream",
          file_extension: getExtension(items[i].file.name),
          original_size: items[i].file.size,
        });
        updateStatus(i, "done");
      } catch (e) {
        updateStatus(i, "error", (e as Error).message);
      }
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div>
      <Header title="Enviar Arquivos" />
      <UploadDropzone onFiles={addFiles} />

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text">
              {items.length} arquivo(s) selecionado(s)
            </p>
            {pendingCount > 0 && (
              <Button onClick={handleUploadAll}>Enviar Todos</Button>
            )}
          </div>
          <UploadQueue items={items} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build** (components only — thin shell page created in Task 17)

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/upload/components/
git commit -m "feat(web): create upload feature components"
```

---

## Task 16: Create Recovery Feature Components + Wire Public Route

Recovery is a public route (not in `(protected)/`) — it replaces `app/recovery/page.tsx` in-place so no route conflict.

**Files:**
- Create: `src/features/recovery/components/SeedPhraseInput.tsx`
- Create: `src/features/recovery/components/RecoveryReport.tsx`
- Create: `src/features/recovery/components/RecoveryPage.tsx`
- Modify: `src/app/recovery/page.tsx` (replace content — stays at root, NOT in `(protected)`)

- [ ] **Step 1: Create SeedPhraseInput**

```tsx
// src/features/recovery/components/SeedPhraseInput.tsx
"use client";

import { Input } from "@/components/ui";

interface SeedPhraseInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SeedPhraseInput({ value, onChange, disabled }: SeedPhraseInputProps) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="palavra1 palavra2 palavra3 ... palavra12"
        rows={3}
        className="w-full p-3 border border-border rounded-lg font-mono text-sm bg-surface-elevated text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      />
      <p className="text-xs text-text-muted mt-1">{wordCount}/12 palavras</p>
    </div>
  );
}
```

- [ ] **Step 2: Create RecoveryReport**

```tsx
// src/features/recovery/components/RecoveryReport.tsx
import { Card } from "@/components/ui";
import type { RecoveryReportDTO } from "../types/recovery.types";

interface RecoveryReportProps {
  report: RecoveryReportDTO;
}

function StatusColor({ status }: { status: string }) {
  const color =
    status === "Complete" ? "text-success" :
    status === "Partial" ? "text-warning" :
    "text-error";
  return <span className={`font-medium ${color}`}>{status}</span>;
}

function BoolValue({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-success" : "text-error"}>
      {value ? "Sim" : "Nao"}
    </span>
  );
}

export function RecoveryReport({ report }: RecoveryReportProps) {
  return (
    <Card className="mt-6">
      <Card.Header>
        <h3 className="font-medium text-text">Resultado do Recovery</h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Seed valida</span>
            <BoolValue value={report.seed_valid} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Master key derivada</span>
            <BoolValue value={report.master_key_derived} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Vaults recuperados</span>
            <span className="text-text font-mono">{report.vaults_recovered}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Manifests encontrados</span>
            <span className="text-text font-mono">{report.manifests_found}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Arquivos recuperados</span>
            <span className="text-text font-mono">{report.files_recovered}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Status</span>
            <StatusColor status={report.status} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
```

- [ ] **Step 3: Create RecoveryPage**

```tsx
// src/features/recovery/components/RecoveryPage.tsx
"use client";

import { useState } from "react";
import { Button, Alert } from "@/components/ui";
import { Header } from "@/components/layouts/Header";
import { useRecovery } from "../hooks/useRecovery";
import { SeedPhraseInput } from "./SeedPhraseInput";
import { RecoveryReport } from "./RecoveryReport";

export function RecoveryPage() {
  const [seedPhrase, setSeedPhrase] = useState("");
  const recovery = useRecovery();

  const handleSubmit = () => {
    if (!seedPhrase.trim()) return;
    recovery.mutate(seedPhrase.trim());
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title="Recovery via Seed Phrase"
        description="Insira a seed phrase de 12 palavras para reconstruir o sistema."
      />

      <SeedPhraseInput
        value={seedPhrase}
        onChange={setSeedPhrase}
        disabled={recovery.isPending}
      />

      <div className="mt-4">
        <Button
          onClick={handleSubmit}
          loading={recovery.isPending}
          disabled={!seedPhrase.trim()}
        >
          Iniciar Recovery
        </Button>
      </div>

      {recovery.error && (
        <Alert variant="error" className="mt-4">
          {recovery.error.message}
        </Alert>
      )}

      {recovery.data && <RecoveryReport report={recovery.data} />}
    </div>
  );
}
```

- [ ] **Step 4: Replace recovery page (public route — stays at app root)**

```tsx
// src/app/recovery/page.tsx
import { RecoveryPage } from "@/features/recovery/components/RecoveryPage";

export default function Page() {
  return <RecoveryPage />;
}
```

**Important:** Recovery stays at `app/recovery/`, NOT inside `app/(protected)/`. It's a public route — used to reconstruct the orchestrator from scratch.

- [ ] **Step 5: Verify build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/recovery/components/ apps/web/src/app/recovery/page.tsx
git commit -m "feat(web): migrate recovery to feature-based architecture (public route)"
```

---

## Task 17: Atomic Route Swap — Wire All Routes + Delete Old Pages

This is the critical migration step. We create the `(protected)` layout, all thin shell pages, delete old pages, and update the root layout — all in one atomic operation to avoid route conflicts.

**IMPORTANT:** Old pages at `app/gallery/page.tsx` and new pages at `app/(protected)/gallery/page.tsx` serve the SAME URL `/gallery`. They cannot coexist. This task does everything at once.

**Files:**
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/gallery/page.tsx`
- Create: `src/app/(protected)/upload/page.tsx`
- Create: `src/app/(protected)/nodes/page.tsx`
- Create: `src/app/(protected)/health/page.tsx`
- Delete: `src/app/gallery/page.tsx`
- Delete: `src/app/upload/page.tsx`
- Delete: `src/app/nodes/page.tsx`
- Delete: `src/app/health/page.tsx`
- Delete: `src/lib/api.ts`
- Delete: `src/lib/useCluster.ts`
- Delete: `src/components/layouts/AppLayout.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Delete old pages FIRST to avoid route conflicts**

```bash
cd apps/web
rm src/app/gallery/page.tsx
rm src/app/upload/page.tsx
rm src/app/nodes/page.tsx
rm src/app/health/page.tsx
```

- [ ] **Step 2: Create protected layout**

```tsx
// src/app/(protected)/layout.tsx
import { AppShell } from "@/components/layouts/AppShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 3: Create all thin shell pages**

```tsx
// src/app/(protected)/gallery/page.tsx
import { GalleryPage } from "@/features/gallery/components/GalleryPage";
export default function Page() { return <GalleryPage />; }
```

```tsx
// src/app/(protected)/upload/page.tsx
import { UploadPage } from "@/features/upload/components/UploadPage";
export default function Page() { return <UploadPage />; }
```

```tsx
// src/app/(protected)/nodes/page.tsx
import { NodesPage } from "@/features/nodes/components/NodesPage";
export default function Page() { return <NodesPage />; }
```

```tsx
// src/app/(protected)/health/page.tsx
import { HealthPage } from "@/features/health/components/HealthPage";
export default function Page() { return <HealthPage />; }
```

- [ ] **Step 4: Update root layout — remove old AppLayout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/query-client";

export const metadata: Metadata = {
  title: "Alexandria — Armazenamento Familiar",
  description: "Sistema de armazenamento familiar distribuido com criptografia zero-knowledge",
};

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

- [ ] **Step 5: Delete remaining old files**

```bash
cd apps/web
rm src/lib/api.ts
rm src/lib/useCluster.ts
rm src/components/layouts/AppLayout.tsx
```

- [ ] **Step 6: Verify build**

```bash
cd apps/web && npm run build
```

Expected: Build succeeds with no import errors.

- [ ] **Step 7: Verify dev server** — test all routes

```bash
cd apps/web && npm run dev
```

Open in browser:
- `http://localhost:3000` → redirects to `/gallery`
- `http://localhost:3000/gallery` → Gallery with sidebar (new AppShell + Sidebar with Lucide icons)
- `http://localhost:3000/upload` → Upload with sidebar
- `http://localhost:3000/nodes` → Nodes with sidebar
- `http://localhost:3000/health` → Health with sidebar
- `http://localhost:3000/recovery` → Recovery (no sidebar — public route via root layout)

- [ ] **Step 8: Commit**

```bash
git add -u apps/web/src/ && git add apps/web/src/app/\(protected\)/ apps/web/src/app/layout.tsx
git commit -m "feat(web): atomic route swap — wire (protected) layout, delete old flat pages"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Full clean build**

```bash
cd apps/web && rm -rf .next && npm run build
```

Expected: Build succeeds.

- [ ] **Step 2: Verify no cross-feature imports**

```bash
cd apps/web && grep -r "features/" src/features/ --include="*.ts" --include="*.tsx" | grep -v "from \"\.\." | grep -v "from \"\." || echo "No cross-feature imports found"
```

Expected: No results — features don't import from other features.

- [ ] **Step 3: Verify no old api.ts imports remain**

```bash
cd apps/web && grep -r "@/lib/api" src/ --include="*.ts" --include="*.tsx" || echo "No old imports found"
```

Expected: "No old imports found"

- [ ] **Step 4: Verify no old useCluster imports remain**

```bash
cd apps/web && grep -r "@/lib/useCluster" src/ --include="*.ts" --include="*.tsx" || echo "No old imports found"
```

Expected: "No old imports found"

- [ ] **Step 5: Commit only if there are changes** (there may be none)

```bash
cd apps/web && git diff --quiet || (git add -u apps/web/src/ && git commit -m "fix(web): cleanup any remaining import issues after restructure")
```

---

## Summary

| Task | Description | Files | Est. Steps |
|------|-------------|-------|-----------|
| 1 | Install dependencies | 1 | 3 |
| 2 | Utility files (cn, format) | 2 | 4 |
| 3 | API client + base types | 2 | 4 |
| 4 | TanStack Query provider | 2 | 4 |
| 5 | Zustand stores | 2 | 4 |
| 6 | UI primitives: Button, Input, Skeleton | 3 | 5 |
| 7 | UI primitives: Card, Badge, Progress, Alert, Modal + barrel | 6 | 8 |
| 8 | EmptyState feedback | 1 | 3 |
| 9 | Layout: AppShell, Sidebar, Header | 3 | 5 |
| 10 | Zod schemas (5 features) | 5 | 7 |
| 11 | Feature APIs + hooks + useCluster migration | 12 | 8 |
| 12 | Gallery feature components | 3 | 5 |
| 13 | Nodes feature components | 4 | 6 |
| 14 | Health feature components | 3 | 5 |
| 15 | Upload feature components | 3 | 5 |
| 16 | Recovery feature components + public route | 4 | 6 |
| 17 | **Atomic route swap** (layout + shells + delete old) | 5 new + 7 deleted + 1 modified | 8 |
| 18 | Final verification | 0 | 5 |
| **Total** | | **~55 new + 3 modified + 7 deleted** | **~97 steps** |

### Known trade-offs documented in plan

- **`useCluster` behavior change:** When `NEXT_PUBLIC_CLUSTER_ID` env var is set, the new hook skips the API call (optimization — doesn't validate cluster exists on backend). The old hook always called the API.
- **No search/filter in Gallery:** The current MVP gallery has no search/filter functionality in the API layer. The migrated gallery preserves the same behavior. Search/filter is a future feature.
- **`RecoveryWizard` deferred:** The spec defines a `RecoveryWizard` component as a step-by-step wizard. The current recovery page is a single-screen form. The migrated version preserves current behavior with `SeedPhraseInput` + `RecoveryReport` components. A proper wizard (with step indicators and progressive flow) is deferred.
- **Zustand hydration:** `preferences-store` uses `persist` middleware (localStorage). Initial render may flash default values before hydration. This is acceptable for non-critical preferences (sidebar state, gallery layout). A mounting guard can be added later if needed.
- **`app/page.tsx` unchanged:** The root page (`redirect("/gallery")`) is kept as-is.
