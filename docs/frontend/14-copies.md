# Copies

Define todos os textos e conteudos textuais das telas do frontend — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | pt-BR |
| Suporte i18n | Sim — lib: next-intl (integrado com App Router) |
| Estrutura de chaves | namespace.screen.element — ex: `auth.login.submitButton` |
| Arquivos de traducao | `locales/pt-BR.json`, `locales/en-US.json` |
| Tom de voz | Casual e amigavel — linguagem acessivel para toda a familia, incluindo avos e membros com baixo nivel tecnico |
| Pessoa gramatical | Voce |
| Genero | Neutro quando possivel |

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo | Definicao | Nao usar |
| --- | --- | --- |
| Cluster | Grupo familiar que compartilha o armazenamento | Grupo, Rede, Time |
| Membro | Pessoa dentro do cluster familiar | Usuario, Participante, Conta |
| No | Dispositivo ou provedor cloud que armazena dados | Servidor, Storage, Disco |
| Vault | Cofre criptografado pessoal do membro | Carteira, Cofre digital, Wallet |
| Seed phrase | Frase de 12 palavras para recuperacao do sistema | Chave mestra, Senha mestra, Frase secreta |
| Chunk | Fragmento criptografado de um arquivo | Pedaco, Bloco, Parte |
| Manifest | Mapa que descreve como reconstruir um arquivo a partir dos chunks | Indice, Catalogo |
| Galeria | Acervo de fotos e videos da familia | Biblioteca, Albuns, Midiateca |
| Upload | Envio de arquivos para o sistema | Importacao, Carregamento |
| Thumbnail | Miniatura de preview de uma foto ou video | Preview pequeno, Icone |
| Tier | Classificacao de disponibilidade do no (hot/warm/cold) | Nivel, Camada |
| Drain | Migracao de dados antes de remover um no | Esvaziamento, Transferencia |
| Heartbeat | Sinal periodico de que um no esta online | Pulso, Ping, Status |
| Replicacao | Copia de chunks em multiplos nos para seguranca | Backup, Espelhamento |
| Pipeline | Processo automatizado de otimizacao de midia | Processamento, Conversao |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela? Organize por rota/pagina conforme definido em 07-rotas.md.

### Tela: Landing Page (`/`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo hero | `landing.hero.title` | Suas memorias familiares, seguras para sempre | Heading principal da landing |
| Subtitulo hero | `landing.hero.subtitle` | Armazene fotos e videos da familia com criptografia e redundancia. Recupere tudo com 12 palavras. | Descricao abaixo do titulo |
| CTA principal | `landing.hero.cta` | Criar cluster familiar | Botao principal do hero |
| CTA secundario | `landing.hero.ctaSecondary` | Ja tenho conta | Link para login |
| Secao como funciona | `landing.howItWorks.title` | Como funciona | Titulo da secao explicativa |
| Passo 1 | `landing.howItWorks.step1` | Crie seu cluster familiar e receba sua seed phrase de 12 palavras | Primeiro passo |
| Passo 2 | `landing.howItWorks.step2` | Conecte dispositivos e provedores cloud como nos de armazenamento | Segundo passo |
| Passo 3 | `landing.howItWorks.step3` | Envie fotos e videos — o sistema otimiza, criptografa e distribui automaticamente | Terceiro passo |

<!-- APPEND:copies-landing -->

### Tela: Login (`/login`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.login.title` | Entrar no Alexandria | Heading principal da pagina |
| Placeholder nome | `auth.login.namePlaceholder` | Seu nome no cluster | Campo de identificacao do membro |
| Placeholder senha | `auth.login.passwordPlaceholder` | Sua senha | Campo de senha |
| Botao submit | `auth.login.submitButton` | Entrar | CTA principal |
| Link recuperacao | `auth.login.recoveryLink` | Recuperar sistema com seed phrase | Link para /recovery |
| Erro credenciais | `auth.login.errorInvalid` | Nome ou senha incorretos | Mensagem de erro inline |

<!-- APPEND:copies-login -->

### Tela: Convite (`/invite/[token]`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.invite.title` | Voce foi convidado para o cluster familiar | Heading principal |
| Subtitulo | `auth.invite.subtitle` | Crie sua conta para acessar fotos e videos da familia | Descricao |
| Label nome | `auth.invite.nameLabel` | Seu nome | Campo de nome do membro |
| Label senha | `auth.invite.passwordLabel` | Crie uma senha | Campo de senha |
| Label confirmar senha | `auth.invite.confirmPasswordLabel` | Confirme sua senha | Campo de confirmacao |
| Botao submit | `auth.invite.submitButton` | Aceitar convite | CTA principal |
| Token expirado titulo | `auth.invite.expiredTitle` | Convite expirado | Titulo quando token invalido |
| Token expirado mensagem | `auth.invite.expiredMessage` | Este convite nao e mais valido. Peca ao administrador do cluster para enviar um novo convite. | Mensagem quando token invalido |

