# Glossario Ubiquo

> **Fonte unica de termos do dominio.** Todos os blueprints (tecnico, backend, frontend, business) devem usar estes termos. Nao crie glossarios separados — referencie este arquivo.

| Termo                       | Definicao                                                                                                                                  | Nao Confundir Com                                                              | Usado em                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| Cluster                     | Grupo familiar com identidade criptografica (cluster_id = SHA-256 da public_key); unidade raiz que agrupa membros, nos, arquivos e alertas | Tenant (multi-tenant SaaS)                                                     | Entidades, endpoints (/clusters), UI            |
| Member                      | Pessoa que pertence a um cluster com role especifica (admin, member, reader)                                                               | User (generico)                                                                | Entidades, endpoints (/members), UI, permissoes |
| Node                        | Dispositivo fisico (PC, NAS, VPS) ou conta cloud (S3, R2, B2) que armazena chunks criptografados                                           | Server (infra generica)                                                        | Entidades, endpoints (/nodes), StorageProvider  |
| File                        | Arquivo de midia (foto, video) ou documento enviado ao sistema e processado pelo pipeline                                                  | Chunk (bloco de dados)                                                         | Entidades, endpoints (/files), galeria          |
| Preview                     | Representacao leve de um arquivo para exibicao no cliente; nao permite download do conteudo original                                       | Thumbnail (preview e mais amplo — inclui video 480p, PDF page, icone)          | Entidades, galeria, timeline                    |
| Manifest                    | Mapa de reconstituicao de um arquivo — lista ordenada de chunks + file key criptografada + assinatura                                      | Index (manifest e por arquivo, nao global)                                     | Entidades, recovery, pipeline                   |
| Chunk                       | Bloco de ~4MB de dados criptografados com AES-256-GCM; enderecado por SHA-256 do conteudo                                                  | File (chunk e parte de um file)                                                | Entidades, replicacao, scrubbing                |
| Replica                     | Copia de um chunk armazenada em um no especifico; minimo 3 replicas por chunk                                                              | Backup (replica e ativa, nao arquivo morto)                                    | Entidades, auto-healing, scrubbing              |
| Vault                       | Cofre criptografado individual por membro; vault do admin contem config do cluster e credenciais de nos                                    | Wallet (vault nao armazena moeda)                                              | Entidades, recovery, seguranca                  |
| Alert                       | Notificacao de condicao anomala no cluster gerada automaticamente pelo Scheduler                                                           | Notification (alert e tecnico/operacional)                                     | Entidades, endpoints (/alerts), dashboard       |
| Invite                      | Convite para ingresso no cluster via token assinado com expiracao de 7 dias                                                                | Link (invite tem logica de validacao e expiracao)                              | Entidades, endpoints (/invites), onboarding     |
| Seed Phrase                 | 12 palavras BIP-39 que derivam a master key; unica forma de recovery do sistema                                                            | Password (seed nao e armazenada no sistema)                                    | Recovery, criptografia, onboarding              |
| Master Key                  | Chave raiz derivada da seed phrase via PBKDF2/scrypt; nunca armazenada em texto puro                                                       | File Key (master key e raiz; file key e derivada)                              | Envelope encryption, recovery                   |
| File Key                    | Chave de criptografia por arquivo, derivada da master key via envelope encryption                                                          | Master Key (file key e especifica por arquivo)                                 | Pipeline, manifest, criptografia                |
| Envelope Encryption         | Hierarquia criptografica: seed → master key → file key → chunk encryption (AES-256-GCM)                                                    | E2E encryption (envelope e a estrategia de derivacao de chaves)                | Seguranca, pipeline                             |
| Content-Addressable Storage | Enderecamento de chunks pelo hash SHA-256 do conteudo; permite deduplicacao                                                                | File system (CAS usa hash, nao path)                                           | Chunks, deduplicacao                            |
| Consistent Hashing          | Algoritmo que distribui chunks entre nos proporcionalmente a capacidade; minimiza redistribuicao quando nos entram/saem                    | Round-robin (consistent hashing e proporcional)                                | Distribuicao, rebalanceamento                   |
| Scrubbing                   | Verificacao periodica de integridade — recalcula SHA-256 de cada replica e compara com chunk_id                                            | Backup verification (scrubbing e continuo e automatico)                        | Integridade, scheduler                          |
| Auto-Healing                | Re-replicacao automatica de chunks quando um no e perdido, para restaurar fator 3x                                                         | Recovery (auto-healing e automatico e parcial; recovery e manual e completo)   | Replicacao, scheduler                           |
| Drain                       | Migracao de todos os chunks de um no antes da sua remocao; garante que replicacao 3x seja mantida                                          | Delete (drain migra dados antes de remover)                                    | Gerenciamento de nos                            |
| Heartbeat                   | Sinal periodico enviado por nos ao orquestrador; ausencia por 30min → suspect, 1h → lost                                                   | Health check (heartbeat e passivo do no; health check e ativo do orquestrador) | Monitoramento, nos                              |
| Pipeline de Midia           | Fluxo de processamento: upload → analise → otimizacao → preview → chunk → criptografia → distribuicao                                      | ETL (pipeline e especifico para midia, nao dados genericos)                    | Upload, processamento                           |
| Placeholder                 | Thumbnail local que substitui arquivo completo no dispositivo; download sob demanda quando necessario                                      | Cache (placeholder e permanente ate pedido explicito)                          | Dispositivos, espaco                            |
| StorageProvider             | Interface unificada (put/get/exists/delete/list/capacity) para comunicacao com qualquer tipo de no                                         | Driver (StorageProvider e abstracao de negocio, nao driver de baixo nivel)     | Nos, replicacao, distribuicao                   |

