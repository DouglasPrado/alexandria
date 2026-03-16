# PRD-001: Alexandria — Sistema de Armazenamento Familiar Distribuído

**Data:** 2026-03-16
**Status:** Rascunho
**Owner de Produto:** Douglas Prado
**Tech Lead:** Douglas Prado
**Stakeholders:** Família Prado
**Versão:** v1.0.0

---

## 1. Resumo Executivo

O Alexandria é um sistema de armazenamento familiar distribuído que permite guardar fotos, vídeos e documentos por décadas com alta durabilidade. Funciona como um "Google Drive familiar descentralizado", distribuindo dados criptografados entre dispositivos da família (computadores, celulares, NAS) e múltiplos provedores de cloud (S3, R2, Google Drive, Dropbox, OneDrive). O sistema prioriza preservação de longo prazo, redundância automática, otimização de espaço e privacidade total do usuário, permitindo recuperação completa do sistema através de uma frase de 12 palavras.

---

## 2. Problema

### 2.1 Situação atual

Famílias acumulam grandes volumes de dados digitais — fotos, vídeos, documentos — que crescem silenciosamente até atingir centenas de gigabytes. Atualmente, a maioria depende de um único provedor centralizado (Google Drive, Dropbox, iCloud) com espaço gratuito limitado. Backups manuais em HDs externos são esquecidos, discos degradam em 5-10 anos sem migração, e não existe uma solução que automatize a distribuição de dados entre múltiplos dispositivos e provedores com auto-reparação.

### 2.2 Evidências

| Fonte                  | Evidência                                                                                                                                                  | Data                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Análise de mercado     | Google Photos eliminou armazenamento ilimitado gratuito; free tier reduzido a 15GB                                                                         | 2021                                 |
| Dados técnicos         | HDDs duram 5-10 anos, SSDs ~10 anos sem migração                                                                                                           | Consenso da indústria                |
| Análise de provedores  | ~102GB de armazenamento gratuito disponível por pessoa ao combinar provedores (Google Drive 15GB, OneDrive 5GB, Dropbox 2GB, MEGA 20GB, pCloud 10GB, etc.) | 2026-03-15                           |
| Comportamento familiar | 20-60% de duplicação em fotos familiares (WhatsApp, compartilhamento entre membros)                                                                        | Estimativa baseada em padrões de uso |
| Custos crescentes      | Google One, Dropbox Plus, iCloud+ com preços crescentes ano a ano                                                                                          | Contínuo                             |
| Dados técnicos         | Bit rot (apodrecimento silencioso de bits) afeta mídias de armazenamento sem verificação                                                                   | Consenso da indústria                |

### 2.3 Impacto de não resolver

- Perda irreversível de memórias familiares (fotos, vídeos de décadas) por falha de disco ou exclusão de conta
- Custos crescentes de armazenamento cloud sem controle do usuário
- Dependência total de um único fornecedor (vendor lock-in)
- Ausência de recuperação de desastre (incêndio, roubo, falha de hardware)
- Dados familiares dispersos sem organização ou busca unificada

---

## 3. Visão da Solução

### 3.1 Elevator Pitch

Para **famílias que precisam preservar memórias digitais por décadas**, o **Alexandria** é um **sistema de armazenamento distribuído** que **garante durabilidade, privacidade e custo mínimo**. Diferente de **Google Drive, Dropbox ou iCloud**, nossa solução **distribui dados criptografados entre múltiplos dispositivos e provedores, permitindo recuperação completa do sistema com apenas 12 palavras**.

### 3.2 Solução proposta

Um ecossistema composto por:

- **Orquestrador central** em VPS — gerencia metadados, coordena distribuição de chunks, pode ser substituído ou recriado a qualquer momento
- **Nós de armazenamento** — computadores, celulares, NAS, VPS, buckets cloud (S3, R2, Google Drive, Dropbox, OneDrive) — guardam chunks criptografados e manifests
- **Clientes** (Web, Desktop, Mobile) — interface para upload, visualização e sincronização automática
- **Pipeline de otimização** — fotos convertidas para Full HD WebP (~300-600KB), vídeos para 1080p H.265/AV1 (~400-600MB)
- **Sistema de recuperação** — seed phrase de 12 palavras + vault criptografado permitem reconstruir o orquestrador e reconectar todos os nós

### 3.3 Princípios de design

- **LOCKSS** — "Lots Of Copies Keep Stuff Safe": múltiplas cópias em lugares diferentes garantem sobrevivência
- **Orquestrador descartável** — o orquestrador é o bibliotecário, não a biblioteca; pode ser substituído sem perda de dados
- **Encrypt before upload** — zero-knowledge; nem o orquestrador nem os provedores cloud conseguem ler os dados
- **Full HD é suficiente** — a maioria das telas tem ~2 megapixels; otimizar para percepção humana, não para fidelidade absoluta
- **Embrace failure** — o sistema assume que nós vão falhar e se auto-repara constantemente
- **Clusters familiares permissionados** — rede privada, não pública; apenas membros autorizados participam

---

## 4. Usuários e Personas

### 4.1 Personas

| Persona                | Perfil                                                 | Necessidade principal                                         | Frequência de uso | Nível técnico |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------- | ----------------- | ------------- |
| Administrador Familiar | Pai/mãe técnico que configura e mantém o sistema       | Garantir que memórias da família estejam seguras e acessíveis | Semanal           | Alto          |
| Membro Familiar        | Mãe/pai, tios, avós que usam o sistema no dia-a-dia    | Salvar e visualizar fotos/vídeos sem complicação              | Diário            | Baixo         |
| Fotógrafo Amador       | Membro da família que tira muitas fotos e grava vídeos | Upload automático, economizar espaço no celular               | Diário            | Médio         |
| Guardião de Memórias   | Avô/avó ou membro mais velho, curador do acervo        | Acessar fotos antigas, organizar por eventos e datas          | Mensal            | Baixo         |

### 4.2 Jobs to Be Done

| Persona                | Job                                                                                                                              | Resultado esperado                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Membro Familiar        | Quando tiro fotos no celular, quero que sejam salvas automaticamente, para não perder memórias                                   | Fotos aparecem no sistema familiar sem intervenção                        |
| Guardião de Memórias   | Quando quero ver fotos de 2015, quero navegar por timeline e buscar, para encontrar rapidamente                                  | Fotos carregam em <1s com thumbnails, busca retorna resultados relevantes |
| Administrador Familiar | Quando meu computador quebra, quero recuperar o sistema com minha frase de 12 palavras, para que nenhum desastre seja permanente | Sistema reconstruído completamente em <2 horas                            |
| Administrador Familiar | Quando adiciono um novo dispositivo, quero que ele participe do armazenamento automaticamente, para expandir a capacidade        | Dispositivo registrado e recebendo chunks em minutos                      |
| Fotógrafo Amador       | Quando meu celular fica cheio, quero que o sistema libere espaço mantendo previews, para continuar tirando fotos                 | Celular mostra thumbnails, originais otimizados vivem no cluster          |