<!-- APPEND:copies-convite -->

### Tela: Recuperacao (`/recovery`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `recovery.title` | Recuperar sistema | Heading principal |
| Subtitulo | `recovery.subtitle` | Insira sua seed phrase de 12 palavras para recuperar o cluster | Descricao |
| Label seed | `recovery.seedLabel` | Palavra {{n}} | Label de cada campo (1-12) |
| Botao submit | `recovery.submitButton` | Iniciar recuperacao | CTA principal |
| Progresso titulo | `recovery.progress.title` | Recuperando seu cluster | Titulo durante recuperacao |
| Etapa derivando | `recovery.progress.derivingKeys` | Derivando chaves criptograficas | Status do pipeline |
| Etapa vaults | `recovery.progress.decryptingVaults` | Descriptografando vaults dos membros | Status do pipeline |
| Etapa nos | `recovery.progress.reconnectingNodes` | Reconectando nos de armazenamento | Status do pipeline |
| Etapa indice | `recovery.progress.rebuildingIndex` | Reconstruindo indice de arquivos | Status do pipeline |
| Progresso nos | `recovery.progress.nodesStatus` | Nos reconectados: {{connected}}/{{total}} | Contador de nos |
| Progresso manifests | `recovery.progress.manifestsStatus` | Manifests recuperados: {{count}} | Contador de manifests |
| Progresso arquivos | `recovery.progress.filesStatus` | Arquivos indexados: {{count}} | Contador de arquivos |
| Sucesso | `recovery.success` | Cluster recuperado com sucesso | Mensagem de conclusao |

<!-- APPEND:copies-recovery -->

### Tela: Galeria (`/gallery`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `gallery.title` | Galeria | Heading principal |
| Busca placeholder | `gallery.searchPlaceholder` | Buscar por nome, data ou tags | Placeholder da barra de busca |
| Filtro tipo | `gallery.filter.type` | Tipo | Label do filtro de tipo |
| Filtro tipo foto | `gallery.filter.typePhoto` | Fotos | Opcao do filtro |
| Filtro tipo video | `gallery.filter.typeVideo` | Videos | Opcao do filtro |
| Filtro periodo | `gallery.filter.period` | Periodo | Label do filtro de data |
| Filtro membro | `gallery.filter.member` | Membro | Label do filtro por membro |
| Empty state | `gallery.empty.title` | Nenhuma memoria por aqui ainda | Titulo do empty state |
| Empty state descricao | `gallery.empty.description` | Envie suas primeiras fotos e videos para comecar a construir o acervo da familia | Descricao do empty state |
| Empty state CTA | `gallery.empty.cta` | Enviar fotos | Botao no empty state |
| Busca sem resultado | `gallery.search.noResults` | Nenhum resultado para "{{termo}}" | Mensagem de busca vazia |
| Busca sem resultado dica | `gallery.search.noResultsHint` | Tente termos diferentes ou ajuste os filtros | Dica abaixo da busca vazia |

<!-- APPEND:copies-galeria -->

### Tela: Detalhe do Arquivo (`/gallery/[fileId]`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Botao baixar | `fileDetail.download` | Baixar original | Botao de download sob demanda |
| Baixando | `fileDetail.downloading` | Reconstruindo arquivo... | Status durante download |
| Info data | `fileDetail.info.date` | Data | Label de metadado |
| Info tamanho | `fileDetail.info.size` | Tamanho | Label de metadado |
| Info tipo | `fileDetail.info.type` | Tipo | Label de metadado |
| Info replicacao | `fileDetail.info.replication` | Copias | Label de metadado |
| Info resolucao | `fileDetail.info.resolution` | Resolucao | Label de metadado |
| Indisponivel titulo | `fileDetail.unavailable.title` | Arquivo temporariamente indisponivel | Quando chunks nao acessiveis |
| Indisponivel mensagem | `fileDetail.unavailable.message` | A replicacao ainda esta em andamento. Tente novamente em alguns minutos. | Descricao do erro |
| Botao retry | `fileDetail.unavailable.retry` | Tentar novamente | CTA de retry |

<!-- APPEND:copies-file-detail -->

