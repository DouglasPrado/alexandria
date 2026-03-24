# Copies

Define todos os textos e conteudos textuais das telas do frontend — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

<!-- do blueprint: 08-use_cases.md + 17-communication.md + 07-routes.md + 08-flows.md -->

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | pt-BR |
| Suporte i18n | Nao na v1 — preparar estrutura de chaves para i18n futuro (next-intl) |
| Estrutura de chaves | `namespace.screen.element` — ex: `auth.login.submitButton` |
| Arquivos de traducao | `locales/pt-BR.json` (unico por enquanto; preparado para en-US futuro) |
| Tom de voz | Familiar e confiavel — como um membro da familia explicando algo. Direto sem ser frio, acolhedor sem ser infantil |
| Pessoa gramatical | Voce |
| Genero | Neutro quando possivel (ex: "membro" em vez de "usuario") |

### Tom de voz — Diretrizes

| Situacao | Tom | Exemplo |
| --- | --- | --- |
| Sucesso | Celebrativo e breve | "Foto salva com sucesso!" |
| Erro recuperavel | Calmo e orientador | "Nao foi possivel processar o arquivo. Tente novamente." |
| Erro critico | Direto e urgente | "No perdido. Auto-healing iniciado." |
| Instrucao | Claro e passo-a-passo | "Anote estas 12 palavras em papel. Esta e a unica vez." |
| Empty state | Encorajador | "Sua galeria esta vazia. Faca seu primeiro upload!" |
| Confirmacao destrutiva | Explicito sobre consequencias | "Tem certeza? Todos os chunks serao migrados antes da remocao." |

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo na UI | Definicao | Nao usar |
| --- | --- | --- |
| Cluster | Grupo familiar no Alexandria | Grupo, Workspace, Conta |
| Membro | Pessoa que pertence a um cluster | Usuario, Participante, Conta |
| No | Dispositivo ou conta cloud que armazena dados | Servidor, Storage, Drive |
| Galeria | Tela principal com fotos, videos e documentos | Biblioteca, Acervo, Feed |
| Upload | Envio de arquivo ao cluster | Subir, Importar |
| Preview | Versao leve de um arquivo para visualizacao rapida | Miniatura (ok como sinonimo), Thumbnail (evitar em UI) |
| Seed phrase | 12 palavras para recuperacao do sistema | Frase de recuperacao (ok como descricao), Senha mestra |
| Drain | Migracao de dados antes de desconectar um no | Esvaziar, Migrar |
| Admin | Membro com permissoes de gerenciamento | Administrador (ok em contexto formal) |
| Alerta | Notificacao de condicao anomala no cluster | Aviso (ok para warning), Notificacao |
| Auto-healing | Re-replicacao automatica quando um no e perdido | Reparo automatico (ok como descricao) |
| Replicacao | Copias de dados distribuidas entre nos | Backup (evitar — nao e backup tradicional) |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela? Organize por rota/pagina conforme definido em 07-routes.md.

### Tela: Login (`/login`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | auth.login.title | Entrar no Alexandria | Heading principal |
| Subtitulo | auth.login.subtitle | Acesse o acervo da sua familia | Descricao abaixo do titulo |
| Label email | auth.login.emailLabel | Email | Label do campo |
| Placeholder email | auth.login.emailPlaceholder | seu@email.com | Campo de email |
| Label senha | auth.login.passwordLabel | Senha | Label do campo |
| Placeholder senha | auth.login.passwordPlaceholder | Sua senha | Campo de senha |
| Botao submit | auth.login.submitButton | Entrar | CTA principal |
| Link recovery | auth.login.recoveryLink | Perdeu acesso? Recupere via seed phrase | Link secundario |
| Erro credenciais | auth.login.errorInvalid | Email ou senha incorretos | Mensagem inline no form |
| Erro rede | auth.login.errorNetwork | Nao foi possivel conectar ao servidor | Toast error |

<!-- APPEND:copies-login -->

