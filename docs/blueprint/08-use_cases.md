# Casos de Uso

> Quais são as ações que os usuários podem realizar no sistema?

Cada caso de uso descreve uma interação completa entre um ator e o sistema para atingir um objetivo específico. Referências a regras de negócio (RN-XX) apontam para o [Modelo de Domínio](./04-domain_model.md).

---

## UC-001: Criar Cluster Familiar

**Ator:** Administrador Familiar

**Pré-condição:** Admin não possui cluster. Orquestrador está online.

#### Fluxo Principal

1. Admin acessa Web Client e seleciona "Criar Cluster"
2. Sistema exibe formulário com campo de nome do cluster
3. Admin preenche nome (ex.: "Família Prado") e confirma
4. Sistema gera seed phrase de 12 palavras (BIP-39) e deriva master key
5. Sistema gera par de chaves criptográficas e calcula cluster_id
6. Sistema cria vault individual do admin, criptografado com sua senha
7. Sistema persiste cluster e cria membro admin
8. Sistema exibe seed phrase com instruções: "Anote em papel. Esta é a ÚNICA vez."
9. Admin confirma que anotou (checkbox obrigatório)
10. Sistema marca cluster como ativo

#### Fluxos Alternativos

- **9a.** Admin não confirma: Sistema mantém seed visível na tela até confirmação; cluster já criado mas alerta persistente na UI

#### Fluxo de Exceção

- **E1.** Falha na geração de entropia (CSPRNG): Sistema retorna erro 500; não cria cluster com entropia fraca
- **E2.** PostgreSQL indisponível no passo 7: Retorna 503; seed phrase NÃO é exibida (cluster não criado)

**Pós-condição:** Cluster criado com identidade criptográfica; admin registrado; seed phrase exibida uma única vez; vault do admin inicializado.

**Regras de Negócio:** RN-C1, RN-C2, RN-C3, RN-C4 | **Requisitos:** RF-001, RF-047, RF-048, RF-049

---

## UC-002: Convidar Membro ao Cluster

**Ator:** Administrador Familiar
**Ator secundário:** Membro convidado

**Pré-condição:** Cluster existe e está ativo. Admin está autenticado com role "admin".

#### Fluxo Principal

1. Admin acessa painel de membros e clica "Convidar"
2. Sistema exibe formulário: email, role (membro/leitura)
3. Admin preenche e confirma
4. Sistema gera token de convite assinado com expiração (7 dias)
5. Sistema retorna link de convite
6. Admin envia link ao convidado (WhatsApp, email, etc.)
7. Convidado acessa link e preenche nome
8. Sistema valida token (assinatura + expiração)
9. Sistema cria membro com role configurada
10. Convidado é redirecionado para galeria do cluster

#### Fluxos Alternativos

- **8a.** Token expirado: Sistema exibe "Convite expirado. Solicite novo convite ao admin."
- **3a.** Admin seleciona role "admin": Sistema exige confirmação adicional ("Tem certeza? Admins podem gerenciar nós e membros.")

#### Fluxo de Exceção

- **E1.** Email já existe no cluster: Retorna 409; "Membro já existe neste cluster"
- **E2.** Token com assinatura inválida: Retorna 403; "Convite inválido"

**Pós-condição:** Novo membro adicionado ao cluster com permissões configuradas.

**Regras de Negócio:** RN-M1, RN-M2, RN-M4 | **Requisitos:** RF-002, RF-003

---

## UC-003: Registrar Nó de Armazenamento

**Ator:** Administrador Familiar

**Pré-condição:** Cluster ativo. Admin autenticado. Para nós cloud: credenciais S3/R2 disponíveis.

#### Fluxo Principal

1. Admin acessa painel de nós e clica "Adicionar Nó"
2. Sistema exibe opções: Local (PC/NAS), S3, R2, VPS
3. Admin seleciona tipo e preenche configuração (endpoint, credenciais, nome descritivo)
4. Sistema criptografa credenciais e armazena no vault do membro
5. Sistema testa conectividade (PUT/GET de chunk de teste)
6. Sistema reporta capacidade total e usada
7. Sistema registra nó em `nodes` (status: online)
8. Sistema adiciona nó ao ConsistentHashRing

