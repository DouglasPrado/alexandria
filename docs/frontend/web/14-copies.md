# Copies

Define todos os textos e conteudos textuais das telas do frontend web — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-010), 17-communication.md (tom de voz), 07-routes.md (rotas) -->

---

## Estrategia de Copy

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | pt-BR |
| Suporte i18n | Nao — produto familiar com escopo fixo (Familia Prado); estrutura de chaves preparada para expansao futura |
| Estrutura de chaves | `namespace.screen.element` — ex: `auth.login.submitButton` |
| Arquivos de traducao | `locales/pt-BR.json` (unico por ora) |
| Tom de voz | Familiar, direto e acolhedor — como um sistema feito por alguem da familia para a familia |
| Pessoa gramatical | Voce (segunda pessoa informal) |
| Genero | Neutro quando possivel |

<!-- do blueprint: 01-vision.md — OBJ-06: acessivel para usuarios nao-tecnicos, membros de diferentes idades -->

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo | Definicao | Nao usar |
| --- | --- | --- |
| Cluster | O grupo familiar no Alexandria — unidade raiz que agrupa membros, nos e arquivos | Conta, Workspace, Projeto |
| Membro | Pessoa que pertence ao cluster familiar | Usuario, Participante, Colaborador |
| No | Dispositivo ou conta cloud que armazena os dados | Servidor, Bucket, Drive |
| Arquivo | Foto, video ou documento enviado ao cluster | Item, Asset, Media |
| Acervo | Colecao de todos os arquivos do cluster | Biblioteca, Repositorio |
| Seed phrase | As 12 palavras que permitem recuperar o sistema | Senha de recuperacao, Chave secreta |
| Vault | Cofre criptografado de credenciais do membro | Carteira, Cofre de senhas |
| Chunk | Bloco criptografado de dados — nao exibir ao usuario final; usar "dados" ou "arquivo" | — |
| Replica | Copia de seguranca dos dados — usar "copia de seguranca" na UI para nao-tecnicos | — |
| Pipeline | Processamento interno — nao exibir; usar "processando" ou "otimizando" | — |
| Drain | Migracao de chunks de um no — usar "migrando dados" na UI | — |
| Admin | Administrador do cluster — "Administrador" em textos formais, "admin" em badges | Dono, Root |

<!-- APPEND:glossario -->

---

## Copies por Tela

### Tela: Login — `/login`

<!-- do blueprint: 08-flows.md (Fluxo 1, passo 1) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.login.title` | Bem-vindo ao Alexandria | Heading principal |
| Subtitulo | `auth.login.subtitle` | Acesse o acervo da sua familia | Subheading descritivo |
| Label email | `auth.login.emailLabel` | Email | Label do campo |
| Placeholder email | `auth.login.emailPlaceholder` | seu@email.com | Campo de email |
| Label senha | `auth.login.passwordLabel` | Senha | Label do campo |
| Placeholder senha | `auth.login.passwordPlaceholder` | Sua senha | Campo de senha |
| Botao submit | `auth.login.submitButton` | Entrar | CTA principal |
| Loading submit | `auth.login.submitting` | Entrando... | Estado de loading do botao |
| Alt logo | `auth.login.logoAlt` | Alexandria | Alt text do logo |

<!-- APPEND:copies-login -->

### Tela: Aceitar Convite — `/invite/:token`

<!-- do blueprint: 08-use_cases.md (UC-002), 08-flows.md (Fluxo 1, passos 14-16) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.invite.title` | Voce foi convidado | Heading principal |
| Subtitulo | `auth.invite.subtitle` | {{admin_name}} convidou voce para o cluster "{{cluster_name}}" | Descricao do convite |
| Label nome | `auth.invite.nameLabel` | Seu nome | Label do campo |
| Placeholder nome | `auth.invite.namePlaceholder` | Como voce quer ser chamado | Campo de nome |
| Label senha | `auth.invite.passwordLabel` | Crie uma senha | Label do campo |
| Placeholder senha | `auth.invite.passwordPlaceholder` | Minimo 8 caracteres | Campo de senha |
| Label confirmar senha | `auth.invite.confirmPasswordLabel` | Confirme a senha | Label do campo |
| Botao submit | `auth.invite.submitButton` | Aceitar convite | CTA principal |
| Loading submit | `auth.invite.submitting` | Entrando no cluster... | Estado de loading |
| Token expirado — titulo | `auth.invite.expiredTitle` | Convite expirado | Tela de erro |
| Token expirado — corpo | `auth.invite.expiredBody` | Este convite nao e mais valido. Solicite um novo convite ao administrador do cluster. | Mensagem de erro |
| Token invalido — titulo | `auth.invite.invalidTitle` | Convite invalido | Tela de erro |
| Token invalido — corpo | `auth.invite.invalidBody` | Nao foi possivel validar este convite. O link pode estar corrompido. | Mensagem de erro |

<!-- APPEND:copies-invite -->

### Tela: Criar Cluster — `/setup`