### Tela: Aceitar Convite (`/invite/:token`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | cluster.invite.title | Voce foi convidado! | Heading principal |
| Subtitulo | cluster.invite.subtitle | {{admin_name}} convidou voce para o cluster "{{cluster_name}}" | Descricao com dados do convite |
| Role info | cluster.invite.roleInfo | Seu acesso sera como: {{role}} | Badge com role atribuida |
| Label nome | cluster.invite.nameLabel | Seu nome | Label do campo |
| Placeholder nome | cluster.invite.namePlaceholder | Como quer ser chamado na familia? | Campo de nome |
| Label senha | cluster.invite.passwordLabel | Crie uma senha | Label do campo |
| Hint senha | cluster.invite.passwordHint | Minimo 8 caracteres. Usada para proteger seu cofre pessoal | Help text |
| Botao submit | cluster.invite.submitButton | Aceitar convite | CTA principal |
| Token expirado titulo | cluster.invite.expiredTitle | Convite expirado | AlertBanner |
| Token expirado corpo | cluster.invite.expiredBody | Este convite nao e mais valido. Peca um novo convite ao admin do cluster. | Mensagem |
| Token invalido | cluster.invite.invalidToken | Convite invalido | AlertBanner error |

<!-- APPEND:copies-convite -->

### Tela: Recovery (`/recovery`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | recovery.title | Recuperar sistema | Heading principal |
| Subtitulo | recovery.subtitle | Insira as 12 palavras da seed phrase para reconstruir o Alexandria | Descricao |
| Label palavra N | recovery.wordLabel | Palavra {{n}} | Label de cada campo (1-12) |
| Placeholder palavra | recovery.wordPlaceholder | Digite a palavra | Placeholder de cada campo |
| Hint geral | recovery.hint | Voce pode colar todas as 12 palavras de uma vez | Help text |
| Erro palavra invalida | recovery.invalidWord | Palavra invalida. Verifique o dicionario BIP-39 | Erro inline por campo |
| Erro seed incorreta | recovery.wrongSeed | Seed incorreta — os dados nao puderam ser descriptografados | Toast error |
| Botao submit | recovery.submitButton | Iniciar recovery | CTA principal |
| Progresso titulo | recovery.progressTitle | Reconstruindo o sistema... | Heading do progress |
| Etapa 1 | recovery.step.seed | Validando seed phrase | Progress step |
| Etapa 2 | recovery.step.vaults | Buscando cofres dos membros | Progress step |
| Etapa 3 | recovery.step.manifests | Escaneando nos em busca de dados | Progress step |
| Etapa 4 | recovery.step.rebuild | Reconstruindo banco de metadados | Progress step |
| Etapa 5 | recovery.step.nodes | Aguardando reconexao dos nos | Progress step |
| Etapa 6 | recovery.step.integrity | Verificando integridade dos dados | Progress step |
| Relatorio titulo | recovery.reportTitle | Recovery concluido | Heading do relatorio |
| Relatorio arquivos | recovery.reportFiles | {{count}} arquivos recuperados | Metrica |
| Relatorio chunks | recovery.reportChunks | {{count}} chunks pendentes de re-replicacao | Metrica |
| Relatorio nos | recovery.reportNodes | {{connected}}/{{total}} nos reconectados | Metrica |
| Botao concluir | recovery.completeButton | Ir para o cluster | CTA |
| Alerta vaults | recovery.vaultsNotFound | Cofres nao encontrados. Insira credenciais S3/R2 manualmente. | AlertBanner warning |
| Alerta manifests | recovery.manifestsNotFound | Dados nao encontrados. Recovery impossivel sem manifests. | AlertBanner critical |

<!-- APPEND:copies-recovery -->

