# Services

Define todos os services do backend — metodos, parametros, retorno, dependencias e fluxos detalhados. Esta e a camada de orquestracao de logica de negocio.

<!-- do blueprint: 07-critical_flows.md -->
<!-- do blueprint: 08-use_cases.md -->

> **Implementa:** [docs/blueprint/07-critical_flows.md](../blueprint/07-critical_flows.md) (fluxos criticos) e [docs/blueprint/08-use_cases.md](../blueprint/08-use_cases.md) (casos de uso).

---

## Convencoes de Services

> Quais regras se aplicam a todos os services?

- Services orquestram logica de negocio — NUNCA acessam banco diretamente (usam repositories)
- Services recebem DTOs e retornam entidades de dominio ou DTOs de response
- Toda operacao critica e executada dentro de `prisma.$transaction()`
- Services emitem eventos de dominio via EventBus apos operacoes bem-sucedidas
- Services nao conhecem HTTP — sem req/res, headers ou status codes
- Services nao tratam autenticacao — isso e responsabilidade dos guards/middlewares
- Erros de negocio sao lancados como domain exceptions tipadas (ver [09-errors.md](09-errors.md))

---

## Catalogo de Services

> Para cada service, documente responsabilidade, dependencias e metodos.

### ClusterService

**Responsabilidade:** Criacao de clusters familiares com identidade criptografica derivada de seed phrase BIP-39. Recuperacao completa do sistema a partir da seed phrase.

**Nao faz:** Nao gerencia membros (MemberService), nao lida com convites, nao armazena a seed phrase em texto plano.

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| ClusterRepository | Repository | Persistencia de clusters |
| MemberService | Service | Criacao do admin inicial do cluster |
| VaultService | Service | Criacao do vault do admin |
| CoreSDK (CryptoEngine) | Infrastructure | Geracao de chaves, derivacao BIP-39, SHA-256 |
| EventBus | Infrastructure | Emissao de ClusterCreated, ClusterRecovered |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| create(dto) | CreateClusterDTO { name, seedPhrase, adminName, adminEmail } | Cluster | Gera identidade criptografica, cria cluster, cria admin com vault, emite ClusterCreated |
| recover(seedPhrase) | string (12 palavras BIP-39) | Cluster | Reconstroi cluster a partir da seed — re-deriva chaves, reconecta nos, reindeza manifests |
| findById(id) | UUID | Cluster \| null | Busca cluster por ID interno |

---

### MemberService

**Responsabilidade:** Gerenciamento de membros do cluster — convites, aceite, listagem, remocao. Controla o ciclo de vida do membro desde o convite ate a remocao.

**Nao faz:** Nao cria clusters (ClusterService), nao gerencia permissoes granulares (PermissionService), nao envia emails diretamente (EmailService).

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| MemberRepository | Repository | CRUD de membros |
| InviteRepository | Repository | CRUD de convites |
| VaultService | Service | Criacao de vault pessoal do membro |
| EmailService | Service | Envio de email de convite e boas-vindas |
| EventBus | Infrastructure | Emissao de MemberJoined, MemberRemoved |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| createAdmin(clusterId, dto) | UUID, CreateAdminDTO { name, email } | Member | Cria membro admin durante criacao do cluster (chamado internamente) |
| invite(clusterId, dto) | UUID, InviteDTO { email, role } | Invite | Gera token de convite, envia email, emite InviteSent |
| acceptInvite(token, dto) | string, AcceptInviteDTO { name, password } | Member | Valida token, cria membro, cria vault, emite MemberJoined |
| findById(id) | UUID | Member \| null | Busca membro por ID |
| listByCluster(clusterId) | UUID | Member[] | Lista todos os membros de um cluster |
| remove(id) | UUID | void | Remove membro, revoga acesso ao vault, emite MemberRemoved |

---

### NodeService

**Responsabilidade:** Registro de nos de armazenamento, monitoramento de saude via heartbeat, ciclo de vida (active, draining, offline). Mantem o ConsistentHashRing atualizado.

