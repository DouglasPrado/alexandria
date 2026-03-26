# Copies

Define todos os textos e conteudos textuais das telas do frontend desktop — labels, placeholders, mensagens de feedback, CTAs, tooltips, empty states, itens de menu bar, tooltips de system tray, titulos de notificacoes nativas e textos de dialogos. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto              | Definicao                                                                           |
| -------------------- | ----------------------------------------------------------------------------------- |
| Idioma padrao        | pt-BR                                                                               |
| Suporte i18n         | Preparado (chaves organizadas por namespace) — biblioteca i18next quando necessario |
| Estrutura de chaves  | `namespace.screen.element` — ex: `auth.unlock.submitButton`                         |
| Arquivos de traducao | `locales/pt-BR.json` (v1); `locales/en-US.json` (futuro)                            |
| Tom de voz           | Direto e acolhedor — produto familiar, sem jargao corporativo                       |
| Pessoa gramatical    | Voce                                                                                |
| Genero               | Neutro quando possivel                                                              |

<!-- do blueprint: 01-vision.md — produto para familias; identidade de produto acessivel e confiavel -->

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo          | Definicao                                                                         | Nao usar                           |
| -------------- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Cluster        | Grupo familiar com identidade criptografica — onde fotos e arquivos sao guardados | Servidor, Rede, Conta              |
| Vault          | Arquivo criptografado do membro com credenciais e chaves — protegido por senha    | Carteira, Cofre, Keystore          |
| Seed phrase    | As 12 palavras BIP-39 que permitem recuperar o cluster inteiro                    | Chave de recuperacao, Backup key   |
| No             | Dispositivo ou servico de storage que armazena chunks do cluster                  | Servidor, Dispositivo              |
| Sync Engine    | Motor de sincronizacao que monitora pastas e envia arquivos automaticamente       | Sincronizador, Background sync     |
| Membro         | Pessoa com acesso ao cluster — admin, membro ou leitura                           | Usuario, Participante, Colaborador |
| Admin          | Administrador do cluster — gerencia nos, membros e configuracoes                  | Dono, Owner, Responsavel           |
| Recovery       | Processo de reconstrucao do cluster a partir da seed phrase                       | Recuperacao, Restore               |
| Galeria        | Visualizacao de fotos e videos do cluster                                         | Fotos, Midia, Arquivos             |
| Fila de upload | Lista de arquivos aguardando envio para o cluster                                 | Upload queue, Lista de espera      |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela?

### Tela: /unlock — Desbloqueio do Vault

| Elemento            | Chave i18n                        | Texto Padrao                                         | Contexto                                    |
| ------------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Titulo              | `auth.unlock.title`               | Bom dia. Seu vault esta protegido.                   | Heading principal, dinamico por hora do dia |
| Subtitulo           | `auth.unlock.subtitle`            | Digite sua senha para acessar o cluster familiar.    | Descricao abaixo do titulo                  |
| Label senha         | `auth.unlock.passwordLabel`       | Senha do vault                                       | Label do campo                              |
| Placeholder senha   | `auth.unlock.passwordPlaceholder` | ••••••••••••                                         | Campo de senha                              |
| Botao submit        | `auth.unlock.submitButton`        | Desbloquear                                          | CTA principal                               |
| Link recovery       | `auth.unlock.recoveryLink`        | Esqueceu sua senha? Use a seed phrase                | Link para /recovery                         |
| Contador tentativas | `auth.unlock.attemptsLeft`        | {{count}} tentativa(s) restante(s) antes de aguardar | Apos 2 erros                                |
| Aguarde             | `auth.unlock.rateLimited`         | Muitas tentativas. Aguarde {{seconds}}s.             | Apos 5 erros                                |
| Tooltip olho        | `auth.unlock.showPassword`        | Mostrar senha                                        | Toggle visibilidade                         |

<!-- APPEND:copies-unlock -->

### Tela: /onboarding — Wizard de Configuracao

| Elemento             | Chave i18n                             | Texto Padrao                                                                                                | Contexto                |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------- |
| Titulo inicial       | `onboarding.welcome.title`             | Bem-vindo ao Alexandria                                                                                     | Tela de escolha inicial |
| Subtitulo inicial    | `onboarding.welcome.subtitle`          | Seu acervo familiar, sempre seguro e sempre seu.                                                            | Descricao               |
| Opcao criar          | `onboarding.welcome.createCluster`     | Criar cluster familiar                                                                                      | CTA opcao 1             |
| Desc criar           | `onboarding.welcome.createClusterDesc` | Configure um novo cluster para a sua familia                                                                | Descricao opcao 1       |
| Opcao entrar         | `onboarding.welcome.joinCluster`       | Entrar em cluster existente                                                                                 | CTA opcao 2             |
| Desc entrar          | `onboarding.welcome.joinClusterDesc`   | Voce recebeu um convite de um familiar                                                                      | Descricao opcao 2       |
| Passo 1/3 titulo     | `onboarding.step1.title`               | Como se chama o seu cluster?                                                                                | Heading do passo        |
| Label nome cluster   | `onboarding.step1.clusterLabel`        | Nome do cluster                                                                                             | Label do campo          |
| Placeholder nome     | `onboarding.step1.clusterPlaceholder`  | Ex: Familia Prado                                                                                           | Placeholder             |
| Passo 2/3 titulo     | `onboarding.step2.title`               | Crie sua senha do vault                                                                                     | Heading do passo        |
| Desc senha           | `onboarding.step2.subtitle`            | Esta senha protege suas chaves locais. Escolha algo memoravel — voce precisara dela sempre que abrir o app. | Descricao               |
| Label senha          | `onboarding.step2.passwordLabel`       | Senha do vault                                                                                              | Label                   |
| Label confirmar      | `onboarding.step2.confirmLabel`        | Confirmar senha                                                                                             | Label confirmacao       |
| Forca senha          | `onboarding.step2.strength`            | Fraca / Media / Forte / Muito forte                                                                         | Badge dinamico          |
| Passo 3/3 titulo     | `onboarding.step3.title`               | Sua seed phrase                                                                                             | Heading seed            |
| Aviso seed           | `onboarding.step3.warning`             | Anote estas 12 palavras em papel. NAO tire screenshot. Esta e a UNICA vez que aparecem.                     | Banner de aviso critico |
| Checkbox confirmacao | `onboarding.step3.confirmCheckbox`     | Anotei a seed phrase em lugar seguro e offline                                                              | Checkbox obrigatorio    |
| Botao continuar      | `onboarding.continueButton`            | Continuar                                                                                                   | Avancao entre passos    |
| Botao voltar         | `onboarding.backButton`                | Voltar                                                                                                      | Retornar passo anterior |
| Botao finalizar      | `onboarding.finishButton`              | Criar cluster                                                                                               | CTA final               |
| Campo convite        | `onboarding.invite.linkLabel`          | Link de convite                                                                                             | Label campo convite     |
| Placeholder convite  | `onboarding.invite.linkPlaceholder`    | https://…/invite/TOKEN                                                                                      | Placeholder             |
| Botao validar        | `onboarding.invite.validateButton`     | Validar convite                                                                                             | CTA validar             |
| Confirmacao convite  | `onboarding.invite.confirmation`       | Voce foi convidado para "{{clusterName}}" como {{role}}                                                     | Texto de confirmacao    |