### Tela: Upload (`/upload`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `upload.title` | Upload | Heading principal |
| Dropzone titulo | `upload.dropzone.title` | Arraste arquivos aqui ou clique para selecionar | Texto da area de drag-and-drop |
| Dropzone formatos | `upload.dropzone.formats` | Formatos aceitos: JPEG, PNG, HEIC, MP4, MOV | Descricao de formatos |
| Botao selecionar | `upload.dropzone.selectButton` | Selecionar arquivos | CTA do dropzone |
| Fila titulo | `upload.queue.title` | Fila de upload | Titulo da secao de fila |
| Status analisando | `upload.status.analyzing` | Analisando | Badge de status |
| Status otimizando | `upload.status.optimizing` | Otimizando | Badge de status |
| Status preview | `upload.status.generatingPreview` | Gerando preview | Badge de status |
| Status criptografando | `upload.status.encrypting` | Criptografando e distribuindo | Badge de status |
| Status concluido | `upload.status.completed` | Concluido | Badge de status |
| Status erro | `upload.status.error` | Erro no processamento | Badge de status |
| Status pausado | `upload.status.paused` | Pausado — sem conexao | Badge de status |
| Progresso global | `upload.progress.global` | {{completed}} de {{total}} arquivos enviados | Barra de progresso global |
| Ver na galeria | `upload.viewInGallery` | Ver na galeria | Link apos conclusao |
| Empty state | `upload.empty.title` | Nenhum upload em andamento | Empty state da fila |
| Empty state descricao | `upload.empty.description` | Arraste fotos e videos para comecar | Descricao do empty state |

<!-- APPEND:copies-upload -->

### Tela: Nos de Armazenamento (`/nodes`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.title` | Nos de armazenamento | Heading principal |
| Botao adicionar | `nodes.addButton` | Adicionar no | CTA principal |
| Status online | `nodes.status.online` | Online | Badge de status |
| Status offline | `nodes.status.offline` | Offline | Badge de status |
| Status suspeito | `nodes.status.suspect` | Sem resposta | Badge de status |
| Tier hot | `nodes.tier.hot` | Hot — sempre online | Label de tier |
| Tier warm | `nodes.tier.warm` | Warm — frequente | Label de tier |
| Tier cold | `nodes.tier.cold` | Cold — ocasional | Label de tier |
| Capacidade | `nodes.capacity` | {{used}} de {{total}} usado | Barra de capacidade |
| Ultimo heartbeat | `nodes.lastHeartbeat` | Ultimo sinal: {{time}} | Tooltip de heartbeat |
| Empty state | `nodes.empty.title` | Nenhum no conectado | Empty state |
| Empty state descricao | `nodes.empty.description` | Adicione dispositivos ou provedores cloud para comecar a armazenar seus dados | Descricao |
| Empty state CTA | `nodes.empty.cta` | Adicionar primeiro no | CTA do empty state |

<!-- APPEND:copies-nodes -->

### Tela: Adicionar No (`/nodes/add`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.add.title` | Adicionar no de armazenamento | Heading principal |
| Subtitulo | `nodes.add.subtitle` | Escolha o tipo de no que deseja conectar | Descricao |
| Tipo local | `nodes.add.typeLocal` | Dispositivo local | Opcao de tipo |
| Tipo local desc | `nodes.add.typeLocalDesc` | Computador, NAS ou HD externo | Descricao do tipo |
| Tipo S3 | `nodes.add.typeS3` | S3 / R2 / B2 | Opcao de tipo |
| Tipo S3 desc | `nodes.add.typeS3Desc` | Amazon S3, Cloudflare R2 ou Backblaze B2 | Descricao do tipo |
| Tipo Google | `nodes.add.typeGoogle` | Google Drive | Opcao de tipo |
| Tipo Dropbox | `nodes.add.typeDropbox` | Dropbox | Opcao de tipo |
| Tipo OneDrive | `nodes.add.typeOneDrive` | OneDrive | Opcao de tipo |
| S3 endpoint label | `nodes.add.s3Endpoint` | Endpoint | Label do formulario S3 |
| S3 access key label | `nodes.add.s3AccessKey` | Access key | Label do formulario S3 |
| S3 secret key label | `nodes.add.s3SecretKey` | Secret key | Label do formulario S3 |
| S3 bucket label | `nodes.add.s3Bucket` | Nome do bucket | Label do formulario S3 |
| Botao validar | `nodes.add.validateButton` | Validar conexao | CTA de validacao S3 |
| Validacao sucesso | `nodes.add.validateSuccess` | Conexao validada com sucesso | Feedback de validacao |
| Validacao erro | `nodes.add.validateError` | Nao foi possivel conectar. Verifique as credenciais. | Feedback de erro |
| OAuth botao | `nodes.add.oauthButton` | Conectar com {{provider}} | CTA para fluxo OAuth |
| Botao salvar | `nodes.add.saveButton` | Registrar no | CTA final |

<!-- APPEND:copies-nodes-add -->

