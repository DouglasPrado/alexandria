# Estados do Sistema

> Identifique entidades que possuem ciclo de vida — elas mudam de estado ao longo do tempo.

Muitos objetos do domínio não são estáticos: um arquivo nasce como **processing**, passa por **ready** ou **error**, e pode eventualmente ser marcado como **corrupted**. Modelar esses estados de forma explícita evita inconsistências, facilita validações e torna o comportamento do sistema previsível.

Este documento cataloga todas as entidades com ciclo de vida, seus estados possíveis e as transições permitidas entre eles.

<!-- do blueprint: 04-domain-model.md (entidades e regras de negócio) + 07-critical_flows.md (transições nos fluxos) -->

---

## Modelo de Estados

---

### File

**Descrição:** Arquivo de mídia ou documento enviado ao cluster. Passa pelo pipeline de processamento antes de ficar disponível na galeria.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `processing` | Arquivo recebido e enfileirado no pipeline de mídia (otimização, chunking, criptografia, distribuição). Estado inicial após upload. |
| `ready` | Pipeline completo com sucesso — arquivo otimizado, criptografado, distribuído com 3+ réplicas. Visível na galeria, disponível para download. |
| `error` | Pipeline falhou (FFmpeg erro, codec não suportado, arquivo corrompido, nós insuficientes). Membro pode tentar retry. |
| `corrupted` | Scrubbing detectou chunks irrecuperáveis (todas as réplicas corrompidas). Arquivo permanentemente danificado. Estado terminal. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| `processing` | `ready` | Pipeline completo (chunks distribuídos, manifest criado) | Todos os chunks com 3+ réplicas confirmadas |
| `processing` | `error` | Pipeline falhou | FFmpeg/libvips retornou erro; timeout; nós insuficientes (<3) |
| `error` | `processing` | Membro clica "Retry" ou admin re-enfileira | Causa do erro corrigida (ex.: nós adicionados) |
| `ready` | `corrupted` | Scrubbing detecta chunks sem réplica saudável | Todas as réplicas de pelo menos 1 chunk estão corrompidas e irrecuperáveis |

> **Estados terminais:** `corrupted` — não é possível recuperar sem backup externo. `ready` e `error` são reversíveis.

---

### Node

**Descrição:** Dispositivo ou conta cloud que armazena chunks. Status muda automaticamente com base nos heartbeats recebidos pelo Scheduler.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `online` | Nó ativo, heartbeat recente (< 30 minutos). Aceita novos chunks, participa do ConsistentHashRing. |
| `suspect` | Sem heartbeat por 30 minutos. Alerta warning gerado. Ainda não dispara auto-healing — pode ser instabilidade temporária. |
| `lost` | Sem heartbeat por 1 hora. Alerta critical gerado. Auto-healing inicia re-replicação de todos os chunks deste nó. |
| `draining` | Admin iniciou desconexão — todos os chunks estão sendo migrados para outros nós antes da remoção. |
| `disconnected` | Drain completo — nó removido do ConsistentHashRing e da lista ativa. Estado terminal. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (registro) | `online` | Admin registra nó (POST /nodes) | Teste de conectividade bem-sucedido (PUT/GET chunk de teste) |
| `online` | `suspect` | Scheduler detecta heartbeat atrasado | `last_heartbeat < NOW() - INTERVAL '30 min'` |
| `suspect` | `online` | Heartbeat recebido | Nó retoma envio de heartbeats |
| `suspect` | `lost` | Scheduler detecta heartbeat ainda ausente | `last_heartbeat < NOW() - INTERVAL '1 hour'` |
| `lost` | `online` | Heartbeat recebido (nó voltou) | Nó reconectado; auto-healing em andamento é pausado para chunks já re-replicados |
| `online` | `draining` | Admin clica "Desconectar" | Cluster tem nós suficientes para manter replicação 3x após remoção |
| `draining` | `disconnected` | Todos os chunks migrados | Nenhum registro em chunk_replicas para este nó |

> **Estados terminais:** `disconnected` — nó removido permanentemente. Todos os outros são reversíveis (exceto `draining` que só avança para `disconnected`).

---

### Cluster

**Descrição:** Grupo familiar com identidade criptográfica. Criado uma única vez; pode ser suspenso por questões administrativas.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `active` | Cluster operacional — membros podem fazer upload, visualizar galeria, gerenciar nós. |
| `suspended` | Cluster temporariamente desativado pelo admin. Membros não podem acessar. Dados preservados. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (criação) | `active` | Admin cria cluster e confirma seed phrase | Seed phrase gerada, vault do admin criado, membro admin registrado |
| `active` | `suspended` | Admin suspende cluster manualmente | Decisão administrativa (ex.: segurança comprometida) |
| `suspended` | `active` | Admin reativa cluster | Admin autenticado confirma reativação |

---

### Alert