<!-- do blueprint: 08-use_cases.md (UC-001), 08-flows.md (Fluxo 1, passos 2-6) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `setup.cluster.title` | Criar seu cluster familiar | Heading principal |
| Subtitulo | `setup.cluster.subtitle` | Seu espaco privado para guardar memorias da familia | Subheading |
| Label nome cluster | `setup.cluster.nameLabel` | Nome do cluster | Label do campo |
| Placeholder nome | `setup.cluster.namePlaceholder` | Ex: Familia Prado | Campo de nome |
| Hint nome | `setup.cluster.nameHint` | Este sera o nome visivel para todos os membros | Texto auxiliar |
| Label senha admin | `setup.cluster.passwordLabel` | Sua senha de acesso | Label do campo |
| Placeholder senha | `setup.cluster.passwordPlaceholder` | Minimo 8 caracteres | Campo de senha |
| Label confirmar senha | `setup.cluster.confirmPasswordLabel` | Confirme a senha | Label do campo |
| Botao submit | `setup.cluster.submitButton` | Criar cluster | CTA principal |
| Loading submit | `setup.cluster.submitting` | Criando cluster... | Estado de loading |
| Stepper passo 1 | `setup.stepper.step1` | Criar cluster | Label do passo ativo |
| Stepper passo 2 | `setup.stepper.step2` | Guardar seed phrase | Label do proximo passo |

<!-- APPEND:copies-setup -->

### Tela: Seed Phrase — `/setup/seed`

<!-- do blueprint: 08-use_cases.md (UC-001, passos 8-10), 08-flows.md (Fluxo 1, passos 7-10) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `setup.seed.title` | Guarde sua seed phrase | Heading principal |
| Alerta principal | `setup.seed.alert` | Anote em papel. Esta e a UNICA vez que ela sera exibida. | Banner de aviso critico |
| Descricao | `setup.seed.description` | Estas 12 palavras sao a unica forma de recuperar o sistema caso o servidor seja perdido. Sem elas, os dados nao podem ser recuperados. | Explicacao do proposito |
| Label checkbox | `setup.seed.confirmLabel` | Anotei as 12 palavras em local seguro e entendo que nao poderei recupera-las depois | Checkbox obrigatorio |
| Botao continuar (desabilitado) | `setup.seed.continueDisabled` | Confirme que anotou para continuar | Tooltip do botao desabilitado |
| Botao continuar (habilitado) | `setup.seed.continueButton` | Ir para o dashboard | CTA apos confirmar |
| Aria label grid de palavras | `setup.seed.gridAriaLabel` | Suas 12 palavras da seed phrase | Acessibilidade do grid |
| Prefixo numero | `setup.seed.wordPrefix` | {{n}}. | Prefixo de cada palavra (ex: "1.") |

<!-- APPEND:copies-seed -->

### Tela: Recovery Seed Input — `/recovery`

<!-- do blueprint: 08-use_cases.md (UC-007), 08-flows.md (Fluxo 4, passos 3-6) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `recovery.seed.title` | Recuperar o sistema | Heading principal |
| Descricao | `recovery.seed.description` | Insira as 12 palavras da seed phrase para reconstruir o banco de dados e reconectar os nos. | Instrucao |
| Hint inputs | `recovery.seed.inputHint` | Digite ou cole cada palavra | Hint abaixo dos inputs |
| Autocomplete hint | `recovery.seed.autocompleteHint` | Sugestoes da wordlist BIP-39 | Tooltip de autocomplete |
| Botao iniciar | `recovery.seed.submitButton` | Iniciar recovery | CTA principal |
| Loading submit | `recovery.seed.submitting` | Validando seed phrase... | Estado de loading |
| Erro palavra invalida | `recovery.seed.invalidWord` | Palavra invalida | Inline error por campo |
| Sugestao de palavra | `recovery.seed.suggestion` | Voce quis dizer "{{word}}"? | Sugestao de autocomplete |

<!-- APPEND:copies-recovery-seed -->

### Tela: Recovery Progresso — `/recovery/progress`

<!-- do blueprint: 08-flows.md (Fluxo 4, passos 7-12) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo em progresso | `recovery.progress.title` | Recuperando o sistema... | Heading durante o processo |
| Titulo concluido | `recovery.progress.titleDone` | Sistema recuperado | Heading quando conclui |
| Etapa 1 | `recovery.progress.step1` | Validando seed phrase | Label da etapa |
| Etapa 2 | `recovery.progress.step2` | Buscando vaults nos nos | Label da etapa |
| Etapa 3 | `recovery.progress.step3` | Descriptografando vaults | Label da etapa |
| Etapa 4 | `recovery.progress.step4` | Conectando a S3/R2 | Label da etapa |
| Etapa 5 | `recovery.progress.step5` | Reconstruindo banco de dados | Label da etapa |
| Progresso etapa 5 | `recovery.progress.step5Progress` | {{current}} de {{total}} manifests processados | Progress text |
| Etapa 6 | `recovery.progress.step6` | Validando integridade | Label da etapa |
| Progresso etapa 6 | `recovery.progress.step6Progress` | {{current}} de {{total}} chunks verificados | Progress text |
| Aviso vault nao encontrado | `recovery.progress.vaultWarning` | Vaults nao encontrados. Insira as credenciais S3/R2 manualmente. | Warning state etapa 2 |
| Botao credenciais manuais | `recovery.progress.manualCredsButton` | Inserir credenciais manualmente | Fallback apos vault nao encontrado |
| Relatorio arquivos | `recovery.report.filesRecovered` | {{count}} arquivos recuperados | Linha do relatorio final |
| Relatorio nos | `recovery.report.nodesReconnected` | {{count}} nos reconectados | Linha do relatorio final |
| Relatorio chunks pendentes | `recovery.report.chunksMissing` | {{count}} chunks aguardando re-replicacao | Linha do relatorio final |
| DNS hint | `recovery.progress.dnsHint` | Atualize o DNS do seu dominio para apontar para o novo servidor. | Instrucao pos-recovery |
| Botao ir ao dashboard | `recovery.progress.dashboardButton` | Ir para o dashboard | CTA final |