### Tela: Detalhe do No (`/nodes/[nodeId]`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Capacidade titulo | `nodeDetail.capacity.title` | Capacidade | Secao de capacidade |
| Chunks titulo | `nodeDetail.chunks.title` | Chunks armazenados | Secao de chunks |
| Chunks total | `nodeDetail.chunks.total` | {{count}} chunks | Contador |
| Configuracao titulo | `nodeDetail.config.title` | Configuracao | Secao de configuracao |
| Quota label | `nodeDetail.config.quotaLabel` | Limite de armazenamento | Label de quota |
| Tier label | `nodeDetail.config.tierLabel` | Classificacao | Label de tier |
| Botao remover | `nodeDetail.removeButton` | Remover no | CTA destrutivo |
| Drain titulo | `nodeDetail.drain.title` | Removendo no com seguranca | Titulo durante drain |
| Drain descricao | `nodeDetail.drain.description` | Migrando chunks para outros nos antes da remocao. Isso pode levar alguns minutos. | Descricao durante drain |
| Drain progresso | `nodeDetail.drain.progress` | {{migrated}} de {{total}} chunks migrados | Progresso do drain |

<!-- APPEND:copies-node-detail -->

### Tela: OAuth Callback (`/nodes/[nodeId]/oauth/callback`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Processando | `oauth.callback.processing` | Conectando sua conta... | Mensagem durante processamento |
| Sucesso | `oauth.callback.success` | Conta conectada com sucesso | Mensagem de sucesso |
| Erro | `oauth.callback.error` | Nao foi possivel conectar a conta. Tente novamente. | Mensagem de erro |

<!-- APPEND:copies-oauth -->

### Tela: Cluster (`/cluster`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `cluster.title` | Cluster familiar | Heading principal |
| Info cluster id | `cluster.info.clusterId` | ID do cluster | Label informativo |
| Info criado em | `cluster.info.createdAt` | Criado em | Label informativo |
| Info total membros | `cluster.info.totalMembers` | Membros | Label informativo |
| Info total nos | `cluster.info.totalNodes` | Nos conectados | Label informativo |
| Info total arquivos | `cluster.info.totalFiles` | Arquivos armazenados | Label informativo |

<!-- APPEND:copies-cluster -->

### Tela: Membros (`/cluster/members`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `members.title` | Membros do cluster | Heading principal |
| Botao convidar | `members.inviteButton` | Convidar membro | CTA principal |
| Role admin | `members.role.admin` | Administrador | Label de role |
| Role membro | `members.role.member` | Membro | Label de role |
| Role leitura | `members.role.readonly` | Somente leitura | Label de role |
| Empty state | `members.empty.title` | Voce e o unico membro | Empty state |
| Empty state descricao | `members.empty.description` | Convide sua familia para comecar a compartilhar memorias | Descricao |
| Empty state CTA | `members.empty.cta` | Convidar primeiro membro | CTA do empty state |

<!-- APPEND:copies-members -->

### Tela: Detalhe do Membro (`/cluster/members/[memberId]`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Dispositivos titulo | `memberDetail.devices.title` | Dispositivos | Secao |
| Quota titulo | `memberDetail.quota.title` | Uso de armazenamento | Secao |
| Auditoria titulo | `memberDetail.audit.title` | Atividade recente | Secao de auditoria |
| Alterar role | `memberDetail.changeRole` | Alterar permissao | CTA |
| Remover membro | `memberDetail.removeButton` | Remover do cluster | CTA destrutivo |

<!-- APPEND:copies-member-detail -->

### Tela: Gerar Convite (`/cluster/invite`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `invite.create.title` | Convidar novo membro | Heading principal |
| Expiracao label | `invite.create.expirationLabel` | Validade do convite | Label do campo |
| Expiracao 24h | `invite.create.expiration24h` | 24 horas | Opcao de expiracao |
| Expiracao 7d | `invite.create.expiration7d` | 7 dias | Opcao de expiracao |
| Expiracao 30d | `invite.create.expiration30d` | 30 dias | Opcao de expiracao |
| Botao gerar | `invite.create.generateButton` | Gerar link de convite | CTA principal |
| Link gerado titulo | `invite.create.linkTitle` | Link de convite | Titulo apos gerar |
| Link gerado instrucao | `invite.create.linkInstruction` | Compartilhe este link com o membro da familia | Instrucao |
| Botao copiar | `invite.create.copyButton` | Copiar link | CTA de copiar |
| Copiado | `invite.create.copied` | Link copiado | Feedback de copia |

<!-- APPEND:copies-invite -->

