# Seguranca

Define o modelo de seguranca do frontend, cobrindo autenticacao, protecao contra vulnerabilidades comuns (XSS, CSRF) e boas praticas de seguranca client-side. Seguranca no frontend e a primeira linha de defesa, mas nunca deve ser a unica — toda validacao deve ser replicada no backend.

<!-- do blueprint: 13-security.md (STRIDE, autenticacao, autorizacao, OWASP, PII) -->

> **Principio Zero-Knowledge:** Nenhum dado sensivel e visivel ao servidor em texto puro. Chunks sao criptografados no cliente antes do upload. Seed phrase e credenciais nunca trafegam em texto puro alem da memoria do browser.

---

## Modelo de Autenticacao

> Como o frontend gerencia autenticacao?

<!-- do blueprint: 13-security.md (13.2 Autenticacao) -->

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | JWT assinado com chave do cluster (Ed25519) |
| Armazenamento do token | httpOnly cookie (`alexandria-token`) via Set-Cookie do backend; access token tambem em `authStore` (Zustand persist) para headers |
| Refresh token strategy | Refresh automatico via Route Handler `/api/auth/refresh` (server-side, httpOnly cookie); se falhar → redirect para /login |
| Expiracao | Access token: 24h; Refresh token: 7 dias |
| Logout | `authStore.logout()` → limpa store + `queryClient.clear()` → DELETE /auth/logout (revoga server-side) → redirect /login |
| Payload do JWT | `{ member_id, cluster_id, role, name, iat, exp }` |

### Fluxo de autenticacao

```
1. Admin gera convite (token assinado Ed25519, expiracao 7d)
2. Convidado acessa /invite/:token
3. Orquestrador valida assinatura + expiracao do convite
4. Convidado preenche nome e confirma
5. Orquestrador cria membro + vault → emite JWT
6. Backend retorna Set-Cookie: alexandria-token=JWT; HttpOnly; Secure; SameSite=Strict; Path=/
7. Frontend recebe JWT no body → salva em authStore (para Authorization header)
8. Redirect para /gallery
9. Toda request subsequente: cookie httpOnly (SSR) + Authorization header (CSR)
10. Middleware Next.js verifica cookie em cada request server-side
```

### Login (membros existentes)

```
1. Membro acessa /login
2. LoginForm captura email + senha
3. POST /auth/login → Backend valida email/senha (Argon2id hash)
4. Backend emite JWT (access + refresh)
5. Set-Cookie httpOnly para refresh; access token no body
6. authStore.setAuth(member, accessToken, refreshToken)
7. Redirect para /gallery (ou ?redirect= se existir)
```

### Refresh automatico

```typescript
// shared/lib/api-client.ts (interceptor de 401)
if (response.status === 401) {
  const refreshed = await fetch('/api/auth/refresh', { method: 'POST' });
  if (refreshed.ok) {
    const { accessToken } = await refreshed.json();
    useAuthStore.getState().setAuth(/* ... */, accessToken, /* ... */);
    return request(path, options); // retry com novo token
  }
  useAuthStore.getState().logout();
  window.location.href = '/login';
}
```

---

## Protecao de Rotas

> Como rotas protegidas sao implementadas?

<!-- do blueprint: 13-security.md (13.3 Autorizacao — RBAC) -->

### Duas camadas de protecao

1. **Server-side (middleware.ts):** Verifica presenca do JWT cookie antes de servir a pagina. Rapido, previne flash de conteudo protegido. Nao valida role (so presenca do token).

2. **Client-side (Guards):** Componentes React que verificam role e estado da sessao apos hydration. Tratam edge cases (token expirado entre request e render).

| Guard | Verifica | Redirect | Usado em |
|-------|----------|----------|----------|
| Middleware (server) | Cookie `alexandria-token` existe | /login?redirect={path} | Todas as rotas protegidas |
| AuthGuard (client) | `authStore.isAuthenticated` | /login | Layout de (protected) |
| RoleGate (client) | `authStore.member.role` | /gallery (sem permissao) | Layout de (admin); botao de upload na galeria |
| SetupGuard (server) | Cluster nao existe | /gallery (cluster ja existe) | /cluster/setup |

### Matriz de acesso por rota

| Rota | Publico | reader | member | admin |
|------|---------|--------|--------|-------|
| /login | ✓ | redirect /gallery | redirect /gallery | redirect /gallery |
| /invite/:token | ✓ | ✓ | ✓ | ✓ |
| /recovery | ✓ | — | — | ✓ |
| /gallery | — | ✓ (sem upload) | ✓ (com upload) | ✓ (com upload) |
| /gallery/:fileId | — | ✓ | ✓ | ✓ |
| /settings | — | ✓ | ✓ | ✓ |
| /nodes | — | — | — | ✓ |
| /health | — | — | — | ✓ |
| /cluster | — | — | — | ✓ |
| /cluster/setup | ✓ (se sem cluster) | — | — | — |