#### Fluxos Alternativos

- **2a.** Nó local (PC/NAS): Admin instala agente de nó (binário Rust); agente registra automaticamente via POST /nodes/register
- **5a.** Teste de conectividade falha: Sistema exibe erro com detalhes; permite corrigir credenciais e re-testar

#### Fluxo de Exceção

- **E1.** Credenciais S3 inválidas: Retorna erro de autenticação AWS; não registra nó
- **E2.** Bucket não existe ou permissões insuficientes: Mensagem específica do provedor; sugestão de correção

**Pós-condição:** Nó registrado, online, com capacidade reportada; incluído no ConsistentHashRing para receber chunks.

**Regras de Negócio:** RN-N4, RN-N5 | **Requisitos:** RF-007, RF-016, RF-018, RF-022

---

## UC-004: Upload de Arquivo

**Ator:** Membro Familiar

**Pré-condição:** Membro autenticado com role "admin" ou "membro". Cluster com pelo menos 3 nós ativos.

#### Fluxo Principal

1. Membro acessa galeria e clica "Upload"
2. Sistema exibe seletor de arquivos (aceita fotos, vídeos, documentos)
3. Membro seleciona arquivo(s) e confirma
4. Sistema faz upload do arquivo para o Orquestrador
5. Sistema enfileira processamento no pipeline de mídia
6. Pipeline otimiza: foto→WebP 1920px; vídeo→1080p H.265/AV1
7. Pipeline gera preview (thumbnail/480p)
8. Pipeline divide em chunks, criptografa e distribui para 3 nós
9. Sistema cria manifest e replica em 2+ nós adicionais
10. Sistema exibe thumbnail na galeria (status: ready)

#### Fluxos Alternativos

- **3a.** Arquivo duplicado (hash idêntico já existe): Sistema notifica "Arquivo já existe no cluster"; chunks reutilizados; economia de espaço
- **6a.** Documento (não mídia): Skip otimização; chunk e distribui diretamente
- **5a.** Sync engine (upload automático): Passos 1-3 substituídos por detecção automática de novo arquivo em pasta monitorada

#### Fluxo de Exceção

- **E1.** Menos de 3 nós ativos: Retorna 503; "Nós insuficientes para garantir replicação mínima"
- **E2.** FFmpeg falha na transcodificação: File status → "error"; alerta ao membro com opção de retry
- **E3.** Upload interrompido por falha de rede: Web Client faz retry; dados parciais descartados após timeout

**Pós-condição:** Arquivo processado, otimizado, criptografado e distribuído com 3+ réplicas. Manifest criado e replicado. Thumbnail visível na galeria.

**Regras de Negócio:** RN-F1, RN-F2, RN-F3, RN-F4, RN-F6, RN-CH1, RN-CH2, RN-MA1 | **Requisitos:** RF-023 a RF-035, RF-038

---

## UC-005: Visualizar e Baixar Arquivo

**Ator:** Membro Familiar (qualquer role, incluindo "leitura")

**Pré-condição:** Membro autenticado. Arquivo com status "ready" no cluster.

#### Fluxo Principal

1. Membro acessa galeria do cluster
2. Sistema exibe grid de thumbnails (previews pré-gerados, ~50KB cada)
3. Membro clica em um arquivo para visualizar
4. Sistema exibe preview em tamanho maior (foto: thumbnail expandido; vídeo: player 480p)
5. Membro clica "Baixar original otimizado"
6. Sistema localiza chunks do arquivo via manifest
7. Sistema baixa chunks dos nós via StorageProvider
8. Core SDK descriptografa chunks com file key (derivada da master key)
9. Core SDK reassembla arquivo a partir dos chunks na ordem do manifest
10. Sistema entrega arquivo ao browser para download

#### Fluxos Alternativos

- **2a.** Timeline view: Membro navega por data em vez de grid; thumbnails carregam sob demanda (lazy loading)
- **4a.** Placeholder file em dispositivo local: Dispositivo mostra thumbnail; download do otimizado acontece em background quando solicitado