### Tela: Dashboard de Saude (`/health`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `health.title` | Saude do cluster | Heading principal |
| Replicacao titulo | `health.replication.title` | Replicacao | Secao |
| Replicacao saudavel | `health.replication.healthy` | {{percentage}}% dos chunks com 3+ copias | Status saudavel |
| Replicacao alerta | `health.replication.warning` | {{count}} chunks com menos de 3 copias | Status de alerta |
| Capacidade titulo | `health.capacity.title` | Capacidade total | Secao |
| Capacidade valor | `health.capacity.value` | {{used}} de {{total}} usado | Valor de capacidade |
| Nos titulo | `health.nodes.title` | Status dos nos | Secao |
| Nos online | `health.nodes.online` | {{count}} online | Contador |
| Nos offline | `health.nodes.offline` | {{count}} offline | Contador |
| Alertas titulo | `health.alerts.title` | Alertas recentes | Secao |
| Ver todos alertas | `health.alerts.viewAll` | Ver todos os alertas | Link para /health/alerts |

<!-- APPEND:copies-health -->

### Tela: Alertas (`/health/alerts`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `alerts.title` | Alertas | Heading principal |
| Tipo no offline | `alerts.type.nodeOffline` | No offline | Tipo de alerta |
| Tipo replicacao | `alerts.type.lowReplication` | Replicacao abaixo do minimo | Tipo de alerta |
| Tipo token | `alerts.type.tokenExpired` | Token OAuth expirado | Tipo de alerta |
| Tipo capacidade | `alerts.type.capacityWarning` | Capacidade quase cheia | Tipo de alerta |
| Empty state | `alerts.empty.title` | Nenhum alerta | Empty state |
| Empty state descricao | `alerts.empty.description` | Tudo esta funcionando normalmente | Descricao |

<!-- APPEND:copies-alerts -->

### Tela: Vault (`/vault`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `vault.title` | Seu vault | Heading principal |
| Subtitulo | `vault.subtitle` | Credenciais e tokens armazenados com criptografia | Descricao |
| Tokens titulo | `vault.tokens.title` | Tokens OAuth | Secao de tokens |
| Token provedor | `vault.tokens.provider` | Provedor | Label de coluna |
| Token status | `vault.tokens.status` | Status | Label de coluna |
| Token ativo | `vault.tokens.active` | Ativo | Badge de status |
| Token expirado | `vault.tokens.expired` | Expirado — reconectar | Badge de status |
| Botao reconectar | `vault.tokens.reconnectButton` | Reconectar | CTA de reconexao |
| Empty state | `vault.empty.title` | Nenhuma credencial armazenada | Empty state |
| Empty state descricao | `vault.empty.description` | Tokens OAuth e credenciais de nos aparecerao aqui quando voce conectar provedores | Descricao |

<!-- APPEND:copies-vault -->

### Tela: Configuracoes (`/settings`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `settings.title` | Configuracoes | Heading principal |
| Secao perfil | `settings.profile.title` | Perfil | Titulo da secao |
| Nome label | `settings.profile.nameLabel` | Nome | Label do campo |
| Senha label | `settings.profile.passwordLabel` | Alterar senha | Label do campo |
| Secao aparencia | `settings.appearance.title` | Aparencia | Titulo da secao |
| Tema label | `settings.appearance.themeLabel` | Tema | Label do campo |
| Tema claro | `settings.appearance.themeLight` | Claro | Opcao |
| Tema escuro | `settings.appearance.themeDark` | Escuro | Opcao |
| Tema sistema | `settings.appearance.themeSystem` | Automatico (sistema) | Opcao |
| Secao notificacoes | `settings.notifications.title` | Notificacoes | Titulo da secao |
| Notif alertas | `settings.notifications.alerts` | Alertas de saude do cluster | Toggle |
| Notif upload | `settings.notifications.upload` | Upload concluido | Toggle |
| Botao salvar | `settings.saveButton` | Salvar configuracoes | CTA principal |

<!-- APPEND:copies-settings -->

### Tela: Seed Phrase (`/recovery/seed`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `seed.title` | Sua seed phrase | Heading principal |
| Aviso | `seed.warning` | Anote estas 12 palavras em um lugar seguro. Elas sao a unica forma de recuperar o sistema em caso de perda total. Nunca compartilhe online. | Alerta de seguranca |
| Confirmar senha label | `seed.confirmPasswordLabel` | Confirme sua senha para visualizar | Label de re-autenticacao |
| Botao revelar | `seed.revealButton` | Revelar seed phrase | CTA |
| Botao copiar | `seed.copyButton` | Copiar para area de transferencia | CTA secundario |
| Copiado | `seed.copied` | Copiado — guarde em local seguro | Feedback |

<!-- APPEND:copies-seed -->

