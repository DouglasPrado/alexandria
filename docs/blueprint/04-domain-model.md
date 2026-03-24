# Modelo de Domínio

O modelo de domínio representa as entidades centrais do sistema, suas responsabilidades e como se relacionam entre si. Ele serve como a **linguagem compartilhada** entre equipe técnica e stakeholders, garantindo que todos falem o mesmo idioma ao discutir o produto.

> O modelo de domínio NÃO é o modelo de dados. Aqui focamos no **comportamento e nas regras de negócio**, não na estrutura de armazenamento.

---

## Glossário Ubíquo

> Quais termos do domínio precisam de definição clara para evitar ambiguidade?
> **Fonte unica de termos:** [docs/shared/glossary.md](../shared/glossary.md). Ao preencher esta secao, atualize tambem o glossario compartilhado.

| Termo | Definição |
|-------|-----------|
| Cluster | Grupo familiar com identidade criptográfica; unidade raiz que agrupa membros, nós, arquivos e alertas |
| Member | Pessoa que pertence a um cluster com role específica (admin, member, reader) |
| Node | Dispositivo físico ou conta cloud que armazena chunks criptografados |
| File | Arquivo de mídia (foto, vídeo) ou documento enviado ao sistema e processado pelo pipeline |
| Preview | Representação leve de um arquivo para exibição no cliente; não permite download do conteúdo original |
| Manifest | Mapa de reconstituição de um arquivo — lista ordenada de chunks + file key criptografada + assinatura |
| Chunk | Bloco de ~4MB de dados criptografados com AES-256-GCM; endereçado por SHA-256 do conteúdo |
| Replica | Cópia de um chunk armazenada em um nó específico; mínimo 3 réplicas por chunk |
| Vault | Cofre criptografado individual por membro; vault do admin contém config do cluster e credenciais de nós |
| Alert | Notificação de condição anômala no cluster gerada automaticamente pelo Scheduler |
| Invite | Convite para ingresso no cluster via token assinado com expiração |
| Seed Phrase | 12 palavras BIP-39 que derivam a master key; única forma de recovery do sistema |
| Master Key | Chave raiz derivada da seed phrase via PBKDF2/scrypt; nunca armazenada em texto puro |
| File Key | Chave de criptografia por arquivo, derivada da master key via envelope encryption |
| Envelope Encryption | Hierarquia criptográfica: seed → master key → file key → chunk encryption (AES-256-GCM) |
| Content-Addressable Storage | Endereçamento de chunks pelo hash SHA-256 do conteúdo; permite deduplicação |
| Consistent Hashing | Algoritmo que distribui chunks entre nós proporcionalmente à capacidade; minimiza redistribuição quando nós entram/saem |
| Scrubbing | Verificação periódica de integridade — recalcula SHA-256 de cada réplica e compara com chunk_id |
| Auto-Healing | Re-replicação automática de chunks quando um nó é perdido, para restaurar fator 3x |
| Drain | Migração de todos os chunks de um nó antes da sua remoção; garante que replicação 3x seja mantida |
| Heartbeat | Sinal periódico enviado por nós ao orquestrador; ausência por 30min → suspect, 1h → lost |
| Pipeline de Mídia | Fluxo de processamento: upload → análise → otimização → preview → chunk → criptografia → distribuição |
| Placeholder | Thumbnail local que substitui arquivo completo no dispositivo; download sob demanda quando necessário |
| StorageProvider | Interface unificada (put/get/exists/delete/list/capacity) para comunicação com qualquer tipo de nó |

<!-- APPEND:glossary -->

---

## Entidades

> Quais são os conceitos centrais que o sistema precisa representar? Cada entidade deve ter identidade própria e ciclo de vida bem definido.

### Cluster

**Descrição:** Unidade raiz do sistema — representa uma família. Possui identidade criptográfica derivada de uma seed phrase de 12 palavras. Agrupa membros, nós, arquivos e alertas.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| cluster_id | String | Sim | SHA-256 da public_key; identificador único e imutável |
| name | String | Sim | Nome do cluster (ex.: "Família Prado") |
| public_key | Bytes | Sim | Chave pública do cluster para verificação de assinaturas |
| encrypted_private_key | Bytes | Sim | Chave privada criptografada com master key |
| status | Enum | Sim | Estado do cluster: `active`, `suspended` |
| created_at | DateTime | Sim | Data de criação |

**Regras de Negócio:**

