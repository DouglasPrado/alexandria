# Controllers

<!-- do blueprint: 08-use_cases.md -->

Define todos os controllers do backend — metodos, rotas, entrada/saida, delegacao para services e formatacao de response.

> **Consumido por:** [05-api-contracts.md](05-api-contracts.md) (contratos detalhados de cada endpoint).
> **Pipeline pre-controller:** [08-middlewares.md](08-middlewares.md) (Guards, Pipes, Interceptors que executam antes).

---

## Convencoes de Controllers

> Quais regras se aplicam a todos os controllers?

- Controllers recebem HTTP requests e delegam para services — sao a camada de apresentacao
- Controllers NAO contem logica de negocio — toda regra vive em services
- Controllers NUNCA acessam repositories diretamente — apenas services
- Controllers sao responsaveis por: parse de parametros, chamar service, formatar response
- Cada controller mapeia para um recurso/dominio unico
- Decorators NestJS usados: `@Controller`, `@Get`, `@Post`, `@Delete`, `@Patch`, `@UseGuards`, `@UsePipes`
- Todos os controllers (exceto `HealthController` e rotas publicas) sao protegidos por `JwtAuthGuard`
- Rotas que exigem admin usam `@Roles('admin')` + `RolesGuard`
- Validacao de DTOs via `ValidationPipe` com `class-validator` (whitelist + forbidNonWhitelisted)
- Porta da aplicacao: **3333** — sem versionamento de API (base path: `/api`)

---

## Catalogo de Controllers

> Para cada controller, documente responsabilidade, dependencias e metodos.

### AuthController

<!-- do blueprint: 08-use_cases.md -->

**Responsabilidade:** Autenticacao de membros — login e refresh de tokens JWT.

**Dependencias:** `AuthService`

**Metodos:**

| Metodo      | Rota                | HTTP | Recebe                  | Chama                        | Response                                                              |
| ----------- | ------------------- | ---- | ----------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `login()`   | `/api/auth/login`   | POST | Body: `LoginDTO`        | `AuthService.login(dto)`     | 200 + `{ member, accessToken }` — seta cookie `access_token` httpOnly |
| `refresh()` | `/api/auth/refresh` | POST | Cookie: `refresh_token` | `AuthService.refresh(token)` | 200 + `{ accessToken }`                                               |

**Guards:** Nenhum — ambas as rotas sao publicas.

