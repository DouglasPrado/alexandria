# Estados do Sistema

> Identifique entidades que possuem ciclo de vida — elas mudam de estado ao longo do tempo.

Este documento cataloga todas as entidades com ciclo de vida, seus estados possíveis e as transições permitidas entre eles.

---

### Nó (Node)

**Descrição:** Dispositivo ou serviço que armazena chunks. Seu estado reflete disponibilidade e confiabilidade. Transições são disparadas por heartbeats (ou ausência deles) e ações administrativas.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| online | Nó saudável, enviando heartbeats regularmente, recebendo e servindo chunks |
| suspeito | Heartbeat ausente por >30 minutos; pode ser instabilidade temporária |
| perdido | Heartbeat ausente por >1 hora; considerado indisponível; auto-healing disparado |
| draining | Admin iniciou desconexão; chunks sendo migrados para outros nós; não recebe novos chunks |

#### Transições

| De | Para | Gatilho | Condição | Ação |
|----|------|---------|----------|------|
| — (novo) | online | Registro do nó (POST /nodes/register) | Conectividade testada com sucesso | Adicionar ao ConsistentHashRing; gerar evento NodeRegistered |
| online | suspeito | Scheduler detecta heartbeat ausente | last_heartbeat < NOW() - 30min | Gerar alerta (warning); evento NodeSuspected |
| suspeito | perdido | Scheduler detecta heartbeat ainda ausente | last_heartbeat < NOW() - 1h | Gerar alerta (critical); disparar auto-healing; evento NodeLost |
| suspeito | online | Heartbeat recebido | Nó envia heartbeat válido | Resolver alerta; evento NodeOnline |
| perdido | online | Heartbeat recebido após período perdido | Nó reconecta e envia heartbeat | Resolver alerta; cancelar auto-healing pendente; revalidar chunks |
| online | draining | Admin inicia desconexão (POST /nodes/:id/drain) | Admin autenticado com role admin | Bloquear novos chunks; iniciar migração; evento NodeDrainStarted |
| draining | — (removido) | Drain completo | Todos os chunks migrados com sucesso | Remover do ConsistentHashRing; remover de `nodes`; evento NodeDisconnected |

#### Transições Proibidas

- **draining → online**: Uma vez iniciado o drain, não pode ser cancelado (chunks já em migração)
- **perdido → draining**: Nó perdido não pode ser drenado (não acessível); auto-healing já cuida dos chunks
- **qualquer → online (sem heartbeat)**: Status online requer heartbeat válido recebido

#### Diagrama

> 📐 Diagrama: [state-node.mmd](../diagrams/domain/state-node.mmd)

---

### Arquivo (File)

**Descrição:** Representação lógica de uma foto, vídeo ou documento. Seu estado reflete o progresso no pipeline de mídia e a integridade das réplicas ao longo do tempo.

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| processing | Arquivo recebido, enfileirado ou em processamento no pipeline de mídia |
| ready | Pipeline concluído; todos os chunks com 3+ réplicas; thumbnail disponível; visível na galeria |
| error | Pipeline falhou (codec não suportado, arquivo corrompido, nós insuficientes); requer ação |
| corrupted | Scrubbing detectou chunks irrecuperáveis (todas as réplicas corrompidas ou perdidas). Estado terminal. |

#### Transições

| De | Para | Gatilho | Condição | Ação |
|----|------|---------|----------|------|
| — (novo) | processing | Upload recebido (POST /files/upload) | Arquivo válido; membro autenticado | Criar registro em files; enfileirar job no Redis; evento FileReceived |
| processing | ready | Pipeline concluído + replicação 3x confirmada | Todos os chunks distribuídos e confirmados | Atualizar status; publicar evento FileReady; thumbnail visível |
| processing | error | Pipeline falha | FFmpeg erro, nós insuficientes, timeout | Gerar alerta ao membro; evento FileError |
| error | processing | Retry solicitado (manual ou automático) | Causa do erro resolvida (nó adicionado, arquivo corrigido) | Re-enfileirar job; evento FileReceived |
| ready | corrupted | Scrubbing detecta chunks irrecuperáveis | Todas as réplicas de pelo menos 1 chunk perdidas | Gerar alerta (critical); evento FileCorrupted |

#### Transições Proibidas

- **ready → processing**: Arquivo pronto não volta para processamento (imutável após ready)
- **corrupted → qualquer**: Estado terminal; dados irrecuperáveis
- **error → ready**: Não pode pular processamento; deve passar por processing novamente via retry

#### Diagrama

> 📐 Diagrama: [state-file.mmd](../diagrams/domain/state-file.mmd)

---

### Alerta

**Descrição:** Notificação de um problema no cluster. Ciclo de vida simples: ativo até ser resolvido (manual ou automaticamente).

#### Estados Possíveis

| Estado | Descrição |
|--------|-----------|
| active | Problema detectado e não resolvido; visível no painel do admin |
| resolved | Problema corrigido; alerta arquivado com timestamp de resolução |

#### Transições

| De | Para | Gatilho | Condição | Ação |
|----|------|---------|----------|------|
| — (novo) | active | Sistema detecta condição anômala | Condição de alerta verdadeira (nó offline, replicação baixa, etc.) | Criar registro; notificar admin |
| active | resolved | Condição resolvida automaticamente ou admin resolve manualmente | Condição que gerou alerta não é mais verdadeira | Atualizar resolved=true + resolved_at; arquivar |

#### Transições Proibidas

- **resolved → active**: Alerta resolvido não reabre; se o problema retornar, novo alerta é criado
- **Alerta duplicado**: Se alerta ativo já existe para mesmo tipo + recurso, não criar novo (RN-A3)

#### Diagrama

> 📐 Diagrama: [state-alert.mmd](../diagrams/domain/state-alert.mmd)
