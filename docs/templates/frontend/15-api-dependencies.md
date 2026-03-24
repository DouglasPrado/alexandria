# Dependencias de API

Define quais endpoints do backend o frontend consome, quais campos utiliza e o impacto de mudancas na API.

---

## Mapa de Dependencias

> Lista TODOS os endpoints que o frontend consome, agrupados por feature.

### {{Feature}} (ex: Autenticacao)

| Endpoint Backend | Metodo | Usado em (Pagina/Component) | Campos Consumidos | Frequencia |
| --- | --- | --- | --- | --- |
| {{/api/v1/auth/login}} | {{POST}} | {{LoginPage, AuthProvider}} | {{accessToken, refreshToken, user.id, user.role}} | {{Por login}} |
| {{/api/v1/auth/refresh}} | {{POST}} | {{AuthProvider (automatico)}} | {{accessToken}} | {{A cada 15min}} |
| {{/api/v1/users/me}} | {{GET}} | {{ProfilePage, Sidebar, Header}} | {{id, name, email, role, avatarUrl}} | {{No mount + cache}} |

<!-- APPEND:dependencias -->

---

## Campos Criticos por Endpoint

> Para cada endpoint, quais campos o frontend DEPENDE e o que quebra se forem removidos.

| Endpoint | Campo | Componentes que Usam | Impacto se Removido |
| --- | --- | --- | --- |
| {{GET /users/me}} | {{name}} | {{Header, Sidebar, ProfilePage}} | {{Nome nao aparece em 3 locais}} |
| {{GET /users/me}} | {{role}} | {{AuthProvider, RouteGuard}} | {{Rotas protegidas param de funcionar}} |
| {{GET /orders}} | {{status}} | {{OrderList, OrderBadge}} | {{Badges de status ficam vazios}} |
| {{POST /orders}} | {{response.id}} | {{Redirect apos criacao}} | {{Nao consegue redirecionar para detalhe}} |

<!-- APPEND:campos-criticos -->

---

## Contratos de Paginacao

> Qual formato de paginacao o frontend espera?

```json
{
  "data": [],
  "meta": {
    "total": {{number}},
    "page": {{number}},
    "limit": {{number}},
    "pages": {{number}}
  }
}
```

**Parametros de query:**
- `?page=1&limit=20` — paginacao
- `?sort=created_at&order=desc` — ordenacao
- `?search=texto` — busca
- `?status=active` — filtros

---

## Cache Strategy por Endpoint

> Quais endpoints sao cacheados no frontend?

| Endpoint | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| {{GET /users/me}} | {{stale-while-revalidate}} | {{5min}} | {{Apos PATCH /users/me}} |
| {{GET /products}} | {{cache-first}} | {{10min}} | {{Apos mutacao em products}} |
| {{GET /orders}} | {{network-first}} | {{1min}} | {{Polling ou WebSocket}} |
| {{POST /auth/login}} | {{no-cache}} | {{—}} | {{—}} |

<!-- APPEND:cache -->

---

## Checklist de Validacao

> Antes de lancar uma feature, verificar:

- [ ] Todos os endpoints listados estao implementados no backend
- [ ] Todos os campos consumidos existem no response
- [ ] Formato de paginacao esta consistente
- [ ] Erros de cada endpoint estao mapeados em `docs/shared/error-ux-mapping.md`
- [ ] Cache strategy esta definida
- [ ] Rate limit do endpoint esta dentro do aceitavel para a UX

> Referenciado por:
> - `docs/backend/05-api-contracts.md` (fonte dos contratos)
> - `docs/frontend/06-data-layer.md` (implementacao do client)
> - `docs/shared/error-ux-mapping.md` (tratamento de erros)
