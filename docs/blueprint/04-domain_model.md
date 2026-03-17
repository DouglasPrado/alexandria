# Modelo de Domínio

O modelo de domínio representa as entidades centrais do sistema, suas responsabilidades e como se relacionam entre si. Ele serve como a **linguagem compartilhada** entre equipe técnica e stakeholders, garantindo que todos falem o mesmo idioma ao discutir o produto.

> O modelo de domínio NÃO é o modelo de dados. Aqui focamos no **comportamento e nas regras de negócio**, não na estrutura de armazenamento.

---

## Glossário Ubíquo

> Quais termos do domínio precisam de definição clara para evitar ambiguidade?

| Termo | Definição |
|-------|-----------|
| Cluster | Grupo familiar que compartilha armazenamento distribuído; identificado por cluster_id (hash da chave pública). Raiz de toda a hierarquia. |
| Membro | Pessoa autorizada a participar de um cluster com um nível de permissão (admin, membro, leitura). |
| Nó (Node) | Qualquer dispositivo ou serviço que armazena chunks criptografados — computador, celular, NAS, VPS, bucket S3/R2. |
| Chunk | Bloco de dados criptografado de ~4MB. Unidade mínima de armazenamento e replicação. Identificado pelo hash SHA-256 do seu conteúdo (content-addressable). |
| Manifest | Documento que descreve completamente um arquivo: lista ordenada de chunks, hashes, metadata e chave de criptografia. Replicado em múltiplos nós. |
| Arquivo (File) | Representação lógica de uma foto, vídeo ou documento no cluster. Composto por um manifest e N chunks. |
| Seed Phrase | Frase de 12 palavras (padrão BIP-39) que gera deterministicamente a master key do cluster. Nunca armazenada digitalmente pelo sistema. |
| Master Key | Chave criptográfica raiz derivada da seed phrase. Existe apenas em memória, nunca persistida em disco. |
| File Key | Chave de criptografia específica de um arquivo, derivada da master key via envelope encryption. |
| Vault | Cofre criptografado **individual por membro** que armazena tokens OAuth, credenciais de provedores, chaves e senhas do membro. Cada membro registra seus próprios nós e credenciais. Desbloqueado via senha do membro; em recovery, desbloqueado via master key derivada da seed. |
| Réplica | Cópia de um chunk armazenada em um nó específico. Cada chunk deve ter pelo menos 3 réplicas em nós diferentes. |
| Heartbeat | Sinal periódico que um nó envia ao orquestrador para indicar que está online e reportar capacidade. |
| Scrubbing | Verificação periódica de integridade: recalcula hashes de chunks e repara corrompidos a partir de réplicas. |
| Auto-healing | Processo automático de re-replicação de chunks quando um nó é perdido, mantendo o fator de replicação mínimo de 3. |
| Drain | Processo de migrar todos os chunks de um nó antes de desconectá-lo, garantindo que nenhum dado fique sub-replicado. |
| Consistent Hashing | Algoritmo que distribui chunks entre nós proporcionalmente à capacidade, minimizando redistribuição quando nós entram ou saem. |
| Placeholder | Arquivo leve (thumbnail) que substitui o original no dispositivo do usuário; o conteúdo otimizado é baixado sob demanda. |
| Preview | Versão leve para navegação: thumbnail ~50KB para fotos, vídeo 480p ~5MB para vídeos. |
| Pipeline de Mídia | Sequência de processamento: upload → análise → resize/transcode → preview → encrypt → chunk → distribute. |
| StorageProvider | Interface unificada (put/get/exists/delete/list/capacity) que abstrai o acesso a qualquer backend de storage. |
| Replication Factor | Número mínimo de cópias de cada chunk exigido pelo sistema (3 na v1). |
| Garbage Collection | Processo de remoção de chunks órfãos — chunks que não são referenciados por nenhum manifest. |
| Rebalanceamento | Redistribuição de chunks entre nós quando capacidades mudam (nó adicionado, removido ou redimensionado). |