<!-- APPEND:copies-onboarding -->

### Tela: /recovery — Recovery via Seed Phrase

| Elemento           | Chave i18n                       | Texto Padrao                                                                              | Contexto                 |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------ |
| Titulo             | `recovery.title`                 | Recovery do cluster                                                                       | Heading                  |
| Subtitulo          | `recovery.subtitle`              | Use sua seed phrase de 12 palavras para recuperar o acervo familiar.                      | Descricao                |
| Etapa 1 titulo     | `recovery.step1.title`           | URL do novo orquestrador                                                                  | Heading etapa 1          |
| Label URL          | `recovery.step1.urlLabel`        | Endereco do orquestrador                                                                  | Label                    |
| Placeholder URL    | `recovery.step1.urlPlaceholder`  | https://nova-vps.suafamilia.net:8080                                                      | Placeholder              |
| Botao testar       | `recovery.step1.testButton`      | Verificar conexao                                                                         | CTA testar conectividade |
| Conectado          | `recovery.step1.connected`       | Conectado com sucesso                                                                     | Status positivo          |
| Etapa 2 titulo     | `recovery.step2.title`           | Digite sua seed phrase                                                                    | Heading etapa 2          |
| Instrucao seed     | `recovery.step2.instruction`     | Digite as 12 palavras na ordem exata. Voce pode colar a frase completa no primeiro campo. | Instrucao                |
| Placeholder campo  | `recovery.step2.wordPlaceholder` | Palavra {{index}}                                                                         | Placeholder por campo    |
| Botao colar        | `recovery.step2.pasteButton`     | Colar seed phrase                                                                         | CTA colar                |
| Botao iniciar      | `recovery.step2.startButton`     | Iniciar recovery                                                                          | CTA                      |
| Etapa 3 titulo     | `recovery.step3.title`           | Recuperando seu acervo...                                                                 | Heading progresso        |
| Status validando   | `recovery.step3.validating`      | Validando seed phrase...                                                                  | Etapa progresso          |
| Status vaults      | `recovery.step3.vaults`          | Descriptografando vaults dos membros...                                                   | Etapa                    |
| Status nos         | `recovery.step3.nodes`           | Reconectando nos do cluster...                                                            | Etapa                    |
| Status indice      | `recovery.step3.index`           | Reconstruindo indice de arquivos...                                                       | Etapa                    |
| Status integridade | `recovery.step3.integrity`       | Validando integridade dos chunks...                                                       | Etapa                    |
| Concluido          | `recovery.step3.complete`        | Recovery concluido!                                                                       | Etapa final              |
| Relatorio          | `recovery.step3.report`          | {{files}} arquivos recuperados · {{nodes}} nos reconectados                               | Resumo final             |
| Botao continuar    | `recovery.step3.continueButton`  | Continuar para o app                                                                      | CTA final                |

<!-- APPEND:copies-recovery -->

### Tela: /gallery — Galeria (Grid)

| Elemento              | Chave i18n                  | Texto Padrao                                                      | Contexto                     |
| --------------------- | --------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Titulo                | `gallery.title`             | Galeria                                                           | Heading da sidebar ativa     |
| Toggle grid           | `gallery.viewGrid`          | Grade                                                             | Botao de alternancia de view |
| Toggle timeline       | `gallery.viewTimeline`      | Timeline                                                          | Botao alternancia            |
| Busca placeholder     | `gallery.searchPlaceholder` | Buscar fotos, videos...                                           | Campo de busca (Cmd+F)       |
| Ordenar por           | `gallery.sortBy`            | Ordenar por: {{campo}}                                            | Label dropdown               |
| Selecionar todos      | `gallery.selectAll`         | Selecionar tudo                                                   | Acao multi-selecao           |
| Deselecionar          | `gallery.deselectAll`       | Cancelar selecao                                                  | Acao                         |
| {{n}} selecionados    | `gallery.selectedCount`     | {{count}} selecionado(s)                                          | Badge de selecao             |
| Download selecionados | `gallery.downloadSelected`  | Baixar ({{count}})                                                | CTA acao em massa            |
| Empty state titulo    | `gallery.empty.title`       | Seu cluster esta vazio                                            | Titulo sem arquivos          |
| Empty state body      | `gallery.empty.body`        | Adicione uma pasta ao Sync ou arraste arquivos aqui para comecar. | Texto explicativo            |
| Empty state CTA       | `gallery.empty.cta`         | Adicionar pasta ao sync                                           | Botao principal              |
| Carregando            | `gallery.loading`           | Carregando galeria...                                             | Estado de loading            |

<!-- APPEND:copies-gallery -->

### Tela: /gallery/timeline — Timeline

| Elemento         | Chave i18n                         | Texto Padrao                       | Contexto                    |
| ---------------- | ---------------------------------- | ---------------------------------- | --------------------------- |
| Titulo           | `gallery.timeline.title`           | Timeline                           | Heading                     |
| Separador ano    | `gallery.timeline.yearSeparator`   | {{year}}                           | Ex: "2024"                  |
| Separador mes    | `gallery.timeline.monthSeparator`  | {{month}} · {{count}} fotos        | Ex: "Dezembro · 43 fotos"   |
| Scrubber tooltip | `gallery.timeline.scrubberTooltip` | {{month}} {{year}}                 | Tooltip do scrubber lateral |
| Empty state      | `gallery.timeline.empty`           | Nenhuma foto com data identificada | Sem EXIF de data            |

<!-- APPEND:copies-timeline -->

### Tela: /gallery/albums — Albuns

| Elemento        | Chave i18n                    | Texto Padrao              | Contexto               |
| --------------- | ----------------------------- | ------------------------- | ---------------------- |
| Titulo          | `gallery.albums.title`        | Albuns                    | Heading                |
| Criar album     | `gallery.albums.createButton` | Novo album                | CTA                    |
| Contagem        | `gallery.albums.count`        | {{count}} foto(s)         | Badge no card do album |
| Empty state     | `gallery.albums.empty`        | Nenhum album criado ainda | Sem albuns             |
| Empty state CTA | `gallery.albums.emptyCta`     | Criar primeiro album      | Botao                  |