<!-- APPEND:copies-recovery-progress -->

### Tela: Galeria — `/dashboard`

<!-- do blueprint: 08-use_cases.md (UC-004, UC-005, UC-010), 08-flows.md (Fluxos 2 e 3) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `gallery.title` | Galeria | Heading da pagina |
| Botao upload | `gallery.uploadButton` | Upload | CTA principal |
| Tooltip upload | `gallery.uploadTooltip` | Enviar fotos, videos ou documentos | Tooltip |
| Toggle grade | `gallery.viewGrid` | Grade | Toggle de visualizacao |
| Toggle timeline | `gallery.viewTimeline` | Linha do tempo | Toggle de visualizacao |
| Aria label grade | `gallery.gridAriaLabel` | Galeria de arquivos em grade | Acessibilidade |
| Aria label timeline | `gallery.timelineAriaLabel` | Galeria organizada por data | Acessibilidade |
| Dropzone texto | `gallery.dropzone.text` | Arraste arquivos aqui ou clique para selecionar | Texto da area de drop |
| Dropzone subtext | `gallery.dropzone.subtext` | Fotos, videos e documentos — ate 10 GB por arquivo | Hint de tipos aceitos |
| Dropzone ativo | `gallery.dropzone.active` | Solte para fazer upload | Estado de drag-over |
| Empty state titulo | `gallery.empty.title` | Nenhum arquivo ainda | Empty state inicial |
| Empty state descricao | `gallery.empty.description` | Faca seu primeiro upload para comecar a construir o acervo familiar. | Descricao |
| Empty state CTA | `gallery.empty.cta` | Fazer primeiro upload | Botao |
| Separador mes/ano (timeline) | `gallery.timeline.separator` | {{month}} de {{year}} | Ex: "Marco de 2024" |
| Aria thumbnail | `gallery.thumbnail.ariaLabel` | {{filename}} — {{type}}, {{date}} | Acessibilidade de cada thumbnail |
| Label processando | `gallery.thumbnail.processing` | Processando... | Sobre thumbnail em processamento |
| Label erro | `gallery.thumbnail.error` | Falha no upload | Sobre thumbnail com erro |

<!-- APPEND:copies-gallery -->

### Tela: Detalhe do Arquivo — `/dashboard/file/:id`

<!-- do blueprint: 08-use_cases.md (UC-005), 08-flows.md (Fluxo 3, passos 7-10) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Aria dialog | `file.lightbox.ariaLabel` | Visualizacao de {{filename}} | Acessibilidade do dialog |
| Botao fechar | `file.lightbox.closeButton` | Fechar | Botao (Esc) |
| Botao anterior | `file.lightbox.prevButton` | Arquivo anterior | Aria label |
| Botao proximo | `file.lightbox.nextButton` | Proximo arquivo | Aria label |
| Botao download | `file.lightbox.downloadButton` | Baixar | CTA de download |
| Loading download | `file.lightbox.downloading` | Baixando... | Loading state |
| Secao metadados | `file.metadata.title` | Informacoes | Heading do painel |
| Label nome | `file.metadata.name` | Nome | Label |
| Label tipo | `file.metadata.type` | Tipo | Label |
| Label tamanho | `file.metadata.size` | Tamanho | Label |
| Label data | `file.metadata.date` | Data | Label |
| Label camera | `file.metadata.camera` | Camera | Label EXIF |
| Label localizacao | `file.metadata.location` | Localizacao | Label EXIF GPS |
| Label dimensoes | `file.metadata.dimensions` | Dimensoes | Label EXIF |
| Label duracao | `file.metadata.duration` | Duracao | Label para videos |
| Sem metadados | `file.metadata.noExif` | Nenhum dado EXIF disponivel | Fallback |
| Tipo foto | `file.type.photo` | Foto | Badge de tipo |
| Tipo video | `file.type.video` | Video | Badge de tipo |
| Tipo documento | `file.type.document` | Documento | Badge de tipo |
| Arquivo indisponivel | `file.unavailable` | Arquivo temporariamente indisponivel | Estado de erro |
| Arquivo danificado | `file.corrupted` | Arquivo danificado — algumas copias estao inacessiveis | Estado de corrupcao |

<!-- APPEND:copies-file-detail -->

### Tela: Busca — `/dashboard/search`

<!-- do blueprint: 08-use_cases.md (UC-010), 08-flows.md (Fluxo 3) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `search.title` | Busca | Heading |
| Placeholder busca | `search.placeholder` | Buscar por nome, data ou tipo... | Input |
| Aria label busca | `search.ariaLabel` | Buscar no acervo | Acessibilidade |
| Filtro fotos | `search.filter.photos` | Fotos | Chip de filtro |
| Filtro videos | `search.filter.videos` | Videos | Chip de filtro |
| Filtro documentos | `search.filter.documents` | Documentos | Chip de filtro |
| Limpar filtros | `search.clearFilters` | Limpar filtros | Botao |
| Contagem resultados | `search.resultsCount` | {{count}} resultado(s) | Contagem |
| Buscando | `search.searching` | Buscando... | Loading state |
| Empty state titulo | `search.empty.title` | Nenhum resultado para "{{query}}" | Empty state |
| Empty state descricao | `search.empty.description` | Tente usar outros termos ou limpar os filtros. | Descricao |