- **RN-C1:** `cluster_id = SHA-256(public_key)` — imutável após criação; identidade criptográfica do grupo familiar
- **RN-C2:** Seed phrase de 12 palavras (BIP-39) gera master key que deriva todas as chaves do cluster via envelope encryption
- **RN-C3:** Máximo de 10 membros por cluster
- **RN-C4:** Máximo de 50 nós por cluster

**Eventos de Domínio:**

- `ClusterCreated` — cluster criado com identidade criptográfica e vault do admin inicializado
- `ClusterRecovered` — sistema reconstruído via seed phrase em novo orquestrador

---

### Member

**Descrição:** Pessoa que pertence a um cluster familiar. Cada membro tem um role que define suas permissões e um vault individual para armazenar credenciais criptografadas.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| member_id | UUID | Sim | Identificador único |
| name | String | Sim | Nome do membro |
| email | String | Sim | Email para identificação (único dentro do cluster) |
| role | Enum | Sim | `admin`, `member`, `reader` |
| invited_by | UUID | Não | Member que convidou (null para o criador do cluster) |
| joined_at | DateTime | Sim | Data de ingresso no cluster |

**Regras de Negócio:**

- **RN-M1:** Email único dentro do cluster — tentativa de convite com email existente retorna erro 409
- **RN-M2:** Pelo menos 1 admin por cluster; não é possível remover ou rebaixar o último admin
- **RN-M3:** Permissões por role: `reader` visualiza; `member` faz upload e download; `admin` gerencia cluster, nós e membros
- **RN-M4:** Membro ingressa exclusivamente via convite com token assinado (exceto o criador do cluster)

**Eventos de Domínio:**

- `MemberJoined` — membro aceitou convite e ingressou no cluster
- `MemberRemoved` — membro removido do cluster pelo admin

---

### Node

**Descrição:** Dispositivo físico (PC, NAS, VPS) ou conta cloud (S3, R2, B2) que armazena chunks criptografados. Cada nó reporta capacidade e envia heartbeats periódicos ao orquestrador.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| node_id | UUID | Sim | Identificador único |
| type | Enum | Sim | `local`, `s3`, `r2`, `b2`, `vps` |
| name | String | Sim | Nome descritivo (ex.: "NAS Sala", "R2 Cloudflare") |
| total_capacity | Long | Sim | Espaço total em bytes |
| used_capacity | Long | Sim | Espaço usado em bytes |
| status | Enum | Sim | `online`, `suspect`, `lost`, `draining`, `disconnected` |
| endpoint | String | Sim | URL ou caminho de conexão |
| config_encrypted | Bytes | Sim | Credenciais criptografadas (armazenadas no vault do owner) |
| last_heartbeat | DateTime | Não | Timestamp do último heartbeat recebido |
| tier | Enum | Não | `hot` (sempre online), `warm` (frequente), `cold` (ocasional) |

**Regras de Negócio:**

- **RN-N1:** Nó sem heartbeat por 30 minutos → status `suspect`; alerta warning gerado
- **RN-N2:** Nó sem heartbeat por 1 hora → status `lost`; alerta critical gerado; dispara auto-healing
- **RN-N3:** Remoção de nó exige drain obrigatório — todos os chunks migrados antes da desconexão
- **RN-N4:** Credenciais de nós cloud são criptografadas e armazenadas no vault do membro que registrou
- **RN-N5:** Teste de conectividade (PUT/GET de chunk de teste) obrigatório no registro do nó
- **RN-N6:** Cluster precisa de mínimo 3 nós ativos para aceitar uploads (garantir replicação 3x)

**Eventos de Domínio:**

- `NodeRegistered` — nó registrado e adicionado ao ConsistentHashRing
- `NodeSuspect` — heartbeat ausente por 30min
- `NodeLost` — heartbeat ausente por 1h; auto-healing iniciado
- `NodeDrained` — todos os chunks migrados; nó removido do ring

---

### File

**Descrição:** Arquivo de mídia ou documento enviado por um membro ao cluster. Passa pelo pipeline de processamento (otimização, preview, chunking, criptografia, distribuição) antes de ficar disponível.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| file_id | UUID | Sim | Identificador único |
| original_name | String | Sim | Nome original do arquivo enviado |
| media_type | Enum | Sim | `photo`, `video`, `document` |
| original_size | Long | Sim | Tamanho antes da otimização (bytes) |
| optimized_size | Long | Sim | Tamanho após otimização (bytes); igual ao original para documentos |
| content_hash | String | Sim | SHA-256 do conteúdo otimizado |
| metadata | JSON | Não | EXIF (GPS, data, câmera), duração, codec, páginas, encoding |
| status | Enum | Sim | `processing`, `ready`, `error`, `corrupted` |
| created_at | DateTime | Sim | Data de criação |