---

## Entidades

### Cluster

**Descrição:** Grupo familiar que compartilha armazenamento distribuído. É a entidade raiz que agrupa membros, nós e arquivos. Possui identidade criptográfica derivada de um par de chaves.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| cluster_id | string | Sim | Hash da chave pública — identificador único e imutável |
| name | string | Sim | Nome legível do cluster (ex.: "Família Prado") |
| public_key | bytes | Sim | Chave pública do cluster para verificação de assinaturas |
| encrypted_private_key | bytes | Sim | Chave privada criptografada com master key |
| created_at | datetime | Sim | Data de criação |

**Regras de Negócio:**

- **RN-C1:** Um cluster é criado junto com uma seed phrase de 12 palavras (BIP-39) que gera a master key deterministicamente
- **RN-C2:** O cluster_id é imutável após criação — é derivado do par de chaves e serve como identidade criptográfica
- **RN-C3:** A chave privada do cluster é armazenada criptografada no vault do membro admin; a senha do membro que a desbloqueia é validada em memória
- **RN-C4:** Todo cluster deve ter pelo menos 1 membro com role admin

**Eventos de Domínio:**

- `ClusterCreated` — dispara geração de seed phrase e criação do vault do membro admin
- `ClusterRecovered` — dispara reconexão de nós e rebuild do índice de metadados

---

### Membro

**Descrição:** Pessoa autorizada a participar de um cluster. Cada membro possui um nível de permissão que determina o que pode fazer no sistema.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| member_id | string | Sim | Identificador único |
| name | string | Sim | Nome completo |
| email | string | Sim | E-mail para identificação e notificações |
| role | enum | Sim | admin, membro, leitura |
| invited_by | referência(Membro) | Não | Membro que convidou (null para o criador do cluster) |
| joined_at | datetime | Sim | Data de ingresso no cluster |

**Regras de Negócio:**

- **RN-M1:** Um membro entra no cluster aceitando um token de convite assinado com expiração
- **RN-M2:** Apenas membros com role admin podem convidar novos membros, remover membros e gerenciar nós
- **RN-M3:** Role "leitura" permite apenas visualizar galeria e fazer download; não pode fazer upload nem gerenciar nós
- **RN-M4:** O e-mail deve ser único dentro de um cluster
- **RN-M5:** O criador do cluster é automaticamente admin e não pode ser removido (apenas pode transferir admin)

**Eventos de Domínio:**

- `MemberInvited` — token de convite gerado e enviado
- `MemberJoined` — membro aceitou convite e foi adicionado ao cluster; dispara criação do vault do membro
- `MemberRemoved` — membro desconectado do cluster; vault do membro é marcado para exclusão

---

### Nó (Node)

**Descrição:** Dispositivo ou serviço que armazena chunks criptografados. Pode ser um computador local, celular, NAS, VPS ou bucket cloud (S3, R2). O orquestrador monitora saúde e capacidade de cada nó.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| node_id | string | Sim | Identificador único |
| type | enum | Sim | local, s3, r2, vps |
| name | string | Sim | Nome descritivo (ex.: "MacBook do Douglas", "R2 Bucket Principal") |
| total_capacity | integer (bytes) | Sim | Espaço total disponível no nó |
| used_capacity | integer (bytes) | Sim | Espaço atualmente ocupado por chunks |
| status | enum | Sim | online, suspect, lost, draining |
| endpoint | string | Não | URL ou endereço de conexão (para nós remotos) |
| config_encrypted | bytes | Não | Credenciais de acesso criptografadas (S3 keys, OAuth tokens) |
| last_heartbeat | datetime | Sim | Timestamp do último heartbeat recebido |
| owner | referência(Membro) | Sim | Membro que registrou o nó |

**Regras de Negócio:**