<!-- APPEND:copies-search -->

### Tela: Nos — `/dashboard/nodes`

<!-- do blueprint: 08-use_cases.md (UC-003, UC-006, UC-008), 08-flows.md (Fluxo 5) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `nodes.title` | Nos de armazenamento | Heading |
| Subtitulo | `nodes.subtitle` | Dispositivos e contas cloud que guardam os dados do cluster | Descricao |
| Botao adicionar | `nodes.addButton` | Adicionar no | CTA principal |
| Resumo nos online | `nodes.summary.online` | {{count}} online | ClusterHealthSummary |
| Resumo espaco total | `nodes.summary.totalSpace` | {{size}} disponiveis | ClusterHealthSummary |
| Resumo replicacao ok | `nodes.summary.replication` | Replicacao saudavel | Badge de status |
| Resumo replicacao alerta | `nodes.summary.replicationWarning` | Replicacao com problemas | Badge de alerta |
| Coluna nome | `nodes.table.name` | Nome | Header de tabela |
| Coluna tipo | `nodes.table.type` | Tipo | Header |
| Coluna status | `nodes.table.status` | Status | Header |
| Coluna capacidade | `nodes.table.capacity` | Capacidade | Header |
| Coluna heartbeat | `nodes.table.lastSeen` | Visto por ultimo | Header |
| Status online | `nodes.status.online` | Online | Badge verde |
| Status suspect | `nodes.status.suspect` | Sem resposta | Badge amarelo — evita jargao |
| Status lost | `nodes.status.lost` | Perdido | Badge vermelho |
| Status draining | `nodes.status.draining` | Migrando dados | Badge azul |
| Status disconnected | `nodes.status.disconnected` | Desconectado | Badge cinza |
| Capacidade usada | `nodes.capacity.used` | {{used}} de {{total}} usados | Ex: "4 GB de 20 GB usados" |
| Tooltip heartbeat | `nodes.heartbeat.tooltip` | Ultimo contato: {{time}} | Tooltip do timestamp |
| Botao detalhes | `nodes.actions.details` | Ver detalhes | Acao de linha |
| Botao desconectar | `nodes.actions.disconnect` | Desconectar | Acao destrutiva |
| Empty state titulo | `nodes.empty.title` | Nenhum no registrado | Empty state |
| Empty state descricao | `nodes.empty.description` | Adicione pelo menos 3 nos para comecar a fazer uploads. | Descricao |
| Empty state CTA | `nodes.empty.cta` | Adicionar primeiro no | Botao |
| Aviso minimo nos | `nodes.warning.minNodes` | Voce precisa de pelo menos 3 nos ativos para fazer uploads | Banner de aviso |

<!-- APPEND:copies-nodes -->

