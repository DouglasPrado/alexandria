# Copies

Define todos os textos e conteudos textuais das telas do frontend web — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-010), 17-communication.md (tom de voz), 07-routes.md (rotas) -->

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | pt-BR |
| Suporte i18n | Sim — lib: next-intl (v1 apenas pt-BR; i18n preparado para en-US futuro) |
| Estrutura de chaves | namespace.screen.element — ex: `auth.login.submitButton` |
| Arquivos de traducao | `messages/pt-BR.json` (default), `messages/en-US.json` (futuro) |
| Tom de voz | Informal e acolhedor — produto para familias, nao para empresas |
| Pessoa gramatical | Voce |
| Genero | Neutro quando possivel |

<!-- do blueprint: 17-communication.md — tom informal e familiar, sem jargao tecnico -->

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo na UI | Definicao | Nao usar |
| --- | --- | --- |
| Cluster | Grupo familiar que compartilha o acervo | Servidor, Workspace, Conta |
| Membro | Pessoa que pertence ao cluster | Usuario, Participante, Conta |
| No | Dispositivo ou servico cloud que armazena dados | Servidor, Storage, Bucket |
| Galeria | Tela principal com fotos, videos e documentos | Feed, Timeline, Biblioteca |
| Upload | Envio de arquivo para o cluster | Importar, Sincronizar |
| Download | Baixar arquivo do cluster para o dispositivo | Exportar, Salvar |
| Seed phrase | 12 palavras para recuperacao do sistema | Chave, Senha mestra, Recovery key |
| Preview | Miniatura leve de um arquivo para visualizacao | Thumbnail (apenas em contexto tecnico) |
| Nó online | No funcionando normalmente | Ativo, Conectado |
| Nó suspeito | No sem resposta ha 30 minutos | Instavel, Com problema |
| Nó perdido | No sem resposta ha 1 hora | Offline, Desconectado |
| Admin | Membro que gerencia o cluster | Administrador (forma completa aceita) |
| Leitor | Membro que so visualiza | Somente leitura, Viewer |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela? Organize por rota/pagina conforme definido em 07-rotas.md.

### Tela: Login (`/login`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.login.title` | Entrar no Alexandria | Heading principal da pagina |
| Subtitulo | `auth.login.subtitle` | Acesse o acervo da sua familia | Texto abaixo do titulo |
| Label email | `auth.login.emailLabel` | Email | Label do campo |
| Placeholder email | `auth.login.emailPlaceholder` | seu@email.com | Campo de email |
| Label senha | `auth.login.passwordLabel` | Senha | Label do campo |
| Placeholder senha | `auth.login.passwordPlaceholder` | Sua senha | Campo de senha |
| Botao submit | `auth.login.submitButton` | Entrar | CTA principal |
| Erro credenciais | `auth.login.invalidCredentials` | Email ou senha incorretos | Inline error apos 401 |

<!-- APPEND:copies-login -->

### Tela: Aceitar Convite (`/invite/:token`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.invite.title` | Voce foi convidado! | Heading principal |
| Subtitulo | `auth.invite.subtitle` | {{admin_name}} convidou voce para o cluster "{{cluster_name}}" | Contexto do convite |
| Label nome | `auth.invite.nameLabel` | Seu nome | Label do campo |
| Placeholder nome | `auth.invite.namePlaceholder` | Como a familia te conhece | Placeholder amigavel |
| Label senha | `auth.invite.passwordLabel` | Crie uma senha | Label do campo |
| Placeholder senha | `auth.invite.passwordPlaceholder` | Minimo 8 caracteres | Placeholder com hint |
| Label confirmar senha | `auth.invite.confirmPasswordLabel` | Confirme a senha | Label do campo |
| Botao submit | `auth.invite.submitButton` | Aceitar convite | CTA principal |
| Role info | `auth.invite.roleInfo` | Voce tera acesso como "{{role}}" | Info de permissao |
| Erro expirado | `auth.invite.expired` | Convite expirado. Solicite novo convite ao administrador. | Pagina de erro |
| Erro invalido | `auth.invite.invalid` | Convite invalido | Pagina de erro (403) |
| Erro email existe | `auth.invite.emailExists` | Este membro ja faz parte do cluster | Inline error (409) |

<!-- APPEND:copies-convite -->