### 4.3 Jornada atual do usuário

1. Tira foto no celular
2. Espera sync automático do Google Photos (15GB gratuitos)
3. Quando espaço acaba, paga plano ou deleta fotos
4. Faz backup manual em HD externo (esquece frequentemente)
5. HD externo fica guardado sem verificação por anos
6. Sem organização entre dispositivos da família
7. Sem proteção contra perda total (incêndio, roubo, exclusão de conta)

**Pontos de dor na jornada atual:**

- Dependência de um único provedor com custo crescente
- Backup manual é esquecido e não verificado
- Não há redundância real — se o HD falhar, dados perdidos
- Fotos duplicadas entre dispositivos da família consomem espaço

---

## 5. Objetivos e Métricas de Sucesso

### 5.1 Objetivos

| ID     | Objetivo                                                            | Prioridade | Alinhamento estratégico                   |
| ------ | ------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| OBJ-01 | Zero perda de dados com replicação mínima de 3 cópias por chunk     | Alta       | Durabilidade de longo prazo               |
| OBJ-02 | Recuperação completa do sistema via seed phrase em menos de 2 horas | Alta       | Resiliência e autonomia do usuário        |
| OBJ-03 | Redução de 70%+ no armazenamento via otimização de mídia            | Alta       | Eficiência de custo                       |
| OBJ-04 | Suportar 5+ provedores cloud simultaneamente como nós               | Média      | Flexibilidade e independência de provedor |
| OBJ-05 | Upload automático de fotos/vídeos em todos os clientes              | Média      | Usabilidade e adoção                      |

### 5.2 Métricas de sucesso (KPIs)

| Métrica                              | Linha de base       | Meta                               | Prazo            | Como medir                                          |
| ------------------------------------ | ------------------- | ---------------------------------- | ---------------- | --------------------------------------------------- |
| Durabilidade de dados                | N/A                 | 99.999999999% (11 nines)           | Contínuo         | Simulação estatística + monitoramento de replicação |
| Taxa de replicação saudável          | N/A                 | >99% chunks com 3+ réplicas        | 3 meses após MVP | Dashboard de saúde do cluster                       |
| Redução de armazenamento (fotos)     | ~5-8MB/foto JPEG    | ~300-600KB/foto WebP Full HD       | MVP              | Benchmark com acervo real                           |
| Redução de armazenamento (vídeos)    | ~2GB/vídeo 4K H.264 | ~400-600MB/vídeo 1080p AV1         | MVP              | Benchmark com acervo real                           |
| Tempo de recuperação do orquestrador | N/A                 | <2 horas                           | Fase 3           | Disaster drill                                      |
| Deduplicação familiar                | 0%                  | 30-70% redução                     | Fase 2           | Análise de acervo real                              |
| Adoção familiar                      | 0                   | 100% dos membros da família usando | 6 meses          | Telemetria de uso                                   |

### 5.3 Critérios de sucesso mínimo (guardrails)

- Integridade de dados: 0% de chunks corrompidos não detectados
- Tempo de resposta da API: p95 < 500ms para operações de metadata
- Disponibilidade do orquestrador: >99.5%
- Nenhum token de cloud armazenado em texto puro
- Nenhuma comunicação entre componentes sem criptografia (TLS)

---

## 6. Não-objetivos

- **Não substituir Google Photos** como aplicativo de visualização completo nesta fase
- **Não suportar rede pública/aberta** — somente clusters familiares permissionados
- **Não armazenar arquivos originais** — somente versões otimizadas + preview
- **Não implementar blockchain ou NFTs** para integridade (hashes SHA-256 são suficientes)
- **Não construir rede peer-to-peer completa** na v1 (usar orquestrador centralizado)
- **Não oferecer serviço comercial multi-tenant** nesta fase
- **Não implementar edição colaborativa** de documentos
- **Não suportar streaming de vídeo em tempo real** (download sob demanda é suficiente para MVP)

---

## 7. Requisitos Funcionais

### 7.1 Capacidades

#### Gerenciamento de Cluster Familiar

| ID     | Requisito                                                                              | Prioridade | Critério de aceitação                                                            |
| ------ | -------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| RF-001 | Criar grupo familiar com identidade criptográfica (cluster_id = hash da chave pública) | Must       | Cluster criado com cluster_id único e par de chaves                              |
| RF-002 | Convidar membros via token assinado com expiração                                      | Must       | Membro aceita convite e pode adicionar dispositivos ao cluster                   |
| RF-003 | Definir permissões por membro (admin, membro, leitura)                                 | Must       | Permissões aplicadas e verificadas em cada operação                              |
| RF-004 | Auditoria de atividades do cluster (log de operações)                                  | Should     | Log de todas as operações acessível ao admin                                     |
| RF-005 | Multi-admin e recovery guardians (múltiplas seeds)                                     | Could      | Múltiplos admins podem recuperar o sistema independentemente                     |
| RF-006 | Governança familiar (transferência de admin, saída de membro)                          | Should     | Admin pode transferir controle; membro pode sair sem perder dados compartilhados |

#### Gerenciamento de Nós

| ID     | Requisito                                                                         | Prioridade | Critério de aceitação                                                                         |
| ------ | --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| RF-007 | Registrar novo nó (computador, celular, NAS, VPS, cloud bucket)                   | Must       | Nó registrado, visível no cluster e reportando capacidade                                     |
| RF-008 | Heartbeat monitoring de nós (sinais periódicos de "estou vivo")                   | Must       | Nós sem heartbeat por X minutos marcados como suspeitos; após timeout, marcados como perdidos |
| RF-009 | Configurar quota/limite de armazenamento por nó                                   | Should     | Nó nunca excede limite configurado pelo usuário                                               |
| RF-010 | Desconectar nó com drain (migrar todos os chunks antes de remover)                | Must       | Todos os chunks migrados para outros nós antes da desconexão; replicação mantida              |
| RF-011 | Classificar nós em tiers: hot (sempre online), warm (frequente), cold (ocasional) | Should     | Política de armazenamento respeita tier do nó; cold nodes recebem snapshots periódicos        |
| RF-012 | Armazenamento elástico (expulsar chunks quando disco local enche)                 | Should     | Chunks removidos automaticamente quando disco >80%; somente chunks com réplicas em outros nós |
| RF-013 | Virtual nodes para consistent hashing proporcional à capacidade                   | Should     | Nós com mais capacidade recebem proporcionalmente mais chunks                                 |
| RF-014 | Descoberta de nós via bootstrap nodes + DNS fixo                                  | Must       | Nós reconectam automaticamente ao orquestrador após troca de VPS via DNS                      |
| RF-015 | Descoberta peer-to-peer via gossip protocol / DHT                                 | Won't      | Adiado para versão futura — complexidade excessiva para v1                                    |