**Registro de rotas (NestJS):**

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDTO, @Res() res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400000, // 24h
    });
    return res.json(toLoginResponse(result));
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const token = req.cookies['refresh_token'];
    return this.authService.refresh(token);
  }
}
```

---

### ClusterController

<!-- do blueprint: 08-use_cases.md (UC-001, UC-007) -->

**Responsabilidade:** Gerencia o ciclo de vida do cluster familiar — criacao, consulta e recovery via seed phrase.

**Dependencias:** `ClusterService`

**Metodos:**

| Metodo       | Rota                         | HTTP | Recebe                                  | Chama                                   | Response                                |
| ------------ | ---------------------------- | ---- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `create()`   | `/api/clusters`              | POST | Body: `CreateClusterDTO`                | `ClusterService.create(dto)`            | 201 + `{ cluster, member, seedPhrase }` |
| `findById()` | `/api/clusters/:id`          | GET  | Params: `id`                            | `ClusterService.findById(id, memberId)` | 200 + `ClusterResponseDTO`              |
| `recover()`  | `/api/clusters/:id/recovery` | POST | Params: `id`, Body: `RecoverClusterDTO` | `ClusterService.recover(id, dto)`       | 200 + recovery status                   |

**Guards:**

- `create()` — publica (cria o primeiro admin junto com o cluster)
- `findById()` — `JwtAuthGuard` + `ClusterMemberGuard` (membro deve pertencer ao cluster)
- `recover()` — publica (seed phrase e a autenticacao)

**Registro de rotas (NestJS):**

```typescript
@Controller('clusters')
export class ClusterController {
  constructor(private readonly clusterService: ClusterService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateClusterDTO) {
    const result = await this.clusterService.create(dto);
    return toClusterCreatedResponse(result);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ClusterMemberGuard)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() member: Member) {
    const cluster = await this.clusterService.findById(id, member.id);
    return toClusterResponse(cluster);
  }

  @Post(':id/recovery')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async recover(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecoverClusterDTO) {
    const result = await this.clusterService.recover(id, dto);
    return toRecoveryResponse(result);
  }
}
```

---

### MemberController

<!-- do blueprint: 08-use_cases.md (UC-002) -->

**Responsabilidade:** Gerencia membros do cluster — convites, listagem e remocao.

**Dependencias:** `MemberService`

**Metodos:**

| Metodo           | Rota                                  | HTTP   | Recebe                                     | Chama                                        | Response                                              |
| ---------------- | ------------------------------------- | ------ | ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| `createInvite()` | `/api/clusters/:id/invites`           | POST   | Params: `id`, Body: `CreateInviteDTO`      | `MemberService.createInvite(clusterId, dto)` | 201 + `{ id, token, inviteUrl, expiresAt, role }`     |
| `acceptInvite()` | `/api/invites/:token/accept`          | POST   | Params: `token`, Body: `AcceptInviteDTO`   | `MemberService.acceptInvite(token, dto)`     | 201 + `{ member, accessToken }`                       |
| `list()`         | `/api/clusters/:id/members`           | GET    | Params: `id`, Query: `CursorPaginationDTO` | `MemberService.list(clusterId, filters)`     | 200 + `CursorPaginatedResponseDTO<MemberResponseDTO>` |
| `remove()`       | `/api/clusters/:id/members/:memberId` | DELETE | Params: `id`, `memberId`                   | `MemberService.remove(clusterId, memberId)`  | 204                                                   |

**Guards:**

- `createInvite()` — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`
- `acceptInvite()` — publica (token do convite e a autenticacao)
- `list()` — `JwtAuthGuard` + `ClusterMemberGuard`
- `remove()` — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`

**Registro de rotas (NestJS):**

```typescript
@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post('clusters/:id/invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createInvite(@Param('id', ParseUUIDPipe) clusterId: string, @Body() dto: CreateInviteDTO) {
    const invite = await this.memberService.createInvite(clusterId, dto);
    return toInviteResponse(invite);
  }

  @Post('invites/:token/accept')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async acceptInvite(@Param('token') token: string, @Body() dto: AcceptInviteDTO) {
    const result = await this.memberService.acceptInvite(token, dto);
    return toMemberCreatedResponse(result);
  }

  @Get('clusters/:id/members')
  @UseGuards(JwtAuthGuard, ClusterMemberGuard)
  async list(@Param('id', ParseUUIDPipe) clusterId: string, @Query() query: CursorPaginationDTO) {
    const result = await this.memberService.list(clusterId, query);
    return toPaginatedResponse(result.data.map(toMemberResponse), result.meta);
  }

  @Delete('clusters/:id/members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) clusterId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.memberService.remove(clusterId, memberId);
  }
}
```

---

### NodeController

<!-- do blueprint: 08-use_cases.md (UC-003, UC-006) -->

**Responsabilidade:** Gerencia nos de armazenamento — registro, listagem, drain e remocao.

**Dependencias:** `NodeService`

**Metodos:**

| Metodo       | Rota                   | HTTP   | Recebe                                   | Chama                                  | Response                                               |
| ------------ | ---------------------- | ------ | ---------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `register()` | `/api/nodes`           | POST   | Body: `RegisterNodeDTO`                  | `NodeService.register(dto, clusterId)` | 201 + `NodeResponseDTO`                                |
| `list()`     | `/api/nodes`           | GET    | Query: `CursorPaginationDTO` + `status?` | `NodeService.list(clusterId, filters)` | 200 + `CursorPaginatedResponseDTO<NodeResponseDTO>`    |
| `drain()`    | `/api/nodes/:id/drain` | POST   | Params: `id`                             | `NodeService.drain(id, clusterId)`     | 202 + `{ id, status, chunksToMigrate, estimatedTime }` |
| `remove()`   | `/api/nodes/:id`       | DELETE | Params: `id`                             | `NodeService.remove(id, clusterId)`    | 204                                                    |

**Guards:**

- `register()` — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`
- `list()` — `JwtAuthGuard`
- `drain()` — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`
- `remove()` — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`