<!-- APPEND:copies-albums -->

### Tela: /gallery/:fileId — Viewer de Arquivo

| Elemento          | Chave i18n                  | Texto Padrao                                           | Contexto          |
| ----------------- | --------------------------- | ------------------------------------------------------ | ----------------- |
| Botao fechar      | `gallery.viewer.close`      | Fechar (Esc)                                           | Tooltip botao X   |
| Botao anterior    | `gallery.viewer.previous`   | Anterior (←)                                           | Tooltip           |
| Botao proximo     | `gallery.viewer.next`       | Proximo (→)                                            | Tooltip           |
| Botao download    | `gallery.viewer.download`   | Baixar original                                        | CTA               |
| Botao deletar     | `gallery.viewer.delete`     | Excluir arquivo                                        | CTA destrutivo    |
| Aba info          | `gallery.viewer.infoTab`    | Informacoes                                            | Tab metadados     |
| Aba chunks        | `gallery.viewer.chunksTab`  | Armazenamento                                          | Tab chunks/nos    |
| Data foto         | `gallery.viewer.dateTaken`  | Tirada em {{date}}                                     | Metadado EXIF     |
| Camera            | `gallery.viewer.camera`     | {{make}} {{model}}                                     | Metadado EXIF     |
| GPS               | `gallery.viewer.location`   | {{location}}                                           | Metadado GPS      |
| Tamanho           | `gallery.viewer.fileSize`   | {{size}} (original) · {{optimized}} (otimizado)        | Tamanhos          |
| Replicas          | `gallery.viewer.replicas`   | {{count}} replicas em {{nodes}} nos                    | Status replicacao |
| Ainda processando | `gallery.viewer.processing` | Processando arquivo... Isso pode levar alguns minutos. | Status pipeline   |

<!-- APPEND:copies-viewer -->

### Tela: /sync — Sync Dashboard

| Elemento                 | Chave i18n                     | Texto Padrao                                                     | Contexto                 |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------- | ------------------------ |
| Titulo                   | `sync.title`                   | Sync                                                             | Heading                  |
| Status idle              | `sync.status.idle`             | Em dia — nenhum arquivo pendente                                 | Status quando fila vazia |
| Status syncing           | `sync.status.syncing`          | Sincronizando {{count}} arquivo(s)...                            | Status com fila ativa    |
| Status pausado           | `sync.status.paused`           | Sync pausado                                                     | Status pausado           |
| Status erro              | `sync.status.error`            | Erro de sync                                                     | Status com falha         |
| Botao pausar             | `sync.pauseButton`             | Pausar sync                                                      | CTA                      |
| Botao retomar            | `sync.resumeButton`            | Retomar sync                                                     | CTA                      |
| Secao pastas             | `sync.foldersSection`          | Pastas monitoradas                                               | Heading secao            |
| Adicionar pasta          | `sync.addFolderButton`         | Adicionar pasta                                                  | CTA                      |
| Pasta nao encontrada     | `sync.folderNotFound`          | Pasta nao encontrada no disco                                    | Badge de erro na pasta   |
| Remover pasta            | `sync.removeFolderTooltip`     | Remover do sync                                                  | Tooltip icone remover    |
| Secao fila               | `sync.queueSection`            | Fila de upload                                                   | Heading secao            |
| Progresso item           | `sync.queueItem.progress`      | {{percent}}% · {{speed}}/s                                       | Progresso por arquivo    |
| Status error item        | `sync.queueItem.error`         | Erro — Retry em {{seconds}}s                                     | Item com falha           |
| Status skipped           | `sync.queueItem.skipped`       | Formato nao suportado                                            | Item ignorado            |
| Retry manual             | `sync.queueItem.retryButton`   | Tentar novamente                                                 | CTA retry manual         |
| Empty fila               | `sync.queue.empty`             | Nenhum arquivo na fila                                           | Fila vazia               |
| Alerta nos insuficientes | `sync.alert.insufficientNodes` | Nos insuficientes para replicacao. Sync pausado automaticamente. | AlertBanner              |

<!-- APPEND:copies-sync -->

### Tela: /cluster — Saude do Cluster

| Elemento        | Chave i18n                  | Texto Padrao                       | Contexto            |
| --------------- | --------------------------- | ---------------------------------- | ------------------- |
| Titulo          | `cluster.title`             | Cluster                            | Heading             |
| Saude geral OK  | `cluster.health.ok`         | Cluster saudavel                   | Badge verde         |
| Saude degradada | `cluster.health.degraded`   | Atencao necessaria                 | Badge amarelo       |
| Saude critica   | `cluster.health.critical`   | Situacao critica                   | Badge vermelho      |
| Nos online      | `cluster.stats.nodesOnline` | {{count}} no(s) online             | Stat                |
| Replicacao      | `cluster.stats.replication` | {{percent}}% dos chunks replicados | Stat                |
| Total arquivos  | `cluster.stats.totalFiles`  | {{count}} arquivo(s) no cluster    | Stat                |
| Armazenamento   | `cluster.stats.storage`     | {{used}} usados de {{total}}       | Stat                |
| Sec nos         | `cluster.nodesSection`      | Nos do cluster                     | Heading secao       |
| Ver todos nos   | `cluster.viewAllNodes`      | Ver todos os nos                   | Link                |
| Sec alertas     | `cluster.alertsSection`     | Alertas ativos                     | Heading secao       |
| Sem alertas     | `cluster.noAlerts`          | Nenhum alerta ativo — tudo certo!  | Empty state alertas |

<!-- APPEND:copies-cluster -->

### Tela: /cluster/nodes — Lista de Nos