### Tela: Onboarding — Criacao de Cluster <!-- inferido do PRD -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Wizard titulo | `onboarding.title` | Criar cluster familiar | Titulo do wizard |
| Step 1 titulo | `onboarding.step1.title` | Seu cluster esta sendo criado | Geracao de chaves |
| Step 1 descricao | `onboarding.step1.description` | Estamos gerando as chaves criptograficas do seu cluster | Descricao |
| Step 2 titulo | `onboarding.step2.title` | Anote sua seed phrase | Exibicao da seed |
| Step 2 descricao | `onboarding.step2.description` | Estas 12 palavras sao a unica forma de recuperar o sistema. Anote em papel e guarde em local seguro. | Instrucao de seguranca |
| Step 2 checkbox | `onboarding.step2.confirmCheckbox` | Eu anotei minha seed phrase em um lugar seguro | Checkbox obrigatorio |
| Step 3 titulo | `onboarding.step3.title` | Confirme sua seed phrase | Verificacao |
| Step 3 descricao | `onboarding.step3.description` | Digite as palavras {{pos1}}, {{pos2}} e {{pos3}} da sua seed phrase | Instrucao de verificacao |
| Step 4 titulo | `onboarding.step4.title` | Crie seu vault pessoal | Criacao de vault |
| Step 4 nome label | `onboarding.step4.nameLabel` | Seu nome | Campo de nome |
| Step 4 senha label | `onboarding.step4.passwordLabel` | Crie uma senha | Campo de senha |
| Step 4 confirmar label | `onboarding.step4.confirmLabel` | Confirme sua senha | Campo de confirmacao |
| Botao avancar | `onboarding.nextButton` | Continuar | CTA de proximo passo |
| Botao concluir | `onboarding.finishButton` | Criar cluster | CTA final |
| Sucesso | `onboarding.success` | Cluster criado com sucesso! Bem-vindo ao Alexandria. | Mensagem de conclusao |

<!-- APPEND:copies-onboarding -->

<!-- APPEND:copies-telas -->

---

## Mensagens de Feedback

> Quais sao as mensagens de sucesso, erro, aviso e informacao exibidas ao usuario?