#### Integração com Provedores Cloud

| ID     | Requisito                                                                 | Prioridade | Critério de aceitação                                                                       |
| ------ | ------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| RF-016 | Conectar contas cloud via OAuth (Google Drive, Dropbox, OneDrive)         | Must       | Token de acesso + refresh token obtidos e armazenados criptografados no vault               |
| RF-017 | Suporte a múltiplas contas do mesmo provedor                              | Must       | 3+ contas Google Drive funcionam como nós separados com capacidade independente             |
| RF-018 | Integração S3-compatible (AWS S3, Cloudflare R2, Backblaze B2)            | Must       | Chunks armazenados e recuperados via API S3 standard                                        |
| RF-019 | Monitoramento de espaço livre por conta/bucket cloud                      | Must       | Dashboard mostra espaço total, usado e livre por nó cloud                                   |
| RF-020 | Renovação automática de refresh tokens expirados                          | Should     | Tokens renovados sem intervenção do usuário; alerta se falhar                               |
| RF-021 | Rate limiting por provedor para respeitar limites de API                  | Must       | Nenhuma requisição bloqueada por rate limit do provedor                                     |
| RF-022 | StorageProvider interface unificada (put/get/exists/delete/list/capacity) | Must       | Qualquer provedor implementa a mesma interface; trocar provedor não afeta lógica do sistema |

#### Upload e Pipeline de Processamento

| ID     | Requisito                                                                   | Prioridade | Critério de aceitação                                                                    |
| ------ | --------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| RF-023 | Upload manual de arquivos via cliente                                       | Must       | Arquivo recebido, processado pelo pipeline e distribuído                                 |
| RF-024 | Detecção automática de novos arquivos (sync engine)                         | Must       | Novos arquivos em pastas monitoradas detectados e enviados automaticamente               |
| RF-025 | Chunking de arquivos em blocos de tamanho fixo (~4MB)                       | Must       | Arquivo dividido em chunks; cada chunk recebe hash SHA-256                               |
| RF-026 | Criação de manifest para cada arquivo (lista de chunks + hashes + metadata) | Must       | Manifest criado, assinado e replicado em múltiplos nós                                   |
| RF-027 | Criptografia AES-256-GCM de chunks no cliente antes do upload               | Must       | Chunks criptografados; nenhum dado em texto puro sai do dispositivo                      |
| RF-028 | Deduplicação via content-addressable storage (hash como identificador)      | Must       | Chunks com hash idêntico armazenados apenas uma vez; referências criadas para duplicatas |
| RF-029 | Compressão automática de chunks com Zstandard quando vantajosa              | Should     | Chunks comprimidos se compressão reduzir tamanho em >10%                                 |
| RF-030 | Distribuição de chunks via consistent hashing entre nós                     | Must       | Chunks distribuídos proporcionalmente à capacidade dos nós                               |

#### Otimização de Mídia

| ID     | Requisito                                                                                         | Prioridade | Critério de aceitação                                                 |
| ------ | ------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| RF-031 | Fotos: redimensionar para máximo 1920px no maior lado, converter para WebP                        | Must       | Foto original ~5-8MB vira ~300-600KB WebP; aspect ratio preservado    |
| RF-032 | Vídeos: downscale para 1080p, transcodificar para H.265 ou AV1                                    | Must       | Vídeo 4K 2GB vira ~400-600MB em 1080p; qualidade visualmente idêntica |
| RF-033 | Gerar preview (thumbnail ~50KB para fotos; 480p ~5MB para vídeos)                                 | Must       | Preview disponível instantaneamente para navegação                    |
| RF-034 | Preservar metadados EXIF (GPS, data, câmera, lente) em metadata separado                          | Must       | EXIF extraído, armazenado no metadata do manifest; nunca perdido      |
| RF-035 | Pipeline completo: upload → análise → resize → transcode → preview → encrypt → chunk → distribute | Must       | Pipeline funcionando end-to-end                                       |
| RF-036 | Fila de processamento com workers paralelos para transcodificação                                 | Should     | Vídeos processados em background sem bloquear uploads                 |
| RF-037 | Controle de qualidade perceptual para vídeo (CRF ~30, bitrate alvo ~4Mbps)                        | Should     | Qualidade visualmente idêntica ao original para olho humano           |

#### Replicação e Redundância

| ID     | Requisito                                                                | Prioridade | Critério de aceitação                                                              |
| ------ | ------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------- |
| RF-038 | Replicação mínima de 3 cópias por chunk em nós diferentes                | Must       | Nenhum chunk com menos de 3 réplicas por mais de 1 hora                            |
| RF-039 | Diversidade obrigatória de nós (1 local + 1 cloud + 1 outro dispositivo) | Should     | Réplicas nunca todas no mesmo tipo de nó ou provedor                               |
| RF-040 | Auto-reparação (self-healing) quando nó é perdido                        | Must       | Chunks do nó perdido re-replicados automaticamente para manter fator 3             |
| RF-041 | Erasure coding opcional (ex: 10 shards dados + 4 redundância)            | Could      | Arquivo reconstruível com perda de até 4 shards; economia de ~40% vs replicação 3x |
| RF-042 | Monitoramento contínuo de saúde de replicação                            | Must       | Dashboard e alertas mostram replication health em tempo real                       |

#### Integridade e Manutenção

| ID     | Requisito                                                                         | Prioridade | Critério de aceitação                                            |
| ------ | --------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| RF-043 | Scrubbing periódico (recalcular hashes, detectar corrupção, restaurar de réplica) | Must       | Corrupção detectada e reparada automaticamente; log gerado       |
| RF-044 | Garbage collection de chunks órfãos (sem referência em nenhum manifest)           | Must       | Chunks sem referência removidos periodicamente; storage liberado |
| RF-045 | Rebalanceamento automático quando nós entram, saem ou mudam de capacidade         | Must       | Cluster equilibrado após mudanças; nenhum nó sobrecarregado      |
| RF-046 | Scheduler interno para tarefas periódicas (scrubbing, GC, rebalancing)            | Must       | Tarefas executam automaticamente em intervalos configuráveis     |

#### Segurança e Criptografia