### Tela: Criar Cluster (`/setup`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `setup.cluster.title` | Criar seu cluster familiar | Heading principal |
| Subtitulo | `setup.cluster.subtitle` | O cluster e o espaco onde sua familia vai guardar memorias por decadas | Explicacao |
| Label nome | `setup.cluster.nameLabel` | Nome do cluster | Label do campo |
| Placeholder nome | `setup.cluster.namePlaceholder` | Ex.: Familia Prado | Exemplo no placeholder |
| Label senha | `setup.cluster.passwordLabel` | Sua senha de administrador | Label do campo |
| Placeholder senha | `setup.cluster.passwordPlaceholder` | Minimo 8 caracteres | Hint de seguranca |
| Label confirmar | `setup.cluster.confirmPasswordLabel` | Confirme a senha | Label do campo |
| Botao submit | `setup.cluster.submitButton` | Criar cluster | CTA principal |
| Loading | `setup.cluster.loading` | Criando cluster... | Estado de loading |

<!-- APPEND:copies-setup -->

### Tela: Seed Phrase (`/setup/seed`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `setup.seed.title` | Anote sua seed phrase | Heading principal |
| Instrucao | `setup.seed.instruction` | Estas 12 palavras sao a unica forma de recuperar o sistema. Anote em papel e guarde em local seguro. Esta e a UNICA vez que serao exibidas. | Instrucao critica |
| Aviso | `setup.seed.warning` | Nao tire print. Nao salve no celular. Anote em papel. | Aviso de seguranca |
| Checkbox | `setup.seed.confirmCheckbox` | Anotei a seed phrase em local seguro | Checkbox obrigatorio |
| Botao continuar | `setup.seed.continueButton` | Continuar | CTA (desabilitado ate marcar checkbox) |
| Tooltip bloqueado | `setup.seed.continueTooltip` | Confirme que anotou a seed phrase para continuar | Tooltip no botao desabilitado |

<!-- APPEND:copies-seed -->

### Tela: Recovery — Seed Input (`/recovery`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `recovery.seed.title` | Recuperar sistema | Heading principal |
| Subtitulo | `recovery.seed.subtitle` | Insira as 12 palavras da sua seed phrase para reconstruir o Alexandria | Instrucao |
| Label campo | `recovery.seed.wordLabel` | Palavra {{number}} | Label de cada campo (1-12) |
| Erro palavra invalida | `recovery.seed.invalidWord` | Palavra invalida | Inline error por campo |
| Botao submit | `recovery.seed.submitButton` | Iniciar recovery | CTA principal |
| Loading | `recovery.seed.loading` | Validando seed phrase... | Estado de loading |
| Erro seed incorreta | `recovery.seed.incorrectSeed` | Seed incorreta — nao foi possivel descriptografar os dados. Verifique as palavras. | Erro apos falha |

<!-- APPEND:copies-recovery-seed -->

### Tela: Recovery — Progresso (`/recovery/progress`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `recovery.progress.title` | Recuperando sistema... | Heading principal |
| Etapa 1 | `recovery.progress.step1` | Validando seed phrase | Stepper etapa 1 |
| Etapa 2 | `recovery.progress.step2` | Buscando dados nos nos | Stepper etapa 2 |
| Etapa 3 | `recovery.progress.step3` | Descriptografando dados | Stepper etapa 3 |
| Etapa 4 | `recovery.progress.step4` | Conectando aos provedores | Stepper etapa 4 |
| Etapa 5 | `recovery.progress.step5` | Reconstruindo banco de dados | Stepper etapa 5 |
| Etapa 5 progresso | `recovery.progress.step5Progress` | {{current}} de {{total}} arquivos processados | Progresso da etapa 5 |
| Etapa 6 | `recovery.progress.step6` | Validando integridade | Stepper etapa 6 |
| Etapa 6 progresso | `recovery.progress.step6Progress` | {{current}} de {{total}} blocos verificados | Progresso da etapa 6 |
| Sucesso titulo | `recovery.progress.successTitle` | Recovery concluido! | Heading de sucesso |
| Sucesso descricao | `recovery.progress.successDescription` | O sistema foi restaurado com sucesso | Texto de sucesso |
| Relatorio arquivos | `recovery.progress.reportFiles` | {{count}} arquivos recuperados | Relatorio |
| Relatorio nos | `recovery.progress.reportNodes` | {{count}} nos reconectados | Relatorio |
| Relatorio pendentes | `recovery.progress.reportPending` | {{count}} blocos pendentes de re-replicacao | Relatorio |
| Info DNS | `recovery.progress.dnsInfo` | Atualize o DNS para apontar para este servidor | Instrucao pos-recovery |
| Botao dashboard | `recovery.progress.goToDashboard` | Ir para o dashboard | CTA final |
| Erro vaults | `recovery.progress.vaultsNotFound` | Dados nao encontrados nos nos. Insira as credenciais manualmente. | Warning etapa 2 |
| Erro manifests | `recovery.progress.manifestsNotFound` | Recovery impossivel — arquivos nao podem ser reassemblados sem os registros de distribuicao | Erro critico |