| Elemento         | Chave i18n                      | Texto Padrao                                                             | Contexto            |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------ | ------------------- |
| Titulo           | `cluster.nodes.title`           | Nos do cluster                                                           | Heading             |
| Adicionar no     | `cluster.nodes.addButton`       | Adicionar no                                                             | CTA (admin)         |
| Status online    | `cluster.nodes.status.online`   | Online                                                                   | Badge verde         |
| Status suspect   | `cluster.nodes.status.suspect`  | Suspeito                                                                 | Badge amarelo       |
| Status lost      | `cluster.nodes.status.lost`     | Offline                                                                  | Badge vermelho      |
| Status draining  | `cluster.nodes.status.draining` | Drenando...                                                              | Badge azul          |
| Capacidade       | `cluster.nodes.capacity`        | {{used}} / {{total}} · {{percent}}%                                      | Barra de uso        |
| Ultimo heartbeat | `cluster.nodes.lastHeartbeat`   | Ultimo contato: {{time}}                                                 | Metadado            |
| Acao drain       | `cluster.nodes.drainAction`     | Iniciar drain                                                            | Botao de acao       |
| Acao remover     | `cluster.nodes.removeAction`    | Remover no                                                               | Botao destrutivo    |
| Confirm drain    | `cluster.nodes.drainConfirm`    | Iniciar drain vai mover todos os chunks deste no para outros. Continuar? | Dialogo confirmacao |
| Empty state      | `cluster.nodes.empty`           | Nenhum no configurado ainda                                              | Sem nos             |
| Empty CTA        | `cluster.nodes.emptyCta`        | Adicionar primeiro no                                                    | Botao               |

<!-- APPEND:copies-nodes -->

### Tela: /cluster/nodes/new — Adicionar No

| Elemento         | Chave i18n                           | Texto Padrao                                                                       | Contexto       |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | -------------- |
| Titulo           | `cluster.nodes.new.title`            | Adicionar no ao cluster                                                            | Heading        |
| Tipo local       | `cluster.nodes.new.typeLocal`        | Dispositivo local                                                                  | Opcao tipo     |
| Tipo S3          | `cluster.nodes.new.typeS3`           | Amazon S3                                                                          | Opcao tipo     |
| Tipo R2          | `cluster.nodes.new.typeR2`           | Cloudflare R2                                                                      | Opcao tipo     |
| Tipo B2          | `cluster.nodes.new.typeB2`           | Backblaze B2                                                                       | Opcao tipo     |
| Tipo VPS         | `cluster.nodes.new.typeVPS`          | VPS / Servidor                                                                     | Opcao tipo     |
| Label nome       | `cluster.nodes.new.nameLabel`        | Nome do no                                                                         | Label          |
| Placeholder nome | `cluster.nodes.new.namePlaceholder`  | Ex: PC do Douglas, NAS da familia                                                  | Placeholder    |
| Label quota      | `cluster.nodes.new.quotaLabel`       | Limite de armazenamento                                                            | Label          |
| Botao adicionar  | `cluster.nodes.new.submitButton`     | Adicionar no                                                                       | CTA            |
| Botao cancelar   | `cluster.nodes.new.cancelButton`     | Cancelar                                                                           | CTA secundario |
| Instrucao agente | `cluster.nodes.new.agentInstruction` | Copie o comando abaixo e execute no dispositivo para instalar o agente Alexandria: | Instrucao      |

<!-- APPEND:copies-nodes-new -->

### Tela: /cluster/members — Membros

| Elemento           | Chave i18n                          | Texto Padrao                       | Contexto         |
| ------------------ | ----------------------------------- | ---------------------------------- | ---------------- |
| Titulo             | `cluster.members.title`             | Membros do cluster                 | Heading          |
| Convidar           | `cluster.members.inviteButton`      | Convidar membro                    | CTA (admin)      |
| Role admin         | `cluster.members.role.admin`        | Admin                              | Badge            |
| Role membro        | `cluster.members.role.membro`       | Membro                             | Badge            |
| Role leitura       | `cluster.members.role.leitura`      | Leitura                            | Badge            |
| Voce mesmo         | `cluster.members.youBadge`          | Voce                               | Badge secundario |
| Alterar role       | `cluster.members.changeRole`        | Alterar permissao                  | Acao             |
| Remover membro     | `cluster.members.removeAction`      | Remover membro                     | Acao destrutiva  |
| Gerar convite      | `cluster.members.invite.title`      | Novo convite                       | Titulo modal     |
| Label role convite | `cluster.members.invite.roleLabel`  | Permissao do convidado             | Label            |
| Link gerado        | `cluster.members.invite.linkLabel`  | Link de convite (expira em 7 dias) | Label            |
| Copiar link        | `cluster.members.invite.copyButton` | Copiar link                        | CTA              |
| Link copiado       | `cluster.members.invite.copied`     | Copiado!                           | Feedback inline  |

<!-- APPEND:copies-members -->

### Tela: /cluster/alerts — Alertas

| Elemento          | Chave i18n                      | Texto Padrao                     | Contexto             |
| ----------------- | ------------------------------- | -------------------------------- | -------------------- |
| Titulo            | `cluster.alerts.title`          | Alertas                          | Heading              |
| Filtro todos      | `cluster.alerts.filterAll`      | Todos                            | Tab filtro           |
| Filtro ativos     | `cluster.alerts.filterActive`   | Ativos                           | Tab filtro           |
| Filtro resolvidos | `cluster.alerts.filterResolved` | Resolvidos                       | Tab filtro           |
| Severidade P1     | `cluster.alerts.severity.p1`    | Critico                          | Badge                |
| Severidade P2     | `cluster.alerts.severity.p2`    | Alto                             | Badge                |
| Severidade P3     | `cluster.alerts.severity.p3`    | Medio                            | Badge                |
| Severidade P4     | `cluster.alerts.severity.p4`    | Informativo                      | Badge                |
| Marcar resolvido  | `cluster.alerts.resolveAction`  | Marcar como resolvido            | Acao                 |
| Tempo ocorrencia  | `cluster.alerts.occurredAt`     | Ocorreu {{time}}                 | Metadado             |
| Empty sem alertas | `cluster.alerts.empty`          | Nenhum alerta ativo. Tudo certo! | Empty state positivo |

<!-- APPEND:copies-alerts -->

### Tela: /vault — Vault de Credenciais