| ID     | Requisito                                                                     | Prioridade | Critério de aceitação                                                                                  |
| ------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| RF-047 | Gerar seed phrase de 12 palavras (padrão BIP-39) na criação do cluster        | Must       | Seed gera master key deterministicamente; usuário anota e guarda com segurança                         |
| RF-048 | Envelope encryption (seed → master key → file keys → chunk keys)              | Must       | Cada arquivo possui sua própria chave derivada; comprometimento de uma chave não afeta outros arquivos |
| RF-049 | Vault criptografado para tokens, credenciais e chaves (modelo tipo 1Password) | Must       | Vault desbloqueado somente com chave derivada da seed; inacessível sem seed                            |
| RF-050 | Tokens OAuth nunca em texto puro; usados somente em memória                   | Must       | Tokens criptografados no vault; descriptografados em memória somente durante uso                       |
| RF-051 | Autenticação mútua entre nós (mutual TLS ou Ed25519)                          | Should     | Nós não autorizados rejeitados automaticamente                                                         |
| RF-052 | Assinatura criptográfica de manifests                                         | Should     | Manifests falsificados ou alterados rejeitados na validação                                            |
| RF-053 | TLS 1.3 para toda comunicação entre componentes                               | Must       | Nenhuma comunicação sem criptografia                                                                   |

#### Recuperação do Sistema

| ID     | Requisito                                                                      | Prioridade | Critério de aceitação                                                                              |
| ------ | ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| RF-054 | Recuperar orquestrador com seed phrase em nova VPS                             | Must       | seed → master key → vault descriptografado → reconectar nós → rebuild índice → sistema operacional |
| RF-055 | Metadata mínimo embutido em cada chunk (file_id, chunk_index, hash, timestamp) | Must       | Chunks são auto-descritivos; sistema pode ser reconstruído escaneando chunks                       |
| RF-056 | Manifests replicados em múltiplos nós (não apenas no orquestrador)             | Must       | Manifests disponíveis para reconstrução mesmo sem orquestrador                                     |
| RF-057 | Reconexão automática de nós via DNS fixo + retry com backoff                   | Must       | Nós reconectam quando novo orquestrador sobe no mesmo domínio                                      |
| RF-058 | Testes automáticos de recuperação (disaster drills periódicos)                 | Could      | Sistema reconstrói arquivos aleatórios periodicamente para validar integridade                     |

#### Versionamento e Retenção

| ID     | Requisito                                                            | Prioridade | Critério de aceitação                                         |
| ------ | -------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| RF-059 | Versionamento de arquivos com deduplicação chunk-level entre versões | Should     | Apenas chunks modificados armazenados; economia significativa |
| RF-060 | Política de retenção configurável (últimas N versões ou por tempo)   | Should     | Versões antigas expiram automaticamente conforme política     |
| RF-061 | Snapshots imutáveis periódicos do acervo completo                    | Could      | Snapshot mensal/anual criado automaticamente                  |

#### Visualização e Clientes

| ID     | Requisito                                          | Prioridade | Critério de aceitação                                                             |
| ------ | -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| RF-062 | Placeholder files com download sob demanda         | Must       | Dispositivo mostra preview leve; download do original otimizado quando necessário |
| RF-063 | Timeline de fotos/vídeos com navegação cronológica | Should     | Thumbnails carregam em <1s; navegação fluida                                      |
| RF-064 | Busca por nome, data, tipo, tags e metadados       | Should     | Resultados retornados em <1s                                                      |
| RF-065 | Streaming de vídeo sob demanda                     | Could      | Vídeo inicia reprodução em <3 segundos                                            |
| RF-066 | Exportação completa do acervo (tar + manifests)    | Should     | Usuário pode sair do sistema sem lock-in; dados portáveis                         |

#### Indexação e Inteligência

| ID     | Requisito                                         | Prioridade | Critério de aceitação                                 |
| ------ | ------------------------------------------------- | ---------- | ----------------------------------------------------- |
| RF-067 | EXIF parsing automático (data, GPS, câmera)       | Should     | Metadados extraídos automaticamente de todas as fotos |
| RF-068 | Reconhecimento facial para agrupamento de pessoas | Could      | Faces agrupadas automaticamente; usuário pode nomear  |
| RF-069 | OCR em documentos para busca de texto             | Could      | Texto extraído e pesquisável                          |
| RF-070 | Organização automática por data/local/evento      | Should     | Fotos agrupadas automaticamente por critérios         |

#### Operação e Monitoramento

| ID     | Requisito                                                                                             | Prioridade | Critério de aceitação                               |
| ------ | ----------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| RF-071 | Alertas automáticos (nó offline, replicação baixa, token expirado, espaço baixo, erro de integridade) | Must       | Admin notificado em <5 minutos de qualquer problema |
| RF-072 | Dashboard de saúde do cluster (capacidade, replicação, nós online)                                    | Should     | Visão consolidada do estado do sistema              |
| RF-073 | Logs estruturados de todas as operações                                                               | Must       | Logs pesquisáveis para troubleshooting              |
| RF-074 | Rate limiting e controle de banda para uploads/downloads                                              | Should     | Upload/download não satura rede doméstica           |

#### Evolução e Protocolo

| ID     | Requisito                                                                        | Prioridade | Critério de aceitação                                               |
| ------ | -------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| RF-075 | Family Storage Protocol (FSP) — protocolo documentado para comunicação entre nós | Should     | Protocolo versionado; qualquer cliente pode implementar             |
| RF-076 | Atualização automática de clientes e agentes de nó                               | Could      | Rolling upgrade sem downtime e sem perda de dados                   |
| RF-077 | Migração de formatos ao longo do tempo (workers de conversão)                    | Could      | Workers convertem formatos obsoletos para modernos automaticamente  |
| RF-078 | Proteção contra ransomware (detectar alterações massivas anômalas)               | Could      | Sync bloqueado e admin alertado quando mudanças massivas detectadas |
| RF-079 | Quotas de armazenamento por usuário no cluster                                   | Should     | Nenhum usuário excede quota configurada pelo admin                  |

### 7.2 Priorização (MoSCoW)

| Prioridade                 | Requisitos                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must have**              | RF-001 a RF-003, RF-007, RF-008, RF-010, RF-014, RF-016 a RF-019, RF-021 a RF-028, RF-030 a RF-035, RF-038, RF-040, RF-042 a RF-046, RF-047 a RF-050, RF-053 a RF-057, RF-062, RF-071, RF-073 |
| **Should have**            | RF-004, RF-006, RF-009, RF-011 a RF-013, RF-020, RF-029, RF-036, RF-037, RF-039, RF-051, RF-052, RF-059, RF-060, RF-063, RF-064, RF-066, RF-067, RF-070, RF-072, RF-074, RF-075, RF-079       |
| **Could have**             | RF-005, RF-041, RF-058, RF-061, RF-065, RF-068, RF-069, RF-076 a RF-078                                                                                                                       |
| **Won't have (this time)** | RF-015 (P2P/DHT), blockchain/NFTs, rede pública de armazenamento, serviço comercial multi-tenant                                                                                              |