> Para estrutura completa de rotas, (ver 07-routes.md).

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade | Protecao | Implementacao no Alexandria |
|-----------------|----------|----------------------------|
| XSS (Cross-Site Scripting) | React auto-escape + CSP restritiva | React escapa todo output por padrao; sem `dangerouslySetInnerHTML`; CSP com nonce para scripts inline |
| CSRF (Cross-Site Request Forgery) | SameSite=Strict + Origin validation | Cookie com `SameSite=Strict`; backend valida header `Origin` em mutations |
| Clickjacking | X-Frame-Options + CSP frame-ancestors | `X-Frame-Options: DENY` + `frame-ancestors 'none'` via Caddy |
| Injection (SQL/NoSQL) | Prisma type-safe queries + Zod validation | Frontend valida com Zod; backend usa Prisma (parameterized queries); sem string concatenation em queries |
| Open Redirect | Whitelist de paths internos | Parametro `?redirect=` aceita apenas paths relativos (`/gallery`, `/settings`); rejeita URLs externas |
| Sensitive Data Exposure | Server Components + criptografia | Dados sensiveis nunca renderizados no servidor; seed phrase CSR-only; vault nunca exposto ao frontend |
| Prototype Pollution | Zod schema validation | Todos os payloads de API validados com Zod schemas antes de uso; sem `Object.assign` de dados externos |
| Supply Chain | Dependabot + npm audit | `npm audit` no CI; Dependabot para updates automaticos; lock file commitado |

<!-- APPEND:vulnerabilidades -->

### Protecoes especificas do Alexandria

| Ameaca | Superficie | Mitigacao no Frontend |
|--------|-----------|----------------------|
| Seed phrase vazada via logs/telemetria | /recovery, /cluster/setup | Seed nunca enviada em logs, error reports ou telemetria; `console.log` sanitizado em producao |
| Seed phrase capturada via screenshot | SeedPhraseDisplay | Aviso visual "Nao tire screenshot — anote em papel"; considerar blur on screenshot event (futuro) |
| Token de convite brute-force | /invite/:token | Token longo (256+ bits); rate limiting 3 tentativas/hora por IP |
| JWT roubo via XSS | authStore (localStorage) | CSP restritiva previne XSS; access token de vida curta (24h); refresh via httpOnly cookie |
| Exfiltracao de previews | /api/preview/[fileId] | Proxy BFF verifica JWT; sem hotlinking direto ao orquestrador |
| Role escalation client-side | authStore.member.role | Role e apenas para UI; toda operacao validada server-side; nunca confiar no role do client |

---

## Content Security Policy (CSP)

> O frontend aplica CSP?

CSP configurada via Caddy (proxy reverso) e replicada em `next.config.ts` para desenvolvimento.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{{random}}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' {API_URL};
  font-src 'self';
  media-src 'self' blob:;
  worker-src 'self' blob:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

| Diretiva | Valor | Justificativa |
|----------|-------|---------------|
| `script-src` | `'self' 'nonce-{random}'` | Bloqueia scripts inline nao autorizados; nonce gerado por request |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind CSS usa inline styles; necessario para funcionar |
| `img-src` | `'self' data: blob:` | Thumbnails do backend + blur placeholder (data URI) + FileReader previews (blob) |
| `connect-src` | `'self' {API_URL}` | Restricto ao orquestrador; sem requests para terceiros |
| `media-src` | `'self' blob:` | Video player usa blob URLs para preview |
| `worker-src` | `'self' blob:` | core-sdk WASM pode usar Web Workers |
| `frame-ancestors` | `'none'` | Previne clickjacking — nao permite embed em iframe |