| Elemento             | Chave i18n                   | Texto Padrao                                                     | Contexto                |
| -------------------- | ---------------------------- | ---------------------------------------------------------------- | ----------------------- |
| Titulo               | `vault.title`                | Vault                                                            | Heading                 |
| Subtitulo            | `vault.subtitle`             | Suas credenciais de provedores cloud. Criptografadas localmente. | Descricao               |
| Adicionar credencial | `vault.addButton`            | Adicionar credencial                                             | CTA                     |
| Tipo Google Drive    | `vault.provider.googledrive` | Google Drive                                                     | Label tipo              |
| Tipo S3              | `vault.provider.s3`          | Amazon S3                                                        | Label tipo              |
| Tipo R2              | `vault.provider.r2`          | Cloudflare R2                                                    | Label tipo              |
| Tipo B2              | `vault.provider.b2`          | Backblaze B2                                                     | Label tipo              |
| Tipo Dropbox         | `vault.provider.dropbox`     | Dropbox                                                          | Label tipo              |
| Conta                | `vault.item.account`         | Conta: {{account}}                                               | Label item              |
| Espaco livre         | `vault.item.freeSpace`       | {{free}} livres de {{total}}                                     | Espaco disponivel       |
| Token expirando      | `vault.item.tokenExpiring`   | Token expira em {{days}} dias                                    | Aviso                   |
| Token expirado       | `vault.item.tokenExpired`    | Token expirado — clique para renovar                             | Erro inline             |
| Editar               | `vault.item.editAction`      | Editar                                                           | Acao                    |
| Remover              | `vault.item.removeAction`    | Remover                                                          | Acao destrutiva         |
| Bloquear vault       | `vault.lockButton`           | Bloquear vault (Cmd+L)                                           | Botao no topo da pagina |
| Empty state          | `vault.empty`                | Nenhuma credencial configurada                                   | Sem itens               |
| Empty CTA            | `vault.emptyCta`             | Adicionar primeiro provedor                                      | Botao                   |

<!-- APPEND:copies-vault -->

### Tela: /settings — Configuracoes

| Elemento         | Chave i18n                            | Texto Padrao                                                         | Contexto         |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------- | ---------------- |
| Titulo           | `settings.title`                      | Configuracoes                                                        | Heading          |
| Sec geral        | `settings.sections.general`           | Geral                                                                | Secao            |
| Label tema       | `settings.general.themeLabel`         | Tema                                                                 | Label            |
| Tema sistema     | `settings.general.themeSystem`        | Sistema (automatico)                                                 | Opcao            |
| Tema claro       | `settings.general.themeLight`         | Claro                                                                | Opcao            |
| Tema escuro      | `settings.general.themeDark`          | Escuro                                                               | Opcao            |
| Label autostart  | `settings.general.autostartLabel`     | Iniciar com o sistema                                                | Toggle label     |
| Desc autostart   | `settings.general.autostartDesc`      | Alexandria inicia minimizado no tray quando o computador liga        | Descricao toggle |
| Sec notificacoes | `settings.sections.notifications`     | Notificacoes                                                         | Secao            |
| Toggle notif     | `settings.notifications.enabledLabel` | Ativar notificacoes                                                  | Toggle label     |
| Notif sync       | `settings.notifications.syncLabel`    | Sync concluido                                                       | Toggle           |
| Notif alertas    | `settings.notifications.alertsLabel`  | Alertas do cluster                                                   | Toggle           |
| Notif update     | `settings.notifications.updateLabel`  | Atualizacoes disponíveis                                             | Toggle           |
| Sec seguranca    | `settings.sections.security`          | Seguranca e privacidade                                              | Secao            |
| Bloquear vault   | `settings.security.lockVaultLabel`    | Bloquear vault agora                                                 | Botao            |
| Tempo auto-lock  | `settings.security.autoLockLabel`     | Bloquear automaticamente apos                                        | Label            |
| Auto-lock nunca  | `settings.security.autoLockNever`     | Nunca                                                                | Opcao            |
| Auto-lock 15min  | `settings.security.autoLock15m`       | 15 minutos                                                           | Opcao            |
| Auto-lock 1h     | `settings.security.autoLock1h`        | 1 hora                                                               | Opcao            |
| Telemetria       | `settings.security.telemetryLabel`    | Enviar relatorios de erro anonimos (Sentry)                          | Toggle           |
| Desc telemetria  | `settings.security.telemetryDesc`     | Ajuda a melhorar o app. Nenhum dado pessoal ou de arquivo e enviado. | Descricao        |
| Sec atualizacoes | `settings.sections.updates`           | Atualizacoes                                                         | Secao            |
| Canal stable     | `settings.updates.stableLabel`        | Versoes estaveis (recomendado)                                       | Opcao            |
| Canal beta       | `settings.updates.betaLabel`          | Versoes beta (receber atualizacoes antecipadas)                      | Opcao            |
| Verificar agora  | `settings.updates.checkNow`           | Verificar atualizacoes                                               | Botao            |
| Versao atual     | `settings.updates.currentVersion`     | Versao atual: {{version}}                                            | Info             |
| Sec sobre        | `settings.sections.about`             | Sobre                                                                | Secao            |
| Nome app         | `settings.about.appName`              | Alexandria                                                           | Info             |
| Versao           | `settings.about.version`              | Versao {{version}}                                                   | Info             |
| Repo             | `settings.about.repoLink`             | Codigo aberto no GitHub                                              | Link             |
| Licenca          | `settings.about.license`              | Licenca MIT                                                          | Info             |

<!-- APPEND:copies-settings -->

---

## Mensagens de Feedback

> Quais sao as mensagens de sucesso, erro, aviso e informacao exibidas ao usuario?

### Sucesso