#### Fluxo de Exceção

- **E1.** Chunk indisponível (nó offline): Sistema tenta próxima réplica; se todas offline → mensagem "Arquivo temporariamente indisponível"
- **E2.** Chunk corrompido durante download: Core SDK verifica hash; se falha → tenta outra réplica
- **E3.** Senha do membro incorreta (vault do membro bloqueado): Impossível descriptografar; pedir membro para informar senha correta

**Pós-condição:** Membro visualizou preview ou baixou arquivo otimizado completo.

**Regras de Negócio:** RN-CH4, RN-MA2 | **Requisitos:** RF-062, RF-063

---

## UC-006: Desconectar Nó com Drain

**Ator:** Administrador Familiar

**Pré-condição:** Admin autenticado. Nó está online ou suspeito. Cluster tem nós suficientes para manter replicação 3x após remoção.

#### Fluxo Principal

1. Admin acessa painel de nós e seleciona nó a desconectar
2. Sistema exibe detalhes: capacidade, chunks armazenados, réplicas dependentes
3. Admin clica "Desconectar" e confirma
4. Sistema marca nó como "draining"
5. Sistema lista todos os chunks com réplica neste nó
6. Para cada chunk: verifica se existem 3+ réplicas em outros nós
7. Se chunk ficaria com < 3 réplicas: re-replica para outro nó via ConsistentHashRing
8. Sistema remove registros de chunk_replicas do nó sendo drenado
9. Sistema remove nó do ConsistentHashRing
10. Sistema marca nó como desconectado e remove de `nodes`

#### Fluxos Alternativos

- **6a.** Todos os chunks já têm 3+ réplicas em outros nós: Skip re-replicação; apenas remover registros

#### Fluxo de Exceção

- **E1.** Remoção deixaria cluster com < 3 nós: Bloqueado; "Não é possível remover — mínimo de 3 nós necessário"
- **E2.** Nó offline durante drain: Re-replicação usa réplicas de outros nós; chunks do nó offline tratados como já perdidos
- **E3.** Espaço insuficiente nos nós restantes: Drain parcial; alerta ao admin com progresso

**Pós-condição:** Todos os chunks migrados; replicação 3x mantida; nó removido do cluster.

**Regras de Negócio:** RN-N3, RN-N6, RN-CH1 | **Requisitos:** RF-010

---

## UC-007: Recovery do Sistema via Seed

**Ator:** Administrador Familiar

**Pré-condição:** Admin possui seed phrase de 12 palavras. Nova VPS provisionada com Docker. Nós de storage (S3/R2, agentes) ainda existem.

#### Fluxo Principal

1. Admin instala Orquestrador via docker compose up na nova VPS
2. Admin acessa interface de recovery
3. Admin insere seed phrase de 12 palavras
4. Sistema valida palavras contra wordlist BIP-39
5. Sistema deriva master key
6. Sistema busca e descriptografa vaults dos membros dos nós de storage
7. Sistema conecta a S3/R2 com credenciais dos vaults dos membros
8. Sistema escaneia e coleta manifests replicados
9. Sistema reconstrói banco PostgreSQL a partir dos manifests
10. Admin atualiza DNS para nova VPS
11. Agentes de nó reconectam via DNS
12. Sistema valida integridade e agenda auto-healing se necessário

#### Fluxos Alternativos

- **6a.** Vaults não encontrados: Admin insere credenciais S3/R2 manualmente; recovery parcial
- **11a.** Nós locais offline: Reconectarão quando voltarem online; recovery continua sem eles

#### Fluxo de Exceção

- **E1.** Seed phrase incorreta: Vaults não descriptografam; mensagem clara "Seed incorreta"
- **E2.** Nenhum manifest encontrado: Recovery impossível; alerta crítico

**Pós-condição:** Sistema operacional com metadados reconstruídos, nós reconectados, replicação restaurada.

**Regras de Negócio:** RN-C1, RN-V1, RN-V3, RN-MA5, RN-CH6 | **Requisitos:** RF-054 a RF-057