**Nao faz:** Nao armazena chunks (StorageService), nao faz scrubbing ou auto-healing (HealthService), nao gerencia replicacao.

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| NodeRepository | Repository | CRUD de nos |
| StorageService | Service | Consulta de chunks por no para drain |
| ConsistentHashRing | Infrastructure | Atualizacao do anel de hash ao adicionar/remover nos |
| EventBus | Infrastructure | Emissao de NodeRegistered, NodeDrained, NodeOffline |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| register(clusterId, dto) | UUID, RegisterNodeDTO { name, endpoint, storageCapacity, region } | Node | Registra no, adiciona ao hash ring, emite NodeRegistered |
| heartbeat(nodeId) | UUID | void | Atualiza last_seen_at, recalcula latencia |
| drain(nodeId) | UUID | void | Inicia processo de drenagem — migra chunks, remove do ring, emite NodeDrained |
| findById(id) | UUID | Node \| null | Busca no por ID |
| listByCluster(clusterId) | UUID | Node[] | Lista nos de um cluster com status atual |

---

### FileService

**Responsabilidade:** Upload de arquivos (fotos, videos, documentos), listagem de galeria com paginacao por cursor, download com reassemblagem de chunks.

**Nao faz:** Nao faz chunking/criptografia (StorageService), nao processa midia (Media Worker via BullMQ), nao gerencia nos (NodeService).

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| FileRepository | Repository | CRUD de arquivos |
| PreviewRepository | Repository | CRUD de previews (thumbnails, video previews) |
| StorageService | Service | Distribuicao de chunks e reassemblagem |
| BullMQ queue | Infrastructure | Enfileiramento de jobs de processamento de midia |
| EventBus | Infrastructure | Emissao de FileUploaded, FileReady, FileError |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| upload(clusterId, memberId, file) | UUID, UUID, FileBuffer | File | Registra arquivo (status: processing), enfileira job de midia, retorna imediatamente |
| findById(id) | UUID | File \| null | Busca arquivo por ID com metadados e preview |
| listGallery(clusterId, cursor?, limit?) | UUID, string?, number? | PaginatedResult\<File\> | Lista arquivos do cluster com cursor-based pagination, ordenado por created_at desc |
| listByType(clusterId, type, cursor?, limit?) | UUID, FileType, string?, number? | PaginatedResult\<File\> | Filtra por tipo (photo, video, document) com paginacao |
| download(fileId) | UUID | ReadableStream | Reassembla chunks via StorageService, decripta e retorna stream |

---

### StorageService

**Responsabilidade:** Orquestracao do pipeline de armazenamento — chunking, criptografia envelope (master key -> file key -> AES-256-GCM), distribuicao via ConsistentHashRing com replicacao 3x, criacao de manifests assinados, re-replicacao de chunks.

**Nao faz:** Nao registra arquivos no banco (FileService), nao gerencia nos (NodeService), nao decide quando re-replicar (HealthService).

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| ChunkRepository | Repository | CRUD de chunks |
| ChunkReplicaRepository | Repository | CRUD de replicas de chunks |
| ManifestRepository | Repository | CRUD de manifests |
| CoreSDK (ChunkingEngine) | Infrastructure | Divisao de conteudo em blocos de ~4MB com SHA-256 |
| CoreSDK (CryptoEngine) | Infrastructure | Envelope encryption, AES-256-GCM, assinatura de manifests |
| CoreSDK (ConsistentHashRing) | Infrastructure | Selecao de nos destino para distribuicao |
| StorageProvider | Infrastructure | Interface unificada para S3/R2/B2/agentes locais |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| distributeChunks(file, optimizedContent) | File, Buffer | Chunk[] | Divide em chunks, dedup por hash, criptografa, distribui 3x, cria registros |
| reReplicateChunk(chunkId) | UUID | ChunkReplica | Copia chunk de replica saudavel para novo no selecionado via hash ring |
| reassembleFile(fileId) | UUID | ReadableStream | Le manifest, busca chunks dos nos, decripta, reassembla em stream |
| createManifest(file, chunks) | File, Chunk[] | Manifest | Cria manifest JSON com chunks_json + file_key_encrypted, assina com chave do cluster |