**Registro de rotas (NestJS):**

```typescript
@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() dto: RegisterNodeDTO, @CurrentMember() member: Member) {
    const node = await this.nodeService.register(dto, member.clusterId);
    return toNodeResponse(node);
  }

  @Get()
  async list(@CurrentMember() member: Member, @Query() query: CursorPaginationDTO) {
    const result = await this.nodeService.list(member.clusterId, query);
    return toPaginatedResponse(result.data.map(toNodeResponse), result.meta);
  }

  @Post(':id/drain')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.ACCEPTED)
  async drain(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() member: Member) {
    const result = await this.nodeService.drain(id, member.clusterId);
    return toDrainResponse(result);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() member: Member) {
    await this.nodeService.remove(id, member.clusterId);
  }
}
```

---

### FileController

<!-- do blueprint: 08-use_cases.md (UC-004, UC-005, UC-010) -->

**Responsabilidade:** Gerencia upload, listagem, consulta, download e preview de arquivos.

**Dependencias:** `FileService`

**Metodos:**

| Metodo       | Rota                      | HTTP | Recebe                                                                | Chama                                                     | Response                                                  |
| ------------ | ------------------------- | ---- | --------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `upload()`   | `/api/files/upload`       | POST | Multipart: `file` (binary) + `metadata?` (JSON)                       | `FileService.upload(file, metadata, clusterId, memberId)` | 202 + `FileResponseDTO` (status: processing)              |
| `list()`     | `/api/files`              | GET  | Query: `ListFilesQueryDTO` (cursor, limit, mediaType, status, search) | `FileService.list(clusterId, filters)`                    | 200 + `CursorPaginatedResponseDTO<FileResponseDTO>`       |
| `findById()` | `/api/files/:id`          | GET  | Params: `id`                                                          | `FileService.findById(id, clusterId)`                     | 200 + `FileDetailResponseDTO`                             |
| `download()` | `/api/files/:id/download` | GET  | Params: `id`                                                          | `FileService.download(id, clusterId)`                     | 200 + stream binario (Content-Disposition: attachment)    |
| `preview()`  | `/api/files/:id/preview`  | GET  | Params: `id`                                                          | `FileService.getPreview(id, clusterId)`                   | 200 + stream binario (thumbnail WebP, Cache-Control: 24h) |

**Guards:**

- `upload()` — `JwtAuthGuard` + role `admin` ou `member` (readers nao podem fazer upload)
- `list()`, `findById()`, `download()`, `preview()` — `JwtAuthGuard`

**Registro de rotas (NestJS):**

```typescript
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
    }),
  )
  @HttpCode(HttpStatus.ACCEPTED)
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: ALLOWED_MIME_TYPES })],
      }),
    )
    file: Express.Multer.File,
    @Body('metadata') metadata: string,
    @CurrentMember() member: Member,
  ) {
    const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
    const result = await this.fileService.upload(file, parsedMetadata, member.clusterId, member.id);
    return toFileResponse(result);
  }

  @Get()
  async list(@CurrentMember() member: Member, @Query() query: ListFilesQueryDTO) {
    const result = await this.fileService.list(member.clusterId, query);
    return toPaginatedResponse(result.data.map(toFileResponse), result.meta);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() member: Member) {
    const file = await this.fileService.findById(id, member.clusterId);
    return toFileDetailResponse(file);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: Member,
    @Res() res: Response,
  ) {
    const { stream, filename, mimeType, size } = await this.fileService.download(
      id,
      member.clusterId,
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': size,
    });
    stream.pipe(res);
  }

  @Get(':id/preview')
  async preview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: Member,
    @Res() res: Response,
  ) {
    const { stream, size } = await this.fileService.getPreview(id, member.clusterId);
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': size,
      'Cache-Control': 'public, max-age=86400',
    });
    stream.pipe(res);
  }
}
```

