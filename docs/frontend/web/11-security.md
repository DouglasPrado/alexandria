# Segurança

Define o modelo de segurança do frontend web (Next.js 16), cobrindo autenticação, proteção contra vulnerabilidades comuns (XSS, CSRF) e boas práticas de segurança client-side. Segurança no frontend é a primeira linha de defesa, mas nunca deve ser a única — toda validação deve ser replicada no backend.

<!-- do blueprint: 13-security.md (STRIDE, auth, RBAC, OWASP, LGPD) -->

---

## Modelo de Autenticação

> Como o frontend gerencia autenticação?

| Aspecto | Implementação |
|---------|---------------|
| Tipo de autenticação | JWT assinado com chave do cluster (Ed25519) |
| Armazenamento do token | Cookie httpOnly + Secure + SameSite=Strict (set pelo backend) |
| Refresh strategy | JWT re-emitido automaticamente se válido e próximo de expirar (sliding window) |
| Expiração | 24h; refresh transparente antes de expirar |
| Logout | Limpar cookie (Set-Cookie com Max-Age=0) + invalidar sessão no orquestrador |
| Dados no JWT | `{ member_id, cluster_id, role, name, exp, iat }` |

### Fluxo de Autenticação

<!-- do blueprint: 13-security.md (seção 13.2) -->

```
1. Membro acessa /login e submete credenciais (ou aceita convite via /invite/:token)
2. POST /api/auth/login → Orquestrador valida credenciais contra vault do membro
3. Orquestrador emite JWT e retorna Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict; Path=/
4. Frontend recebe 200 OK — token NÃO está no response body (segurança)
5. Cookie é enviado automaticamente em todas as requests ao orquestrador
6. Middleware Next.js lê cookie para verificar auth e extrair role (server-side)
7. Middleware redireciona se necessário (/login, /setup, /recovery)
```

### O que o Frontend NÃO Faz

- **NÃO** armazena JWT em localStorage ou sessionStorage (vulnerável a XSS)
- **NÃO** acessa o token via JavaScript (httpOnly impede)
- **NÃO** executa operações criptográficas (AES, SHA-256) — toda crypto é no orquestrador
- **NÃO** armazena seed phrase, master key ou credenciais S3 (zero-knowledge)

---

## Proteção de Rotas

> Como rotas protegidas são implementadas?

- **Server-side (primário):** Middleware Next.js verifica cookie JWT em todas as rotas protegidas
- **Client-side (complementar):** `authStore` (Zustand) reflete estado de auth para condicionar UI
- **Fallback:** Redirect para `/login` com `?returnUrl=` para retorno após autenticação

### Matriz de Acesso por Role

<!-- do blueprint: 13-security.md (seção 13.3 RBAC) -->

| Rota | admin | member | reader | Sem auth |
|------|:-----:|:------:|:------:|:--------:|
| `/login`, `/invite/:token` | redirect /dashboard | redirect /dashboard | redirect /dashboard | ✅ |
| `/setup`, `/setup/seed` | ✅ (se sem cluster) | — | — | — |
| `/recovery` | ✅ (se banco vazio) | — | — | — |
| `/dashboard` (galeria) | ✅ | ✅ | ✅ | redirect /login |
| `/dashboard/file/:id` | ✅ | ✅ | ✅ | redirect /login |
| Upload (ação) | ✅ | ✅ | ❌ | — |
| `/dashboard/nodes` | ✅ | ❌ redirect /dashboard | ❌ | redirect /login |
| `/dashboard/alerts` | ✅ | ❌ | ❌ | redirect /login |
| `/dashboard/members` | ✅ | ❌ | ❌ | redirect /login |
| `/dashboard/cluster` | ✅ | ❌ | ❌ | redirect /login |

> Para estrutura completa de rotas, (ver [07-routes.md](07-routes.md)).

---

## Proteção contra Vulnerabilidades

> Quais proteções estão implementadas?

| Vulnerabilidade | Proteção | Implementação |
|-----------------|----------|---------------|
| XSS (Cross-Site Scripting) | Auto-escape do React + CSP | React escapa output por padrão; CSP com nonce para scripts; sem `dangerouslySetInnerHTML`; nenhum HTML user-supplied |
| CSRF (Cross-Site Request Forgery) | SameSite cookie + origin validation | Cookie `SameSite=Strict` impede envio cross-origin; orquestrador valida header `Origin` |
| Clickjacking | X-Frame-Options + CSP frame-ancestors | `X-Frame-Options: DENY` via Caddy; CSP `frame-ancestors 'none'` |
| Injection (SQL, NoSQL) | Prisma type-safe + Zod validation | Frontend valida com Zod schemas; backend usa Prisma (parameterized queries); sem SQL raw |
| Open Redirect | Whitelist de redirect URLs | `returnUrl` validado contra whitelist de rotas internas; rejeitar URLs externas |
| Sensitive Data Exposure | Zero-knowledge + Server Components | Dados sensíveis nunca chegam ao browser; RSC fetch no servidor; seed phrase exibida uma única vez |
| Man-in-the-Middle | TLS 1.3 + HSTS | Caddy força HTTPS; HSTS max-age=31536000; includeSubDomains |
| Dependency Vulnerabilities | Audit + Dependabot | `pnpm audit` no CI; Dependabot para PRs automáticos; pin de versões major |