---

## 8. Requisitos Não Funcionais

| ID      | Categoria        | Requisito                                      | Meta                                      | Como medir                                     |
| ------- | ---------------- | ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| RNF-001 | Durabilidade     | Durabilidade de dados no cluster               | 99.999999999% (11 nines)                  | Simulação estatística + monitoramento contínuo |
| RNF-002 | Disponibilidade  | Uptime do orquestrador                         | >99.5%                                    | Monitoramento externo                          |
| RNF-003 | Performance      | Tempo de resposta API de metadata              | p95 < 500ms                               | APM / métricas de latência                     |
| RNF-004 | Performance      | Upload paralelo de chunks                      | Saturar banda disponível                  | Load test                                      |
| RNF-005 | Segurança        | Criptografia de dados em repouso               | AES-256-GCM em todos os chunks            | Auditoria de segurança                         |
| RNF-006 | Segurança        | Criptografia em trânsito                       | TLS 1.3 em todas as comunicações          | Scan de segurança                              |
| RNF-007 | Escalabilidade   | Nós suportados por cluster                     | Até 50 nós                                | Load test                                      |
| RNF-008 | Escalabilidade   | Usuários por cluster                           | Até 10 usuários                           | Teste funcional                                |
| RNF-009 | Escalabilidade   | Armazenamento total por cluster                | Até 100TB                                 | Teste de capacidade                            |
| RNF-010 | Eficiência       | Redução de armazenamento para fotos            | 10-20x vs original JPEG                   | Benchmark com acervo real                      |
| RNF-011 | Eficiência       | Redução de armazenamento para vídeos           | 3-5x vs original H.264 4K                 | Benchmark com acervo real                      |
| RNF-012 | Recuperabilidade | Tempo de reconstrução do orquestrador via seed | <2 horas                                  | Disaster drill                                 |
| RNF-013 | Compatibilidade  | Browsers suportados (web client)               | Chrome, Firefox, Safari últimas 2 versões | Testes cross-browser                           |
| RNF-014 | Portabilidade    | Plataformas desktop                            | macOS, Windows, Linux (via Tauri)         | Build matrix                                   |
| RNF-015 | Portabilidade    | Plataformas mobile                             | iOS, Android (via React Native)           | Build matrix                                   |

---

## 9. User Stories e Cenários

### 9.1 User Stories

| ID     | Persona   | Story                                                                                                        | Critério de aceitação                                              |
| ------ | --------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| US-001 | Admin     | Como admin, quero criar um cluster familiar, para que minha família tenha armazenamento compartilhado seguro | Cluster criado com cluster_id único e seed phrase gerada           |
| US-002 | Admin     | Como admin, quero convidar membros, para que eles participem do sistema                                      | Membro recebe convite, aceita e pode adicionar dispositivos        |
| US-003 | Membro    | Como membro, quero que minhas fotos sejam salvas automaticamente, para não perder memórias                   | Sync engine detecta novas fotos e envia ao cluster sem intervenção |
| US-004 | Guardião  | Como guardião, quero ver fotos antigas rapidamente, para reviver memórias                                    | Thumbnails carregam em <1s; Full HD sob demanda                    |
| US-005 | Admin     | Como admin, quero adicionar um bucket S3 como nó, para aumentar armazenamento                                | Bucket registrado via credenciais S3 e recebendo chunks            |
| US-006 | Admin     | Como admin, quero desconectar um nó com segurança, para que dados não se percam                              | Drain completo antes da desconexão; replicação mantida             |
| US-007 | Sistema   | Como sistema, quero replicar chunks automaticamente, para manter redundância mínima                          | Chunks com <3 réplicas re-replicados automaticamente em <1h        |
| US-008 | Fotógrafo | Como fotógrafo amador, quero que meu celular não fique cheio, para continuar tirando fotos                   | Placeholder + quota respeitada; espaço liberado automaticamente    |
| US-009 | Admin     | Como admin, quero recuperar o sistema com 12 palavras após desastre, para que a perda seja recuperável       | seed → vault → nós → índice reconstruído em <2h                    |
| US-010 | Sistema   | Como sistema, quero otimizar fotos para WebP Full HD, para economizar 70%+ de espaço                         | Foto 5-8MB → 300-600KB sem perda perceptível de qualidade          |

### 9.2 Cenários detalhados

#### Cenário: Upload de foto do celular

**Contexto:** Membro da família tira foto com celular e sync engine está ativo.

**Fluxo principal:**

1. Sync engine detecta nova foto no rolo da câmera
2. Pipeline analisa mídia (resolução, formato, tamanho)
3. Redimensiona para max 1920px no maior lado, preservando aspect ratio
4. Converte para WebP com qualidade perceptual alta
5. Gera thumbnail (~50KB)
6. Divide resultado em chunks de ~4MB, calcula SHA-256 de cada
7. Verifica deduplicação (hash já existe no cluster?)
8. Criptografa chunks com AES-256-GCM
9. Distribui para 3 nós via consistent hashing
10. Registra manifest e metadata no orquestrador
11. Substitui foto original por placeholder (thumbnail) no celular

**Fluxos alternativos:**

- Se foto já existe (hash idêntico no cluster) → apenas criar referência (deduplicação); não armazenar novamente
- Se nó destino está offline → selecionar próximo nó disponível no consistent hash ring
- Se celular sem espaço → expulsar chunks menos importantes localmente antes do upload

**Cenários de erro:**

- Falha de rede durante upload → retry com backoff exponencial; chunks parciais descartados
- Chunk corrompido no destino → verificar hash, re-enviar; alertar se persistir
- Orquestrador offline → enfileirar manifest localmente; enviar quando reconectar

---

## 10. Escopo e Fases de Entrega

### 10.1 Escopo funcional

**Incluído nesta iniciativa:**

- Sistema completo de armazenamento distribuído familiar (RF-001 a RF-079)
- Clientes Web, Desktop e Mobile
- Integração com S3, R2, Google Drive, Dropbox, OneDrive
- Pipeline de otimização de mídia
- Sistema de recuperação via seed phrase

**Explicitamente excluído:**

- Rede peer-to-peer pura (RF-015) — será tratado em fase futura
- Blockchain/NFTs — decidido contra após análise na conversa
- Serviço comercial multi-tenant — fora do escopo familiar
- Rede pública de armazenamento — apenas clusters familiares

### 10.2 Fases de entrega