| Chave i18n                          | Texto                                                                | Onde aparece                                                               |
| ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `feedback.success.vaultUnlocked`    | Vault desbloqueado. Bem-vindo!                                       | Toast apos unlock (opcional — redirect para galeria ja e sinal suficiente) |
| `feedback.success.clusterCreated`   | Cluster criado! Adicione nos para comecar a salvar arquivos.         | Toast apos onboarding completo                                             |
| `feedback.success.folderAdded`      | Pasta adicionada ao sync. Verificando arquivos existentes...         | Toast apos adicionar pasta                                                 |
| `feedback.success.folderRemoved`    | Pasta removida do sync. Arquivos existentes no cluster sao mantidos. | Toast apos remover pasta                                                   |
| `feedback.success.fileSynced`       | {{count}} arquivo(s) salvos no cluster.                              | Notificacao nativa apos sync batch                                         |
| `feedback.success.fileDownloaded`   | "{{filename}}" baixado com sucesso.                                  | Toast apos download                                                        |
| `feedback.success.fileDeleted`      | Arquivo excluido do cluster.                                         | Toast apos exclusao                                                        |
| `feedback.success.memberInvited`    | Convite criado! Link valido por 7 dias.                              | Toast modal convite                                                        |
| `feedback.success.memberRemoved`    | Membro removido do cluster.                                          | Toast                                                                      |
| `feedback.success.credentialSaved`  | Credencial salva no vault.                                           | Toast                                                                      |
| `feedback.success.settingsSaved`    | Configuracoes salvas.                                                | Toast                                                                      |
| `feedback.success.nodeDraining`     | Drain iniciado. Os chunks serao migrados automaticamente.            | Toast                                                                      |
| `feedback.success.updateInstalled`  | Alexandria {{version}} instalado. Reinicie para aplicar.             | Toast com botao Reiniciar                                                  |
| `feedback.success.linkCopied`       | Link copiado!                                                        | Toast inline no botao                                                      |
| `feedback.success.recoveryComplete` | Recovery concluido. {{files}} arquivos recuperados.                  | Toast na tela de recovery                                                  |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n                             | Texto                                                                              | Onde aparece                    |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------- |
| `feedback.error.generic`               | Algo deu errado. Tente novamente.                                                  | Fallback generico               |
| `feedback.error.network`               | Sem conexao com o orquestrador. Verifique sua rede.                                | Erro de rede — IPC falha        |
| `feedback.error.unauthorized`          | Sessao expirada. Desbloqueie o vault novamente.                                    | 401 do orquestrador             |
| `feedback.error.forbidden`             | Voce nao tem permissao para esta acao.                                             | 403 — role insuficiente         |
| `feedback.error.notFound`              | Arquivo ou recurso nao encontrado.                                                 | 404                             |
| `feedback.error.vaultWrongPassword`    | Senha incorreta.                                                                   | Campo de senha — unlock         |
| `feedback.error.vaultCorrupted`        | Vault danificado. Use a seed phrase para fazer recovery.                           | Erro critico no vault           |
| `feedback.error.inviteExpired`         | Convite expirado ou invalido. Solicite novo convite ao admin.                      | Validacao de convite            |
| `feedback.error.inviteAlreadyUsed`     | Este convite ja foi usado.                                                         | Reuso de convite                |
| `feedback.error.orchestratorOffline`   | Nao foi possivel conectar ao orquestrador. Verifique se ele esta online.           | Dialog de conexao               |
| `feedback.error.insufficientNodes`     | Nos insuficientes para replicacao. Adicione pelo menos 1 no ao cluster.            | AlertBanner                     |
| `feedback.error.uploadFailed`          | Falha ao enviar "{{filename}}". Retry automatico em {{seconds}}s.                  | Item da fila                    |
| `feedback.error.fileTooBig`            | Arquivo "{{filename}}" ({{size}}) excede o limite maximo.                          | Validacao pre-upload            |
| `feedback.error.fileFormatUnsupported` | Formato nao suportado.                                                             | Item da fila com status skipped |
| `feedback.error.nodeDrainFailed`       | Falha ao iniciar drain. Verifique se ha nos suficientes para receber os chunks.    | Toast                           |
| `feedback.error.recoveryWrongSeed`     | Seed incorreta — vaults nao puderam ser decriptados. Verifique as 12 palavras.     | Etapa recovery                  |
| `feedback.error.recoveryNoManifests`   | Nenhum manifest encontrado nos nos disponiveis. Recovery impossivel sem manifests. | Etapa critica recovery          |
| `feedback.error.updateFailed`          | Falha ao instalar atualizacao. Baixe manualmente no GitHub.                        | Toast com link                  |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n                        | Texto                                              | Quando aparece               |
| --------------------------------- | -------------------------------------------------- | ---------------------------- |
| `validation.required`             | Campo obrigatorio                                  | Campo vazio no submit        |
| `validation.minLength`            | Minimo de {{min}} caracteres                       | Texto curto demais           |
| `validation.maxLength`            | Maximo de {{max}} caracteres                       | Texto longo demais           |
| `validation.passwordMismatch`     | As senhas nao coincidem                            | Confirmacao de senha diverge |
| `validation.passwordTooWeak`      | Senha muito fraca. Use letras, numeros e simbolos. | Medidor de forca             |
| `validation.urlInvalid`           | URL invalida. Use o formato https://…              | Campo de URL                 |
| `validation.urlUnreachable`       | Nao foi possivel conectar a este endereco          | Validacao de conectividade   |
| `validation.seedWordInvalid`      | Palavra nao reconhecida no dicionario BIP-39       | Campo de seed phrase         |
| `validation.clusterNameTaken`     | Ja existe um cluster com este nome                 | Campo nome cluster           |
| `validation.folderAlreadyWatched` | Esta pasta ja esta sendo monitorada                | FolderPicker                 |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n                            | Texto                                                                                                         | Onde aparece                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `feedback.warning.vaultWillLock`      | Vault sera bloqueado automaticamente em {{minutes}} minutos.                                                  | Banner auto-lock                |
| `feedback.warning.updateAvailable`    | Alexandria {{version}} disponivel.                                                                            | UpdateBanner                    |
| `feedback.warning.updateAvailableCta` | Instalar e reiniciar                                                                                          | Botao no UpdateBanner           |
| `feedback.warning.lowStorage`         | No "{{nodeName}}" com {{percent}}% de disco usado.                                                            | AlertBanner                     |
| `feedback.warning.tokenExpiringSoon`  | Credencial "{{provider}}" expira em {{days}} dias. Renove para evitar interrupcao do sync.                    | Banner no /vault                |
| `feedback.warning.syncPaused`         | Sync pausado. Novos arquivos nao serao enviados ate retomar.                                                  | Banner no /sync                 |
| `feedback.warning.offlineMode`        | Sem conexao com o orquestrador. O app esta em modo offline.                                                   | Banner global                   |
| `feedback.info.firstClose`            | Fechar a janela nao encerra o Alexandria. O sync continua em segundo plano. Use "Sair" no tray para encerrar. | Dialog primeira vez ao fechar   |
| `feedback.info.loading`               | Carregando...                                                                                                 | Estados de loading genericos    |
| `feedback.info.noResults`             | Nenhum resultado encontrado                                                                                   | Busca sem resultados            |
| `feedback.info.seedPhraseShown`       | Esta e a unica vez que sua seed phrase e exibida. Guarde-a em lugar seguro.                                   | Banner no passo 3 do onboarding |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas e janelas.

### Title Bar

| Elemento                      | Chave i18n                      | Texto Padrao                                    |
| ----------------------------- | ------------------------------- | ----------------------------------------------- |
| Nome do app                   | `global.titlebar.appName`       | Alexandria                                      |
| Titulo com status idle        | `global.titlebar.statusIdle`    | Alexandria — Em dia                             |
| Titulo com status sync        | `global.titlebar.statusSyncing` | Alexandria — Sincronizando {{count}} arquivo(s) |
| Titulo com status erro        | `global.titlebar.statusError`   | Alexandria — Erro de sync                       |
| Titulo com status paused      | `global.titlebar.statusPaused`  | Alexandria — Sync pausado                       |
| Tooltip minimizar (Win/Linux) | `global.titlebar.minimize`      | Minimizar                                       |
| Tooltip maximizar (Win/Linux) | `global.titlebar.maximize`      | Maximizar                                       |
| Tooltip restaurar (Win/Linux) | `global.titlebar.restore`       | Restaurar                                       |
| Tooltip fechar (Win/Linux)    | `global.titlebar.close`         | Fechar (o sync continua no tray)                |