**Regras de Negócio:**

- **RN-F1:** Classificação automática via MIME type: `image/*` → photo, `video/*` → video, demais → document
- **RN-F2:** Otimização obrigatória para mídia: fotos → WebP max 1920px (~300-600KB); vídeos → 1080p H.265/AV1 (~400-600MB)
- **RN-F3:** Documentos fazem bypass do pipeline de otimização — `optimized_size = original_size`; chunk e distribui diretamente
- **RN-F4:** Limites de tamanho por tipo: fotos 50MB, vídeos 10GB, documentos 2GB, archives 5GB
- **RN-F5:** Deduplicação: se `content_hash` já existe no cluster, chunks existentes são reutilizados via manifest
- **RN-F6:** Placeholder substitui arquivo local somente quando replicação 3x está confirmada para todos os chunks

**Eventos de Domínio:**

- `FileUploaded` — arquivo recebido e enfileirado para processamento
- `FileProcessed` — pipeline completo; status → `ready`; preview e manifest criados
- `FileCorrupted` — scrubbing detectou chunks irrecuperáveis; status → `corrupted`

---

### Preview

**Descrição:** Representação leve de um arquivo para exibição no cliente (galeria, timeline). Nunca oferece download do conteúdo original — serve exclusivamente para navegação visual.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| preview_id | UUID | Sim | Identificador único |
| file_id | UUID | Sim | Arquivo ao qual o preview pertence |
| type | Enum | Sim | `thumbnail`, `video_preview`, `pdf_page`, `generic_icon` |
| size | Long | Sim | Tamanho do preview em bytes |
| format | Enum | Sim | `webp`, `mp4`, `png` |
| content_hash | String | Sim | SHA-256 do conteúdo do preview |
| created_at | DateTime | Sim | Data de geração |

**Regras de Negócio:**

- **RN-P1:** Preview é somente para exibição no cliente — não oferece download do conteúdo original
- **RN-P2:** Tamanho alvo por tipo: foto → thumbnail ~50KB WebP; vídeo → 480p ~5MB MP4; PDF → imagem da primeira página ~100KB PNG; documento genérico → ícone por extensão/MIME
- **RN-P3:** Preview gerado durante o pipeline de processamento, antes da distribuição dos chunks
- **RN-P4:** Preview é armazenado como chunk(s) criptografado(s) e distribuído nos nós

**Eventos de Domínio:**

- `PreviewGenerated` — preview criado e armazenado durante processamento do arquivo

---

### Manifest

**Descrição:** Mapa de reconstituição de um arquivo — contém a lista ordenada de chunk_ids, a file key criptografada e uma assinatura criptográfica. É a fonte de verdade para reassemblar um arquivo e para o recovery via seed.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| manifest_id | UUID | Sim | Identificador único |
| file_id | UUID | Sim | Arquivo que este manifest descreve (1:1) |
| chunks_json | JSON | Sim | Lista ordenada de chunk_ids com índices |
| file_key_encrypted | Bytes | Sim | Chave do arquivo criptografada com master key |
| signature | Bytes | Sim | Assinatura criptográfica do manifest |
| replicated_to | JSON | Sim | Lista de node_ids onde o manifest foi replicado |
| created_at | DateTime | Sim | Data de criação |

**Regras de Negócio:**

- **RN-MA1:** Todo arquivo com status `ready` tem exatamente 1 manifest
- **RN-MA2:** Manifest contém a file key criptografada com master key (envelope encryption) — sem master key, impossível descriptografar
- **RN-MA3:** Manifest assinado criptograficamente com chave privada do cluster para garantir integridade e autenticidade
- **RN-MA4:** Manifest replicado em 2+ nós além do orquestrador (PostgreSQL) — garante recovery
- **RN-MA5:** Manifests são a fonte de verdade para reconstrução do banco no recovery via seed

**Eventos de Domínio:**

- `ManifestCreated` — manifest gerado após distribuição de todos os chunks
- `ManifestReplicated` — manifest copiado para nó adicional

---

### Chunk

**Descrição:** Bloco de dados criptografados de tamanho fixo (~4MB). Endereçado pelo SHA-256 do conteúdo (content-addressable). Pode ser referenciado por múltiplos arquivos quando há deduplicação.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| chunk_id | String | Sim | SHA-256 do conteúdo criptografado; funciona como endereço CAS |
| chunk_index | Int | Sim | Posição dentro do arquivo (usado no manifest para reassembly) |
| size | Int | Sim | Tamanho em bytes |
| created_at | DateTime | Sim | Data de criação |