<!-- APPEND:copies-recovery-progress -->

### Tela: Galeria (`/dashboard`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `gallery.title` | Galeria | Heading principal / sidebar |
| Botao upload | `gallery.uploadButton` | Upload | CTA de upload |
| Filtro fotos | `gallery.filterPhotos` | Fotos | Chip de filtro |
| Filtro videos | `gallery.filterVideos` | Videos | Chip de filtro |
| Filtro documentos | `gallery.filterDocuments` | Documentos | Chip de filtro |
| Modo grid | `gallery.viewGrid` | Grade | Toggle de visualizacao |
| Modo timeline | `gallery.viewTimeline` | Linha do tempo | Toggle de visualizacao |
| Empty state titulo | `gallery.empty.title` | Nenhuma memoria ainda | Empty state heading |
| Empty state descricao | `gallery.empty.description` | Faca seu primeiro upload para comecar a guardar as memorias da familia | Empty state texto |
| Empty state CTA | `gallery.empty.cta` | Fazer primeiro upload | Botao no empty state |
| Dropzone texto | `gallery.dropzone.text` | Arraste arquivos aqui ou clique para selecionar | Area de drag-and-drop |
| Dropzone formatos | `gallery.dropzone.formats` | Fotos, videos e documentos ate {{maxSize}} | Info de formatos |
| Carregando mais | `gallery.loadingMore` | Carregando mais arquivos... | Infinite scroll |
| Total arquivos | `gallery.totalFiles` | {{count}} arquivos | Contador de resultados |

<!-- APPEND:copies-galeria -->

### Tela: Detalhe do Arquivo (`/dashboard/file/:id`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Botao download | `file.downloadButton` | Baixar | CTA de download |
| Downloading | `file.downloading` | Baixando... | Estado de download |
| Label nome | `file.metadata.name` | Nome | Metadado |
| Label tipo | `file.metadata.type` | Tipo | Metadado |
| Label tamanho | `file.metadata.size` | Tamanho | Metadado |
| Label data | `file.metadata.date` | Data | Metadado |
| Label camera | `file.metadata.camera` | Camera | Metadado EXIF |
| Label localizacao | `file.metadata.location` | Localizacao | Metadado EXIF |
| Label dimensoes | `file.metadata.dimensions` | Dimensoes | Metadado de imagem |
| Label duracao | `file.metadata.duration` | Duracao | Metadado de video |
| Replicacao status | `file.metadata.replication` | {{count}} copias distribuidas | Status de replicacao |
| Erro indisponivel | `file.unavailable` | Arquivo temporariamente indisponivel. Tentando replica alternativa... | Erro de no offline |
| Erro corrompido | `file.corrupted` | Arquivo danificado — nao foi possivel recuperar de nenhuma copia | Erro irrecuperavel |

<!-- APPEND:copies-arquivo -->

### Tela: Busca (`/dashboard/search`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Placeholder busca | `search.placeholder` | Buscar por nome, tipo ou data... | Input de busca |
| Resultados | `search.results` | {{count}} resultados para "{{query}}" | Contador |
| Sem resultados titulo | `search.empty.title` | Nenhum resultado encontrado | Empty state heading |
| Sem resultados descricao | `search.empty.description` | Tente buscar com outros termos ou ajuste os filtros | Empty state texto |
| Sem resultados CTA | `search.empty.cta` | Limpar filtros | Acao no empty state |

<!-- APPEND:copies-busca -->

### Tela: Nos (`/dashboard/nodes`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.title` | Nos de armazenamento | Heading principal |
| Botao adicionar | `nodes.addButton` | Adicionar no | CTA |
| Status online | `nodes.status.online` | Online | Badge verde |
| Status suspect | `nodes.status.suspect` | Sem resposta | Badge amarelo |
| Status lost | `nodes.status.lost` | Perdido | Badge vermelho |
| Status draining | `nodes.status.draining` | Migrando dados... | Badge azul |
| Label capacidade | `nodes.capacity` | {{used}} de {{total}} usado | Barra de capacidade |
| Label heartbeat | `nodes.lastHeartbeat` | Ultimo sinal: {{time}} | Timestamp |
| Empty state titulo | `nodes.empty.title` | Nenhum no cadastrado | Empty state heading |
| Empty state descricao | `nodes.empty.description` | Adicione pelo menos 3 nos para comecar a armazenar dados com seguranca | Empty state texto |
| Empty state CTA | `nodes.empty.cta` | Adicionar primeiro no | Botao |