| Fase | Nome     | Objetivo                                        | Entregáveis                                                                                                                                                                                                                                                     | Critério de entrada na próxima fase                |
| ---- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 0    | Fundação | Infraestrutura base, contratos e core SDK       | Seed/key management, chunking engine, StorageProvider interface, manifest system, hash engine (SHA-256), criptografia AES-256-GCM, consistent hashing, modelo de dados                                                                                          | Arquitetura validada com testes unitários          |
| 1    | MVP      | Fluxo principal funcionando end-to-end          | Orquestrador básico (API + metadata DB + scheduler), upload/download, replicação 3x, integração S3/R2/local, media optimization pipeline (fotos WebP + vídeos H.265), placeholder files, web client básico, alertas, recovery via seed, heartbeat, auto-healing | Família do dev usando por 1 mês sem perda de dados |
| 2    | Evolução | Features complementares e qualidade             | Deduplicação global, garbage collection, rebalanceamento, versionamento, busca, dashboard, integração Google Drive/Dropbox/OneDrive via OAuth, desktop client (Tauri), FSP v1, quotas por usuário, tiered storage, observabilidade                              | Beta com 2-3 famílias estável                      |
| 3    | Escala   | Otimização, inteligência e resiliência avançada | Erasure coding, mobile client (React Native), indexação inteligente (EXIF, faces, OCR), disaster drills automáticos, proteção ransomware, migração de formatos, auto-update de clientes, cold storage optimization                                              | GA com documentação completa                       |

### 10.3 MVP — Definição mínima

**Funcionalidades essenciais do MVP:**

- Criar cluster familiar + convidar membros
- Registrar nós (local + S3/R2)
- Upload com pipeline completo (resize, compress, chunk, encrypt, distribute)
- Replicação 3x com auto-healing
- Download/visualização com placeholder
- Seed phrase + vault + recuperação do orquestrador
- Web client básico (upload, galeria, download)
- Alertas de saúde do cluster (nó offline, replicação baixa)

**O que NÃO está no MVP:**

- Deduplicação global (fase 2)
- Desktop/mobile nativos (fase 2/3)
- Erasure coding (fase 3)
- Indexação inteligente (fase 3)
- Versionamento de arquivos (fase 2)
- Integração OAuth clouds (fase 2)

---

## 11. Design e Experiência do Usuário

### 11.1 Fluxo principal do usuário

1. Admin instala orquestrador em VPS (Docker)
2. Sistema gera seed phrase de 12 palavras — admin anota e guarda com segurança
3. Admin convida membros da família via link/token
4. Membros instalam clientes (web/desktop/mobile) e conectam seus dispositivos como nós
5. Admin e membros conectam contas cloud (Google Drive, Dropbox, S3, R2)
6. Sync engine detecta e processa novos arquivos automaticamente
7. Galeria mostra todos os arquivos da família com previews instantâneos
8. Download sob demanda quando qualidade total é necessária

### 11.2 Wireframes / Mockups

- A definir — protótipos no Figma após aprovação do PRD

### 11.3 Requisitos de UX

- Upload automático sem intervenção do usuário após configuração inicial
- Galeria responsiva com thumbnails instantâneos (previews pré-gerados)
- Feedback visual para status de sync, upload e replicação
- Fluxo de recuperação (seed) completável em menos de 10 passos
- Fluxo de adicionar nó cloud em menos de 5 cliques (redirect OAuth)
- Estados de loading, vazio, erro e sucesso para todas as telas
- Responsivo para mobile e desktop

---

## 12. Dependências

### 12.1 Dependências internas

| Dependência               | O que precisa                                                       | Status   | Impacto se atrasar                       |
| ------------------------- | ------------------------------------------------------------------- | -------- | ---------------------------------------- |
| Core SDK                  | API client, criptografia, chunking, upload/download                 | Pendente | Bloqueia todos os clientes e integrações |
| StorageProvider interface | Abstrações para S3, R2, local, OAuth clouds                         | Pendente | Bloqueia integração com provedores       |
| Vault implementation      | Key management, envelope encryption, armazenamento seguro de tokens | Pendente | Bloqueia segurança e recuperação         |
| Consistent hashing        | Algoritmo de distribuição de chunks                                 | Pendente | Bloqueia pipeline de upload              |

### 12.2 Dependências externas

| Dependência       | Fornecedor                 | O que precisa                           | SLA      | Alternativa                                     |
| ----------------- | -------------------------- | --------------------------------------- | -------- | ----------------------------------------------- |
| OAuth APIs        | Google, Dropbox, Microsoft | APIs estáveis de autenticação + storage | Variável | rclone como motor de transporte                 |
| FFmpeg            | Open source                | Transcodificação de vídeo (H.265/AV1)   | N/A      | libvips para imagens; HandBrake CLI para vídeos |
| VPS hosting       | Hetzner / DigitalOcean     | Servidor always-on para orquestrador    | 99.9%    | Cloudflare Workers (serverless)                 |
| S3-compatible API | AWS / Cloudflare           | Armazenamento de chunks em buckets      | 99.99%   | Qualquer S3-compatible                          |

### 12.3 Dependências técnicas

- BIP-39 wordlist para geração de seed phrase
- Biblioteca SHA-256 para hashing de chunks
- Biblioteca AES-256-GCM para criptografia
- Implementação de consistent hashing ring
- Codecs WebP/AVIF para compressão de imagens
- Codecs H.265/AV1 via FFmpeg para transcodificação de vídeo
- PostgreSQL para banco de metadados do orquestrador
- Redis para filas de processamento

---

## 13. Riscos e Mitigações

| ID   | Risco                                                  | Probabilidade | Impacto | Mitigação                                                                                                     | Owner     | Status |
| ---- | ------------------------------------------------------ | ------------- | ------- | ------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| R-01 | Usuário perde seed phrase de 12 palavras               | Alta          | Alto    | Instruções claras de backup (papel, cofre); opção de recovery guardians (fase 3); alertas periódicos          | Admin     | Aberto |
| R-02 | Provedor cloud muda API ou fecha serviço               | Média         | Alto    | Abstração via StorageProvider interface; dados em 3+ provedores diferentes; sem dependência de provedor único | Tech Lead | Aberto |
| R-03 | Corrupção silenciosa de dados (bit rot)                | Média         | Alto    | Scrubbing periódico com SHA-256; replicação 3x; auto-reparação de chunks corrompidos                          | Sistema   | Aberto |
| R-04 | Todos os nós de um chunk ficam offline simultaneamente | Baixa         | Alto    | Diversidade obrigatória de nós (local + cloud + dispositivo); alertas proativos de replicação                 | Sistema   | Aberto |
| R-05 | Token OAuth revogado/expirado sem aviso                | Média         | Médio   | Monitoramento de tokens; alertas automáticos; re-autenticação simplificada                                    | Sistema   | Aberto |
| R-06 | Processamento de vídeo sobrecarrega recursos           | Média         | Médio   | Fila com workers paralelos; rate limiting; processamento assíncrono em background                             | Tech Lead | Aberto |
| R-07 | Conflito de versão entre clientes/agentes              | Média         | Médio   | Versionamento semântico de API; compatibilidade backwards; rolling upgrade                                    | Tech Lead | Aberto |
| R-08 | Espaço de armazenamento do cluster esgota              | Média         | Médio   | Monitoramento em 80%; alertas; sugestão de adicionar nós; quotas por usuário                                  | Sistema   | Aberto |
| R-09 | Complexidade de consistent hashing na implementação    | Média         | Médio   | Usar biblioteca testada; testes extensivos com cenários de adição/remoção de nós                              | Tech Lead | Aberto |
| R-10 | Formatos de mídia tornam-se obsoletos em 50 anos       | Baixa         | Alto    | Migration workers (fase 3); priorizar formatos abertos e amplamente adotados (WebP, H.265, AV1)               | Tech Lead | Aberto |