---

### HealthService

**Responsabilidade:** Monitoramento de saude do sistema — detecao de nos offline via heartbeat timeout, auto-healing de chunks sub-replicados, scrubbing periodico para validar integridade, garbage collection de chunks orfaos.

**Nao faz:** Nao registra nos (NodeService), nao distribui chunks novos (StorageService), nao envia emails diretamente (EmailService).

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| AlertRepository | Repository | CRUD de alertas |
| NodeRepository | Repository | Consulta de nos e seus heartbeats |
| ChunkReplicaRepository | Repository | Consulta de replicas por no e contagem de replicas |
| StorageService | Service | Re-replicacao de chunks sub-replicados |
| EmailService | Service | Notificacao de alertas criticos ao admin |
| EventBus | Infrastructure | Emissao de NodeLost, AutoHealComplete, ScrubComplete |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| checkHeartbeats() | — | void | Verifica nos com last_seen_at > threshold (5min), marca como offline, cria alerta, dispara autoHeal |
| autoHeal(nodeId) | UUID | void | Encontra chunks sub-replicados do no perdido, re-replica via StorageService, resolve alerta |
| scrub(batchSize) | number | ScrubResult | Verifica integridade de chunks via SHA-256 em lotes, cria alertas para corrompidos |
| garbageCollect() | — | GCResult | Remove chunks orfaos (sem referencia em manifests) e replicas de nos removidos |
| createAlert(data) | CreateAlertDTO | Alert | Cria alerta com severidade e metadata |
| resolveAlert(id) | UUID | Alert | Marca alerta como resolvido |

---

### EmailService

**Responsabilidade:** Envio de emails transacionais via Resend SDK. Abstrai templates e dados para cada tipo de email.

**Nao faz:** Nao decide quando enviar (quem decide e o service chamador), nao armazena historico de emails, nao faz retry (Resend SDK gerencia).

**Dependencias:**

| Dependencia | Tipo | Funcao |
| --- | --- | --- |
| Resend SDK | Infrastructure | API de envio de emails transacionais |

**Metodos:**

| Metodo | Parametros | Retorno | Descricao |
| --- | --- | --- | --- |
| sendInvite(data) | InviteEmailDTO { to, clusterName, inviterName, token } | void | Email de convite com link de aceite |
| sendWelcome(data) | WelcomeEmailDTO { to, memberName, clusterName } | void | Email de boas-vindas apos aceite |
| sendNodeLostAlert(data) | NodeLostEmailDTO { to, nodeName, clusterName, chunksAffected } | void | Alerta de no perdido ao admin |
| sendRecoveryComplete(data) | RecoveryEmailDTO { to, clusterName, nodesReconnected, filesReindexed } | void | Confirmacao de recovery completo |
| sendFileError(data) | FileErrorEmailDTO { to, fileName, errorType } | void | Notificacao de erro no processamento de arquivo |

<!-- APPEND:services -->

---

## Fluxos Detalhados

> Para cada metodo critico, descreva o fluxo passo-a-passo.

### ClusterService.create() — Fluxo Detalhado

<!-- do blueprint: 07-critical_flows.md (Recovery do Orquestrador via Seed Phrase) -->

```
1. Recebe CreateClusterDTO { name, seedPhrase, adminName, adminEmail }
2. Valida seed phrase — 12 palavras, vocabulario BIP-39 valido
3. Deriva master key a partir da seed phrase via CryptoEngine.deriveMasterKey(seedPhrase)
4. Gera par de chaves Ed25519 via CryptoEngine.generateKeypair(masterKey)
5. Calcula cluster_id = SHA-256(public_key) — identificador criptografico imutavel
6. Criptografa private_key com master key via AES-256-GCM
7. BEGIN TRANSACTION
8.   Chama ClusterRepository.create({ cluster_id, name, public_key, encrypted_private_key, status: 'active' })
9.   Chama MemberService.createAdmin(cluster.id, { name: adminName, email: adminEmail })
10.  Chama VaultService.create(cluster.id, admin.id, masterKey)
11. COMMIT
12. Emite evento ClusterCreated { clusterId, adminId } via EventBus
13. Retorna Cluster criado
```

