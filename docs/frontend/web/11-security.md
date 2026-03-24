# Seguranca

Define o modelo de seguranca do frontend, cobrindo autenticacao, protecao contra vulnerabilidades comuns (XSS, CSRF) e boas praticas de seguranca client-side. Seguranca no frontend e a primeira linha de defesa, mas nunca deve ser a unica — toda validacao deve ser replicada no backend.

---

## Modelo de Autenticacao

> Como o frontend gerencia autenticacao?

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | {{JWT / Session / OAuth 2.0 / outro}} |
| Armazenamento do token | {{Cookie httpOnly / localStorage / memoria}} |
| Refresh token strategy | {{Refresh automatico / Redirect para login}} |
| Expiracao | {{Tempo de expiracao do token}} |
| Logout | {{Limpar token + invalidar sessao no servidor}} |

<details>
<summary>Exemplo — Fluxo de autenticacao com Cookie httpOnly</summary>

```
1. Usuario submete credenciais no LoginForm
2. POST /api/auth/login → Backend valida credenciais
3. Backend retorna Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
4. Frontend recebe 200 OK (sem token no body)
5. Cookie e enviado automaticamente em requests subsequentes
6. Frontend redireciona para /dashboard
7. Em cada request, middleware verifica cookie automaticamente
```

</details>

---

## Protecao de Rotas

> Como rotas protegidas sao implementadas?

- Server-side: {{Middleware Next.js / API gateway}}
- Client-side: {{Auth context / route guard component}}
- Fallback: {{Redirect para /login com return URL}}

> Para estrutura completa de rotas, (ver 07-rotas.md).

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade | Protecao | Implementacao |
|-----------------|----------|---------------|
| XSS (Cross-Site Scripting) | Sanitizacao de inputs, escape de output | {{React auto-escape + DOMPurify para HTML dinamico}} |
| CSRF (Cross-Site Request Forgery) | CSRF tokens | {{Cookie SameSite=Strict + CSRF header}} |
| Clickjacking | X-Frame-Options | {{Header X-Frame-Options: DENY}} |
| Injection | Validacao de inputs | {{Zod schemas + server-side validation}} |
| Open Redirect | Validacao de URLs de redirect | {{Whitelist de dominios permitidos}} |
| Sensitive Data Exposure | Nao expor dados sensiveis no client | {{Server Components para dados sensiveis}} |

<!-- APPEND:vulnerabilidades -->

---

## Content Security Policy (CSP)

> O frontend aplica CSP?

{{Descreva a politica CSP ou indique que sera configurada}}

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{{random}}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' {{api-domain}};
  font-src 'self';
  frame-ancestors 'none';
```

---

## Checklist de Seguranca

- [ ] Tokens nunca expostos em localStorage (usar httpOnly cookies)
- [ ] Inputs sanitizados antes de renderizar HTML dinamico
- [ ] Headers de seguranca configurados (CSP, X-Frame-Options, HSTS)
- [ ] Dependencias auditadas regularmente (`npm audit`)
- [ ] Secrets nunca commitados no repositorio
- [ ] HTTPS obrigatorio em todos os ambientes
- [ ] Rate limiting configurado no API gateway
- [ ] Validacao de inputs duplicada no backend

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre seguranca}} | {{Justificativa}} |