---

### AlertController

<!-- do blueprint: 08-use_cases.md (UC-008) -->

**Responsabilidade:** Gerencia alertas do cluster — listagem e resolucao.

**Dependencias:** `AlertService`

**Metodos:**

| Metodo      | Rota                      | HTTP  | Recebe                                   | Chama                                   | Response                                             |
| ----------- | ------------------------- | ----- | ---------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `list()`    | `/api/alerts`             | GET   | Query: `CursorPaginationDTO` + `status?` | `AlertService.list(clusterId, filters)` | 200 + `CursorPaginatedResponseDTO<AlertResponseDTO>` |
| `resolve()` | `/api/alerts/:id/resolve` | PATCH | Params: `id`                             | `AlertService.resolve(id, clusterId)`   | 200 + `{ id, status, resolvedAt }`                   |

**Guards:** Ambos — `JwtAuthGuard` + `@Roles('admin')` + `RolesGuard`

**Registro de rotas (NestJS):**

```typescript
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  async list(@CurrentMember() member: Member, @Query() query: CursorPaginationDTO) {
    const result = await this.alertService.list(member.clusterId, query);
    return toPaginatedResponse(result.data.map(toAlertResponse), result.meta);
  }

  @Patch(':id/resolve')
  async resolve(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() member: Member) {
    const alert = await this.alertService.resolve(id, member.clusterId);
    return toAlertResponse(alert);
  }
}
```

---

### HealthController

<!-- do blueprint: 15-observability.md -->

**Responsabilidade:** Health checks para infraestrutura — liveness e readiness probes usadas por load balancers e orquestradores.

**Dependencias:** `HealthService` (apenas para readiness)

**Metodos:**

| Metodo    | Rota            | HTTP | Recebe | Chama                   | Response                                       |
| --------- | --------------- | ---- | ------ | ----------------------- | ---------------------------------------------- |
| `live()`  | `/health/live`  | GET  | —      | —                       | 200 + `{ status: "ok" }`                       |
| `ready()` | `/health/ready` | GET  | —      | `HealthService.check()` | 200 + `{ status, checks }` ou 503 se degradado |

**Guards:** Nenhum — ambas as rotas sao publicas e NAO possuem prefixo `/api`.