---

## 14. Hipóteses e Validações

| ID   | Hipótese                                                                                 | Como validar                                                                       | Resultado esperado                          | Status   |
| ---- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------- | -------- |
| H-01 | Full HD (1920px) é suficiente para memórias familiares sem perda perceptível             | Pesquisa com membros da família; teste A/B com fotos originais vs otimizadas       | >90% dos usuários aceitam qualidade Full HD | Pendente |
| H-02 | Deduplicação reduz 30-70% do armazenamento em acervos familiares                         | Análise de acervo real piloto (fotos de WhatsApp, fotos em múltiplos dispositivos) | Redução >30% confirmada                     | Pendente |
| H-03 | Família média tem 5+ dispositivos utilizáveis como nós de armazenamento                  | Pesquisa com famílias-alvo (computadores, celulares, NAS, contas cloud)            | Média >= 5 dispositivos por família         | Pendente |
| H-04 | Recovery via seed phrase funciona de forma confiável e completa                          | Disaster drills mensais com reconstrução real do orquestrador                      | 100% de recuperações bem-sucedidas          | Pendente |
| H-05 | Consistent hashing distribui chunks uniformemente entre nós                              | Simulação com dados reais e cenários de adição/remoção de nós                      | Variação <15% entre nós                     | Pendente |
| H-06 | WebP oferece melhor tradeoff qualidade/tamanho que AVIF para fotos familiares            | Benchmark com acervo real comparando WebP vs AVIF em múltiplas qualidades          | Formato ideal escolhido com dados           | Pendente |
| H-07 | ~500GB gratuitos (5 pessoas × ~100GB) cobrem necessidades de família com mídia otimizada | Cálculo com acervo piloto (100k fotos + 500h vídeo otimizados)                     | 500GB suficientes para 5-10 anos            | Pendente |

---

## 15. Restrições e Premissas

### 15.1 Restrições

| Tipo    | Descrição                                                             | Origem                       |
| ------- | --------------------------------------------------------------------- | ---------------------------- |
| Técnica | Backend em Rust para performance de IO e concorrência                 | Decisão arquitetural         |
| Técnica | Frontend web em Next.js, desktop em Tauri, mobile em React Native     | Decisão arquitetural         |
| Técnica | PostgreSQL para metadata do orquestrador, Redis para filas            | Decisão arquitetural         |
| Técnica | Monorepo com core-sdk compartilhado entre todos os clientes           | Decisão arquitetural         |
| Técnica | Sem armazenamento de originais — somente versões otimizadas + preview | Decisão explícita do usuário |
| Técnica | Cluster máximo: 10 usuários, 50 nós, 100TB                            | Limites de escala para v1    |
| Negócio | Custo mínimo — priorizar free tiers de cloud e VPS barata             | Requisito do projeto         |

### 15.2 Premissas

- Famílias possuem pelo menos 3-5 dispositivos disponíveis como nós de armazenamento
- Pelo menos 1 nó "âncora" (VPS, NAS, ou cloud bucket) está sempre online
- Usuários guardam seed phrase com segurança (papel, cofre)
- Provedores cloud manterão free tiers e APIs estáveis por período relevante
- Banda de internet doméstica é suficiente para sync em background
- FFmpeg e codecs modernos (WebP, H.265, AV1) continuarão disponíveis e mantidos

> Se alguma premissa se provar falsa: a premissa sobre seed phrase é a mais crítica — se usuários perdem seeds, o sistema precisa de recovery guardians (RF-005). Se free tiers desaparecerem, o modelo de custo precisa ser revisado.

---

## 16. Considerações de Segurança e Privacidade

### 16.1 Dados manipulados

| Tipo de dado                         | Classificação      | Controles necessários                                                |
| ------------------------------------ | ------------------ | -------------------------------------------------------------------- |
| Fotos e vídeos familiares            | Pessoal / Sensível | Criptografia AES-256-GCM no cliente, acesso restrito por cluster_id  |
| Documentos                           | Pessoal            | Criptografia ponta-a-ponta, acesso por permissão                     |
| Tokens OAuth (Google, Dropbox, etc.) | Sensível           | Vault criptografado, nunca em texto puro, uso somente em memória     |
| Seed phrase (12 palavras)            | Crítico            | Nunca armazenada digitalmente pelo sistema; somente com o usuário    |
| Master key                           | Crítico            | Derivada da seed em memória; nunca persistida em disco               |
| Metadados de arquivos (nomes, datas) | Interno            | Criptografados no orquestrador                                       |
| Metadados EXIF (GPS, câmera)         | PII                | Extraídos e armazenados criptografados; GPS pode revelar localização |

### 16.2 Requisitos de compliance

- Consentimento implícito dos membros do cluster ao aceitar convite
- Direito ao esquecimento: usuário pode deletar seus dados, manifests e metadata
- Tokens OAuth em conformidade com políticas de cada provedor (Google, Microsoft, Dropbox)
- Dados de menores: fotos de crianças protegidas pela criptografia do cluster

### 16.3 Considerações de segurança

- **Zero-knowledge**: orquestrador e provedores cloud nunca veem dados em texto puro
- **Envelope encryption**: seed → master key → file keys → chunk keys (comprometimento de uma chave não afeta outros arquivos)
- **Vault criptografado**: tokens e credenciais protegidos por chave derivada da seed
- **Mutual TLS ou Ed25519**: autenticação entre nós do cluster
- **Assinatura criptográfica de manifests**: proteção contra manifests falsificados
- **Rate limiting**: proteção contra abuso de API
- **Validação de input**: em todas as interfaces (API, CLI, web)
- **Proteção contra ransomware**: detecção de alterações massivas anômalas (fase 3)

---

## 17. Plano de Lançamento

### 17.1 Estratégia de rollout

