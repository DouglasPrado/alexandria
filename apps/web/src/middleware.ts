import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth middleware — proteção de rotas server-side.
 * Fonte: docs/frontend/web/07-routes.md (Proteção de Rotas)
 *        docs/frontend/web/11-security.md (Modelo de Autenticação)
 *
 * JWT payload: { member_id, cluster_id, role, name, exp, iat }
 * Cookie: access_token (httpOnly, Secure, SameSite=Strict)
 */

interface JwtPayload {
  member_id: string;
  cluster_id: string;
  role: 'admin' | 'member' | 'reader';
  name: string;
  exp: number;
  iat: number;
}

/** Rotas que exigem role admin */
const ADMIN_ROUTES = [
  '/dashboard/nodes',
  '/dashboard/alerts',
  '/dashboard/members',
  '/dashboard/cluster',
];

/** Rotas públicas (sem auth) */
const PUBLIC_ROUTES = ['/login', '/invite'];

/** Rotas de setup (sem cluster) */
const SETUP_ROUTES = ['/setup'];

/** Rotas de recovery (banco vazio) */
const RECOVERY_ROUTES = ['/recovery'];

/**
 * Decodifica o payload do JWT sem verificar assinatura.
 * A verificação real é feita pelo orquestrador em cada request à API.
 * O middleware usa o payload apenas para decisões de routing.
 *
 * Usa atob() ao invés de Buffer — middleware roda no Edge Runtime.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;

    // base64url → base64 → atob
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // Verificar expiração
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload as JwtPayload;
  } catch {
    return null;
  }
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isSetupRoute(pathname: string): boolean {
  return SETUP_ROUTES.some((route) => pathname.startsWith(route));
}

function isRecoveryRoute(pathname: string): boolean {
  return RECOVERY_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  // --- Rotas públicas (/login, /invite/:token) ---
  if (isPublicRoute(pathname)) {
    // Autenticado → redireciona para dashboard
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // --- Rotas de setup (/setup, /setup/seed) ---
  if (isSetupRoute(pathname)) {
    // Se já autenticado (cluster existe) → redireciona para dashboard
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Sem auth → permite (o setup é para quando não há cluster)
    return NextResponse.next();
  }

  // --- Rotas de recovery (/recovery, /recovery/progress) ---
  if (isRecoveryRoute(pathname)) {
    // Se autenticado (banco populado) → redireciona para dashboard
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Sem auth → permite (recovery é para banco vazio)
    return NextResponse.next();
  }

  // --- Rotas protegidas (/dashboard/*) ---
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Rotas admin ---
  if (isAdminRoute(pathname) && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Injeta dados do membro no header para Server Components
  const response = NextResponse.next();
  response.headers.set('x-member-id', payload.member_id);
  response.headers.set('x-cluster-id', payload.cluster_id);
  response.headers.set('x-member-role', payload.role);
  response.headers.set('x-member-name', encodeURIComponent(payload.name));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api routes (handled by rewrites → orquestrador)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/).*)',
  ],
};
