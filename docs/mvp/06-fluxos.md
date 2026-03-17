# Fluxos Críticos

Esta seção documenta os **2-3 fluxos mais importantes** da POC — aqueles que, se falharem, invalidam a prova de conceito. Cada fluxo descreve o caminho feliz passo a passo e os principais cenários de erro.

---

## Fluxo: Upload e Distribuição de Arquivo

**Descrição:** Usuário envia uma foto ou vídeo pelo web client; o sistema processa, otimiza, criptografa, divide em chunks e distribui entre nós com replicação 3x. É o fluxo central da POC — sem ele, o sistema não tem razão de existir.

**Atores envolvidos:** Membro, Web Client, Orquestrador, Pipeline de Mídia, StorageProvider, Nós

**Pré-condições:** Membro está autenticado; cluster tem pelo menos 3 nós ativos com espaço disponível.

### Caminho feliz

1. **Membro** seleciona arquivo(s) no web client e clica em "Upload"
2. **Web Client** envia arquivo para a API do orquestrador via REST (TLS)
3. **Orquestrador** registra o arquivo em `files` com status "processing" e enfileira job no Redis
4. **Pipeline de Mídia** consome job da fila e analisa o arquivo (resolução, formato, tamanho)
5. **Pipeline** otimiza: foto → resize max 1920px + WebP; vídeo → 1080p H.265/AV1
6. **Pipeline** gera preview: thumbnail ~50KB (foto) ou 480p ~5MB (vídeo)
7. **Pipeline** extrai metadados EXIF (data, GPS, câmera) e armazena no campo metadata
8. **Core SDK** divide conteúdo otimizado em chunks de ~4MB e calcula SHA-256 de cada
9. **Core SDK** criptografa cada chunk com AES-256-GCM usando file key derivada da master key
10. **Core SDK** consulta consistent hashing para determinar 3 nós destino por chunk
11. **Orquestrador** envia chunks criptografados para os 3 nós via StorageProvider
12. **Orquestrador** cria registros em `chunks` e `chunk_replicas` para cada chunk distribuído
13. **Orquestrador** cria manifest com lista de chunks, hashes e file key criptografada
14. **Orquestrador** replica manifest em 2+ nós adicionais
15. **Orquestrador** atualiza file status para "ready"
16. **Web Client** exibe confirmação com thumbnail do arquivo

**Resultado esperado:** Arquivo processado, otimizado, criptografado e distribuído com 3 réplicas por chunk; manifest criado e replicado; thumbnail disponível para navegação.

### Erros e exceções

| Passo | Falha possível | Comportamento do sistema |
| --- | --- | --- |
| 2 | Upload interrompido por falha de rede | Cliente faz retry; arquivo parcial descartado no servidor |
| 5 | FFmpeg falha na transcodificação (codec não suportado, arquivo corrompido) | Job marcado como erro; file status → "error"; alerta ao membro |
| 10 | Menos de 3 nós ativos disponíveis | Upload bloqueado; retorna erro "nós insuficientes para replicação mínima" |
| 11 | Nó destino falha durante recebimento do chunk | Selecionar próximo nó no consistent hash ring; retry no nó original após backoff |
| 11 | Nó S3/R2 retorna rate limit | Respeitar retry-after; enfileirar para retry com backoff exponencial |
| 14 | Falha ao replicar manifest | Manifest mantido no orquestrador; retry de replicação em background; alerta gerado |

### Regras de negócio aplicáveis

- **RN2:** Nenhum dado sai do dispositivo sem criptografia AES-256-GCM
- **RN1:** Todo chunk deve ter no mínimo 3 réplicas em nós diferentes
- **RN9:** Fotos → WebP max 1920px; vídeos → 1080p H.265/AV1
- **RN10:** Manifests replicados em múltiplos nós

---

## Fluxo: Recovery do Orquestrador via Seed Phrase

**Descrição:** Admin perdeu o servidor do orquestrador (falha de hardware, VPS destruída) e reconstrói o sistema completo em uma nova máquina usando apenas a seed phrase de 12 palavras. Este fluxo valida a premissa fundamental do sistema: o orquestrador é descartável.

**Atores envolvidos:** Admin, Nova VPS, Orquestrador (novo), Nós existentes, DNS

**Pré-condições:** Admin possui a seed phrase de 12 palavras; nós de armazenamento (S3/R2, dispositivos) ainda existem e contêm chunks e manifests; DNS aponta para nova VPS.

### Caminho feliz