### Tela: Criar Cluster (`/cluster/setup`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | cluster.setup.title | Criar seu cluster familiar | Heading principal |
| Subtitulo | cluster.setup.subtitle | Um espaco seguro para as memorias da sua familia | Descricao |
| Label nome | cluster.setup.nameLabel | Nome do cluster | Label do campo |
| Placeholder nome | cluster.setup.namePlaceholder | Ex: Familia Prado | Campo de nome |
| Label senha | cluster.setup.passwordLabel | Sua senha de admin | Label |
| Hint senha | cluster.setup.passwordHint | Protege seu cofre pessoal. Diferente da seed phrase. | Help text |
| Botao criar | cluster.setup.createButton | Criar cluster | CTA |
| Seed titulo | cluster.setup.seedTitle | Sua seed phrase | Heading apos criacao |
| Seed instrucao | cluster.setup.seedInstruction | Anote estas 12 palavras em papel e guarde em local seguro. Esta e a UNICA vez que serao exibidas. Sem elas, o sistema nao pode ser recuperado. | Instrucao critica |
| Seed aviso | cluster.setup.seedWarning | Nao tire screenshot. Nao salve digitalmente. Anote em papel. | AlertBanner warning |
| Checkbox confirmacao | cluster.setup.seedConfirm | Anotei a seed phrase em local seguro | Checkbox obrigatorio |
| Botao copiar | cluster.setup.copyButton | Copiar seed phrase | CopyButton |
| Toast copiado | cluster.setup.copiedToast | Seed copiada! Lembre-se de apagar da area de transferencia. | Toast info |
| Botao continuar | cluster.setup.continueButton | Continuar | CTA apos confirmacao |

<!-- APPEND:copies-setup -->

### Tela: Galeria (`/gallery`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | gallery.title | Galeria | Header da pagina |
| Busca placeholder | gallery.searchPlaceholder | Buscar por nome... | SearchBar |
| Filtro todos | gallery.filterAll | Todos | Filtro de tipo |
| Filtro fotos | gallery.filterPhotos | Fotos | Filtro de tipo |
| Filtro videos | gallery.filterVideos | Videos | Filtro de tipo |
| Filtro documentos | gallery.filterDocuments | Documentos | Filtro de tipo |
| View grid | gallery.viewGrid | Grade | Toggle de visualizacao |
| View timeline | gallery.viewTimeline | Timeline | Toggle de visualizacao |
| Empty titulo | gallery.emptyTitle | Sua galeria esta vazia | Empty state |
| Empty descricao | gallery.emptyDescription | Faca seu primeiro upload para comecar a preservar as memorias da familia | Empty state |
| Empty CTA | gallery.emptyCta | Fazer upload | Button no empty state |
| Carregando | gallery.loading | Carregando fotos... | Skeleton state |
| Erro titulo | gallery.errorTitle | Nao foi possivel carregar a galeria | Error state |
| Erro CTA | gallery.errorRetry | Tentar novamente | Button no error state |
| Sem resultados | gallery.noResults | Nenhum arquivo encontrado para "{{search}}" | Busca sem resultados |
| Sem resultados CTA | gallery.clearFilters | Limpar filtros | Button |

<!-- APPEND:copies-galeria -->

### Tela: Detalhe do Arquivo (`/gallery/:fileId`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Botao download | gallery.detail.download | Baixar arquivo | CTA principal |
| Botao excluir | gallery.detail.delete | Excluir | Button destructive |
| Label nome | gallery.detail.nameLabel | Nome original | Metadata |
| Label tipo | gallery.detail.typeLabel | Tipo | Metadata |
| Label tamanho original | gallery.detail.originalSize | Tamanho original | Metadata |
| Label tamanho otimizado | gallery.detail.optimizedSize | Tamanho otimizado | Metadata |
| Label data | gallery.detail.dateLabel | Data de upload | Metadata |
| Label hash | gallery.detail.hashLabel | Hash (SHA-256) | Metadata tecnico |
| Status processing | gallery.detail.statusProcessing | Processando... | Badge |
| Status ready | gallery.detail.statusReady | Disponivel | Badge |
| Status error | gallery.detail.statusError | Erro no processamento | Badge |
| Status corrupted | gallery.detail.statusCorrupted | Corrompido | Badge |
| Preview indisponivel | gallery.detail.previewUnavailable | Preview temporariamente indisponivel | Fallback |
| Modal excluir titulo | gallery.detail.deleteTitle | Excluir arquivo | ConfirmDialog |
| Modal excluir corpo | gallery.detail.deleteBody | Tem certeza que deseja excluir "{{name}}"? O arquivo sera removido de todos os nos. | ConfirmDialog |

<!-- APPEND:copies-detalhe -->