| Etapa        | Público                                | Critério de avanço                                       |                                    Rollback |
| ------------ | -------------------------------------- | -------------------------------------------------------- | ------------------------------------------: |
| Alpha        | Família do desenvolvedor (3-5 pessoas) | Zero perda de dados por 1 mês, recovery testado          | Desligar orquestrador, manter dados nos nós |
| Beta privada | 2-3 famílias convidadas                | Replicação saudável, recovery testado, feedback positivo |               Rollback para versão anterior |
| Beta pública | Self-host por famílias técnicas        | Documentação completa, instalação automatizada (Docker)  |                Guia de rollback documentado |
| GA           | Qualquer família                       | KPIs atingidos, zero bugs críticos por 1 mês             |                Processo de rollback testado |

### 17.2 Comunicação

| Público       | Canal                 | Mensagem                          | Responsável   | Quando |
| ------------- | --------------------- | --------------------------------- | ------------- | ------ |
| Família alpha | WhatsApp / presencial | Instruções de uso e feedback      | Douglas Prado | Alpha  |
| Famílias beta | GitHub / email        | Guia de instalação e configuração | Douglas Prado | Beta   |
| Comunidade    | GitHub / blog         | Anúncio open-source, documentação | Douglas Prado | GA     |

### 17.3 Critérios de go / no-go

**Go:**

- [ ] Recovery via seed testado e funcionando em nova VPS
- [ ] Replicação 3x funcionando com auto-healing
- [ ] Zero corrupção de dados em 1 mês de uso
- [ ] Media optimization pipeline completo (fotos + vídeos)
- [ ] Alertas de saúde do cluster funcionando
- [ ] Documentação de instalação e troubleshooting pronta

**No-go (bloqueia lançamento):**

- [ ] Bug de perda de dados encontrado
- [ ] Falha na criptografia ou vazamento de tokens
- [ ] Seed phrase não recupera sistema corretamente
- [ ] Replicação falha silenciosamente

---

## 18. Suporte e Operações

### 18.1 Impacto em suporte

- Sistema é self-hosted: usuário é responsável pela operação
- Documentação de troubleshooting necessária para cenários comuns
- Runbook de recuperação de desastre (passo a passo com seed)
- FAQ cobrindo: adição de nós, tokens expirados, espaço esgotado, recovery

### 18.2 Monitoramento pós-lançamento

| O que monitorar          | Ferramenta         | Threshold de alerta                   | Ação                                      |
| ------------------------ | ------------------ | ------------------------------------- | ----------------------------------------- |
| Replication health       | Dashboard interno  | <99% chunks com 3 réplicas            | Auto-replicação + alerta ao admin         |
| Nó offline               | Heartbeat monitor  | >30min sem heartbeat                  | Alerta ao admin + marcar nó como suspeito |
| Espaço do cluster        | Capacity monitor   | >80% uso total                        | Alerta + sugestão de adicionar nó         |
| Token expirado           | Token monitor      | Qualquer token com falha de refresh   | Notificar usuário para re-autenticar      |
| Corrupção detectada      | Scrubbing          | Qualquer chunk com hash inconsistente | Auto-reparação de réplica + log           |
| Integridade de manifests | Manifest validator | Assinatura inválida                   | Rejeitar manifest + alerta                |

---

## 19. Questões em Aberto

| ID   | Questão                                                                                                                                            | Impacto | Owner     | Prazo           | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------- | --------------- | ------ |
| Q-01 | Chunking fixo (4MB) vs variável (content-defined chunking com Rabin fingerprint)? Fixo é mais simples; variável melhora deduplicação entre versões | Alto    | Tech Lead | Antes da Fase 0 | Aberta |
| Q-02 | WebP ou AVIF como formato padrão para fotos? WebP tem suporte mais amplo; AVIF comprime 20-30% melhor                                              | Médio   | Tech Lead | Antes da Fase 1 | Aberta |
| Q-03 | H.265 ou AV1 como codec padrão para vídeo? AV1 é menor mas exige mais CPU para transcodificar                                                      | Médio   | Tech Lead | Antes da Fase 1 | Aberta |
| Q-04 | Onde rodar transcodificação de vídeo: servidor VPS, cliente, ou workers em computadores domésticos?                                                | Alto    | Tech Lead | Antes da Fase 1 | Aberta |
| Q-05 | Modelo de concorrência para edição simultânea: last-write-wins vs version graph?                                                                   | Médio   | Tech Lead | Antes da Fase 2 | Aberta |
| Q-06 | Gossip protocol vs centralized discovery para descoberta de nós em fases futuras?                                                                  | Médio   | Tech Lead | Antes da Fase 3 | Aberta |
| Q-07 | Tamanho ideal de chunk (1MB, 4MB, 8MB)? Menores = mais deduplicação; maiores = menos overhead                                                      | Alto    | Tech Lead | Antes da Fase 0 | Aberta |
| Q-08 | Como lidar com migração de metadados ao evoluir schema do banco PostgreSQL?                                                                        | Médio   | Tech Lead | Antes da Fase 2 | Aberta |

---

## 20. Referências

- Amazon S3 — referência conceitual para durabilidade de 11 nines e object storage
- Ceph / MinIO — referência para armazenamento distribuído e erasure coding
- IPFS — referência para content-addressable storage e distribuição P2P
- Git — referência para hashing, versionamento e object store baseado em hash
- BorgBackup / restic — referência para chunking, deduplicação e backup incremental
- Syncthing — referência para sincronização entre dispositivos pessoais
- BIP-39 — padrão para geração de seed phrase de 12/24 palavras
- LOCKSS — princípio "Lots Of Copies Keep Stuff Safe" para preservação digital
- Apache Cassandra / Amazon Dynamo — referência para consistent hashing e virtual nodes
- FFmpeg — ferramenta principal para transcodificação de mídia
- rclone — motor de transporte para integração com 70+ provedores cloud
- Conversa.MD — documento fonte com todas as decisões arquiteturais e contexto do projeto

---

## Histórico de Revisões

| Versão | Data       | Autor         | Mudança                                                                                                                                            |
| ------ | ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1.0 | 2026-03-15 | Douglas Prado | Criação do PRD inicial (superficial)                                                                                                               |
| v1.0.0 | 2026-03-16 | Douglas Prado | Reescrita completa seguindo template formal; 79 requisitos funcionais, 15 RNFs, 10 user stories, 4 fases de entrega, análise de riscos e hipóteses |

---

## Aprovações

| Papel      | Responsável   | Status   | Data |
| ---------- | ------------- | -------- | ---- |
| Produto    | Douglas Prado | Pendente |      |
| Engenharia | Douglas Prado | Pendente |      |
| Segurança  | Douglas Prado | Pendente |      |