### Sucesso

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.success.clusterCreated` | Cluster familiar criado com sucesso | Toast apos criar cluster |
| `feedback.success.memberInvited` | Convite gerado com sucesso | Toast apos gerar convite |
| `feedback.success.inviteAccepted` | Bem-vindo ao cluster familiar! | Toast apos aceitar convite |
| `feedback.success.nodeAdded` | No registrado e conectado | Toast apos adicionar no |
| `feedback.success.nodeRemoved` | No removido com sucesso | Toast apos drain e remocao |
| `feedback.success.uploadCompleted` | {{count}} arquivo(s) enviado(s) com sucesso | Toast apos uploads concluidos |
| `feedback.success.settingsSaved` | Configuracoes salvas | Toast apos salvar settings |
| `feedback.success.passwordChanged` | Senha alterada com sucesso | Toast apos alterar senha |
| `feedback.success.roleChanged` | Permissao do membro alterada | Toast apos alterar role |
| `feedback.success.recoveryCompleted` | Cluster recuperado com sucesso | Toast apos recovery |
| `feedback.success.oauthConnected` | Conta {{provider}} conectada | Toast apos OAuth |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.error.generic` | Algo deu errado. Tente novamente. | Fallback generico |
| `feedback.error.network` | Sem conexao com o servidor. Verifique sua internet. | Erro de rede |
| `feedback.error.unauthorized` | Sessao expirada. Faca login novamente. | 401 |
| `feedback.error.forbidden` | Voce nao tem permissao para esta acao. | 403 |
| `feedback.error.notFound` | Recurso nao encontrado. | 404 |
| `feedback.error.invalidCredentials` | Nome ou senha incorretos. | Erro de login |
| `feedback.error.invalidSeed` | Seed phrase invalida. Verifique as palavras digitadas. | Erro de recovery |
| `feedback.error.seedNoCluster` | Nenhum cluster encontrado para esta seed phrase. Verifique se os nos estao acessiveis. | Cluster nao encontrado |
| `feedback.error.inviteExpired` | Este convite expirou. Peca um novo ao administrador. | Token expirado |
| `feedback.error.s3InvalidCredentials` | Nao foi possivel conectar. Verifique as credenciais e o endpoint. | Validacao S3 |
| `feedback.error.oauthDenied` | Voce nao autorizou o acesso. Tente novamente se quiser conectar. | OAuth negado |
| `feedback.error.oauthFailed` | Erro ao conectar a conta. Tente novamente. | OAuth falha |
| `feedback.error.uploadFormat` | Formato nao suportado. Use JPEG, PNG, HEIC, MP4 ou MOV. | Validacao de arquivo |
| `feedback.error.uploadFailed` | Erro ao enviar "{{filename}}". Tente novamente. | Falha de upload |
| `feedback.error.pipelineFailed` | Erro ao processar "{{filename}}". O arquivo pode estar corrompido. | Falha de pipeline |
| `feedback.error.downloadFailed` | Arquivo temporariamente indisponivel. A replicacao pode estar em andamento. | Falha de download |
| `feedback.error.drainFailed` | Nao foi possivel migrar todos os chunks. Adicione mais nos antes de remover este. | Falha de drain |
| `feedback.error.vaultCreationFailed` | Erro ao criar seu vault. Tente novamente. | Falha na criacao do vault |
| `feedback.error.serverOffline` | O servidor esta indisponivel. Verifique sua conexao. | Servidor offline |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| `validation.required` | Campo obrigatorio | Campo vazio no submit |
| `validation.minLength` | Minimo de {{min}} caracteres | Texto curto demais |
| `validation.maxLength` | Maximo de {{max}} caracteres | Texto longo demais |
| `validation.passwordMismatch` | As senhas nao coincidem | Confirmacao de senha |
| `validation.passwordWeak` | A senha deve ter pelo menos 8 caracteres | Senha fraca |
| `validation.seedWordInvalid` | "{{word}}" nao faz parte da lista de palavras validas | Palavra fora do wordlist BIP-39 |
| `validation.seedIncomplete` | Preencha todas as 12 palavras | Seed incompleta |
| `validation.seedVerificationFailed` | As palavras nao correspondem a sua seed phrase | Verificacao de seed falhou |
| `validation.urlInvalid` | URL invalida | Formato de endpoint invalido |
| `validation.nameRequired` | Informe seu nome | Nome vazio |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.warning.unsavedChanges` | Voce tem alteracoes nao salvas. Deseja sair? | Modal ao navegar |
| `feedback.warning.nodeOffline` | O no "{{nodeName}}" esta offline desde {{time}} | Banner de alerta |
| `feedback.warning.lowReplication` | {{count}} chunks com menos de 3 copias. Adicione mais nos para melhorar a seguranca. | Banner no health dashboard |
| `feedback.warning.tokenExpiring` | O token do {{provider}} expira em breve. Reconecte sua conta. | Banner de aviso |
| `feedback.warning.capacityHigh` | O no "{{nodeName}}" esta com {{percentage}}% da capacidade. Considere adicionar mais espaco. | Banner de aviso |
| `feedback.warning.drainConfirm` | Ao remover este no, todos os chunks serao migrados. Isso pode demorar. Deseja continuar? | Modal de confirmacao |
| `feedback.warning.removeMemberConfirm` | Remover "{{memberName}}" do cluster? O membro perdera acesso a galeria e uploads. | Modal de confirmacao |
| `feedback.info.loading` | Carregando... | Estado de loading |
| `feedback.info.noResults` | Nenhum resultado encontrado | Busca sem resultados |
| `feedback.info.syncInProgress` | Sincronizando arquivos... | Indicador de sync |
| `feedback.info.replicationPending` | Replicacao em andamento | Badge de replicacao |
| `feedback.info.recoveryBanner` | Alguns arquivos podem nao estar indexados. Verifique nos offline. | Banner pos-recovery |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Navbar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Logo alt | `global.navbar.logoAlt` | Alexandria — armazenamento familiar |
| Link login | `global.navbar.login` | Entrar |
| Link sobre | `global.navbar.about` | Sobre |

<!-- APPEND:copies-navbar -->

### Sidebar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Galeria | `global.sidebar.gallery` | Galeria |
| Upload | `global.sidebar.upload` | Upload |
| Upload badge | `global.sidebar.uploadBadge` | {{count}} pendentes |
| Nos | `global.sidebar.nodes` | Nos |
| Saude | `global.sidebar.health` | Saude |
| Saude badge | `global.sidebar.healthBadge` | {{count}} alertas |
| Vault | `global.sidebar.vault` | Vault |
| Cluster | `global.sidebar.cluster` | Cluster |
| Configuracoes | `global.sidebar.settings` | Configuracoes |
| Sair | `global.sidebar.logout` | Sair |

<!-- APPEND:copies-sidebar -->

### Footer

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Copyright | `global.footer.copyright` | © {{ano}} Alexandria. Todos os direitos reservados. |
| Termos | `global.footer.terms` | Termos de uso |
| Privacidade | `global.footer.privacy` | Politica de privacidade |

<!-- APPEND:copies-footer -->

### Header (Area Logada)

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Busca placeholder | `global.header.searchPlaceholder` | Buscar... |
| Sync status sincronizando | `global.header.syncActive` | Sincronizando |
| Sync status ok | `global.header.syncDone` | Tudo sincronizado |
| Sync status erro | `global.header.syncError` | Erro de sincronizacao |
| Notificacoes tooltip | `global.header.notificationsTooltip` | Notificacoes |
| Menu perfil | `global.header.profile` | Meu perfil |
| Menu configuracoes | `global.header.settings` | Configuracoes |
| Menu sair | `global.header.logout` | Sair |

<!-- APPEND:copies-header -->

### Modais Genericos

| Modal | Chave i18n titulo | Texto titulo | Chave i18n corpo | Texto corpo |
| --- | --- | --- | --- | --- |
| Confirmacao de exclusao | `modal.delete.title` | Confirmar exclusao | `modal.delete.body` | Tem certeza que deseja excluir? Esta acao nao pode ser desfeita. |
| Confirmacao de saida | `modal.leave.title` | Sair sem salvar? | `modal.leave.body` | Suas alteracoes nao salvas serao perdidas. |
| Confirmacao de remocao de no | `modal.removeNode.title` | Remover no? | `modal.removeNode.body` | Todos os chunks serao migrados para outros nos antes da remocao. |
| Confirmacao de remocao de membro | `modal.removeMember.title` | Remover membro? | `modal.removeMember.body` | O membro perdera acesso ao cluster e seus dados compartilhados. |
| Botao confirmar | `modal.confirmButton` | Confirmar | `modal.cancelButton` | Cancelar |

<!-- APPEND:copies-modais -->

### Empty States

| Tela/Secao | Chave i18n | Texto | CTA |
| --- | --- | --- | --- |
| Galeria vazia | `empty.gallery` | Nenhuma memoria por aqui ainda | Enviar fotos |
| Busca sem resultado | `empty.search` | Nenhum resultado para "{{termo}}" | Limpar filtros |
| Erro de carregamento | `empty.error` | Nao foi possivel carregar os dados | Tentar novamente |
| Nos vazio | `empty.nodes` | Nenhum no conectado | Adicionar primeiro no |
| Membros vazio | `empty.members` | Voce e o unico membro do cluster | Convidar membro |
| Alertas vazio | `empty.alerts` | Nenhum alerta — tudo funcionando | — |
| Vault vazio | `empty.vault` | Nenhuma credencial armazenada | — |
| Fila de upload vazia | `empty.uploadQueue` | Nenhum upload em andamento | Selecionar arquivos |
| Auditoria vazia | `empty.audit` | Nenhuma atividade recente | — |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra em titulos | Criar cluster familiar | Criar Cluster Familiar |
| Use voz ativa | Envie suas fotos | Suas fotos devem ser enviadas |
| Seja direto — maximo 60 caracteres em CTAs | Adicionar no | Clique aqui para adicionar um novo no de armazenamento |
| Evite jargao tecnico em mensagens ao usuario | Algo deu errado | Erro 500: Internal Server Error |
| Use pontuacao em frases completas | Suas configuracoes foram salvas. | Suas configuracoes foram salvas |
| Nao use ponto em labels e botoes | Salvar configuracoes | Salvar configuracoes. |
| Tooltips devem ser autoexplicativos | Exportar dados em CSV | Clique para exportar |
| Termos tecnicos do dominio usam o glossario | Chunk, Manifest, Vault, Seed phrase | Pedaco, Indice, Cofre, Frase secreta |
| Numeros de contagem usam formato localizado | 1.234 arquivos | 1234 arquivos |
| Datas usam formato brasileiro | 18 de mar. de 2026 | 2026-03-18 |
| Mensagens de erro incluem orientacao | Nao foi possivel conectar. Verifique as credenciais. | Erro de conexao. |
| Confirmacoes destrutivas nomeiam o recurso | Remover no "meu-nas"? | Tem certeza? |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-18 | Idioma padrao pt-BR com suporte i18n via next-intl | Produto de uso familiar brasileiro; next-intl integra nativamente com App Router |
| 2026-03-18 | Tom de voz casual e amigavel, pessoa "voce" | Membros com baixo nivel tecnico (avos, tios) precisam de linguagem acessivel |
| 2026-03-18 | Termos tecnicos do dominio mantidos em ingles (Chunk, Vault, Manifest) | Sao conceitos do sistema sem traducao direta; consistencia com documentacao tecnica |
| 2026-03-18 | Mensagens de erro sempre incluem orientacao de acao | Usuarios nao tecnicos precisam saber o que fazer, nao apenas o que deu errado |
| 2026-03-18 | Genero neutro sempre que possivel | Inclusao e adequacao a comunicacao moderna |

<!-- APPEND:decisoes -->