### Tela: Detalhe do No — `/dashboard/nodes/:id`

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodeDetail.title` | {{node_name}} | Heading com nome do no |
| Label tipo | `nodeDetail.type` | Tipo | Label |
| Label endpoint | `nodeDetail.endpoint` | Endpoint | Label |
| Label chunks | `nodeDetail.chunks` | Chunks armazenados | Label — admin ve o jargao |
| Label replicas | `nodeDetail.replicas` | Replicas dependentes | Label |
| Drain titulo | `nodeDetail.drain.title` | Migrando dados | Heading do estado de drain |
| Drain progresso | `nodeDetail.drain.progress` | {{current}} de {{total}} chunks migrados | Progress text |
| Drain concluido | `nodeDetail.drain.done` | Migracao concluida | Estado final |
| Botao desconectar | `nodeDetail.disconnectButton` | Desconectar no | Botao destrutivo |

<!-- APPEND:copies-node-detail -->

### Tela: Alertas — `/dashboard/alerts`

<!-- do blueprint: 08-use_cases.md (UC-008), 08-flows.md (Fluxo 5) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `alerts.title` | Alertas | Heading |
| Filtro todos | `alerts.filter.all` | Todos | Tab/chip |
| Filtro criticos | `alerts.filter.critical` | Criticos | Tab/chip |
| Filtro avisos | `alerts.filter.warning` | Avisos | Tab/chip |
| Filtro info | `alerts.filter.info` | Informativos | Tab/chip |
| Filtro resolvidos | `alerts.filter.resolved` | Resolvidos | Tab/chip |
| Badge critical | `alerts.severity.critical` | Critico | Badge vermelho |
| Badge warning | `alerts.severity.warning` | Aviso | Badge amarelo |
| Badge info | `alerts.severity.info` | Info | Badge azul |
| Badge resolved | `alerts.severity.resolved` | Resolvido | Badge verde |
| Timestamp | `alerts.timestamp` | Ha {{time}} | Ex: "Ha 5 minutos" |
| Botao resolver | `alerts.resolveButton` | Marcar como resolvido | Acao |
| Empty state titulo | `alerts.empty.title` | Tudo funcionando | Empty state positivo |
| Empty state descricao | `alerts.empty.description` | Nenhum alerta ativo no momento. | Descricao positiva |
| Tipo no offline | `alerts.type.nodeOffline` | No offline | Tipo de alerta |
| Tipo replicacao baixa | `alerts.type.replicationLow` | Replicacao insuficiente | Tipo de alerta |
| Tipo token expirado | `alerts.type.tokenExpired` | Token expirado | Tipo de alerta |
| Tipo espaco baixo | `alerts.type.spaceLow` | Espaco em disco baixo | Tipo de alerta |
| Tipo corrupcao | `alerts.type.corruption` | Dados corrompidos detectados | Tipo de alerta |
| Tipo auto-healing | `alerts.type.autoHealingComplete` | Reparo automatico concluido | Tipo positivo |

<!-- APPEND:copies-alerts -->

### Tela: Membros — `/dashboard/members`

<!-- do blueprint: 08-use_cases.md (UC-002) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `members.title` | Membros | Heading |
| Subtitulo | `members.subtitle` | Pessoas com acesso ao cluster "{{cluster_name}}" | Descricao |
| Botao convidar | `members.inviteButton` | Convidar membro | CTA principal |
| Coluna nome | `members.table.name` | Nome | Header |
| Coluna email | `members.table.email` | Email | Header |
| Coluna acesso | `members.table.role` | Acesso | Header — evita jargao "role" |
| Coluna ingresso | `members.table.joinedAt` | Membro desde | Header |
| Role admin | `members.role.admin` | Administrador | Badge/label |
| Role member | `members.role.member` | Membro | Badge/label |
| Role reader | `members.role.reader` | Apenas visualizacao | Badge/label |
| Botao remover | `members.actions.remove` | Remover | Acao destrutiva |
| Voce mesmo | `members.selfLabel` | Voce | Label na propria linha |
| Convites pendentes | `members.pendingSection` | Convites pendentes | Secao |
| Expira em | `members.invite.expiresIn` | Expira em {{time}} | Ex: "Expira em 3 dias" |
| Expirado | `members.invite.expired` | Expirado | Badge vermelho |
| Botao copiar link | `members.invite.copyLink` | Copiar link | Botao |
| Link copiado | `members.invite.linkCopied` | Link copiado! | Feedback de clipboard |
| Empty convites | `members.invite.empty` | Nenhum convite pendente | Empty state |
| Aviso ultimo admin | `members.warning.lastAdmin` | Voce e o unico administrador. Promova outro membro antes de se remover. | Aviso inline |

<!-- APPEND:copies-members -->

### Tela: Configuracoes do Cluster — `/dashboard/cluster`

<!-- do blueprint: 04-domain-model.md (Cluster, Vault) -->

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `cluster.title` | Configuracoes do cluster | Heading |
| Secao info | `cluster.info.title` | Informacoes do cluster | Secao |
| Label nome | `cluster.info.name` | Nome do cluster | Label |
| Label id | `cluster.info.id` | ID do cluster | Label (truncado com CopyButton) |
| Label criado em | `cluster.info.createdAt` | Criado em | Label |
| Secao seed | `cluster.seed.title` | Seed phrase | Secao |
| Seed aviso | `cluster.seed.warning` | A seed phrase foi exibida apenas uma vez na criacao. Guarde-a em local fisico seguro. Se voce a perdeu, o sistema ainda funciona, mas nao podera ser recuperado em caso de desastre. | Banner de aviso |
| Seed nao confirmada | `cluster.seed.unconfirmed` | Voce ainda nao confirmou que anotou a seed phrase. | Banner critico |
| Botao confirmar seed | `cluster.seed.confirmButton` | Confirmar que anotei a seed phrase | Botao |
| Secao perigo | `cluster.danger.title` | Zona de perigo | Secao destrutiva |
| Suspender cluster | `cluster.danger.suspend` | Suspender cluster | Acao destrutiva |
| Hint suspender | `cluster.danger.suspendWarning` | Suspender impede novos uploads e acessos de membros. | Hint descritivo |

<!-- APPEND:copies-cluster -->

### Tela: Minha Conta — `/dashboard/settings`

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo pagina | `settings.title` | Minha conta | Heading |
| Secao perfil | `settings.profile.title` | Perfil | Secao |
| Label nome | `settings.profile.name` | Nome | Label |
| Label email | `settings.profile.email` | Email | Label |
| Label acesso | `settings.profile.role` | Acesso | Label |
| Botao salvar | `settings.profile.saveButton` | Salvar alteracoes | CTA |
| Loading salvar | `settings.profile.saving` | Salvando... | Loading state |
| Secao senha | `settings.password.title` | Alterar senha | Secao |
| Label senha atual | `settings.password.current` | Senha atual | Label |
| Label nova senha | `settings.password.new` | Nova senha | Label |
| Label confirmar | `settings.password.confirm` | Confirmar nova senha | Label |
| Botao alterar senha | `settings.password.submitButton` | Alterar senha | CTA |
| Secao aparencia | `settings.theme.title` | Aparencia | Secao |
| Tema claro | `settings.theme.light` | Claro | Opcao |
| Tema escuro | `settings.theme.dark` | Escuro | Opcao |
| Tema sistema | `settings.theme.system` | Seguir sistema | Opcao |

<!-- APPEND:copies-settings -->

---

## Mensagens de Feedback

### Sucesso

<!-- do blueprint: 08-flows.md (mensagens pos-acao bem-sucedida em todos os fluxos) -->

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.success.clusterCreated` | Cluster criado com sucesso! | Toast apos criar cluster |
| `feedback.success.memberInvited` | Convite enviado para {{email}} | Toast apos criar convite |
| `feedback.success.memberAccepted` | Bem-vindo ao cluster "{{cluster_name}}"! | Toast ao aceitar convite |
| `feedback.success.memberRemoved` | Membro removido do cluster | Toast apos remover membro |
| `feedback.success.nodeAdded` | No "{{node_name}}" adicionado com sucesso | Toast apos adicionar no |
| `feedback.success.nodeDrained` | Dados migrados. No desconectado. | Toast apos drain concluido |
| `feedback.success.uploadDone` | {{filename}} enviado com sucesso | Toast por arquivo concluido |
| `feedback.success.downloadReady` | Download iniciado | Toast ao iniciar download |
| `feedback.success.profileSaved` | Perfil atualizado | Toast apos salvar perfil |
| `feedback.success.passwordChanged` | Senha alterada com sucesso | Toast apos alterar senha |
| `feedback.success.linkCopied` | Link copiado! | Toast de clipboard |
| `feedback.success.alertResolved` | Alerta marcado como resolvido | Toast apos resolver alerta |
| `feedback.success.seedConfirmed` | Seed phrase confirmada | Toast apos confirmar |
| `feedback.success.recoveryComplete` | Sistema recuperado com sucesso! | Toast ao concluir recovery |