1. **Admin** provisiona nova VPS e instala orquestrador via Docker
2. **Admin** inicia processo de recovery e insere seed phrase de 12 palavras
3. **Orquestrador** deriva master key da seed via BIP-39
4. **Orquestrador** descriptografa vaults dos membros (arquivos criptografados replicados nos nós) com a master key
5. **Vaults** liberam: credenciais S3/R2, chaves de criptografia, senhas dos membros, configuração do cluster, lista de nós conhecidos
6. **Orquestrador** conecta aos nós cloud (S3/R2) usando credenciais dos vaults dos membros
7. **Orquestrador** escaneia nós em busca de manifests replicados
8. **Orquestrador** reconstrói banco de metadados (PostgreSQL) a partir dos manifests encontrados
9. **Admin** atualiza DNS para apontar para nova VPS
10. **Nós locais** (agentes) detectam novo orquestrador via DNS e reconectam com retry + backoff
11. **Orquestrador** recebe heartbeats dos nós e atualiza status
12. **Orquestrador** valida integridade: cruza manifests com chunks existentes nos nós
13. **Orquestrador** identifica chunks com replicação abaixo de 3x e inicia auto-healing

**Resultado esperado:** Sistema completamente operacional em <2 horas; todos os nós reconectados; metadados reconstruídos; replicação restaurada; nenhum dado perdido.

### Erros e exceções

| Passo | Falha possível | Comportamento do sistema |
| --- | --- | --- |
| 3 | Seed phrase incorreta | Master key errada → vaults não descriptografam; mensagem clara ao admin |
| 5 | Vaults corrompidos ou não encontrados nos nós | Recovery parcial: admin precisa re-inserir credenciais S3/R2 manualmente |
| 7 | Manifests não encontrados em nenhum nó | Recovery impossível sem manifests; alerta crítico; chunks existem mas não podem ser reassemblados sem manifest |
| 10 | Nó local não consegue resolver DNS ou está offline | Nó reconectará quando voltar online; chunks desse nó temporariamente indisponíveis |
| 12 | Chunks faltando (nós destruídos durante downtime) | Auto-healing re-replica a partir de nós restantes; se chunk sem réplica → arquivo marcado como corrompido |

### Regras de negócio aplicáveis

- **RN3:** Seed phrase nunca armazenada digitalmente pelo sistema
- **RN4:** Master key derivada em memória, nunca persistida
- **RN5:** Tokens, credenciais e senhas vivem exclusivamente no vault criptografado de cada membro
- **RN10:** Manifests replicados em múltiplos nós para permitir recovery
- **RN1:** Auto-healing restaura fator de replicação 3x

---

## Fluxo: Auto-Healing (Nó Perdido)

**Descrição:** Um nó para de enviar heartbeats, é marcado como perdido, e o sistema automaticamente re-replica todos os chunks que estavam naquele nó para manter o fator de replicação 3x. Este fluxo valida a premissa de resiliência automática.

**Atores envolvidos:** Nó (falhando), Orquestrador (Scheduler), Nós restantes

**Pré-condições:** Cluster tem pelo menos 3 nós restantes após a perda; chunks do nó perdido possuem réplicas em outros nós.

### Caminho feliz

1. **Scheduler** detecta que um nó não enviou heartbeat por mais de 30 minutos
2. **Orquestrador** marca nó como "suspeito" e gera alerta
3. **Scheduler** aguarda mais 30 minutos (total 1h sem heartbeat)
4. **Orquestrador** marca nó como "perdido" e gera alerta crítico ao admin
5. **Orquestrador** consulta `chunk_replicas` para listar todos os chunks que tinham réplica no nó perdido
6. **Orquestrador** identifica chunks que agora têm menos de 3 réplicas
7. **Core SDK** para cada chunk sub-replicado, seleciona novo nó destino via consistent hashing (excluindo nó perdido)
8. **Orquestrador** copia chunk de uma réplica existente para o novo nó destino
9. **Orquestrador** cria novo registro em `chunk_replicas` e remove o registro do nó perdido
10. **Orquestrador** repete até todos os chunks terem 3+ réplicas
11. **Orquestrador** atualiza alerta como resolvido quando replicação está saudável

**Resultado esperado:** Todos os chunks restaurados com 3 réplicas; nenhum dado perdido; admin notificado; processo completado automaticamente sem intervenção.

### Erros e exceções

| Passo | Falha possível | Comportamento do sistema |
| --- | --- | --- |
| 3 | Nó volta online durante período de espera | Status volta para "online"; heartbeat retomado; auto-healing cancelado |
| 6 | Chunk sem nenhuma réplica restante (todos os nós falharam) | Chunk marcado como irrecuperável; arquivo afetado marcado como corrompido; alerta crítico |
| 7 | Nós restantes sem espaço suficiente | Alerta "espaço insuficiente para auto-healing"; admin precisa adicionar nós |
| 8 | Falha de rede durante cópia de chunk | Retry com backoff; chunk permanece na fila de re-replicação |

### Regras de negócio aplicáveis

- **RN1:** Todo chunk deve ter no mínimo 3 réplicas; auto-healing inicia em até 1 hora
- **RN7:** Chunks corrompidos detectados durante cópia são restaurados de outra réplica
- **RN8:** Se o nó perdido continha chunks órfãos, eles não são re-replicados (GC natural)
