# Validacao

Define as regras de validacao por campo, validacoes cross-field, sanitizacao e mensagens de erro.

<!-- do blueprint: 05-data-model.md, 13-security.md -->

---

## Estrategia de Validacao

> Em quais camadas a validacao acontece?

| Camada | O que Valida | Ferramenta | Exemplo |
| --- | --- | --- | --- |
| Presentation | Formato de entrada (tipos, required, min/max, formato) | `class-validator` + `class-transformer` via `ValidationPipe` | `@IsEmail()`, `@MinLength(2)` |
| Application | Regras de negocio simples (unicidade, estado atual) | Service logic | Email ja existe no cluster; no minimo 3 nos ativos |
| Domain | Invariantes da entidade | Metodos da entidade / value objects | Status so transiciona conforme maquina de estados |
| Infrastructure | Constraints do banco | TypeORM + PostgreSQL constraints | `UNIQUE(email, cluster_id)`, `NOT NULL`, `CHECK`, `FK` |

---

## Regras por Entidade

> Para CADA campo que recebe input, documente tipo, regras e mensagem.

### Cluster

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| name | string | required, min(2), max(100), trim | "Nome do cluster deve ter entre 2 e 100 caracteres" |

### Member

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| name | string | required, min(2), max(100), trim | "Nome deve ter entre 2 e 100 caracteres" |
| email | string | required, email format, max(255), lowercase + trim | "Email em formato invalido" |
| password | string | required, min(8) | "Senha deve ter no minimo 8 caracteres" |
| role | enum | required, enum: `admin`, `member`, `reader` | "Role deve ser admin, member ou reader" |

### Node

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| name | string | required, min(2), max(100) | "Nome do no deve ter entre 2 e 100 caracteres" |
| type | enum | required, enum: `local`, `s3`, `r2`, `b2`, `vps` | "Tipo deve ser local, s3, r2, b2 ou vps" |
| endpoint | string | required; URL format para cloud (`s3`, `r2`, `b2`); path absoluto para `local` | "Endpoint invalido para o tipo de no" |
| totalCapacity | number | required, integer positivo | "Capacidade total deve ser um inteiro positivo (bytes)" |

### File (Upload)

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| file | multipart | required, deve ser multipart/form-data | "Arquivo obrigatorio" |
| mediaType | enum | inferido do MIME type — `photo`, `video`, `document` | -- (automatico) |

**Limites de tamanho por mediaType:**

| Media Type | Limite | MIME types aceitos |
| --- | --- | --- |
| photo | 50 MB | `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, `image/gif` |
| video | 10 GB | `video/mp4`, `video/quicktime`, `video/webm`, `video/x-msvideo` |
| document | 2 GB | `application/pdf`, `text/*`, `application/msword`, `application/vnd.openxmlformats-*` |
| archive | 5 GB | `application/zip`, `application/gzip`, `application/x-tar` |

### Invite

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| email | string | required, email format, max(255) | "Email em formato invalido" |
| role | enum | required, enum: `admin`, `member`, `reader` | "Role deve ser admin, member ou reader" |

### Seed Phrase (Recovery)

| Campo | Tipo | Regras | Mensagem de Erro |
| --- | --- | --- | --- |
| seedPhrase | string | required, exatamente 12 palavras, cada palavra deve estar na wordlist BIP-39 | "Seed phrase deve conter exatamente 12 palavras validas BIP-39" |

---

## Validacoes Cross-Field

> Quais validacoes dependem de multiplos campos ou estado do sistema?

| Regra | Campos / Contexto | Logica | Mensagem |
| --- | --- | --- | --- |
| Endpoint compativel com tipo | `type`, `endpoint` | Se `type` e cloud (`s3`, `r2`, `b2`), endpoint deve ser URL valida; se `local`, deve ser path absoluto | "Endpoint incompativel com o tipo de no" |
| Capacidade disponivel | `totalCapacity`, estado do cluster | `totalCapacity` deve ser > 0 e cluster nao pode exceder 50 nos | "Cluster atingiu o limite maximo de nos" |
| Upload permitido | `file.size`, `mediaType` inferido | Tamanho do arquivo deve respeitar limite do mediaType | "Arquivo excede o tamanho maximo para este tipo de midia" |

---

## Validacoes de Parametros de URL e Query

> Quais validacoes se aplicam a params e query strings?

| Parametro | Tipo | Regras | Mensagem |
| --- | --- | --- | --- |
| `:id` | string | UUID v4 valido | "ID invalido" |
| `:clusterId` | string | UUID v4 valido | "ID do cluster invalido" |
| `?cursor` | string | UUID v4 valido (opcional) | "Cursor invalido" |
| `?limit` | number | integer, min(1), max(100), default(20) | "Limite deve ser entre 1 e 100" |
| `?mediaType` | string | enum: `photo`, `video`, `document` (opcional) | "Tipo de midia deve ser photo, video ou document" |

---

## Sanitizacao

> Quais campos sao sanitizados antes de processar?

| Campo | Sanitizacao | Motivo |
| --- | --- | --- |
| email | lowercase, trim | Evitar duplicatas por case — `User@Email.com` e `user@email.com` sao o mesmo membro |
| name (member, cluster, node) | trim, normalize whitespace (colapsar espacos multiplos) | Remover espacos extras, manter consistencia |
| original_name (file) | trim, sanitizar caracteres de path (`/`, `\`, `..`, null bytes) | Prevenir path traversal e nomes invalidos no filesystem |

> (ver [11-permissions.md](11-permissions.md) para controle de acesso)