<!-- APPEND:copies-titlebar -->

### Menu Bar

| Menu               | Elemento               | Chave i18n                      | Texto                      |
| ------------------ | ---------------------- | ------------------------------- | -------------------------- |
| Alexandria (macOS) | Sobre Alexandria       | `global.menu.app.about`         | Sobre Alexandria           |
| Alexandria (macOS) | Verificar Atualizacoes | `global.menu.app.checkUpdates`  | Verificar atualizacoes...  |
| Alexandria (macOS) | Bloquear Vault         | `global.menu.app.lockVault`     | Bloquear Vault             |
| Alexandria (macOS) | Sair                   | `global.menu.app.quit`          | Sair                       |
| Arquivo            | Abrir Galeria          | `global.menu.file.gallery`      | Abrir Galeria              |
| Arquivo            | Fazer Upload           | `global.menu.file.upload`       | Fazer Upload...            |
| Arquivo            | Adicionar Pasta        | `global.menu.file.addFolder`    | Adicionar Pasta ao Sync... |
| Exibir             | Galeria (Grid)         | `global.menu.view.gallery`      | Galeria                    |
| Exibir             | Timeline               | `global.menu.view.timeline`     | Timeline                   |
| Exibir             | Sync                   | `global.menu.view.sync`         | Sync                       |
| Exibir             | Cluster                | `global.menu.view.cluster`      | Cluster                    |
| Exibir             | Vault                  | `global.menu.view.vault`        | Vault                      |
| Exibir             | Configuracoes          | `global.menu.view.settings`     | Configuracoes              |
| Exibir             | Tela Cheia             | `global.menu.view.fullscreen`   | Tela Cheia                 |
| Cluster            | Saude do Cluster       | `global.menu.cluster.health`    | Saude do Cluster           |
| Cluster            | Nos                    | `global.menu.cluster.nodes`     | Nos                        |
| Cluster            | Membros                | `global.menu.cluster.members`   | Membros                    |
| Cluster            | Alertas                | `global.menu.cluster.alerts`    | Alertas                    |
| Ajuda              | Documentacao           | `global.menu.help.docs`         | Documentacao               |
| Ajuda              | Verificar Atualizacoes | `global.menu.help.checkUpdates` | Verificar atualizacoes...  |
| Ajuda              | Reportar Problema      | `global.menu.help.report`       | Reportar Problema          |
| Ajuda              | Sobre Alexandria       | `global.menu.help.about`        | Sobre Alexandria           |

<!-- APPEND:copies-menubar -->

### System Tray

| Elemento                   | Chave i18n                   | Texto                                           |
| -------------------------- | ---------------------------- | ----------------------------------------------- |
| Tooltip idle               | `global.tray.tooltipIdle`    | Alexandria — Em dia                             |
| Tooltip syncing            | `global.tray.tooltipSyncing` | Alexandria — Sincronizando {{count}} arquivo(s) |
| Tooltip error              | `global.tray.tooltipError`   | Alexandria — Erro de sync                       |
| Tooltip paused             | `global.tray.tooltipPaused`  | Alexandria — Sync pausado                       |
| Abrir                      | `global.tray.open`           | Abrir Alexandria                                |
| Status item (desabilitado) | `global.tray.statusItem`     | Status: {{status}}                              |
| Pausar Sync                | `global.tray.pauseSync`      | Pausar Sync                                     |
| Retomar Sync               | `global.tray.resumeSync`     | Retomar Sync                                    |
| Configuracoes              | `global.tray.settings`       | Configuracoes                                   |
| Sair                       | `global.tray.quit`           | Sair                                            |

<!-- APPEND:copies-tray -->

### Notificacoes Nativas

| Evento                 | Titulo (chave)                        | Titulo                              | Corpo (chave)                        | Corpo                                                     |
| ---------------------- | ------------------------------------- | ----------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Sync concluido (batch) | `notification.syncComplete.title`     | Alexandria — Sync concluido         | `notification.syncComplete.body`     | {{count}} foto(s)/video(s) salvos com sucesso no cluster. |
| No offline             | `notification.nodeOffline.title`      | Alexandria — No offline             | `notification.nodeOffline.body`      | "{{nodeName}}" ficou offline. Auto-healing iniciado.      |
| Atualizacao disponivel | `notification.updateAvailable.title`  | Alexandria — Atualizacao disponivel | `notification.updateAvailable.body`  | Versao {{version}} esta pronta para instalar.             |
| Alerta critico         | `notification.alertCritical.title`    | Alexandria — Atencao                | `notification.alertCritical.body`    | {{alertMessage}}                                          |
| Recovery concluido     | `notification.recoveryComplete.title` | Alexandria — Recovery completo      | `notification.recoveryComplete.body` | {{files}} arquivos recuperados com sucesso.               |

<!-- APPEND:copies-notifications -->

### Sidebar

| Elemento           | Chave i18n                     | Texto               |
| ------------------ | ------------------------------ | ------------------- | -------------------------- |
| Item Galeria       | `global.sidebar.gallery`       | Galeria             |
| Item Sync          | `global.sidebar.sync`          | Sync                |
| Badge fila sync    | `global.sidebar.syncBadge`     | {{count}}           | Numero de arquivos na fila |
| Item Cluster       | `global.sidebar.cluster`       | Cluster             |
| Badge alertas      | `global.sidebar.clusterBadge`  | {{count}}           | Alertas ativos             |
| Item Vault         | `global.sidebar.vault`         | Vault               |
| Item Configuracoes | `global.sidebar.settings`      | Configuracoes       |
| Tooltip usuario    | `global.sidebar.memberTooltip` | {{name}} · {{role}} | Tooltip no avatar          |
| Collapse sidebar   | `global.sidebar.collapse`      | Recolher sidebar    | Tooltip botao              |
| Expand sidebar     | `global.sidebar.expand`        | Expandir sidebar    | Tooltip botao              |

<!-- APPEND:copies-sidebar -->

### Dialogos Nativos (OS)

