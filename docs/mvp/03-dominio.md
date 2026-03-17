# Domínio

O modelo de domínio representa os **conceitos centrais do negócio**, suas regras e como se relacionam. Ele serve como linguagem compartilhada entre equipe técnica e stakeholders — todos devem usar os mesmos termos ao discutir o sistema.

> O modelo de domínio NÃO é o modelo de dados. Aqui focamos em **comportamento e regras de negócio**, não em tabelas e colunas.

---

## Glossário

| Termo | Definição |
| --- | --- |
| Cluster | Grupo familiar que compartilha armazenamento; identificado por cluster_id (hash da chave pública) |
| Nó (Node) | Qualquer dispositivo ou serviço que armazena chunks — computador, celular, NAS, VPS, bucket S3/R2 |
| Chunk | Bloco de dados criptografado de ~4MB, unidade mínima de armazenamento e replicação |
| Manifest | Documento que descreve um arquivo: lista de chunks, hashes, metadata, chave de criptografia |
| Seed Phrase | Frase de 12 palavras (BIP-39) que gera deterministicamente a master key do cluster |
| Master Key | Chave raiz derivada da seed; nunca persistida em disco |
| File Key | Chave de criptografia específica de um arquivo, derivada da master key via envelope encryption |
| Vault | Cofre criptografado individual por membro que armazena tokens, credenciais, chaves e senhas; desbloqueado via senha do membro |
| Placeholder | Arquivo leve (thumbnail) que substitui o original no dispositivo; download sob demanda do otimizado |
| Preview | Versão leve para navegação rápida: thumbnail ~50KB para fotos, 480p ~5MB para vídeos |
| Heartbeat | Sinal periódico que um nó envia ao orquestrador para indicar que está online e saudável |
| Scrubbing | Processo periódico de verificação de integridade: recalcula hashes e repara chunks corrompidos |
| Consistent Hashing | Algoritmo de distribuição que decide quais nós armazenam quais chunks, proporcional à capacidade |
| Auto-healing | Processo automático de re-replicação quando um nó é perdido, mantendo fator de replicação 3x |
| Drain | Processo de migrar todos os chunks de um nó antes de desconectá-lo do cluster |
| Replication Factor | Número mínimo de cópias de cada chunk (3 na POC) |

---

## Entidades e atributos

### Cluster

**Descrição:** Grupo familiar que compartilha armazenamento distribuído. Raiz de toda a hierarquia.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| cluster_id | string | Sim | Hash da chave pública do cluster |
| name | string | Sim | Nome do cluster (ex.: "Família Prado") |
| public_key | bytes | Sim | Chave pública do cluster |
| created_at | datetime | Sim | Data de criação |

### Membro

**Descrição:** Pessoa autorizada a participar do cluster com um nível de permissão.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| member_id | string | Sim | Identificador único |
| name | string | Sim | Nome do membro |
| email | string | Sim | E-mail para identificação |
| role | enum | Sim | admin, membro, leitura |
| invited_by | referência | Sim | Membro que convidou |
| joined_at | datetime | Sim | Data de ingresso |

### Nó (Node)

**Descrição:** Dispositivo ou serviço cloud que armazena chunks criptografados.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| node_id | string | Sim | Identificador único |
| type | enum | Sim | local, s3, r2, vps |
| total_capacity | integer | Sim | Espaço total em bytes |
| used_capacity | integer | Sim | Espaço usado em bytes |
| status | enum | Sim | online, suspect, lost, draining |
| last_heartbeat | datetime | Sim | Último heartbeat recebido |
| owner | referência | Sim | Membro que registrou o nó |

### Arquivo (File)

**Descrição:** Representação lógica de uma foto, vídeo ou documento no cluster.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| file_id | string | Sim | Identificador único |
| original_name | string | Sim | Nome do arquivo original |
| media_type | enum | Sim | foto, video, documento |
| original_size | integer | Sim | Tamanho antes de otimização |
| optimized_size | integer | Sim | Tamanho após otimização |
| content_hash | string | Sim | SHA-256 do conteúdo otimizado |
| uploaded_by | referência | Sim | Membro que fez upload |
| metadata | json | Não | EXIF e outros metadados extraídos |

### Chunk

**Descrição:** Bloco criptografado de ~4MB, unidade mínima de armazenamento e replicação.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| chunk_id | string | Sim | Hash SHA-256 do conteúdo criptografado |
| file_id | referência | Sim | Arquivo ao qual pertence |
| chunk_index | integer | Sim | Posição dentro do arquivo |
| size | integer | Sim | Tamanho em bytes |
| replicas | lista | Sim | Nós que armazenam este chunk |

### Manifest

**Descrição:** Documento que descreve completamente um arquivo: lista de chunks, hashes e metadata.

**Atributos-chave:**

| Atributo | Tipo | Obrigatório | Descrição |
| --- | --- | :-: | --- |
| manifest_id | string | Sim | Identificador único |
| file_id | referência | Sim | Arquivo descrito |
| chunks | lista | Sim | Lista ordenada de chunk_ids com hashes |
| file_key_encrypted | bytes | Sim | Chave do arquivo criptografada com master key |
| signature | bytes | Não | Assinatura criptográfica do manifest |

---

## Relacionamentos

| Entidade A | Cardinalidade | Entidade B | Descrição |
| --- | :-: | --- | --- |
| Cluster | 1:N | Membro | Um cluster tem múltiplos membros |
| Cluster | 1:N | Nó | Um cluster tem múltiplos nós de armazenamento |
| Membro | 1:N | Arquivo | Um membro faz upload de múltiplos arquivos |
| Arquivo | 1:1 | Manifest | Cada arquivo tem exatamente um manifest |
| Arquivo | 1:N | Chunk | Um arquivo é dividido em múltiplos chunks |
| Chunk | N:M | Nó | Um chunk é replicado em múltiplos nós; um nó armazena múltiplos chunks |

---

## Regras de negócio

- **RN1:** Todo chunk deve ter no mínimo 3 réplicas em nós diferentes; se abaixo de 3, auto-healing inicia em até 1 hora
- **RN2:** Nenhum dado sai do dispositivo sem criptografia AES-256-GCM (zero-knowledge)
- **RN3:** A seed phrase nunca é armazenada digitalmente pelo sistema; somente o usuário a possui
- **RN4:** A master key é derivada da seed em memória e nunca persistida em disco
- **RN5:** Tokens OAuth, credenciais de provedores e senhas vivem exclusivamente no vault criptografado de cada membro
- **RN6:** Um nó só pode ser desconectado após drain completo (migrar todos os chunks para outros nós)
- **RN7:** Chunks corrompidos detectados pelo scrubbing são restaurados automaticamente a partir de réplicas
- **RN8:** Chunks órfãos (sem referência em nenhum manifest) são removidos pelo garbage collector
- **RN9:** Fotos são armazenadas como WebP max 1920px; vídeos como 1080p H.265/AV1 — originais não são preservados
- **RN10:** Manifests devem ser replicados em múltiplos nós, não apenas no orquestrador, para permitir recovery