**Transacao:** Sim — passos 8-10 dentro de `prisma.$transaction()`. Se qualquer passo falhar, rollback completo.
**Idempotencia:** cluster_id derivado da public_key e deterministico. Mesma seed phrase sempre gera mesmo cluster_id. Constraint UNIQUE em cluster_id previne duplicidade.

---

### MemberService.acceptInvite() — Fluxo Detalhado

```
1. Recebe token (string) e AcceptInviteDTO { name, password }
2. Chama InviteRepository.findByToken(token)
3. Se convite nao encontrado → lanca InviteNotFoundError
4. Verifica expires_at > now() — se expirado → lanca InviteExpiredError
5. Verifica invite.status === 'pending' — se ja aceito → lanca InviteAlreadyAcceptedError
6. Chama MemberRepository.findByEmail(invite.email, invite.cluster_id)
7. Se membro ja existe no cluster → lanca MemberAlreadyExistsError
8. Verifica contagem de membros no cluster < 10 (RN-C3)
9. BEGIN TRANSACTION
10.   Cria membro via MemberRepository.create({ cluster_id, name, email: invite.email, role: invite.role, status: 'active' })
11.   Cria vault pessoal via VaultService.create(cluster_id, member.id)
12.   Marca convite como aceito via InviteRepository.update(invite.id, { status: 'accepted', accepted_at: now() })
13. COMMIT
14. Emite evento MemberJoined { clusterId, memberId, role } via EventBus
15. Chama EmailService.sendWelcome({ to: invite.email, memberName: name, clusterName: cluster.name })
16. Retorna Member criado
```

**Transacao:** Sim — passos 10-12 dentro de `prisma.$transaction()`. Membro, vault e atualizacao do convite sao atomicos.
**Idempotencia:** Convite so pode ser aceito uma vez (status check no passo 5). Email unico por cluster previne duplicidade.

---

### NodeService.drain() — Fluxo Detalhado

<!-- do blueprint: 07-critical_flows.md -->

```
1. Recebe nodeId (UUID)
2. Chama NodeRepository.findById(nodeId)
3. Se no nao encontrado → lanca NodeNotFoundError
4. Verifica node.status === 'active' — se nao → lanca InvalidNodeStateError
5. Atualiza status para 'draining' via NodeRepository.updateStatus(nodeId, 'draining')
6. Lista todos os chunks no no via ChunkReplicaRepository.listByNode(nodeId)
7. Para cada chunk:
   a. Conta replicas ativas via ChunkReplicaRepository.countActiveReplicas(chunk.chunk_id)
   b. Se replicas < 3 → chama StorageService.reReplicateChunk(chunk.chunk_id)
   c. Remove replica do no via ChunkReplicaRepository.delete(replica.id)
8. Remove no do ConsistentHashRing
9. Atualiza status para 'removed' via NodeRepository.updateStatus(nodeId, 'removed')
10. Emite evento NodeDrained { nodeId, chunksRelocated } via EventBus
11. Retorna void
```

**Transacao:** Parcial — cada re-replicacao de chunk e uma transacao individual. O drain como um todo e idempotente (pode ser retomado se interrompido).
**Idempotencia:** Status 'draining' previne drain concorrente. Chunks ja re-replicados sao detectados pela contagem de replicas.

---

### HealthService.autoHeal() — Fluxo Detalhado

<!-- do blueprint: 07-critical_flows.md (Auto-healing) -->