**Descrição:** Notificação de condição anômala. Gerada automaticamente pelo Scheduler ou por eventos do sistema. Persiste até resolução.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `active` | Alerta criado — condição anômala detectada. Visível no painel do admin. |
| `resolved` | Condição resolvida — manual pelo admin ou automaticamente pelo sistema (auto-healing). |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (detecção) | `active` | Scheduler ou evento detecta anomalia | Condição de alerta atendida (nó offline, replicação baixa, etc.) |
| `active` | `resolved` | Admin marca como resolvido | Admin investigou e tratou a causa |
| `active` | `resolved` | Sistema resolve automaticamente | Auto-healing re-replicou chunks; nó voltou online; token renovado |

> **Sem expiração automática:** Alertas permanecem ativos até resolução explícita.

---

### Invite

**Descrição:** Convite para ingresso de novo membro no cluster. Token assinado com expiração.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `pending` | Convite criado, token gerado. Aguardando aceite do convidado. |
| `accepted` | Convidado aceitou e ingressou no cluster. Token invalidado. |
| `expired` | Convite não aceito dentro do prazo (7 dias). Token invalidado. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (criação) | `pending` | Admin gera convite (POST /clusters/:id/invite) | Email válido, role definida, admin autenticado |
| `pending` | `accepted` | Convidado aceita (POST /invites/:token/accept) | Token válido (assinatura + expiração), email não existe no cluster |
| `pending` | `expired` | Prazo de validade atingido | `expires_at < NOW()` — cleanup periódico pelo Scheduler |

> **Estados terminais:** `accepted` e `expired` — ambos invalidam o token permanentemente.

---

### ChunkReplica

**Descrição:** Cópia de um chunk armazenada em um nó. Status gerenciado pelo scrubbing e auto-healing.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `pending` | Réplica em processo de criação — chunk sendo copiado para o nó destino. |
| `healthy` | Réplica verificada — hash confere com chunk_id. Estado normal. |
| `corrupted` | Scrubbing detectou hash divergente — réplica danificada. Será substituída por cópia saudável. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (criação) | `pending` | Orquestrador inicia cópia do chunk para nó destino | Chunk selecionado para replicação (upload, auto-healing, rebalanceamento) |
| `pending` | `healthy` | Cópia concluída e hash verificado | SHA-256 do chunk no nó confere com chunk_id |
| `healthy` | `corrupted` | Scrubbing detecta divergência | SHA-256 recalculado ≠ chunk_id |
| `corrupted` | (removido) | Auto-healing substitui réplica | Réplica corrompida deletada; nova réplica criada a partir de cópia saudável |

---

### Upload (estado do frontend — uploadStore)

**Descrição:** Estado local no frontend que acompanha o ciclo de vida de cada arquivo na fila de upload. Não é persistido no banco — se a aba fechar, o upload é interrompido.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| `queued` | Arquivo adicionado à fila, aguardando sua vez (max 3 uploads concorrentes). |
| `uploading` | Upload em andamento — barra de progresso com percentual e velocidade. |
| `processing` | Upload concluído — arquivo entrou no pipeline do backend. Polling GET /files/:id a cada 3s. |
| `done` | Pipeline completo — arquivo com status `ready` no backend. |
| `error` | Upload ou pipeline falhou. Botão retry disponível. |

#### Transições

| De | Para | Gatilho | Condição |
|----|------|---------|----------|
| (seleção) | `queued` | Membro seleciona arquivo(s) | Arquivo validado (tipo e tamanho dentro dos limites) |
| `queued` | `uploading` | Slot disponível na fila | `activeUploads < maxConcurrent (3)` |
| `uploading` | `processing` | Upload HTTP concluído (201) | Resposta 201 do POST /files/upload |
| `uploading` | `error` | Falha de rede ou timeout | Upload interrompido |
| `processing` | `done` | Polling retorna status = `ready` | Backend completou pipeline |
| `processing` | `error` | Polling retorna status = `error` | Pipeline falhou no backend |
| `error` | `uploading` | Membro clica "Retry" | Re-enfileira upload |

---

## Diagrama de Estados — Resumo Visual

```
File:       processing ──→ ready
                      ╲──→ error ──→ processing (retry)
            ready ────→ corrupted (terminal)

Node:       (registro) ──→ online ──→ suspect ──→ lost
                         ↖──────────────↙     ↖───↙
            online ──→ draining ──→ disconnected (terminal)

Alert:      (detecção) ──→ active ──→ resolved (terminal)

Invite:     (criação) ──→ pending ──→ accepted (terminal)
                                 ╲──→ expired (terminal)

Replica:    (criação) ──→ pending ──→ healthy ──→ corrupted ──→ (removido)

Upload(FE): (seleção) ──→ queued ──→ uploading ──→ processing ──→ done
                                  ╲──→ error ←──╱           ╲──→ error
```

<!-- APPEND:state-models -->