- **RN-N1:** Nó sem heartbeat por >30 min é marcado como "suspect"; sem heartbeat por >1h é marcado como "lost"
- **RN-N2:** Nó marcado como "lost" dispara auto-healing de todos os seus chunks
- **RN-N3:** Um nó só pode ser desconectado após drain completo — todos os chunks migrados para outros nós
- **RN-N4:** Credenciais de acesso (S3 keys, tokens OAuth) são armazenadas criptografadas; nunca em texto puro
- **RN-N5:** Capacidade usada não pode exceder capacidade total; uploads são rejeitados quando nó está cheio
- **RN-N6:** Nó com status "draining" não recebe novos chunks; apenas exporta os existentes

**Eventos de Domínio:**

- `NodeRegistered` — nó adicionado ao cluster, visível e reportando capacidade
- `NodeOnline` — heartbeat recebido após período offline
- `NodeSuspected` — heartbeat ausente por >30 minutos
- `NodeLost` — heartbeat ausente por >1 hora; dispara auto-healing
- `NodeDrainStarted` — migração de chunks começou
- `NodeDisconnected` — drain completo, nó removido do cluster

---

### Arquivo (File)

**Descrição:** Representação lógica de uma foto, vídeo ou documento que foi processado pelo pipeline de mídia e armazenado no cluster. Não contém os dados em si — estes vivem nos chunks.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| file_id | string | Sim | Identificador único |
| original_name | string | Sim | Nome do arquivo como enviado pelo usuário |
| media_type | enum | Sim | foto, video, documento |
| original_size | integer (bytes) | Sim | Tamanho antes da otimização |
| optimized_size | integer (bytes) | Sim | Tamanho após pipeline de mídia |
| content_hash | string | Sim | SHA-256 do conteúdo otimizado (para deduplicação) |
| status | enum | Sim | processing, ready, error |
| metadata | json | Não | EXIF e outros metadados extraídos (data, GPS, câmera) |
| uploaded_by | referência(Membro) | Sim | Membro que fez upload |
| created_at | datetime | Sim | Data de upload |

**Regras de Negócio:**

- **RN-F1:** Todo arquivo passa pelo pipeline de mídia antes de ser armazenado: fotos → WebP max 1920px; vídeos → 1080p H.265/AV1
- **RN-F2:** Originais não são preservados — decisão explícita; apenas versão otimizada + preview
- **RN-F3:** Metadados EXIF são extraídos e preservados separadamente, nunca perdidos
- **RN-F4:** Dois arquivos com o mesmo content_hash são considerados duplicatas; chunks são compartilhados (deduplicação)
- **RN-F5:** Arquivo com status "processing" não está visível na galeria; se pipeline falhar, status muda para "error"
- **RN-F6:** Um arquivo só está "ready" quando todos os seus chunks têm 3+ réplicas confirmadas

**Eventos de Domínio:**

- `FileReceived` — upload iniciado, job enfileirado no pipeline
- `FileProcessed` — pipeline concluído, chunks distribuídos
- `FileReady` — replicação mínima atingida (3x), visível na galeria
- `FileError` — pipeline falhou, requer ação do usuário ou retry

---

### Manifest

**Descrição:** Documento que descreve completamente um arquivo: lista ordenada de chunks com hashes, chave de criptografia do arquivo e metadata. É o "mapa" que permite reconstruir o arquivo a partir dos chunks distribuídos.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| manifest_id | string | Sim | Identificador único |
| file_id | referência(Arquivo) | Sim | Arquivo descrito por este manifest |
| chunks | lista | Sim | Lista ordenada de {chunk_id, index, hash, size} |
| file_key_encrypted | bytes | Sim | Chave do arquivo criptografada com master key |
| signature | bytes | Não | Assinatura criptográfica para verificação de integridade |
| replicated_to | lista(Node) | Sim | Nós que possuem cópia do manifest |

**Regras de Negócio:**