<!-- APPEND:termos -->

---

## Acronimos

| Sigla  | Significado                                             | Contexto                  |
| ------ | ------------------------------------------------------- | ------------------------- |
| RBAC   | Role-Based Access Control                               | Autorizacao               |
| JWT    | JSON Web Token                                          | Autenticacao              |
| DTO    | Data Transfer Object                                    | API contracts             |
| DLQ    | Dead Letter Queue                                       | Mensageria                |
| ADR    | Architecture Decision Record                            | Decisoes                  |
| SLA    | Service Level Agreement                                 | Operacoes                 |
| SLO    | Service Level Objective                                 | Observabilidade           |
| RPO    | Recovery Point Objective                                | Disaster recovery         |
| RTO    | Recovery Time Objective                                 | Disaster recovery         |
| MoSCoW | Must/Should/Could/Won't                                 | Priorizacao               |
| CAS    | Content-Addressable Storage                             | Chunks, deduplicacao      |
| BIP-39 | Bitcoin Improvement Proposal 39                         | Seed phrase, criptografia |
| CSPRNG | Cryptographically Secure Pseudo-Random Number Generator | Geracao de chaves         |
| GC     | Garbage Collection                                      | Chunks orfaos             |
| FSP    | Family Storage Protocol                                 | Comunicacao entre nos     |

<!-- APPEND:acronimos -->

---

## Convencoes de Nomenclatura

> Regras que se aplicam a todos os blueprints.

| Contexto  | Convencao                    | Exemplo                                       |
| --------- | ---------------------------- | --------------------------------------------- |
| Entidades | PascalCase, singular, ingles | Cluster, Member, ChunkReplica                 |
| Campos    | snake_case, ingles           | created_at, cluster_id, content_hash          |
| Endpoints | kebab-case, plural, ingles   | /api/v1/clusters, /api/v1/chunk-replicas      |
| Eventos   | PascalCase, passado, ingles  | ClusterCreated, FileProcessed, ChunkCorrupted |
| Estados   | lowercase, ingles            | active, processing, ready, suspect, lost      |
| Erros     | UPPER_SNAKE_CASE             | CLUSTER_NOT_FOUND, REPLICATION_INSUFFICIENT   |
| Tabelas   | snake_case, plural           | clusters, members, chunk_replicas             |

<!-- APPEND:convencoes -->

> Este arquivo e referenciado por:
>
> - `docs/blueprint/04-domain-model.md` (glossario de dominio)
> - `docs/backend/03-domain.md` (implementacao de entidades)
> - `docs/frontend/04-components.md` (nomes de componentes baseados no dominio)
> - `docs/business/00-business-context.md` (termos de negocio)
