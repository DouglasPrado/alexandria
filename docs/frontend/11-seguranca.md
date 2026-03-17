# Seguranca

Define o modelo de seguranca do frontend, cobrindo autenticacao, protecao contra vulnerabilidades comuns (XSS, CSRF) e boas praticas de seguranca client-side. Seguranca no frontend e a primeira linha de defesa, mas nunca deve ser a unica — toda validacao deve ser replicada no backend.

---

## Modelo de Autenticacao

> Como o frontend gerencia autenticacao?

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | JWT assinado com chave Ed25519 do cluster (implementacao propria — sem IdP externo) |
| Armazenamento do token | Cookie httpOnly + Secure + SameSite=Strict (definido pelo backend via `Set-Cookie`) |
| Refresh token strategy | JWT re-emitido automaticamente pelo backend quando valido e proximo de expirar; frontend intercepta 401 e redireciona para /login se refresh falhar |
| Expiracao | 24 horas; re-emissao transparente antes da expiracao |
| Logout | DELETE /api/auth/logout → backend invalida sessao server-side + limpa cookie via `Set-Cookie: token=; Max-Age=0` |

### Fluxo de Autenticacao no Frontend

```
1. Admin gera token de convite (assinado Ed25519, expiracao 7d)
2. Membro acessa link /invite/:token
3. Frontend envia POST /api/auth/accept-invite { token }
4. Backend valida assinatura + expiracao do convite
5. Backend cria registro de membro com role configurada
6. Backend emite JWT { membro_id, cluster_id, role, exp }
7. Backend retorna Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict
8. Frontend recebe 200 OK (sem token no body — cookie gerenciado pelo browser)
9. Frontend redireciona para /dashboard
10. Cookie enviado automaticamente em todas as requests subsequentes
11. Middleware Axum valida JWT em cada request server-side
```

<!-- inferido do PRD -->
> **Nota:** Nao ha fluxo de login com senha — autenticacao e baseada em convites assinados e JWT. A seed phrase de 12 palavras e usada apenas para recovery do cluster, nunca como credencial de login.

---

## Protecao de Rotas

> Como rotas protegidas sao implementadas?

- **Server-side:** Middleware Next.js verifica cookie httpOnly em requests de Server Components e API routes; redireciona para `/login` se ausente ou invalido
- **Client-side:** `AuthProvider` context wrapper nos route groups `(protected)` e `(admin)` — verifica sessao via endpoint `/api/auth/me` no mount
- **Fallback:** Redirect para `/login?returnUrl=<rota-original>` preservando a URL de retorno

### Niveis de Protecao

| Nivel | Route Group | Verificacao | Exemplo de Rota |
|-------|------------|-------------|-----------------|
| Publico | `(public)` | Nenhuma | `/`, `/login`, `/invite/:token` |
| Protegido | `(protected)` | JWT valido (qualquer role) | `/dashboard`, `/files`, `/settings` |
| Admin | `(admin)` | JWT valido + role = `admin` | `/admin/nodes`, `/admin/members`, `/admin/alerts` |
| Leitura | `(protected)` | JWT valido + role >= `leitura` | `/gallery`, `/timeline` |

<!-- inferido do PRD -->
> **RBAC:** O frontend verifica roles para exibicao condicional de UI (botoes, menus), mas a **autorizacao real** acontece no backend via middleware Axum. O frontend nunca confia apenas no role do JWT decodificado client-side para operacoes criticas.