<!-- APPEND:copies-nos -->

### Tela: Detalhe do No (`/dashboard/nodes/:id`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Label tipo | `nodeDetail.type` | Tipo | Metadado |
| Label endpoint | `nodeDetail.endpoint` | Endereco | Metadado |
| Label chunks | `nodeDetail.chunks` | {{count}} blocos armazenados | Info de armazenamento |
| Botao desconectar | `nodeDetail.disconnectButton` | Desconectar no | CTA destrutiva |
| Botao testar | `nodeDetail.testButton` | Testar conexao | CTA secundaria |
| Teste sucesso | `nodeDetail.testSuccess` | Conexao OK | Feedback do teste |
| Teste falha | `nodeDetail.testFailed` | Falha na conexao — verifique as credenciais | Feedback do teste |

<!-- APPEND:copies-no-detalhe -->

### Dialog: Adicionar No

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.addDialog.title` | Adicionar no de armazenamento | Heading do dialog |
| Step tipo | `nodes.addDialog.stepType` | Escolha o tipo | Step 1 |
| Tipo local | `nodes.addDialog.typeLocal` | Dispositivo local (PC, NAS) | Opcao |
| Tipo s3 | `nodes.addDialog.typeS3` | Amazon S3 | Opcao |
| Tipo r2 | `nodes.addDialog.typeR2` | Cloudflare R2 | Opcao |
| Tipo vps | `nodes.addDialog.typeVPS` | VPS / Servidor | Opcao |
| Step config | `nodes.addDialog.stepConfig` | Configure o acesso | Step 2 |
| Label nome | `nodes.addDialog.nameLabel` | Nome do no | Label |
| Placeholder nome | `nodes.addDialog.namePlaceholder` | Ex.: NAS da sala, R2 Cloudflare | Placeholder |
| Label endpoint | `nodes.addDialog.endpointLabel` | Endereco (endpoint) | Label |
| Label access key | `nodes.addDialog.accessKeyLabel` | Access Key | Label |
| Label secret key | `nodes.addDialog.secretKeyLabel` | Secret Key | Label |
| Label bucket | `nodes.addDialog.bucketLabel` | Nome do bucket | Label |
| Step teste | `nodes.addDialog.stepTest` | Testando conexao... | Step 3 |
| Teste progresso | `nodes.addDialog.testing` | Verificando acesso ao armazenamento... | Loading |
| Teste sucesso | `nodes.addDialog.testSuccess` | Conexao estabelecida — {{capacity}} disponiveis | Sucesso |
| Teste falha | `nodes.addDialog.testFailed` | Nao foi possivel conectar | Falha |
| Erro auth | `nodes.addDialog.errorAuth` | Autenticacao falhou — verifique access key e secret | Erro de credencial |
| Erro bucket | `nodes.addDialog.errorBucket` | Bucket nao encontrado | Erro de bucket |
| Botao confirmar | `nodes.addDialog.confirmButton` | Adicionar no | CTA final |
| Botao testar novamente | `nodes.addDialog.retryButton` | Testar novamente | CTA de retry |

<!-- APPEND:copies-add-no -->

### Dialog: Desconectar No

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.disconnectDialog.title` | Desconectar "{{node_name}}"? | Heading do dialog |
| Descricao | `nodes.disconnectDialog.description` | Todos os dados serao migrados para outros nos antes da remocao. Isso pode levar alguns minutos. | Explicacao |
| Info chunks | `nodes.disconnectDialog.chunksInfo` | {{count}} blocos serao migrados | Info de impacto |
| Botao confirmar | `nodes.disconnectDialog.confirmButton` | Desconectar | CTA destrutiva |
| Botao cancelar | `nodes.disconnectDialog.cancelButton` | Cancelar | Acao secundaria |
| Erro minimo | `nodes.disconnectDialog.errorMinNodes` | Nao e possivel remover — minimo de 3 nos necessario | Bloqueio |
| Erro espaco | `nodes.disconnectDialog.errorSpace` | Espaco insuficiente nos nos restantes para migracao completa | Bloqueio parcial |
| Drain progresso | `nodes.disconnectDialog.drainProgress` | Migrando: {{current}} de {{total}} blocos | Progresso |

<!-- APPEND:copies-desconectar-no -->