### Funcionalidade: Upload (modal/drawer dentro da Galeria)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Botao header | upload.openButton | Upload | Button no header da GalleryPage (admin/member) |
| Drop zone titulo | upload.dropTitle | Arraste arquivos aqui | FileUploader |
| Drop zone subtitulo | upload.dropSubtitle | ou clique para selecionar | FileUploader |
| Drop zone tipos | upload.dropTypes | Fotos, videos e documentos (max {{limit}}) | FileUploader |
| Drop zone disabled | upload.dropDisabled | Minimo 3 nos ativos para upload | Mensagem quando < 3 nos |
| Tipo nao suportado | upload.unsupportedType | Tipo de arquivo nao suportado: {{mimeType}} | Toast warning |
| Arquivo grande | upload.fileTooLarge | Arquivo muito grande. Maximo: {{limit}} | Toast warning |
| Duplicado | upload.duplicate | Arquivo ja existe no cluster. Chunks reutilizados. | Toast info |
| Status queued | upload.statusQueued | Na fila | UploadQueue |
| Status uploading | upload.statusUploading | Enviando... {{progress}}% | UploadQueue |
| Status processing | upload.statusProcessing | Processando... | UploadQueue |
| Status distributing | upload.statusDistributing | Distribuindo entre os nos... | UploadQueue |
| Status done | upload.statusDone | Concluido | UploadQueue |
| Status error | upload.statusError | Falhou | UploadQueue |
| Botao retry | upload.retryButton | Tentar novamente | Button por arquivo |
| Toast sucesso | upload.successToast | "{{name}}" processado com sucesso! | Toast success |
| Toast erro pipeline | upload.errorToast | Falha ao processar "{{name}}": {{reason}} | Toast error |
| Limpar concluidos | upload.clearCompleted | Limpar concluidos | Button secundario |

<!-- APPEND:copies-upload -->

### Tela: Nos de Armazenamento (`/nodes`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | nodes.title | Nos de armazenamento | Header da pagina |
| Botao adicionar | nodes.addButton | Adicionar no | CTA no header |
| Empty titulo | nodes.emptyTitle | Nenhum no registrado | Empty state |
| Empty descricao | nodes.emptyDescription | Adicione pelo menos 3 nos para comecar a armazenar dados | Empty state |
| Empty CTA | nodes.emptyCta | Adicionar primeiro no | Button |
| Tipo local | nodes.typeLocal | Local (PC/NAS) | Badge de tipo |
| Tipo s3 | nodes.typeS3 | AWS S3 | Badge de tipo |
| Tipo r2 | nodes.typeR2 | Cloudflare R2 | Badge de tipo |
| Tipo b2 | nodes.typeB2 | Backblaze B2 | Badge de tipo |
| Tipo vps | nodes.typeVps | VPS | Badge de tipo |
| Status online | nodes.statusOnline | Online | StatusDot label |
| Status suspect | nodes.statusSuspect | Sem resposta | StatusDot label |
| Status lost | nodes.statusLost | Perdido | StatusDot label |
| Status draining | nodes.statusDraining | Migrando dados... | StatusDot label |
| Capacidade | nodes.capacity | {{used}} de {{total}} usado | CapacityBar label |

<!-- APPEND:copies-nos -->

### Tela: Adicionar No (FormDialog)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Dialog titulo | nodes.add.title | Adicionar no de armazenamento | FormDialog |
| Label tipo | nodes.add.typeLabel | Tipo de no | Select |
| Label nome | nodes.add.nameLabel | Nome descritivo | Input |
| Placeholder nome | nodes.add.namePlaceholder | Ex: NAS Sala, R2 Cloudflare | Input |
| Label bucket | nodes.add.bucketLabel | Nome do bucket | Input (S3/R2/B2) |
| Label region | nodes.add.regionLabel | Regiao | Input (S3) |
| Label access key | nodes.add.accessKeyLabel | Access Key | Input (S3/R2/B2) |
| Label secret key | nodes.add.secretKeyLabel | Secret Key | Input (S3/R2/B2) |
| Label endpoint | nodes.add.endpointLabel | Endpoint | Input (Local/VPS) |
| Botao testar | nodes.add.testButton | Testar conexao | Button secundario |
| Teste sucesso | nodes.add.testSuccess | Conexao OK! Capacidade: {{capacity}} | Toast success |
| Teste falha | nodes.add.testFailed | Falha na conexao: {{reason}} | Toast error |
| Botao registrar | nodes.add.registerButton | Registrar no | CTA principal |
| Erro credenciais | nodes.add.invalidCredentials | Credenciais invalidas. Verifique access key e secret. | FormField error |
| Erro bucket | nodes.add.bucketNotFound | Bucket "{{name}}" nao encontrado na regiao "{{region}}" | FormField error |