**Regras de Negócio:**

- **RN-CH1:** Tamanho fixo de ~4MB por chunk (último chunk pode ser menor)
- **RN-CH2:** `chunk_id = SHA-256(conteúdo criptografado)` — endereço content-addressable; imutável
- **RN-CH3:** Todo chunk é criptografado com AES-256-GCM antes do armazenamento em qualquer nó
- **RN-CH4:** Chunk pode ser referenciado por múltiplos manifests/arquivos (deduplicação cross-file)
- **RN-CH5:** Chunk sem referência em nenhum manifest → órfão → elegível para garbage collection
- **RN-CH6:** Cada chunk contém metadata mínimo embutido (file_id, chunk_index, hash, timestamp) para viabilizar recovery sem orquestrador

**Eventos de Domínio:**

- `ChunkCreated` — chunk gerado pelo pipeline e pronto para distribuição
- `ChunkOrphaned` — chunk sem referência detectado pelo garbage collector

---

### ChunkReplica

**Descrição:** Registro de uma cópia de um chunk armazenada em um nó específico. A entidade central para monitoramento de replicação, scrubbing e auto-healing.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| chunk_id | String | Sim | Chunk que esta réplica armazena |
| node_id | UUID | Sim | Nó onde esta réplica está armazenada |
| verified_at | DateTime | Não | Timestamp do último scrubbing bem-sucedido |
| status | Enum | Sim | `healthy`, `corrupted`, `pending` |
| created_at | DateTime | Sim | Data de criação da réplica |

**Regras de Negócio:**

- **RN-CR1:** Mínimo de 3 réplicas por chunk em nós diferentes — invariante mais importante do sistema
- **RN-CR2:** Diversidade preferencial de nós: idealmente 1 local + 1 cloud + 1 outro dispositivo
- **RN-CR3:** Scrubbing periódico recalcula SHA-256 de cada réplica e compara com chunk_id; `verified_at` atualizado em caso de sucesso
- **RN-CR4:** Réplica corrompida é substituída automaticamente a partir de réplica saudável em outro nó

**Eventos de Domínio:**

- `ChunkReplicated` — réplica criada em nó destino com sucesso
- `ChunkCorrupted` — scrubbing detectou hash divergente; réplica marcada como corrompida
- `ChunkRepaired` — réplica corrompida substituída por cópia saudável

---

### Vault

**Descrição:** Cofre criptografado individual por membro. O vault do admin é especial — além de credenciais pessoais, contém a configuração do cluster, lista de nós e credenciais de provedores cloud necessárias para recovery.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| member_id | UUID | Sim | Membro dono do vault (relação 1:1) |
| vault_data | Bytes | Sim | Conteúdo criptografado do cofre |
| encryption_algorithm | String | Sim | Algoritmo usado (ex.: AES-256-GCM) |
| replicated_to | JSON | Sim | Lista de node_ids onde o vault foi replicado |
| is_admin_vault | Boolean | Sim | Indica se é vault de admin (contém config do cluster) |
| updated_at | DateTime | Sim | Última atualização do conteúdo |

**Regras de Negócio:**

- **RN-V1:** Vault do admin contém: config do cluster, lista de nós, credenciais S3/R2 de todos os provedores, master key derivada — essencial para recovery
- **RN-V2:** Vault de membro regular contém: credenciais pessoais, tokens OAuth, preferências
- **RN-V3:** Vault replicado em nós de storage para viabilizar recovery via seed — sem vault, recovery é parcial (credenciais manuais)
- **RN-V4:** Vault desbloqueado com senha do membro; no recovery, desbloqueado com master key derivada da seed
- **RN-V5:** Credenciais e tokens nunca armazenados em texto puro — somente dentro do vault criptografado

**Eventos de Domínio:**

- `VaultCreated` — vault inicializado na criação do membro
- `VaultUpdated` — credencial adicionada ou atualizada no vault
- `VaultReplicated` — vault replicado em nó de storage

---

### Alert

**Descrição:** Notificação de condição anômala no cluster. Gerada automaticamente pelo Scheduler ou por eventos do sistema. Persiste até resolução manual ou automática (auto-healing).

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| alert_id | UUID | Sim | Identificador único |
| type | Enum | Sim | `node_offline`, `replication_low`, `token_expired`, `space_low`, `corruption_detected`, `auto_healing_complete` |
| message | String | Sim | Descrição legível do problema |
| severity | Enum | Sim | `info`, `warning`, `critical` |
| resolved | Boolean | Sim | Se foi resolvido (manual ou auto) |
| created_at | DateTime | Sim | Data de criação |
| resolved_at | DateTime | Não | Data de resolução |