### Tela: Alertas (`/dashboard/alerts`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `alerts.title` | Alertas | Heading principal |
| Severity critical | `alerts.severity.critical` | Critico | Badge vermelho |
| Severity warning | `alerts.severity.warning` | Atencao | Badge amarelo |
| Severity info | `alerts.severity.info` | Info | Badge azul |
| Status resolvido | `alerts.resolved` | Resolvido | Badge verde |
| Empty state titulo | `alerts.empty.title` | Nenhum alerta ativo | Empty state heading |
| Empty state descricao | `alerts.empty.description` | Tudo funcionando normalmente | Empty state texto |
| Tipo node_offline | `alerts.type.nodeOffline` | No "{{node_name}}" sem resposta | Mensagem de alerta |
| Tipo replication_low | `alerts.type.replicationLow` | Replicacao abaixo do minimo ({{count}} copias) | Mensagem de alerta |
| Tipo token_expired | `alerts.type.tokenExpired` | Credencial de "{{node_name}}" expirada | Mensagem de alerta |
| Tipo space_low | `alerts.type.spaceLow` | Espaco em "{{node_name}}" abaixo de 20% | Mensagem de alerta |
| Tipo corruption | `alerts.type.corruption` | Dados corrompidos detectados em {{count}} blocos | Mensagem de alerta |
| Tipo auto_healing | `alerts.type.autoHealing` | Re-replicacao concluida automaticamente | Mensagem info |

<!-- APPEND:copies-alertas -->

### Tela: Membros (`/dashboard/members`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `members.title` | Membros | Heading principal |
| Botao convidar | `members.inviteButton` | Convidar membro | CTA |
| Role admin | `members.role.admin` | Administrador | Badge de role |
| Role member | `members.role.member` | Membro | Badge de role |
| Role reader | `members.role.reader` | Leitor | Badge de role |
| Label desde | `members.joinedAt` | Membro desde {{date}} | Info |
| Botao remover | `members.removeButton` | Remover do cluster | Acao destrutiva |
| Empty state titulo | `members.empty.title` | So voce por enquanto | Empty state heading |
| Empty state descricao | `members.empty.description` | Convide membros da familia para compartilhar o acervo | Empty state texto |
| Empty state CTA | `members.empty.cta` | Convidar primeiro membro | Botao |

<!-- APPEND:copies-membros -->

### Dialog: Convidar Membro

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `members.inviteDialog.title` | Convidar membro | Heading do dialog |
| Label email | `members.inviteDialog.emailLabel` | Email do convidado | Label |
| Placeholder email | `members.inviteDialog.emailPlaceholder` | email@exemplo.com | Placeholder |
| Label role | `members.inviteDialog.roleLabel` | Permissao | Label |
| Role member desc | `members.inviteDialog.memberDesc` | Pode fazer upload e download de arquivos | Descricao da role |
| Role reader desc | `members.inviteDialog.readerDesc` | Pode apenas visualizar o acervo | Descricao da role |
| Role admin desc | `members.inviteDialog.adminDesc` | Gerencia o cluster, nos e membros | Descricao da role |
| Role admin confirm | `members.inviteDialog.adminConfirm` | Tem certeza? Admins podem gerenciar nos e membros. | Confirmacao extra |
| Botao convidar | `members.inviteDialog.submitButton` | Gerar convite | CTA |
| Link titulo | `members.inviteDialog.linkTitle` | Link de convite gerado! | Sucesso |
| Link descricao | `members.inviteDialog.linkDescription` | Envie este link para o convidado. Expira em 7 dias. | Info |
| Botao copiar | `members.inviteDialog.copyButton` | Copiar link | Acao |
| Copiado | `members.inviteDialog.copied` | Copiado! | Feedback |

<!-- APPEND:copies-convidar -->

### Tela: Configuracoes (`/dashboard/settings`)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `settings.title` | Minha conta | Heading principal |
| Label nome | `settings.nameLabel` | Nome | Campo |
| Label email | `settings.emailLabel` | Email | Campo (readonly) |
| Secao senha | `settings.passwordSection` | Alterar senha | Subtitulo |
| Label senha atual | `settings.currentPasswordLabel` | Senha atual | Campo |
| Label nova senha | `settings.newPasswordLabel` | Nova senha | Campo |
| Label confirmar | `settings.confirmPasswordLabel` | Confirmar nova senha | Campo |
| Botao salvar | `settings.saveButton` | Salvar alteracoes | CTA |
| Secao tema | `settings.themeSection` | Aparencia | Subtitulo |
| Tema light | `settings.theme.light` | Claro | Opcao |
| Tema dark | `settings.theme.dark` | Escuro | Opcao |
| Tema system | `settings.theme.system` | Automatico | Opcao |