> Para estrutura completa de rotas, (ver 07-rotas.md).

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade | Protecao | Implementacao |
|-----------------|----------|---------------|
| XSS (Cross-Site Scripting) | Sanitizacao de inputs, escape de output | React auto-escape por padrao; DOMPurify para HTML dinamico (ex.: descricoes de arquivos com formatacao); nenhum uso de `dangerouslySetInnerHTML` sem sanitizacao |
| CSRF (Cross-Site Request Forgery) | Cookie SameSite + validacao de origin | Cookie `SameSite=Strict` previne envio cross-origin; backend valida header `Origin` em requests mutantes |
| Clickjacking | X-Frame-Options + CSP frame-ancestors | Header `X-Frame-Options: DENY`; CSP `frame-ancestors 'none'` — Alexandria nunca deve ser embutido em iframe |
| Injection | Validacao de inputs | Schemas Zod para validacao client-side antes de enviar; backend replica validacao server-side com mesmos schemas |
| Open Redirect | Validacao de URLs de redirect | `returnUrl` validado contra whitelist de paths internos (`/dashboard`, `/files`, etc.); URLs externas rejeitadas |
| Sensitive Data Exposure | Nao expor dados sensiveis no client | Server Components para dados de configuracao do cluster; seed phrase e vault nunca transitam para o browser; JWT nao acessivel via JavaScript (httpOnly) |
| Token/Credential Leak | Tokens OAuth e credenciais S3 nunca expostos ao frontend | Vault criptografado vive server-side; frontend recebe apenas status de conexao ("Google Drive: conectado"), nunca tokens ou credenciais |
| Seed Phrase Exposure | Seed exibida apenas uma vez no fluxo de criacao | Tela de exibicao da seed usa Server Component; nao persiste no state; instrucao clara para anotar offline; componente auto-limpa apos confirmacao |

<!-- APPEND:vulnerabilidades -->

---

## Content Security Policy (CSP)

> O frontend aplica CSP via headers configurados no Next.js (`next.config.js` ou middleware).

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{{random}}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self' https://*.alexandria.local;
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### Justificativas

| Diretiva | Motivo |
|----------|--------|
| `script-src 'nonce-...'` | Permite apenas scripts com nonce gerado por request; bloqueia inline scripts injetados |
| `img-src blob:` | Necessario para previews/thumbnails gerados client-side a partir de chunks descriptografados |
| `media-src blob:` | Necessario para streaming de video sob demanda via blob URLs |
| `connect-src` | Restringe requests AJAX/Fetch ao proprio dominio e API do orquestrador |
| `frame-ancestors 'none'` | Equivalente a X-Frame-Options DENY — previne clickjacking |

### Outros Headers de Seguranca

| Header | Valor | Motivo |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS — forca HTTPS por 2 anos |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Fallback para browsers sem suporte a CSP frame-ancestors |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita informacao de referrer em requests cross-origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Desabilita APIs de hardware nao utilizadas |

---

## Checklist de Seguranca

- [ ] Tokens JWT nunca expostos em localStorage (usar httpOnly cookies)
- [ ] Inputs sanitizados antes de renderizar HTML dinamico (DOMPurify)
- [ ] Headers de seguranca configurados (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- [ ] Dependencias auditadas regularmente (`npm audit` + Dependabot/Renovate)
- [ ] Secrets nunca commitados no repositorio (`.env` no `.gitignore`)
- [ ] HTTPS obrigatorio em todos os ambientes (HSTS preload)
- [ ] Rate limiting configurado no API gateway (Tower middleware + Caddy)
- [ ] Validacao de inputs duplicada no backend (schemas Zod compartilhados)
- [ ] Seed phrase exibida apenas uma vez e nunca persistida no frontend
- [ ] Vault e tokens OAuth nunca expostos ao browser — apenas status de conexao
- [ ] Role-based UI (botoes/menus condicionais) nunca substitui autorizacao server-side
- [ ] Cookie SameSite=Strict em todos os ambientes
- [ ] Nenhum uso de `dangerouslySetInnerHTML` sem sanitizacao previa
- [ ] CSP nonce rotacionado por request em producao

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | JWT em httpOnly cookie em vez de localStorage | Previne acesso via XSS; cookie gerenciado pelo browser automaticamente |
| 2026-03-17 | Autenticacao via convites assinados sem senha | Modelo do Alexandria e baseado em clusters familiares permissionados; seed phrase + convites eliminam necessidade de senhas |
| 2026-03-17 | CSP com nonce em vez de hash ou unsafe-inline para scripts | Nonce por request e mais seguro; compativel com Next.js Server Components |
| 2026-03-17 | Vault e tokens OAuth nunca expostos ao frontend | Principio de zero-knowledge; frontend recebe apenas status de conexao dos provedores cloud |