<!-- APPEND:copies-adicionar-no -->

### Tela: Detalhe do No (`/nodes/:nodeId`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Label endpoint | nodes.detail.endpoint | Endpoint | Metadata |
| Label tipo | nodes.detail.type | Tipo | Metadata |
| Label capacidade | nodes.detail.capacity | Capacidade | Metadata |
| Label ultimo heartbeat | nodes.detail.lastHeartbeat | Ultimo heartbeat | Metadata |
| Label chunks | nodes.detail.chunks | Chunks armazenados | Metadata |
| Botao drain | nodes.detail.drainButton | Desconectar no | Button destructive |
| Modal drain titulo | nodes.detail.drainTitle | Desconectar "{{name}}"? | ConfirmDialog |
| Modal drain corpo | nodes.detail.drainBody | Todos os chunks serao migrados para outros nos antes da remocao. Isso pode levar algum tempo. | ConfirmDialog |
| Modal drain erro minimo | nodes.detail.drainMinNodes | Nao e possivel remover — minimo 3 nos necessario | Mensagem de bloqueio |
| Drain progresso | nodes.detail.drainProgress | Migrando chunks: {{migrated}}/{{total}} | DrainProgress |
| Drain tempo | nodes.detail.drainEta | Tempo estimado: {{time}} | DrainProgress |
| Drain concluido | nodes.detail.drainComplete | No desconectado com sucesso | Toast success |

<!-- APPEND:copies-detalhe-no -->

### Tela: Saude do Cluster (`/health`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | health.title | Saude do cluster | Header da pagina |
| Metrica nos online | health.nodesOnline | Nos online | MetricCard label |
| Metrica capacidade | health.capacityUsed | Espaco utilizado | MetricCard label |
| Metrica replicacao | health.replication | Replicacao saudavel | MetricCard label |
| Metrica arquivos | health.filesTotal | Arquivos | MetricCard label |
| Metrica alertas | health.alertsActive | Alertas ativos | MetricCard label |
| Alertas titulo | health.alertsTitle | Alertas | Secao |
| Alerta sem alertas | health.noAlerts | Nenhum alerta ativo. Tudo funcionando normalmente. | Empty state |
| Alerta node_offline | health.alert.nodeOffline | No "{{node_name}}" offline ha {{duration}} | Alert message |
| Alerta replication_low | health.alert.replicationLow | {{count}} chunks com menos de 3 replicas | Alert message |
| Alerta space_low | health.alert.spaceLow | No "{{node_name}}" com {{percent}}% de espaco utilizado | Alert message |
| Alerta corruption | health.alert.corruption | {{count}} chunks corrompidos detectados | Alert message |
| Alerta auto_healing | health.alert.autoHealing | Auto-healing concluido: {{count}} chunks re-replicados | Alert message |
| Botao resolver | health.resolveButton | Marcar como resolvido | Button por alerta |

<!-- APPEND:copies-saude -->

### Tela: Membros (`/cluster`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | cluster.members.title | Membros | Header da pagina |
| Botao convidar | cluster.members.inviteButton | Convidar | CTA no header |
| Role admin | cluster.members.roleAdmin | Admin | Badge |
| Role member | cluster.members.roleMember | Membro | Badge |
| Role reader | cluster.members.roleReader | Leitura | Badge |
| Label desde | cluster.members.since | Desde {{date}} | Data de ingresso |
| Botao remover | cluster.members.removeButton | Remover do cluster | Menu acao |
| Modal remover titulo | cluster.members.removeTitle | Remover "{{name}}"? | ConfirmDialog |
| Modal remover corpo | cluster.members.removeBody | O membro perdera acesso a galeria e seus dados pessoais serao removidos. | ConfirmDialog |
| Erro ultimo admin | cluster.members.lastAdmin | Nao e possivel remover o ultimo admin do cluster | Toast error |