**Regras de Negócio:**

- **RN-A1:** Alertas gerados automaticamente pelo Scheduler ou por eventos do sistema (nunca manualmente)
- **RN-A2:** Alertas persistem até resolução — sem expiração automática
- **RN-A3:** Auto-healing pode resolver alertas automaticamente (ex.: nó volta online → alerta `node_offline` resolvido)

**Eventos de Domínio:**

- `AlertCreated` — condição anômala detectada
- `AlertResolved` — condição resolvida (manual ou auto)

---

### Invite

**Descrição:** Convite para ingresso de um novo membro no cluster. Token assinado com chave do cluster e expiração configurável. Uso único — invalidado após aceite.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| invite_id | UUID | Sim | Identificador único |
| email | String | Sim | Email do convidado |
| role | Enum | Sim | Role atribuída ao aceitar: `admin`, `member`, `reader` |
| token | String | Sim | Token assinado com chave privada do cluster |
| expires_at | DateTime | Sim | Data de expiração do convite |
| created_by | UUID | Sim | Member que criou o convite |
| accepted_at | DateTime | Não | Data de aceite (null se pendente) |

**Regras de Negócio:**

- **RN-I1:** Token assinado com chave privada do cluster; expiração padrão de 7 dias
- **RN-I2:** Token de uso único — após aceite, `accepted_at` é preenchido e token não pode ser reutilizado
- **RN-I3:** Email já existente no cluster → rejeição (erro 409)
- **RN-I4:** Somente membros com role `admin` podem criar convites

**Eventos de Domínio:**

- `InviteCreated` — convite gerado pelo admin
- `InviteAccepted` — convidado aceitou e ingressou no cluster
- `InviteExpired` — convite não aceito dentro do prazo de validade

<!-- APPEND:entities -->

---

## Relacionamentos

> Como as entidades se conectam? Quais dependências existem entre elas? Existem relações de composição (parte-todo) ou apenas associação?

| Entidade A | Cardinalidade | Entidade B | Descrição do Relacionamento |
|------------|:-------------:|------------|----------------------------|
| Cluster | 1:N | Member | Cluster possui membros; mínimo 1 (admin criador) |
| Cluster | 1:N | Node | Cluster gerencia nós de armazenamento |
| Cluster | 1:N | File | Cluster contém arquivos enviados pelos membros |
| Cluster | 1:N | Alert | Cluster gera alertas de condições anômalas |
| Cluster | 1:N | Invite | Cluster possui convites pendentes ou aceitos |
| Member | 1:1 | Vault | Cada membro tem exatamente 1 vault criptografado |
| Member | 1:N | Node | Membro registra nós (owner do nó) |
| Member | 1:N | File | Membro faz upload de arquivos |
| Member | 1:N | Invite | Admin cria convites para novos membros |
| File | 1:1 | Manifest | Todo arquivo ready tem exatamente 1 manifest |
| File | 1:1 | Preview | Todo arquivo processado tem 1 preview para exibição no cliente |
| Manifest | N:M | Chunk | Manifest referencia chunks; chunk pode ser referenciado por múltiplos manifests (deduplicação) |
| Chunk | 1:N | ChunkReplica | Cada chunk tem 3+ réplicas em nós diferentes |
| Node | 1:N | ChunkReplica | Nó armazena múltiplas réplicas de chunks |

<!-- APPEND:relationships -->

---

## Diagrama de Domínio

> Atualize o diagrama abaixo conforme as entidades e relacionamentos definidos acima.

> 📐 Diagrama: [class-diagram.mmd](../diagrams/domain/class-diagram.mmd)

---

## Referências

- PRD do Alexandria — fonte primária de requisitos e regras de negócio
- [Contexto do Sistema](./00-context.md) — atores, sistemas externos e limites
- [Visão do Sistema](./01-vision.md) — objetivos, personas e métricas de sucesso
- [Requisitos](./03-requirements.md) — requisitos funcionais e não funcionais com priorização MoSCoW
- [Fluxos Críticos](./07-critical_flows.md) — fluxos de upload, recovery, auto-healing, onboarding e scrubbing
- [Casos de Uso](./08-use_cases.md) — 10 casos de uso com referências a regras de negócio
- [Decisões Arquiteturais](./10-architecture_decisions.md) — ADRs que fundamentam escolhas de domínio