<!-- APPEND:copies-configuracoes -->

### Tela: Configuracoes do Cluster (`/dashboard/cluster`) — Admin

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `cluster.title` | Configuracoes do cluster | Heading principal |
| Label nome | `cluster.nameLabel` | Nome do cluster | Campo |
| Info cluster id | `cluster.clusterIdLabel` | ID do cluster | Campo (readonly, truncado) |
| Info criado em | `cluster.createdAtLabel` | Criado em | Campo (readonly) |
| Info membros | `cluster.membersCount` | {{count}} membros | Info |
| Info nos | `cluster.nodesCount` | {{count}} nos | Info |
| Info arquivos | `cluster.filesCount` | {{count}} arquivos | Info |
| Info espaco | `cluster.totalSpace` | {{used}} de {{total}} usado | Info |
| Botao salvar | `cluster.saveButton` | Salvar | CTA |

<!-- APPEND:copies-cluster -->

### Paginas de Erro

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| 404 titulo | `error.notFound.title` | Pagina nao encontrada | Heading 404 |
| 404 descricao | `error.notFound.description` | A pagina que voce procura nao existe ou foi movida | Texto 404 |
| 404 CTA | `error.notFound.cta` | Voltar para a galeria | Botao 404 |
| Erro generico titulo | `error.generic.title` | Algo deu errado | Heading erro generico |
| Erro generico descricao | `error.generic.description` | Ocorreu um erro inesperado. Tente novamente. | Texto erro generico |
| Erro generico CTA | `error.generic.cta` | Tentar novamente | Botao erro generico |

<!-- APPEND:copies-telas -->

---

## Mensagens de Feedback

> Quais sao as mensagens de sucesso, erro, aviso e informacao exibidas ao usuario?

