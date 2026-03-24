# Permissoes

Define roles, permissoes, matriz de acesso por recurso e regras de ownership.

<!-- do blueprint: 13-security.md -->

---

## Modelo de Autorizacao

> Qual modelo de autorizacao o sistema usa?

| Aspecto | Decisao |
| --- | --- |
| Modelo | RBAC (Role-Based Access Control) com 3 roles fixos |
| Metodo de autenticacao | JWT assinado com cluster key (Ed25519) |
| Provedor | Implementacao propria — seed phrase gera cluster keys, cluster key assina JWTs |
| Onde verificar | `JwtAuthGuard` (autenticacao) + `RolesGuard` (autorizacao) no middleware NestJS |
| Multi-tenancy | Nao — single-tenant. Cada instancia do Alexandria serve 1 cluster familiar |

---

## Roles

> Quais perfis de acesso existem?

| Role | Descricao | Pode criar |
| --- | --- | --- |
| admin | Acesso total — cria cluster, convida/remove membros, registra/drena nos, upload/download, gerencia config, recovery, visualiza alertas | Tudo |
| member | Acesso de contribuidor — faz upload de arquivos, visualiza galeria, faz download, visualiza proprios uploads | Arquivos |
| reader | Somente leitura — visualiza galeria e faz download; NAO faz upload, NAO gerencia nada | Nada |

---

## Matriz de Permissoes por Recurso

> Quem pode fazer o que em cada recurso?

### Clusters

| Acao | admin | member | reader | Regra Especial |
| --- | --- | --- | --- | --- |
| GET /clusters/:id | Sim | Sim | Sim | Todos os membros do cluster |
| POST /clusters | Sim | Nao | Nao | Criacao inicial do cluster (primeiro admin) |
| POST /clusters/:id/recover | Sim | Nao | Nao | Recovery via seed phrase |

### Members

| Acao | admin | member | reader | Regra Especial |
| --- | --- | --- | --- | --- |
| GET /clusters/:id/members | Sim (todos) | Proprio perfil | Proprio perfil | member/reader so ve a si mesmo |
| POST /clusters/:id/invite | Sim | Nao | Nao | Gera token de convite assinado (Ed25519, expira 7d) |
| DELETE /members/:id | Sim | Nao | Nao | Admin nao pode remover a si mesmo se for o unico admin |

### Nodes

| Acao | admin | member | reader | Regra Especial |
| --- | --- | --- | --- | --- |
| GET /clusters/:id/nodes | Sim | Nao | Nao | Apenas admin ve status dos nos |
| POST /clusters/:id/nodes | Sim | Nao | Nao | Registrar novo no de armazenamento |
| POST /nodes/:id/heartbeat | -- | -- | -- | Autenticacao por node token (nao usa role de membro) |
| POST /nodes/:id/drain | Sim | Nao | Nao | Inicia drenagem — redistribui chunks para outros nos |

### Files

| Acao | admin | member | reader | Regra Especial |
| --- | --- | --- | --- | --- |
| GET /clusters/:id/files | Sim | Sim | Sim | Galeria do cluster — todos os membros |
| POST /clusters/:id/files/upload | Sim | Sim | Nao | reader nao pode fazer upload |
| GET /files/:id/download | Sim | Sim | Sim | Todos os membros podem baixar |

### Health e Alertas

| Acao | admin | member | reader | Regra Especial |
| --- | --- | --- | --- | --- |
| GET /clusters/:id/health | Sim | Nao | Nao | Status de saude do cluster (nos, replicacao) |
| GET /clusters/:id/alerts | Sim | Nao | Nao | Alertas ativos (nos offline, replicacao baixa) |

### Health Checks (Publicos)

| Acao | Autenticacao | Descricao |
| --- | --- | --- |
| GET /health/live | Nenhuma (publico) | Liveness probe — API esta respondendo |
| GET /health/ready | Nenhuma (publico) | Readiness probe — PostgreSQL e Redis conectados |

---

## Regras de Ownership

> Quais recursos pertencem a um membro e como o acesso e controlado?

| Recurso | Owner Field | Regra |
| --- | --- | --- |
| File | `uploaded_by` (member_id) | Member ve seus proprios uploads + galeria do cluster; admin ve tudo |
| Node | `owner_id` (member_id) | Apenas admin gerencia nos (registrar, drenar, visualizar status) |
| Vault | `member_id` | Cada membro acessa apenas seu proprio vault criptografado (credenciais de provedores cloud) |

---

## Token e Claims

> Quais informacoes o token JWT carrega?

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "clusterId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "role": "admin",
  "iat": 1711288200,
  "exp": 1711374600,
  "iss": "alexandria"
}
```

| Claim | Tipo | Descricao |
| --- | --- | --- |
| sub | UUID | ID do membro autenticado |
| clusterId | UUID | ID do cluster ao qual o membro pertence |
| role | enum | `admin`, `member` ou `reader` |
| iat | number | Timestamp Unix de emissao |
| exp | number | Timestamp Unix de expiracao (iat + 24h) |
| iss | string | Issuer fixo: `alexandria` |

| Tipo de Token | Expiracao | Armazenamento | Uso |
| --- | --- | --- | --- |
| Access Token | 24h | httpOnly cookie (flag `Secure` em producao, `SameSite=Strict`) | Enviado automaticamente em cada request |

**Nota:** Na v1 nao ha refresh token. Quando o JWT esta proximo da expiracao e ainda valido, o servidor emite um novo JWT automaticamente (sliding session).

> (ver [12-events.md](12-events.md) para eventos e mensageria)