<!-- APPEND:feedback-sucesso -->

### Erro

<!-- do blueprint: 08-flows.md (tratamento de erro dos 5 fluxos criticos) -->

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.error.generic` | Algo deu errado. Tente novamente. | Fallback generico |
| `feedback.error.network` | Sem conexao com o servidor. Verifique sua internet. | Erro de rede |
| `feedback.error.unauthorized` | Sessao expirada. Faca login novamente. | 401 — redireciona para /login |
| `feedback.error.forbidden` | Voce nao tem permissao para esta acao. | 403 |
| `feedback.error.notFound` | Recurso nao encontrado. | 404 |
| `feedback.error.serverUnavailable` | Servico temporariamente indisponivel. Tente em alguns instantes. | 503 |
| `feedback.error.clusterCreate` | Erro ao criar cluster. Tente novamente. | Falha no POST /clusters |
| `feedback.error.insufficientNodes` | Nos insuficientes. Adicione mais nos ao cluster antes de fazer uploads. | 503 em upload (RN-N6) |
| `feedback.error.uploadFailed` | Falha ao enviar {{filename}}. | Erro de upload individual |
| `feedback.error.uploadFormat` | Formato nao suportado: .{{ext}} | Validacao client-side de tipo MIME |
| `feedback.error.uploadSize` | Arquivo muito grande. Limite: {{limit}} por arquivo. | Validacao client-side de tamanho |
| `feedback.error.processingFailed` | Falha ao processar {{filename}}. | File status = error (pipeline) |
| `feedback.error.downloadUnavailable` | Arquivo temporariamente indisponivel. | Chunk em no offline |
| `feedback.error.downloadCorrupted` | Arquivo danificado e nao pode ser baixado. | Chunk corrompido irrecuperavel |
| `feedback.error.nodeConnectivity` | Nao foi possivel conectar ao no. Verifique as credenciais. | Teste de conectividade falhou |
| `feedback.error.nodeCredentials` | Credenciais invalidas. Verifique o access key e secret. | Autenticacao S3/R2 falhou |
| `feedback.error.nodeBucketNotFound` | Bucket nao encontrado. Verifique o nome e as permissoes. | Bucket inexistente |
| `feedback.error.nodeMinimum` | Nao e possivel remover — minimo de 3 nos necessario. | Remover com <3 nos (RN-N6) |
| `feedback.error.inviteEmailExists` | Este email ja e membro do cluster. | 409 em convite (RN-M1) |
| `feedback.error.inviteTokenInvalid` | Convite invalido. | 403 em aceite |
| `feedback.error.inviteTokenExpired` | Convite expirado. Solicite um novo ao administrador. | Token expirado (RN-I1) |
| `feedback.error.recoverySeedInvalid` | Seed phrase incorreta — vaults nao puderam ser descriptografados. Verifique as palavras. | Etapa 3 do recovery |
| `feedback.error.recoveryNoManifests` | Recovery impossivel — nenhum manifest encontrado nos nos. | Manifests ausentes |
| `feedback.error.lastAdmin` | Nao e possivel remover o unico administrador do cluster. | Tentativa de remover ultimo admin (RN-M2) |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| `validation.required` | Campo obrigatorio | Campo vazio no submit |
| `validation.email` | Email invalido | Formato de email incorreto |
| `validation.minLength` | Minimo de {{min}} caracteres | Texto curto demais |
| `validation.maxLength` | Maximo de {{max}} caracteres | Texto longo demais |
| `validation.passwordMismatch` | As senhas nao coincidem | Confirmacao de senha diferente |
| `validation.passwordMinLength` | A senha deve ter pelo menos 8 caracteres | Senha curta demais |
| `validation.clusterNameRequired` | Informe o nome do cluster | Nome vazio no setup |
| `validation.nameRequired` | Informe seu nome | Nome vazio no convite |
| `validation.seedWordInvalid` | Palavra invalida | Palavra fora do wordlist BIP-39 |
| `validation.seedWordRequired` | Informe todas as 12 palavras | Seed incompleta no submit |
| `validation.nodeNameRequired` | Informe um nome para o no | Nome de no vazio |
| `validation.nodeEndpointRequired` | Informe o endpoint do no | Endpoint vazio |
| `validation.s3BucketRequired` | Informe o nome do bucket | Bucket vazio para nos S3/R2 |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.warning.seedUnconfirmed` | Voce ainda nao confirmou que anotou a seed phrase. Faca isso agora em Configuracoes do cluster. | Banner persistente no dashboard |
| `feedback.warning.uploadLeave` | Uploads em andamento serao interrompidos se voce sair da pagina. | beforeunload durante upload ativo |
| `feedback.warning.drainInProgress` | Migracao de dados em andamento. Nao feche esta janela. | Banner durante drain |
| `feedback.warning.nodeSuspect` | No "{{node_name}}" sem resposta ha {{time}}. Verificando... | Toast ao detectar suspect |
| `feedback.warning.spaceLow` | Espaco em disco baixo no no "{{node_name}}" ({{percent}}% usado). | Alerta no painel de nos |
| `feedback.info.uploadDuplicate` | "{{filename}}" ja existe no cluster. Espaco reutilizado. | Toast informativo (deduplicacao) |
| `feedback.info.processingQueue` | {{count}} arquivo(s) sendo processado(s)... | Status da fila de upload |
| `feedback.info.noResults` | Nenhum resultado encontrado | Busca sem resultados |
| `feedback.info.loading` | Carregando... | Estado de loading generico |
| `feedback.info.retrying` | Tentando novamente... | Retry automatico de upload |
| `feedback.info.autoHealed` | No "{{node_name}}" voltou ao ar. Alerta resolvido automaticamente. | Toast de auto-healing |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