**Registro de rotas (NestJS):**

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  async live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(@Res() res: Response) {
    const result = await this.healthService.check();
    const status = result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(status).json(result);
  }
}
```

---

## Registro de Rotas — Visao Geral

> Mapa consolidado de todas as rotas, controller e guards aplicados.

| Rota                                  | HTTP   | Controller.metodo               | Auth    | Role              |
| ------------------------------------- | ------ | ------------------------------- | ------- | ----------------- |
| `/api/auth/login`                     | POST   | `AuthController.login`          | Publica | —                 |
| `/api/auth/refresh`                   | POST   | `AuthController.refresh`        | Cookie  | —                 |
| `/api/clusters`                       | POST   | `ClusterController.create`      | Publica | —                 |
| `/api/clusters/:id`                   | GET    | `ClusterController.findById`    | JWT     | membro do cluster |
| `/api/clusters/:id/recovery`          | POST   | `ClusterController.recover`     | Publica | —                 |
| `/api/clusters/:id/invites`           | POST   | `MemberController.createInvite` | JWT     | admin             |
| `/api/invites/:token/accept`          | POST   | `MemberController.acceptInvite` | Publica | —                 |
| `/api/clusters/:id/members`           | GET    | `MemberController.list`         | JWT     | membro do cluster |
| `/api/clusters/:id/members/:memberId` | DELETE | `MemberController.remove`       | JWT     | admin             |
| `/api/nodes`                          | POST   | `NodeController.register`       | JWT     | admin             |
| `/api/nodes`                          | GET    | `NodeController.list`           | JWT     | membro do cluster |
| `/api/nodes/:id/drain`                | POST   | `NodeController.drain`          | JWT     | admin             |
| `/api/nodes/:id`                      | DELETE | `NodeController.remove`         | JWT     | admin             |
| `/api/files/upload`                   | POST   | `FileController.upload`         | JWT     | admin, member     |
| `/api/files`                          | GET    | `FileController.list`           | JWT     | membro do cluster |
| `/api/files/:id`                      | GET    | `FileController.findById`       | JWT     | membro do cluster |
| `/api/files/:id/download`             | GET    | `FileController.download`       | JWT     | membro do cluster |
| `/api/files/:id/preview`              | GET    | `FileController.preview`        | JWT     | membro do cluster |
| `/api/alerts`                         | GET    | `AlertController.list`          | JWT     | admin             |
| `/api/alerts/:id/resolve`             | PATCH  | `AlertController.resolve`       | JWT     | admin             |
| `/health/live`                        | GET    | `HealthController.live`         | Publica | —                 |
| `/health/ready`                       | GET    | `HealthController.ready`        | Publica | —                 |

---

## Serializers / Response Formatters

> Como responses sao formatadas antes de enviar ao cliente?

<!-- do blueprint: 13-security.md -->

| Funcao                            | Entrada                 | Saida                           | Remove                                                                                            |
| --------------------------------- | ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `toClusterResponse(cluster)`      | Cluster entity          | `ClusterResponseDTO`            | `encrypted_private_key`, `public_key` (bytes brutos), `seedPhrase` (apos criacao)                 |
| `toMemberResponse(member)`        | Member entity           | `MemberResponseDTO`             | `passwordHash`, `vaultKey`                                                                        |
| `toNodeResponse(node)`            | Node entity             | `NodeResponseDTO`               | `accessKey`, `secretKey`                                                                          |
| `toFileResponse(file)`            | File entity             | `FileResponseDTO`               | `fileKey`, `chunkHashes` — inclui `previewUrl` calculado                                          |
| `toFileDetailResponse(file)`      | File entity + relations | `FileDetailResponseDTO`         | `fileKey` — inclui `hash`, `chunksCount`, `replicationFactor`, `uploadedBy`                       |
| `toAlertResponse(alert)`          | Alert entity            | `AlertResponseDTO`              | —                                                                                                 |
| `toInviteResponse(invite)`        | Invite entity           | `InviteResponseDTO`             | Token interno — retorna apenas `inviteUrl` pre-montada                                            |
| `toPaginatedResponse(data, meta)` | Array + cursor meta     | `CursorPaginatedResponseDTO<T>` | — (envelope padrao: `{ data: T[], meta: { cursor, hasMore } }`)                                   |
| `toErrorResponse(error)`          | AppError                | `ErrorResponseDTO`              | Stack trace em producao — mantem `code`, `message`, `status`, `details`, `requestId`, `timestamp` |

**Regras dos serializers:**

- Serializers sao funcoes puras — sem side effects, sem acesso a banco
- Nunca retornam campos com dados criptografados ou credenciais
- `previewUrl` em `toFileResponse` e montado como `/api/files/:id/preview`
- Em ambiente de desenvolvimento, `toErrorResponse` inclui stack trace para debug

---

## Decorator Customizado: @CurrentMember

> Como o controller acessa o membro autenticado?

O decorator `@CurrentMember()` extrai o membro do request apos o `JwtAuthGuard` popular `request.user`:

```typescript
export const CurrentMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Member => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

Usado em todos os controllers que precisam do `clusterId` ou `memberId` do usuario autenticado.

---

## Guard Customizado: ClusterMemberGuard

> Como garantir que o membro pertence ao cluster da rota?

```typescript
@Injectable()
export class ClusterMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const member = request.user;
    const clusterId = request.params.id || request.params.clusterId;
    if (member.clusterId !== clusterId) {
      throw new ForbiddenException('Sem permissao para este cluster');
    }
    return true;
  }
}
```

Aplicado em rotas que recebem `:id` de cluster no path e precisam verificar pertencimento.

> (ver [08-middlewares.md](08-middlewares.md) para o pipeline completo que executa antes dos controllers)