| Dialogo                           | Titulo (chave)              | Titulo                                                                          | Botao confirmacao |
| --------------------------------- | --------------------------- | ------------------------------------------------------------------------------- | ----------------- |
| Selecionar pasta para sync        | `dialog.folderPicker.title` | Selecionar pasta para monitorar                                                 | Adicionar         |
| Upload manual de arquivo(s)       | `dialog.filePicker.title`   | Selecionar arquivos para upload                                                 | Enviar            |
| Salvar arquivo baixado            | `dialog.saveFile.title`     | Salvar arquivo                                                                  | Salvar            |
| Confirmacao ao fechar janela (1x) | `dialog.firstClose.title`   | O sync continua em segundo plano                                                | Entendido         |
| Confirmar saida                   | `dialog.quit.title`         | Sair do Alexandria?                                                             | Sair              |
| Confirmar saida corpo             | `dialog.quit.body`          | O sync sera interrompido. Arquivos na fila nao serao enviados.                  | —                 |
| Confirmar drain                   | `dialog.drain.title`        | Iniciar drain do no?                                                            | Iniciar drain     |
| Confirmar drain corpo             | `dialog.drain.body`         | Os chunks serao migrados para outros nos. O processo pode levar varios minutos. | —                 |

<!-- APPEND:copies-dialogs -->

### Modais Genericos

| Modal                         | Titulo (chave)                 | Titulo                  | Corpo (chave)                 | Corpo                                                                                                                |
| ----------------------------- | ------------------------------ | ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Confirmar exclusao de arquivo | `modal.deleteFile.title`       | Excluir arquivo?        | `modal.deleteFile.body`       | "{{filename}}" sera removido do cluster. Os chunks serao deletados de todos os nos. Esta acao nao pode ser desfeita. |
| Remover membro                | `modal.removeMember.title`     | Remover membro?         | `modal.removeMember.body`     | "{{name}}" perdera acesso ao cluster. Seus arquivos sao mantidos.                                                    |
| Remover credencial            | `modal.removeCredential.title` | Remover credencial?     | `modal.removeCredential.body` | Os chunks armazenados neste provedor nao serao deletados automaticamente.                                            |
| Onboarding — descartar seed   | `modal.discardSeed.title`      | Descartar configuracao? | `modal.discardSeed.body`      | A seed phrase gerada sera descartada e o vault local removido. Voce precisara comecar novamente.                     |

<!-- APPEND:copies-modais -->

### Empty States

| Tela/Secao             | Chave i18n titulo      | Texto titulo              | Chave i18n corpo      | Texto corpo                                                              | CTA                  |
| ---------------------- | ---------------------- | ------------------------- | --------------------- | ------------------------------------------------------------------------ | -------------------- |
| Galeria vazia          | `empty.gallery.title`  | Seu cluster esta vazio    | `empty.gallery.body`  | Adicione uma pasta ao sync ou arraste arquivos para comecar.             | Adicionar pasta      |
| Timeline vazia         | `empty.timeline.title` | Nenhuma foto com data     | `empty.timeline.body` | Fotos sem metadados EXIF de data nao aparecem na timeline.               | Ver galeria em grid  |
| Fila de upload vazia   | `empty.queue.title`    | Nenhum arquivo na fila    | `empty.queue.body`    | O sync monitorara suas pastas automaticamente.                           | —                    |
| Sem pastas monitoradas | `empty.folders.title`  | Nenhuma pasta monitorada  | `empty.folders.body`  | Adicione uma pasta para que o Alexandria sincronize automaticamente.     | Adicionar pasta      |
| Cluster sem nos        | `empty.nodes.title`    | Nenhum no configurado     | `empty.nodes.body`    | Adicione pelo menos 1 no para comecar a salvar arquivos com replicacao.  | Adicionar no         |
| Vault sem credenciais  | `empty.vault.title`    | Vault vazio               | `empty.vault.body`    | Adicione credenciais de provedores cloud para distribuir seus chunks.    | Adicionar credencial |
| Sem alertas            | `empty.alerts.title`   | Nenhum alerta ativo       | `empty.alerts.body`   | Tudo certo com o cluster!                                                | —                    |
| Busca sem resultado    | `empty.search.title`   | Nenhum resultado          | `empty.search.body`   | Nenhum arquivo encontrado para "{{query}}".                              | Limpar busca         |
| Carregamento com erro  | `empty.error.title`    | Nao foi possivel carregar | `empty.error.body`    | Verifique sua conexao com o orquestrador.                                | Tentar novamente     |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra                                                                | Exemplo correto                          | Exemplo incorreto                                                  |
| -------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Capitalize apenas a primeira palavra em titulos e labels             | Salvar configuracoes                     | Salvar Configuracoes                                               |
| Use voz ativa e imperativo                                           | Adicionar pasta                          | Pasta deve ser adicionada                                          |
| CTAs: maximo 4 palavras                                              | Adicionar no                             | Clique aqui para adicionar um novo no ao cluster                   |
| Evite jargao tecnico na UI                                           | Algo deu errado                          | Erro 500: Internal Server Error                                    |
| Use pontuacao em mensagens completas (toasts, descricoes)            | Arquivo excluido do cluster.             | Arquivo excluido do cluster                                        |
| Nao use ponto em labels, botoes e titulos                            | Configuracoes                            | Configuracoes.                                                     |
| Reticencias indicam abertura de dialogo nativo                       | Adicionar pasta...                       | Adicionar pasta                                                    |
| Termos do glossario devem ser usados de forma consistente            | Vault, Cluster, No, Seed phrase          | Cofre, Servidor, Dispositivo, Palavras magicas                     |
| Mensagens de erro devem ser acionaveis                               | Verifique se o orquestrador esta online. | Erro de rede.                                                      |
| Feedback positivo e conciso                                          | Sync concluido!                          | Parabens! Seus arquivos foram enviados com sucesso para o cluster! |
| Mensagens criticas (seed, vault) usam linguagem enfatica sem alarmar | Anote em papel. Nao tire screenshot.     | ATENCAO!!!! Esta e SUA UNICA CHANCE!!!!                            |
| Nomes de arquivos e pastas entre aspas                               | "foto.jpg" ja existe                     | foto.jpg ja existe                                                 |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data       | Decisao                                                          | Motivo                                                                                                                                           |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-24 | pt-BR como idioma unico na v1 (sem i18n completo)                | Produto para familia brasileira; internacionalizacao sera adicionada se abrir para outras familias; chaves organizadas facilitam migracao futura |
| 2026-03-24 | Termos tecnicos (Vault, Seed phrase, Cluster, No) nao traduzidos | Termos sao parte da identidade do produto e do vocabulario de seguranca; traducoes criariam confusao com documentacao e comunidade               |
| 2026-03-24 | Tom direto sem marketing excessivo                               | Produto familiar/pessoal; copies de produto SaaS soariam artificiais para contexto domestic                                                      |

<!-- APPEND:decisoes -->