---

## UC-008: Monitorar Saúde do Cluster

**Ator:** Administrador Familiar (passivo — Sistema gera alertas automaticamente)

**Pré-condição:** Cluster ativo com pelo menos 1 nó.

#### Fluxo Principal

1. Scheduler executa checks periódicos (heartbeats, replicação, integridade)
2. Sistema detecta condição anômala (nó offline, replicação < 3x, token expirado, espaço < 20%)
3. Sistema gera alerta com tipo, severidade e mensagem descritiva
4. Admin visualiza alertas no painel do Web Client
5. Admin investiga e resolve (adiciona nó, re-autentica token, etc.)
6. Sistema detecta que condição foi resolvida e marca alerta como resolved

#### Fluxos Alternativos

- **2a.** Auto-healing resolve automaticamente: Alerta gerado → auto-healing executa → alerta auto-resolvido
- **4a.** Admin não vê alerta imediatamente: Alertas permanecem ativos até resolução; sem expiração

#### Fluxo de Exceção

- **E1.** Scheduler falha: Orquestrador detecta e reinicia scheduler; gap temporário na detecção

**Pós-condição:** Admin informado de problemas; ações corretivas tomadas; alertas resolvidos.

**Regras de Negócio:** RN-A1, RN-A2, RN-A3, RN-N1, RN-N2 | **Requisitos:** RF-071, RF-042, RF-008

---

## UC-009: Liberar Espaço no Dispositivo

**Ator:** Fotógrafo Amador / Membro Familiar

**Pré-condição:** Membro com dispositivo local contendo arquivos já sincronizados ao cluster (status: ready, 3+ réplicas confirmadas).

#### Fluxo Principal

1. Membro acessa configurações do dispositivo no Web Client ou agente local
2. Sistema exibe espaço ocupado por arquivos sincronizados vs thumbnails
3. Membro seleciona "Liberar espaço" (ou automático quando disco > 80%)
4. Sistema identifica arquivos com replicação 3x confirmada
5. Sistema substitui arquivo local por placeholder (thumbnail ~50KB)
6. Sistema libera espaço no disco local
7. Sistema exibe sumário: X GB liberados, Y arquivos convertidos para placeholder

#### Fluxos Alternativos

- **3a.** Liberação automática: Quando disco > 80%, agente de nó substitui automaticamente os arquivos mais antigos por placeholders

#### Fluxo de Exceção

- **E1.** Arquivo sem replicação 3x confirmada: NÃO substitui por placeholder; alerta "Aguardando replicação completa"

**Pós-condição:** Espaço liberado no dispositivo. Placeholders disponíveis localmente. Download sob demanda quando necessário.

**Regras de Negócio:** RN-F6, RN-CH1 | **Requisitos:** RF-062, RF-012

---

## UC-010: Buscar e Navegar pelo Acervo

**Ator:** Guardião de Memórias / Membro Familiar

**Pré-condição:** Membro autenticado. Cluster com arquivos (status: ready).

#### Fluxo Principal

1. Membro acessa galeria e escolhe modo de navegação (grid, timeline, busca)
2. Sistema exibe thumbnails com lazy loading e paginação por cursor
3. Membro digita busca (nome, data, tipo) ou navega por timeline
4. Sistema filtra resultados via query em `files` (metadata JSONB para EXIF)
5. Sistema exibe resultados com thumbnails
6. Membro clica para visualizar detalhes (preview, metadata, data, localização)

#### Fluxos Alternativos

- **1a.** Filtro por tipo: Membro seleciona "Fotos", "Vídeos" ou "Documentos"
- **3a.** Busca por data/local via EXIF: Sistema consulta metadata JSONB com índice GIN (fase 2)

#### Fluxo de Exceção

- **E1.** Nenhum resultado encontrado: Sistema exibe "Nenhum arquivo encontrado" com sugestão de ajustar filtros

**Pós-condição:** Membro encontrou e visualizou arquivos desejados.

**Regras de Negócio:** RN-F3 | **Requisitos:** RF-063, RF-064, RF-067