- **RN-MA1:** Todo manifest é replicado em pelo menos 2 nós além do orquestrador — sem manifest, o arquivo é irrecuperável
- **RN-MA2:** A file_key é criptografada com a master key (envelope encryption); comprometimento de uma file_key não afeta outros arquivos
- **RN-MA3:** Manifest com assinatura inválida é rejeitado na validação (proteção contra adulteração)
- **RN-MA4:** Cada arquivo tem exatamente 1 manifest ativo (relação 1:1)
- **RN-MA5:** Manifests são usados para reconstruir o banco de metadados durante recovery via seed

**Eventos de Domínio:**

- `ManifestCreated` — manifest gerado após distribuição dos chunks
- `ManifestReplicated` — cópia do manifest confirmada em nó adicional
- `ManifestValidated` — assinatura verificada com sucesso durante scrubbing

---

### Chunk

**Descrição:** Bloco de dados criptografado de ~4MB. Unidade atômica de armazenamento, replicação e verificação de integridade. Identificado pelo hash SHA-256 do seu conteúdo (content-addressable storage).

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| chunk_id | string | Sim | SHA-256 do conteúdo criptografado — funciona como ID e prova de integridade |
| file_id | referência(Arquivo) | Sim | Arquivo ao qual pertence |
| chunk_index | integer | Sim | Posição dentro do arquivo (0-based) |
| size | integer (bytes) | Sim | Tamanho do chunk criptografado |

**Regras de Negócio:**

- **RN-CH1:** Todo chunk deve ter no mínimo 3 réplicas em nós diferentes; se abaixo de 3, auto-healing inicia em até 1 hora
- **RN-CH2:** O chunk_id é o hash SHA-256 do conteúdo criptografado — se o conteúdo mudar, o ID muda (imutabilidade)
- **RN-CH3:** Dois chunks com o mesmo hash são idênticos (content-addressable); armazenados uma vez, referenciados por múltiplos manifests (deduplicação)
- **RN-CH4:** Chunk corrompido (hash recalculado ≠ chunk_id) é restaurado automaticamente a partir de outra réplica
- **RN-CH5:** Chunk sem referência em nenhum manifest é considerado órfão e removido pelo garbage collector
- **RN-CH6:** Metadata mínimo (file_id, chunk_index, hash, timestamp) é embutido no chunk para permitir reconstrução sem orquestrador

**Eventos de Domínio:**

- `ChunkCreated` — chunk gerado pelo pipeline e pronto para distribuição
- `ChunkReplicated` — réplica confirmada em nó adicional
- `ChunkCorrupted` — hash inconsistente detectado pelo scrubbing
- `ChunkRepaired` — chunk corrompido restaurado de outra réplica
- `ChunkOrphaned` — chunk identificado sem referência em manifests

---

### Réplica (ChunkReplica)

**Descrição:** Registro de que um chunk específico está armazenado em um nó específico. Permite rastrear onde cada chunk vive e quando foi verificado pela última vez.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| chunk_id | referência(Chunk) | Sim | Chunk armazenado |
| node_id | referência(Nó) | Sim | Nó que contém a réplica |
| verified_at | datetime | Não | Último scrubbing bem-sucedido nesta réplica |
| created_at | datetime | Sim | Quando a réplica foi criada |

**Regras de Negócio:**

- **RN-R1:** Não pode existir duas réplicas do mesmo chunk no mesmo nó
- **RN-R2:** Quando um nó é marcado como lost, todas as réplicas nele são invalidadas e auto-healing é disparado
- **RN-R3:** Réplica não verificada por scrubbing há mais de X dias deve ser priorizada para verificação

---

### Vault

**Descrição:** Cofre criptografado **individual por membro** que armazena tokens OAuth, credenciais de provedores cloud, chaves de criptografia, senhas e configuração sensível do membro. Cada membro possui seu próprio vault para registrar nós e credenciais individualmente. Existe como arquivo criptografado replicado nos nós.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| member_id | referência(Membro) | Sim | Membro dono deste vault |
| vault_data | bytes | Sim | Conteúdo criptografado (tokens, credenciais, senhas, config do membro) |
| encryption_algorithm | string | Sim | AES-256-GCM |
| replicated_to | lista(Node) | Sim | Nós que possuem cópia do vault |