```
1. Recebe nodeId (UUID) do no detectado como offline
2. Lista todos os chunks que tinham replica no no perdido via ChunkReplicaRepository.listByNode(nodeId)
3. Para cada chunk:
   a. Conta replicas ativas restantes via ChunkReplicaRepository.countActiveReplicas(chunk.chunk_id)
   b. Se replicas >= 3 → skip (ja tem replicas suficientes)
   c. Se replicas < 3 (sub-replicado):
      i.   Seleciona novo no destino via ConsistentHashRing (excluindo nos que ja tem replica)
      ii.  Busca replica saudavel de um no ativo
      iii. Chama StorageService.reReplicateChunk(chunk.chunk_id)
4. Marca replicas do no perdido como status 'lost' via ChunkReplicaRepository.updateByNode(nodeId, { status: 'lost' })
5. Resolve alerta do no via resolveAlert(alertId)
6. Emite evento AutoHealComplete { nodeId, chunksHealed, chunksAlreadyReplicated } via EventBus
7. Chama EmailService.sendRecoveryComplete({ ... }) para notificar admin
```

**Transacao:** Nao — cada re-replicacao e atomica individualmente. O processo completo e idempotente e pode ser executado multiplas vezes sem efeito colateral.
**Idempotencia:** Contagem de replicas ativas garante que chunks ja re-replicados nao sao processados novamente.

---

### StorageService.distributeChunks() — Fluxo Detalhado

<!-- do blueprint: 07-critical_flows.md (Upload e Distribuicao de Arquivo) -->

```
1. Recebe File (entidade) e optimizedContent (Buffer — conteudo ja otimizado pelo Media Worker)
2. Divide conteudo em chunks de ~4MB via ChunkingEngine.split(optimizedContent)
3. Calcula SHA-256 de cada chunk via ChunkingEngine.hash(chunk)
4. Para cada chunk — verifica deduplicacao:
   a. Chama ChunkRepository.findByHash(hash)
   b. Se hash existe → reutiliza chunk existente (cria referencia, nao rearmazena)
   c. Se hash novo → continua pipeline
5. Gera file key via envelope encryption: CryptoEngine.generateFileKey(masterKey)
6. Criptografa cada chunk novo com AES-256-GCM usando file key
7. Para cada chunk novo:
   a. Consulta ConsistentHashRing.getNodes(chunk.hash, replicationFactor: 3)
   b. Envia chunk criptografado para os 3 nos via StorageProvider.put(node, chunkData)
   c. Se no falha → seleciona proximo no no ring e retry
8. BEGIN TRANSACTION
9.   Cria registros em chunks para cada chunk novo
10.  Cria registros em chunk_replicas para cada replica (3 por chunk)
11. COMMIT
12. Chama createManifest(file, chunks) para gerar e armazenar manifest assinado
13. Retorna Chunk[] com todos os chunks (novos + dedup)
```

**Transacao:** Sim — passos 9-10 dentro de `prisma.$transaction()`. Registros de chunks e replicas sao atomicos. Se falhar, chunks ja enviados aos nos ficam orfaos (GC remove depois).
**Idempotencia:** Deduplicacao por SHA-256 garante que chunks identicos nao sao rearmazenados.

<!-- APPEND:fluxos -->

---

## Injecao de Dependencias

> Como os services recebem suas dependencias?

| Estrategia | Descricao |
| --- | --- |
| Constructor injection via NestJS | Dependencias injetadas via `@Injectable()` e decorators `@Inject()` no construtor |
| Module-scoped providers | Cada modulo NestJS (ClusterModule, MemberModule, etc.) registra seus services e repositories como providers |
| Token-based injection para infraestrutura | CoreSDK, StorageProvider e EventBus injetados via tokens customizados (`@Inject('CRYPTO_ENGINE')`, `@Inject('STORAGE_PROVIDER')`) |

```typescript
// Exemplo: ClusterService com injecao de dependencias
@Injectable()
export class ClusterService {
  constructor(
    private readonly clusterRepository: ClusterRepository,
    private readonly memberService: MemberService,
    private readonly vaultService: VaultService,
    @Inject('CRYPTO_ENGINE') private readonly cryptoEngine: CryptoEngine,
    private readonly eventBus: EventBus,
  ) {}
}
```

> (ver [07-controllers.md](07-controllers.md) para como controllers chamam os services)
> (ver [12-events.md](12-events.md) para detalhes dos eventos emitidos)
> (ver [04-data-layer.md](04-data-layer.md) para os repositories injetados)