<!-- APPEND:vulnerabilidades -->

---

## Content Security Policy (CSP)

> O frontend aplica CSP via headers do Caddy e `next.config.js`.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https://{api-domain};
  font-src 'self';
  media-src 'self' blob:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

| Diretiva | Valor | Justificativa |
|----------|-------|---------------|
| `script-src` | `'self' 'nonce-{random}'` | Apenas scripts próprios com nonce; bloqueia inline scripts e eval |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind injeta estilos inline; necessário para CSS-in-JS |
| `img-src` | `'self' data: blob:` | Thumbnails do backend + blur placeholders (data:) + previews (blob:) |
| `connect-src` | `'self' https://{api-domain}` | Apenas requests para o orquestrador |
| `media-src` | `'self' blob:` | Vídeos 480p preview via blob URL |
| `frame-ancestors` | `'none'` | Impede embedding em iframes (clickjacking) |

### Headers de Segurança Adicionais (Caddy)

| Header | Valor |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## Segurança de Dados no Frontend

### Dados que o Frontend Acessa

| Dado | Como Chega | Sensibilidade | Proteção Client-Side |
|------|-----------|---------------|---------------------|
| Thumbnails (~50KB) | `next/image` via URL do orquestrador | Pessoal | TLS em trânsito; cache local do browser |
| Metadados de arquivo (nome, data, tipo) | TanStack Query (JSON) | Pessoal | Nunca persistido em localStorage; cache em memória (TanStack Query) |
| Dados EXIF (GPS, câmera) | TanStack Query no lightbox | PII | Exibido somente no detalhe; não indexado client-side |
| Seed phrase (12 palavras) | Resposta do POST /clusters (uma única vez) | Crítico | Exibido uma vez na tela; NUNCA armazenado no frontend; alerta para anotar em papel |
| Lista de membros (nome, email, role) | TanStack Query | PII | Cache em memória; acessível apenas por admin |
| JWT claims (member_id, role) | Cookie httpOnly (inacessível via JS) | Sensível | Middleware server-side extrai; Zustand armazena apenas `{ member, role }` (não o token) |

### O que NÃO Armazenar no Frontend

- Token JWT em texto puro (localStorage, sessionStorage, Zustand com persist)
- Seed phrase (nem em memória após sair da tela de setup)
- Credenciais S3/R2 (existem apenas no vault do orquestrador)
- Master key ou file keys (existem apenas na memória do orquestrador)
- Conteúdo de chunks descriptografados (download é stream direto)

---

## Checklist de Segurança

- [x] JWT armazenado em cookie httpOnly (nunca em localStorage)
- [x] Cookie com flags Secure + SameSite=Strict + Path=/
- [x] React auto-escape em todo output (sem dangerouslySetInnerHTML)
- [x] CSP header configurado com nonce para scripts
- [x] Headers de segurança (HSTS, X-Frame-Options, nosniff, Referrer-Policy)
- [x] HTTPS obrigatório (TLS 1.3 via Caddy)
- [x] Validação de inputs com Zod schemas (client + server)
- [x] Redirect URLs validadas contra whitelist
- [x] `pnpm audit` no CI pipeline
- [x] Dependabot habilitado para dependências npm
- [x] Seed phrase exibida uma única vez e nunca armazenada
- [x] Sem operações criptográficas no browser (zero-knowledge no orquestrador)
- [x] Role verificado server-side em cada request (middleware + NestJS Guard)
- [x] Rate limiting no orquestrador (100 req/min por membro)
- [x] Permissions-Policy desabilita camera/microphone/geolocation no browser

<!-- APPEND:checklist -->

> Para monitoramento de erros de segurança, (ver [12-observability.md](12-observability.md)).

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03-24 | Cookie httpOnly em vez de localStorage para JWT | Impede acesso via XSS; SameSite=Strict impede CSRF; alinhado com OWASP best practices |
| 2026-03-24 | Zero crypto no frontend | Simplicidade; toda criptografia no orquestrador; evita expor chaves no browser; alinhado com princípio "Orquestrador Descartável" |
| 2026-03-24 | CSP com nonce em vez de 'unsafe-inline' para scripts | Bloqueia inline script injection; nonce gerado por request pelo Caddy/Next.js |
| 2026-03-24 | Permissions-Policy restritiva | App não usa camera/mic/geolocation via browser; reduz superfície de ataque |
| 2026-03-24 | Seed phrase exibida uma vez sem opção de copiar | Forçar anotação manual; clipboard pode ser lido por extensões maliciosas |