### Sucesso

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.success.clusterCreated` | Cluster criado com sucesso! | Toast apos criar cluster |
| `feedback.success.uploadComplete` | "{{fileName}}" enviado com sucesso | Toast apos upload concluido |
| `feedback.success.uploadAllComplete` | Todos os {{count}} arquivos foram enviados | Toast apos fila concluida |
| `feedback.success.nodeAdded` | No "{{nodeName}}" adicionado | Toast apos adicionar no |
| `feedback.success.nodeDisconnected` | No "{{nodeName}}" desconectado | Toast apos drain completo |
| `feedback.success.inviteCreated` | Convite gerado! Copie o link e envie ao convidado. | Toast apos gerar convite |
| `feedback.success.inviteAccepted` | Bem-vindo ao cluster! | Toast apos aceitar convite |
| `feedback.success.settingsSaved` | Alteracoes salvas | Toast apos salvar configuracoes |
| `feedback.success.passwordChanged` | Senha alterada com sucesso | Toast apos alterar senha |
| `feedback.success.memberRemoved` | Membro removido do cluster | Toast apos remover membro |
| `feedback.success.linkCopied` | Link copiado! | Toast ao copiar link de convite |
| `feedback.success.recoveryComplete` | Sistema restaurado com sucesso! | Toast ao concluir recovery |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.error.generic` | Algo deu errado. Tente novamente. | Fallback generico |
| `feedback.error.network` | Sem conexao com o servidor. Verifique sua internet. | Erro de rede |
| `feedback.error.unauthorized` | Sessao expirada. Faca login novamente. | 401 — redirect para /login |
| `feedback.error.forbidden` | Voce nao tem permissao para esta acao. | 403 |
| `feedback.error.notFound` | Recurso nao encontrado. | 404 |
| `feedback.error.clusterCreation` | Erro ao criar cluster. Tente novamente. | Toast (500 no POST /clusters) |
| `feedback.error.serviceUnavailable` | Servico temporariamente indisponivel. Tente em alguns minutos. | 503 |
| `feedback.error.uploadFailed` | Falha ao enviar "{{fileName}}". | Upload queue item |
| `feedback.error.uploadUnsupported` | Formato nao suportado: .{{ext}} | Inline error no dropzone |
| `feedback.error.uploadTooLarge` | Arquivo excede o limite de {{maxSize}} | Inline error no dropzone |
| `feedback.error.nodesInsufficient` | Armazenamento indisponivel — aguarde ate que nos sejam adicionados | Toast (503 upload) |
| `feedback.error.pipelineFailed` | Erro ao processar "{{fileName}}". Tente novamente. | Upload queue item |
| `feedback.error.fileUnavailable` | Arquivo temporariamente indisponivel. Tentando replica alternativa... | Toast no download |
| `feedback.error.fileCorrupted` | Arquivo danificado — nao foi possivel recuperar de nenhuma copia | Toast no download |
| `feedback.error.nodeAuthFailed` | Autenticacao falhou — verifique access key e secret | Inline error no dialog |
| `feedback.error.nodeBucketNotFound` | Bucket nao encontrado | Inline error no dialog |
| `feedback.error.nodeConnectFailed` | Falha no teste de conexao | Inline error no dialog |
| `feedback.error.nodeMinimum` | Nao e possivel remover — minimo de 3 nos necessario | Dialog bloqueado |
| `feedback.error.nodeSpaceInsufficient` | Espaco insuficiente para migracao completa | Toast durante drain |
| `feedback.error.inviteEmailExists` | Este membro ja faz parte do cluster | Inline error no dialog |
| `feedback.error.inviteExpired` | Convite expirado. Solicite novo convite ao administrador. | Pagina /invite |
| `feedback.error.inviteInvalid` | Convite invalido | Pagina /invite (403) |
| `feedback.error.seedIncorrect` | Seed incorreta — nao foi possivel descriptografar os dados. Verifique as palavras. | Erro no recovery |
| `feedback.error.recoveryImpossible` | Recovery impossivel — dados nao podem ser reassemblados | Erro critico no recovery |
| `feedback.error.lastAdmin` | Nao e possivel remover o unico administrador do cluster | Inline error |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| `validation.required` | Campo obrigatorio | Campo vazio no submit |
| `validation.email` | Email invalido | Formato de email incorreto |
| `validation.minLength` | Minimo de {{min}} caracteres | Texto curto demais |
| `validation.maxLength` | Maximo de {{max}} caracteres | Texto longo demais |
| `validation.passwordMismatch` | As senhas nao coincidem | Confirmacao de senha |
| `validation.passwordWeak` | Senha muito fraca. Use letras, numeros e simbolos. | Senha nao atende criterios |
| `validation.seedWordInvalid` | Palavra invalida | Palavra fora do wordlist BIP-39 |
| `validation.clusterNameRequired` | Escolha um nome para o cluster | Nome vazio no setup |
| `validation.fileTypeNotAllowed` | Tipo de arquivo nao permitido | Upload de tipo invalido |
| `validation.fileTooLarge` | Arquivo muito grande (maximo: {{max}}) | Upload excede limite |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.warning.uploadsInProgress` | Uploads em andamento serao interrompidos | Alerta beforeunload |
| `feedback.warning.seedNotConfirmed` | Voce ainda nao confirmou sua seed phrase | Alerta persistente no dashboard |
| `feedback.warning.drainInProgress` | Migracao de dados em andamento — nao desconecte o no manualmente | Aviso durante drain |
| `feedback.info.duplicateFile` | Arquivo ja existe no cluster — espaco economizado! | Toast informativo |
| `feedback.info.processing` | Processando "{{fileName}}"... | Upload queue item |
| `feedback.info.retryingReplica` | Tentando replica alternativa... | Toast durante download |
| `feedback.info.autoHealed` | Alerta resolvido automaticamente | Toast ao auto-resolver alerta |
| `feedback.info.loadingMore` | Carregando mais arquivos... | Infinite scroll |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Header

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Busca placeholder | `global.header.searchPlaceholder` | Buscar arquivos... |
| Alertas label | `global.header.alertsLabel` | Alertas |
| Alertas count | `global.header.alertsCount` | {{count}} alertas ativos |
| Menu perfil | `global.header.profile` | Minha conta |
| Sair | `global.header.logout` | Sair |
| Confirmar sair | `global.header.logoutConfirm` | Sair do Alexandria? |

<!-- APPEND:copies-navbar -->

### Sidebar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Galeria | `global.sidebar.gallery` | Galeria |
| Busca | `global.sidebar.search` | Busca |
| Nos | `global.sidebar.nodes` | Nos |
| Alertas | `global.sidebar.alerts` | Alertas |
| Membros | `global.sidebar.members` | Membros |
| Cluster | `global.sidebar.cluster` | Cluster |
| Minha conta | `global.sidebar.settings` | Minha conta |
| Espaco usado | `global.sidebar.spaceUsed` | {{used}} de {{total}} |

<!-- APPEND:copies-sidebar -->

### Upload Queue (Flutuante)

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Titulo | `global.uploadQueue.title` | Uploads |
| Status queued | `global.uploadQueue.queued` | Na fila |
| Status uploading | `global.uploadQueue.uploading` | Enviando... {{percent}}% |
| Status processing | `global.uploadQueue.processing` | Processando... |
| Status done | `global.uploadQueue.done` | Concluido |
| Status error | `global.uploadQueue.error` | Erro |
| Botao retry | `global.uploadQueue.retryButton` | Tentar novamente |
| Botao cancelar | `global.uploadQueue.cancelButton` | Cancelar |
| Minimizar | `global.uploadQueue.minimize` | Minimizar |
| Total progresso | `global.uploadQueue.progress` | {{current}} de {{total}} arquivos |

<!-- APPEND:copies-footer -->

### Dialogs Genericos

| Dialog | Chave titulo | Texto titulo | Chave corpo | Texto corpo |
| --- | --- | --- | --- | --- |
| Confirmar exclusao | `dialog.delete.title` | Confirmar exclusao | `dialog.delete.body` | Tem certeza que deseja excluir? Esta acao nao pode ser desfeita. |
| Confirmar saida | `dialog.leave.title` | Sair sem salvar? | `dialog.leave.body` | Suas alteracoes serao perdidas. |
| Confirmar remover membro | `dialog.removeMember.title` | Remover "{{name}}" do cluster? | `dialog.removeMember.body` | O membro perdera acesso ao acervo da familia. |
| Botao confirmar | `dialog.confirmButton` | Confirmar | — | — |
| Botao cancelar | `dialog.cancelButton` | Cancelar | — | — |

<!-- APPEND:copies-modais -->

### Empty States

| Tela/Secao | Chave i18n | Texto | CTA |
| --- | --- | --- | --- |
| Galeria vazia | `empty.gallery` | Nenhuma memoria ainda | Fazer primeiro upload |
| Busca sem resultado | `empty.search` | Nenhum resultado para "{{query}}" | Limpar filtros |
| Sem nos | `empty.nodes` | Nenhum no cadastrado | Adicionar primeiro no |
| Sem alertas | `empty.alerts` | Nenhum alerta ativo. Tudo funcionando normalmente. | — |
| Sem membros | `empty.members` | So voce por enquanto | Convidar primeiro membro |
| Erro de carregamento | `empty.error` | Nao foi possivel carregar os dados | Tentar novamente |
| Onboarding dashboard | `empty.onboarding` | Bem-vindo ao Alexandria! Comece adicionando nos e convidando membros. | Adicionar primeiro no |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra | Adicionar no | Adicionar No |
| Use voz ativa | Salve suas alteracoes | Suas alteracoes devem ser salvas |
| CTAs com maximo 30 caracteres | Fazer primeiro upload | Clique aqui para fazer o upload do seu primeiro arquivo |
| Evite jargao tecnico na UI | Blocos armazenados | Chunks criptografados |
| Use pontuacao em frases completas | Arquivo enviado com sucesso. | Arquivo enviado com sucesso |
| Nao use ponto em labels e botoes | Salvar alteracoes | Salvar alteracoes. |
| Tooltips autoexplicativos | Adicionar no de armazenamento | Clique para adicionar |
| Use "voce" consistentemente | Suas memorias estao seguras | As memorias do usuario estao seguras |
| Erros com acao clara | Verifique sua internet e tente novamente | Erro de rede |
| Status de no em linguagem acessivel | Sem resposta (suspect) | suspect / heartbeat timeout |
| Numeros grandes formatados | 1.247 blocos | 1247 blocos |
| Datas relativas quando recente | Ha 5 minutos | 2026-03-24T15:30:00Z |
| Datas absolutas quando distante | 24 de mar de 2026 | 2026-03-24 |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-24 | pt-BR como idioma padrao, i18n preparado com next-intl | Produto familiar brasileiro; estrutura de chaves pronta para en-US futuro |
| 2026-03-24 | Tom informal e acolhedor ("voce", sem jargao) | Alinhado com 17-communication.md; usuarios incluem avos e membros nao-tecnicos |
| 2026-03-24 | "No" em vez de "servidor/storage" na UI | Termo do dominio acessivel; evita confusao tecnica |
| 2026-03-24 | "Blocos" em vez de "chunks" na UI para usuario final | Jargao tecnico traduzido para linguagem acessivel |
| 2026-03-24 | Mensagens de erro sempre com acao sugerida | Evita usuario travado sem saber o que fazer |
| 2026-03-24 | Empty states com CTA de proxima acao | Guia o usuario no onboarding; evita telas "mortas" |

<!-- APPEND:decisoes -->