<!-- APPEND:copies-membros -->

### Tela: Convidar Membro (FormDialog)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Dialog titulo | cluster.invite.formTitle | Convidar membro | FormDialog |
| Label email | cluster.invite.emailLabel | Email do convidado | Input |
| Placeholder email | cluster.invite.emailPlaceholder | email@exemplo.com | Input |
| Label role | cluster.invite.roleLabel | Nivel de acesso | Select |
| Role member desc | cluster.invite.roleMemberDesc | Pode ver e enviar fotos | Select hint |
| Role reader desc | cluster.invite.roleReaderDesc | Pode ver fotos, mas nao enviar | Select hint |
| Botao gerar | cluster.invite.generateButton | Gerar convite | CTA principal |
| Link gerado titulo | cluster.invite.linkTitle | Link de convite gerado! | Sucesso |
| Link gerado hint | cluster.invite.linkHint | Compartilhe este link com {{email}}. Expira em 7 dias. | Instrucao |
| Botao copiar link | cluster.invite.copyLink | Copiar link | CopyButton |
| Toast link copiado | cluster.invite.linkCopied | Link de convite copiado! | Toast success |
| Erro email existente | cluster.invite.emailExists | Este email ja e membro do cluster | FormField error |

<!-- APPEND:copies-convidar -->

### Tela: Configuracoes (`/settings`)

| Elemento | Chave i18n | Texto | Contexto |
| --- | --- | --- | --- |
| Titulo | settings.title | Configuracoes | Header da pagina |
| Tab perfil | settings.tabProfile | Perfil | Tab |
| Tab vault | settings.tabVault | Cofre | Tab |
| Tab preferencias | settings.tabPreferences | Preferencias | Tab |
| Label nome | settings.nameLabel | Nome | Input |
| Label email | settings.emailLabel | Email | Input |
| Botao salvar | settings.saveButton | Salvar alteracoes | CTA |
| Toast salvo | settings.savedToast | Perfil atualizado com sucesso | Toast success |
| Vault titulo | settings.vaultTitle | Cofre criptografado | Secao |
| Vault descricao | settings.vaultDescription | Suas credenciais e tokens sao armazenados aqui de forma criptografada | Descricao |
| Tema label | settings.themeLabel | Tema | Preferencia |
| Tema light | settings.themeLight | Claro | Opcao |
| Tema dark | settings.themeDark | Escuro | Opcao |
| Tema system | settings.themeSystem | Sistema | Opcao |

<!-- APPEND:copies-configuracoes -->

<!-- APPEND:copies-telas -->

---

## Mensagens de Feedback

> Quais sao as mensagens de sucesso, erro, aviso e informacao exibidas ao usuario?