**Regras de Negócio:**

- **RN-V1:** O vault é desbloqueado via senha do membro; em cenário de recovery, a master key derivada da seed phrase também pode desbloquear os vaults
- **RN-V2:** Tokens OAuth, credenciais S3 e senhas do usuário existem em texto puro apenas em memória, nunca em disco
- **RN-V3:** Cada vault de membro é replicado em múltiplos nós para permitir recovery sem orquestrador
- **RN-V4:** Qualquer modificação no vault do membro (novo token, credencial atualizada, senha adicionada) dispara re-criptografia e re-replicação

**Eventos de Domínio:**

- `VaultCreated` — vault inicializado quando membro entra no cluster (ou na criação do cluster para o admin)
- `VaultUnlocked` — senha do usuário validada com sucesso (ou master key em recovery)
- `VaultUpdated` — credencial, senha ou token adicionado ou modificado
- `VaultReplicated` — cópia atualizada confirmada em nó

---

### Alerta

**Descrição:** Notificação de um problema ou evento importante no cluster que requer atenção do admin.

**Atributos:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| alert_id | string | Sim | Identificador único |
| type | enum | Sim | node_offline, low_replication, integrity_error, token_expired, space_low |
| message | string | Sim | Descrição legível do problema |
| severity | enum | Sim | info, warning, critical |
| resolved | boolean | Sim | Se o problema foi resolvido |
| created_at | datetime | Sim | Quando o alerta foi gerado |
| resolved_at | datetime | Não | Quando foi resolvido |

**Regras de Negócio:**

- **RN-A1:** Alertas críticos (integrity_error, nó com chunks sem réplica) notificam o admin em <5 minutos
- **RN-A2:** Alertas são resolvidos automaticamente quando a condição que os gerou deixa de existir (ex.: nó volta online)
- **RN-A3:** Alertas duplicados (mesmo tipo + mesmo recurso) não são criados; o existente é mantido

---

## Relacionamentos

> Como as entidades se conectam? Quais dependências existem entre elas?

| Entidade A | Cardinalidade | Entidade B | Descrição do Relacionamento |
|------------|:-------------:|------------|----------------------------|
| Cluster | 1:N | Membro | Um cluster tem múltiplos membros; membro pertence a exatamente 1 cluster |
| Cluster | 1:N | Nó | Um cluster tem múltiplos nós de armazenamento |
| Membro | 1:1 | Vault | Cada membro tem exatamente 1 vault criptografado individual |
| Cluster | 1:N | Alerta | Um cluster pode ter múltiplos alertas ativos |
| Membro | 1:N | Nó | Um membro pode registrar múltiplos nós |
| Membro | 1:N | Arquivo | Um membro pode fazer upload de múltiplos arquivos |
| Arquivo | 1:1 | Manifest | Cada arquivo tem exatamente 1 manifest que o descreve |
| Arquivo | 1:N | Chunk | Um arquivo é dividido em múltiplos chunks (composição) |
| Chunk | 1:N | Réplica | Um chunk tem múltiplas réplicas (mínimo 3) |
| Nó | 1:N | Réplica | Um nó armazena múltiplas réplicas de chunks diferentes |
| Manifest | N:M | Nó | Um manifest é replicado em múltiplos nós; um nó armazena múltiplos manifests |

---

## Diagrama de Domínio

> Atualize o diagrama abaixo conforme as entidades e relacionamentos definidos acima.

> 📐 Diagrama: [class-diagram.mmd](../diagrams/domain/class-diagram.mmd)

---

## Referências

- PRD-001: Alexandria — Sistema de Armazenamento Familiar Distribuído (docs/PRD.MD)
- BIP-39: Mnemonic code for generating deterministic keys (padrão para seed phrase)
- Amazon Dynamo / Apache Cassandra — referência para consistent hashing e replicação
- IPFS — referência para content-addressable storage
- BorgBackup / restic — referência para chunking e deduplicação
