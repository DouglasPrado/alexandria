# Dados

Esta seção define **como e onde os dados são armazenados** na POC. Traduz o modelo de domínio em estruturas concretas de persistência — tabelas, colunas, tipos e relacionamentos no banco.

> Este é o modelo de dados, não o modelo de domínio. Aqui focamos em **estrutura de armazenamento**, não em comportamento.

---

## Tecnologia escolhida

**Banco:** PostgreSQL

**Justificativa:** Dados altamente relacionais (clusters → membros → nós → arquivos → chunks → réplicas) com integridade referencial necessária; suporte nativo a JSON para metadata flexível; experiência do tech lead com a tecnologia; ecossistema maduro de migrações.

**Fila:** Redis

**Justificativa:** Fila de processamento para pipeline de mídia (transcodificação de vídeo pode levar minutos); pub/sub para notificações internas; leve e sem overhead para a POC.

---

## Schema principal

### clusters

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| cluster_id | varchar(64) | Sim, único | Hash da chave pública |
| nome | varchar(255) | Sim | Nome do cluster familiar |
| public_key | bytea | Sim | Chave pública do cluster |
| encrypted_private_key | bytea | Sim | Chave privada criptografada com master key |
| created_at | timestamp | Sim | Data de criação |
| updated_at | timestamp | Sim | Última atualização |

### membros

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| cluster_id | uuid | FK → clusters | Cluster ao qual pertence |
| nome | varchar(255) | Sim | Nome do membro |
| email | varchar(255) | Sim | E-mail para identificação |
| role | varchar(20) | Sim | admin, membro, leitura |
| invited_by | uuid | FK → membros | Quem convidou (null para criador) |
| joined_at | timestamp | Sim | Data de ingresso |
| created_at | timestamp | Sim | Data de criação |
| updated_at | timestamp | Sim | Última atualização |

### nodes

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| cluster_id | uuid | FK → clusters | Cluster ao qual pertence |
| owner_id | uuid | FK → membros | Membro que registrou |
| tipo | varchar(20) | Sim | local, s3, r2, vps |
| nome | varchar(255) | Sim | Nome descritivo do nó |
| capacidade_total | bigint | Sim | Espaço total em bytes |
| capacidade_usada | bigint | Sim | Espaço usado em bytes |
| status | varchar(20) | Sim | online, suspeito, perdido, draining |
| endpoint | text | Não | URL/endereço de conexão |
| config_encrypted | bytea | Não | Credenciais criptografadas (S3 keys, etc.) |
| last_heartbeat | timestamp | Sim | Último heartbeat recebido |
| created_at | timestamp | Sim | Data de criação |
| updated_at | timestamp | Sim | Última atualização |

### files

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| cluster_id | uuid | FK → clusters | Cluster ao qual pertence |
| uploaded_by | uuid | FK → membros | Membro que fez upload |
| nome_original | varchar(500) | Sim | Nome do arquivo original |
| tipo_midia | varchar(20) | Sim | foto, video, documento |
| tamanho_original | bigint | Sim | Tamanho antes de otimização |
| tamanho_otimizado | bigint | Sim | Tamanho após otimização |
| hash_conteudo | varchar(64) | Sim | SHA-256 do conteúdo otimizado |
| metadata | jsonb | Não | EXIF e outros metadados extraídos |
| preview_chunk_id | varchar(64) | Não | Chunk ID do preview/thumbnail |
| status | varchar(20) | Sim | processing, ready, error |
| created_at | timestamp | Sim | Data de criação |
| updated_at | timestamp | Sim | Última atualização |

### manifests

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| file_id | uuid | FK → files, único | Arquivo descrito |
| chunks_json | jsonb | Sim | Lista ordenada: [{chunk_id, index, hash, size}] |
| file_key_encrypted | bytea | Sim | Chave do arquivo criptografada |
| assinatura | bytea | Não | Assinatura criptográfica |
| replicated_to | jsonb | Sim | Lista de node_ids que possuem cópia do manifest |
| created_at | timestamp | Sim | Data de criação |
| updated_at | timestamp | Sim | Última atualização |

### chunks

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | varchar(64) | PK | SHA-256 do conteúdo criptografado |
| file_id | uuid | FK → files | Arquivo ao qual pertence |
| chunk_index | integer | Sim | Posição dentro do arquivo |
| tamanho | integer | Sim | Tamanho em bytes |
| created_at | timestamp | Sim | Data de criação |

### chunk_replicas

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| chunk_id | varchar(64) | FK → chunks | Chunk replicado |
| node_id | uuid | FK → nodes | Nó que armazena a réplica |
| verified_at | timestamp | Não | Último scrubbing bem-sucedido |
| created_at | timestamp | Sim | Data de criação |

### alerts

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| id | uuid | PK | Identificador único |
| cluster_id | uuid | FK → clusters | Cluster relacionado |
| tipo | varchar(50) | Sim | node_offline, low_replication, integrity_error, etc. |
| mensagem | text | Sim | Descrição do alerta |
| resolved | boolean | Sim | Se já foi resolvido |
| created_at | timestamp | Sim | Data de criação |
| resolved_at | timestamp | Não | Data de resolução |

---

## Índices

| Tabela | Campos | Tipo | Justificativa |
| --- | --- | --- | --- |
| chunks | file_id, chunk_index | composite | Reconstruir arquivo na ordem correta |
| chunk_replicas | chunk_id | btree | Encontrar todas as réplicas de um chunk |
| chunk_replicas | node_id | btree | Listar todos os chunks de um nó (para drain) |
| chunk_replicas | chunk_id, node_id | unique | Evitar réplica duplicada no mesmo nó |
| files | cluster_id, created_at | composite | Listar arquivos por data (galeria/timeline) |
| files | hash_conteudo | btree | Deduplicação por conteúdo |
| nodes | cluster_id, status | composite | Listar nós ativos de um cluster |
| nodes | last_heartbeat | btree | Identificar nós com heartbeat atrasado |
| membros | cluster_id, email | unique | Um email por cluster |
| alerts | cluster_id, resolved | composite | Listar alertas ativos de um cluster |

---

## Decisões

| Decisão | Justificativa |
| --- | --- |
| UUID como PK em todas as tabelas | Facilita distribuição futura; evita exposição de sequência |
| chunk_id é o hash SHA-256, não UUID | Content-addressable storage: o ID é derivado do conteúdo, habilitando deduplicação |
| chunks_json como JSONB no manifest | Lista ordenada de chunks com metadata; evita join pesado; consultada inteira |
| metadata como JSONB em files | EXIF varia por arquivo; schema flexível sem migrações |
| config_encrypted em nodes | Credenciais S3/R2 criptografadas; nunca em texto puro |
| Tabela chunk_replicas separada | Relacionamento N:M entre chunks e nós; permite tracking de verificação por réplica |
| Timestamps em UTC | Evita problemas de fuso horário; conversão no frontend |
| Sem soft delete na POC | Complexidade desnecessária; chunks removidos via GC; alertas resolvidos via flag |