### Sidebar

<!-- do blueprint: 07-routes.md (Itens da Sidebar) -->

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Item galeria | `global.sidebar.gallery` | Galeria |
| Item busca | `global.sidebar.search` | Busca |
| Item nos | `global.sidebar.nodes` | Nos |
| Item alertas | `global.sidebar.alerts` | Alertas |
| Item membros | `global.sidebar.members` | Membros |
| Item cluster | `global.sidebar.cluster` | Cluster |
| Item minha conta | `global.sidebar.settings` | Minha conta |
| Badge alertas ativos | `global.sidebar.alertsBadge` | {{count}} alertas |
| Aria sidebar | `global.sidebar.ariaLabel` | Navegacao principal |
| Tooltip colapsar | `global.sidebar.collapse` | Recolher menu |
| Tooltip expandir | `global.sidebar.expand` | Expandir menu |

<!-- APPEND:copies-sidebar -->

### Header

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Placeholder busca | `global.header.searchPlaceholder` | Buscar arquivos... |
| Aria busca | `global.header.searchAriaLabel` | Buscar no acervo |
| Aria alertas | `global.header.alertsAriaLabel` | Alertas — {{count}} ativos |
| Tooltip alertas | `global.header.alertsTooltip` | Ver alertas |
| Aria avatar | `global.header.avatarAriaLabel` | Menu do usuario |
| Menu minha conta | `global.header.profile` | Minha conta |
| Menu sair | `global.header.logout` | Sair |

<!-- APPEND:copies-header -->

### Upload Queue (Painel Flutuante)

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Titulo painel | `uploadQueue.title` | Uploads |
| Status na fila | `uploadQueue.status.queued` | Na fila |
| Status enviando | `uploadQueue.status.uploading` | Enviando... |
| Status processando | `uploadQueue.status.processing` | Processando... |
| Status concluido | `uploadQueue.status.done` | Concluido |
| Status falha | `uploadQueue.status.error` | Falha no envio |
| Botao retry | `uploadQueue.retryButton` | Tentar novamente |
| Botao cancelar | `uploadQueue.cancelButton` | Cancelar |
| Velocidade | `uploadQueue.speed` | {{speed}}/s |
| Todos concluidos | `uploadQueue.allDone` | Todos os arquivos enviados! |
| Fechar painel | `uploadQueue.close` | Fechar |

<!-- APPEND:copies-upload-queue -->

### Modais de Confirmacao

| Modal | Titulo | Corpo | CTA confirm | CTA cancel |
| --- | --- | --- | --- | --- |
| Remover membro | Remover membro | Tem certeza que deseja remover {{name}} do cluster? Ele perdera acesso imediatamente. | Remover | Cancelar |
| Desconectar no | Desconectar no | O no "{{node_name}}" sera desconectado. {{chunks}} chunks serao migrados para outros nos antes da remocao. | Desconectar | Cancelar |
| Confirmar seed | Confirmar seed phrase | Confirme que voce anotou as 12 palavras em local seguro. Sem elas, o sistema nao pode ser recuperado em caso de desastre. | Confirmar | Cancelar |
| Sair sem salvar | Descartar alteracoes? | Suas alteracoes nao foram salvas e serao perdidas. | Descartar | Voltar |
| Convidar como admin | Convidar como administrador? | Administradores podem gerenciar nos, membros e configuracoes do cluster. Tem certeza? | Confirmar | Cancelar |