### Sucesso

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| feedback.success.clusterCreated | Cluster criado com sucesso! | Toast apos criar cluster |
| feedback.success.fileUploaded | "{{name}}" processado com sucesso! | Toast apos pipeline ready |
| feedback.success.fileDeleted | Arquivo removido | Toast apos deletar |
| feedback.success.nodeRegistered | No "{{name}}" registrado com sucesso | Toast apos registrar no |
| feedback.success.nodeDrained | No desconectado com sucesso | Toast apos drain completo |
| feedback.success.inviteCreated | Convite gerado! Copie o link para enviar. | Toast apos gerar convite |
| feedback.success.inviteAccepted | Bem-vindo ao cluster! | Toast apos aceitar convite |
| feedback.success.alertResolved | Alerta resolvido | Toast apos resolver alerta |
| feedback.success.profileSaved | Perfil atualizado com sucesso | Toast apos salvar perfil |
| feedback.success.recoveryComplete | Recovery concluido! Sistema restaurado. | Toast apos recovery |
| feedback.success.seedCopied | Seed copiada! Lembre-se de apagar da area de transferencia. | Toast info apos copiar seed |
| feedback.success.linkCopied | Link copiado! | Toast info apos copiar link/hash |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| feedback.error.generic | Algo deu errado. Tente novamente. | Fallback generico |
| feedback.error.network | Sem conexao com o servidor. Verifique sua internet. | Erro de rede (fetch failed) |
| feedback.error.unauthorized | Sessao expirada. Faca login novamente. | Response 401 |
| feedback.error.forbidden | Voce nao tem permissao para esta acao. | Response 403 |
| feedback.error.notFound | Recurso nao encontrado. | Response 404 |
| feedback.error.conflict | Este recurso ja existe. | Response 409 |
| feedback.error.tooManyRequests | Muitas tentativas. Aguarde {{seconds}} segundos. | Response 429 |
| feedback.error.serverError | Erro no servidor. Tente novamente em alguns minutos. | Response 5xx |
| feedback.error.uploadFailed | Falha no upload de "{{name}}". | Upload interrompido |
| feedback.error.pipelineFailed | Falha ao processar "{{name}}": {{reason}} | Pipeline error |
| feedback.error.insufficientNodes | Nos insuficientes para garantir replicacao minima (3 nos) | Upload bloqueado |
| feedback.error.seedInvalid | Seed incorreta — os dados nao puderam ser descriptografados | Recovery falhou |
| feedback.error.inviteExpired | Este convite expirou. Peca um novo ao admin. | Token expirado |
| feedback.error.inviteInvalid | Convite invalido. | Token com assinatura invalida |
| feedback.error.emailExists | Este email ja e membro do cluster. | Convite com email existente |
| feedback.error.lastAdmin | Nao e possivel remover o ultimo admin do cluster. | Tentativa de remover ultimo admin |
| feedback.error.drainMinNodes | Nao e possivel desconectar — minimo 3 nos necessario. | Drain bloqueado |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| validation.required | Campo obrigatorio | Campo vazio no submit |
| validation.email | Email invalido | Formato de email incorreto |
| validation.minLength | Minimo de {{min}} caracteres | Texto curto demais |
| validation.maxLength | Maximo de {{max}} caracteres | Texto longo demais |
| validation.passwordMin | Senha deve ter no minimo 8 caracteres | Senha curta |
| validation.seedWord | Palavra invalida. Verifique o dicionario BIP-39 | Palavra fora do wordlist |
| validation.clusterName | Nome do cluster deve ter entre 3 e 100 caracteres | Nome invalido |
| validation.nodeName | Nome do no deve ter entre 3 e 100 caracteres | Nome invalido |
| validation.url | URL invalida | Endpoint de no invalido |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| feedback.info.loading | Carregando... | Estado de loading generico |
| feedback.info.processing | Processando... | Pipeline em andamento |
| feedback.info.noResults | Nenhum resultado para "{{search}}" | Busca sem resultados |
| feedback.warning.seedOnce | Esta e a UNICA vez que a seed sera exibida | AlertBanner no setup |
| feedback.warning.seedNoScreenshot | Nao tire screenshot. Anote em papel. | AlertBanner warning |
| feedback.warning.nodeDisconnecting | Migracao de dados em andamento. Nao desligue o no. | AlertBanner durante drain |
| feedback.warning.lowSpace | Espaco de armazenamento baixo. Considere adicionar mais nos. | AlertBanner warning |
| feedback.info.autoHealing | Auto-healing em andamento. Seus dados estao sendo protegidos. | AlertBanner info |
| feedback.info.recoveryInProgress | Recovery em andamento. Isso pode levar ate 2 horas. | AlertBanner info |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Sidebar

| Elemento | Chave i18n | Texto |
| --- | --- | --- |
| Item galeria | global.sidebar.gallery | Galeria |
| Item upload | global.sidebar.upload | Upload |
| Item nos | global.sidebar.nodes | Nos |
| Item saude | global.sidebar.health | Saude |
| Item membros | global.sidebar.members | Membros |
| Item configuracoes | global.sidebar.settings | Configuracoes |
| Tooltip collapse | global.sidebar.collapse | Recolher menu |
| Tooltip expand | global.sidebar.expand | Expandir menu |

<!-- APPEND:copies-sidebar -->

### Header

| Elemento | Chave i18n | Texto |
| --- | --- | --- |
| Menu perfil | global.header.profile | Meu perfil |
| Menu tema | global.header.theme | Alternar tema |
| Menu sair | global.header.logout | Sair |
| Logo alt | global.header.logoAlt | Alexandria — preservando memorias |