### Headers de seguranca adicionais (Caddy)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 0
```

| Header | Valor | Justificativa |
|--------|-------|---------------|
| HSTS | max-age=1 ano + preload | Forca HTTPS; previne downgrade attacks |
| X-Content-Type-Options | nosniff | Previne MIME type sniffing |
| X-Frame-Options | DENY | Previne clickjacking (redundante com CSP frame-ancestors) |
| Referrer-Policy | strict-origin-when-cross-origin | Nao vaza path em requests cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Alexandria nao usa camera/mic/geo — bloqueia explicitamente |

---

## Seguranca de Dados no Frontend

> Quais dados sensiveis existem no frontend e como sao protegidos?

<!-- do blueprint: 13-security.md (13.4 Protecao de Dados — PII) -->

| Dado | Onde existe no frontend | Protecao | Tempo de vida |
|------|------------------------|----------|---------------|
| Access token JWT | authStore (Zustand persist → localStorage) | CSP previne XSS; token de vida curta (24h) | Ate logout ou expiracao |
| Refresh token | httpOnly cookie (nao acessivel via JS) | Cookie HttpOnly + Secure + SameSite=Strict | 7 dias |
| Seed phrase (12 palavras) | Memoria (state local do componente) | CSR-only; nunca SSR; limpa ao sair da pagina; nunca em logs/telemetria | Duracao da interacao (<5min) |
| Email do membro | authStore.member.email | Exibido na UI; nao enviado a terceiros | Ate logout |
| Nome do membro | authStore.member.name | Exibido na UI | Ate logout |
| Thumbnails/previews | Cache do browser (HTTP cache) | Servidos via proxy BFF com JWT validation | Cache 1 ano (imutaveis) |
| Token de convite | URL (/invite/:token) | Token de uso unico; expiracao 7 dias; validado server-side | Duracao do aceite |
| Filtros de busca | URL search params | Nao sensivel; compartilhavel via URL | Duracao da sessao |

### Regras de seguranca de dados

- **Nunca armazenar seed phrase digitalmente** — exibida uma unica vez via SeedPhraseDisplay, nunca persistida
- **Nunca logar dados sensiveis** — seed, tokens, hashes nao devem aparecer em `console.log`, error reports ou telemetria
- **Limpar dados sensíveis ao sair** — seed phrase limpa do state ao navegar para outra pagina
- **Nao enviar PII para terceiros** — sem analytics SaaS (Google Analytics, Mixpanel); metricas via web-vitals para endpoint proprio

---

## Checklist de Seguranca

### Pre-release

- [x] Access token JWT com expiracao curta (24h)
- [x] Refresh token em httpOnly cookie (nao acessivel via JS)
- [x] Cookie com Secure + SameSite=Strict
- [x] React escapa output por padrao (sem dangerouslySetInnerHTML)
- [x] CSP configurada (scripts com nonce, frame-ancestors none)
- [x] Headers de seguranca (HSTS, X-Frame-Options, nosniff)
- [x] Seed phrase renderizada apenas client-side (CSR-only)
- [x] Seed phrase nunca em logs, telemetria ou error reports
- [x] Role verificado server-side em cada endpoint (nao confiar no client)
- [x] Inputs validados com Zod no frontend e revalidados no backend
- [x] Redirect parameter aceita apenas paths relativos
- [x] Dependencias auditadas (`npm audit` no CI)
- [x] Secrets nunca commitados no repositorio (.env no .gitignore)
- [x] HTTPS obrigatorio em todos os ambientes
- [x] Permissoes de browser restritas (camera, mic, geo desabilitados)

### Periodico (mensal)

- [ ] Executar `npm audit` e resolver vulnerabilidades criticas
- [ ] Revisar Dependabot PRs de seguranca
- [ ] Verificar que CSP esta ativa em producao (DevTools → Network → Response Headers)
- [ ] Verificar que cookies tem flags corretas (HttpOnly, Secure, SameSite)
- [ ] Testar fluxo de logout (token revogado, cache limpo, redirect)
- [ ] Testar fluxo de token expirado (refresh automatico funciona)
- [ ] Verificar que seed phrase nao aparece em nenhum log

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observability.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-23 | JWT em authStore (localStorage) + refresh em httpOnly cookie | Trade-off: access token precisa estar acessivel para Authorization header; refresh token protegido pelo browser |
| 2026-03-23 | Seed phrase CSR-only (nunca SSR) | Principio Zero-Knowledge — seed nunca deve ser renderizada no servidor; evita vazamento via logs/cache do servidor |
| 2026-03-23 | CSP com nonce (nao hash) | Nonce por request e mais seguro que hash; Next.js suporta nonce via `next.config.ts` |
| 2026-03-23 | Sem analytics SaaS (Google Analytics, etc.) | PII familiar (fotos, GPS, nomes) nao deve ser enviado a terceiros; web-vitals para endpoint proprio |
| 2026-03-23 | RoleGate como UI-only guard | Role no frontend e conveniencia (esconder botoes); toda validacao real acontece no backend via middleware |
| 2026-03-23 | Permissions-Policy restritiva | Alexandria nao usa camera/mic/geo — bloquear explicitamente previne uso acidental por dependencias |