<!-- APPEND:copies-modais -->

### Wizard AddNode — Copies por Passo

| Passo | Elemento | Texto |
| --- | --- | --- |
| Geral | Titulo modal | Adicionar no de armazenamento |
| 1 — Tipo | Titulo | Tipo do no |
| 1 — Tipo | Opcao local | Dispositivo local (PC, NAS) |
| 1 — Tipo | Opcao S3 | Amazon S3 |
| 1 — Tipo | Opcao R2 | Cloudflare R2 |
| 1 — Tipo | Opcao B2 | Backblaze B2 |
| 1 — Tipo | Opcao VPS | VPS / Servidor |
| 2 — Configuracao | Titulo | Configuracao |
| 2 — Configuracao | Label nome | Nome do no |
| 2 — Configuracao | Placeholder nome | Ex: R2 Cloudflare, NAS Sala |
| 2 — Configuracao | Label endpoint | Endpoint |
| 2 — Configuracao | Label access key | Access Key |
| 2 — Configuracao | Label secret key | Secret Key |
| 2 — Configuracao | Label bucket | Nome do bucket |
| 3 — Conectividade | Titulo | Teste de conectividade |
| 3 — Conectividade | Testando | Testando conexao... |
| 3 — Conectividade | Sucesso | Conexao estabelecida com sucesso |
| 3 — Conectividade | Falha | Falha na conexao. Verifique as credenciais. |
| 3 — Conectividade | Retry | Testar novamente |
| 4 — Confirmacao | Titulo | Confirmacao |
| 4 — Confirmacao | Capacidade | {{total}} disponiveis neste no |
| 4 — Confirmacao | CTA | Adicionar no |

<!-- APPEND:copies-add-node -->

### Empty States

| Tela/Secao | Titulo | Descricao | CTA |
| --- | --- | --- | --- |
| Galeria vazia | Nenhum arquivo ainda | Faca seu primeiro upload para comecar o acervo familiar. | Fazer upload |
| Busca sem resultado | Nenhum resultado para "{{query}}" | Tente ajustar os filtros ou usar outros termos. | Limpar filtros |
| Nos vazios | Nenhum no registrado | Adicione pelo menos 3 nos para comecar. | Adicionar no |
| Alertas sem resultado | Tudo funcionando | Nenhum alerta ativo no momento. | — |
| Membros (so admin) | Apenas voce por enquanto | Convide membros da familia para compartilhar o acervo. | Convidar membro |
| Convites pendentes | Nenhum convite pendente | — | — |
| Erro de carregamento | Nao foi possivel carregar | Verifique sua conexao e tente novamente. | Tentar novamente |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra em titulos | Criar cluster familiar | Criar Cluster Familiar |
| Use voz ativa | Envie suas fotos | Suas fotos devem ser enviadas |
| Maximo 60 caracteres em CTAs | Adicionar no de armazenamento | Clique aqui para adicionar um novo no de armazenamento ao cluster |
| Evite jargao tecnico para membros regulares | Arquivo temporariamente indisponivel | Erro 503: StorageProvider nao respondeu |
| Use jargao tecnico para admins quando necessario | 1.247 chunks em re-replicacao | Muitos dados sendo copiados |
| Use pontuacao em frases e descricoes completas | Adicione pelo menos 3 nos para comecar. | Adicione pelo menos 3 nos para comecar |
| Sem ponto final em labels, botoes e titulos | Adicionar no | Adicionar no. |
| Tooltips devem ser autoexplicativos | Enviar fotos, videos e documentos | Clique aqui |
| Numeros com separador de milhar | 1.247 chunks | 1247 chunks |
| Tamanhos de arquivo em unidade legivel | 4,2 GB, 350 KB | 4200000000 bytes |
| Datas relativas para recentes, absolutas para antigas | Ha 5 minutos / 15 de marco de 2024 | 2024-03-15T10:30:00Z |
| Empty states acolhedores — nao culpam o usuario | Nenhum arquivo ainda — faca seu primeiro upload | Voce nao enviou nenhum arquivo |
| Alertas criticos: diretos, sem dramatizar | No "MacBook do Douglas" sem resposta | ERRO CRITICO: FALHA CATASTROFICA |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-24 | Idioma unico pt-BR, sem i18n real por ora | Produto familiar com escopo fixo; estrutura de chaves preparada para expansao futura |
| 2026-03-24 | Tom familiar e direto, "voce" informal | Produto feito por membro da familia para a familia — formalidade seria inapropriada |
| 2026-03-24 | Jargao tecnico oculto para membros regulares, visivel para admins | Admin configura nos e entende "chunk"; membros precisam de linguagem simples |
| 2026-03-24 | "Nos" para todos os tipos de storage (local, cloud, VPS) | Termo do dominio (04-domain-model.md) — consistencia com o modelo tecnico |
| 2026-03-24 | "Acervo" para a colecao de arquivos | Alinhado com a identidade Alexandria (biblioteca) e ao perfil Guardiao de Memorias |
| 2026-03-24 | "Sem resposta" em vez de "suspect" para status de no | "Suspect" e jargao de sistema distribuido; "sem resposta" e imediatamente compreensivel |

<!-- APPEND:decisoes -->