<!-- APPEND:copies-navbar -->

### AlertBanner (global — alertas criticos no topo)

| Elemento | Chave i18n | Texto |
| --- | --- | --- |
| Alerta critico prefix | global.alert.criticalPrefix | Atencao: |
| Botao ver detalhes | global.alert.viewDetails | Ver detalhes |
| Botao dispensar | global.alert.dismiss | Dispensar |

<!-- APPEND:copies-footer -->

### Modais Genericos

| Modal | Titulo | Corpo | CTA confirmar | CTA cancelar |
| --- | --- | --- | --- | --- |
| Exclusao | Confirmar exclusao | Esta acao nao pode ser desfeita. | Excluir | Cancelar |
| Desconexao de no | Desconectar no | Todos os chunks serao migrados. Isso pode levar algum tempo. | Desconectar | Cancelar |
| Remocao de membro | Remover membro | O membro perdera acesso a galeria e seus dados pessoais serao removidos. | Remover | Cancelar |
| Logout | Sair do Alexandria | Voce sera desconectado desta sessao. | Sair | Cancelar |

<!-- APPEND:copies-modais -->

### Empty States

| Tela/Secao | Titulo | Descricao | CTA |
| --- | --- | --- | --- |
| Galeria (sem arquivos) | Sua galeria esta vazia | Faca seu primeiro upload para comecar a preservar as memorias da familia | Fazer upload |
| Galeria (busca sem resultado) | Nenhum arquivo encontrado | Nenhum resultado para "{{search}}". Tente ajustar os filtros. | Limpar filtros |
| Nos (sem nos) | Nenhum no registrado | Adicione pelo menos 3 nos para comecar a armazenar dados | Adicionar primeiro no |
| Alertas (sem alertas) | Nenhum alerta ativo | Tudo funcionando normalmente | — |
| Membros (so admin) | Voce e o unico membro | Convide sua familia para comecar a compartilhar memorias | Convidar membro |
| Upload (fila vazia) | Nenhum arquivo na fila | Arraste arquivos aqui ou clique para selecionar | — |
| Erro generico | Nao foi possivel carregar os dados | Houve um problema ao conectar com o servidor | Tentar novamente |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra | Criar novo cluster | Criar Novo Cluster |
| Voz ativa | Salve suas fotos | Suas fotos devem ser salvas |
| Direto — max 50 chars em CTAs | Fazer upload | Clique aqui para comecar a fazer upload dos seus arquivos |
| Sem jargao tecnico para membros | Algo deu errado | Erro 500: Internal Server Error |
| Jargao tecnico ok para admin | Chunks em re-replicacao | Dados sendo copiados |
| Pontuacao em frases completas | Suas alteracoes foram salvas. | Suas alteracoes foram salvas |
| Sem ponto em labels e botoes | Salvar alteracoes | Salvar alteracoes. |
| Tooltips autoexplicativos | Copiar seed phrase para a area de transferencia | Clique para copiar |
| Numeros formatados | 1.247 chunks | 1247 chunks |
| Tamanhos formatados | 450 KB, 2.3 GB | 450000 bytes |
| Datas relativas para < 7 dias | ha 3 horas, ontem | 2026-03-20T14:30:00Z |
| Datas absolutas para >= 7 dias | 15 de marco de 2026 | 2026-03-15 |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-23 | pt-BR como idioma unico (preparado para i18n) | Produto para familias brasileiras na v1; chaves i18n facilitam traducao futura |
| 2026-03-23 | Tom familiar e confiavel (nao corporativo) | Usuarios incluem avos e pessoas nao-tecnicas; produto trata de memorias familiares |
| 2026-03-23 | "Voce" (nao "Tu" ou formal) | Tom informal mas respeitoso; padrao brasileiro mais universal |
| 2026-03-23 | Jargao tecnico apenas para telas de admin | Membros comuns nao precisam saber o que e "chunk" ou "heartbeat"; admin sim |
| 2026-03-23 | Seed phrase com instrucoes explicitas e repetidas | Seed e o elemento mais critico do sistema; redundancia de avisos e intencional |

<!-- APPEND:decisoes -->
