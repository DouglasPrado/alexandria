# Copies

Define todos os textos e conteudos textuais das telas do app mobile — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | pt-BR (Portugues Brasileiro) |
| Suporte i18n | Sim — `expo-localization` + `react-i18next` |
| Deteccao de idioma | Automatica via `expo-localization` (idioma do dispositivo); fallback pt-BR |
| Estrutura de chaves | `namespace.screen.element` — ex: `auth.login.submitButton` |
| Arquivos de traducao | `locales/pt-BR.json`, `locales/en-US.json` |
| Tom de voz | Caloroso e familiar — o app guarda memorias da familia; copy deve transmitir confianca e afeto sem ser informal demais |
| Pessoa gramatical | Voce (segunda pessoa singular) |
| Genero | Neutro quando possivel |

<!-- do blueprint: 00-context.md (Guardioes de Memorias, familia como ator principal) -->

<details>
<summary>Exemplo — Configuracao i18n com expo-localization</summary>

```typescript
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from '@/locales/pt-BR.json';
import enUS from '@/locales/en-US.json';

const deviceLocale = getLocales()[0]?.languageTag ?? 'pt-BR';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
  lng: deviceLocale,
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});
```

</details>

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo | Definicao | Nao usar |
| --- | --- | --- |
| Cluster | O grupo familiar de armazenamento (conjunto de nos + membros) | Projeto, Rede, Servidor |
| No (Node) | Dispositivo ou provedor cloud que armazena partes dos seus arquivos | Servidor, Maquina, Drive |
| Vault | Cofre criptografado pessoal de cada membro | Carteira, Chave, Cofre digital |
| Seed phrase | As 12 palavras que permitem recuperar o cluster | Senha de recuperacao, Chave mestra, Backup |
| Replica | Copia de seguranca de um fragmento de arquivo em um no diferente | Copia, Backup |
| Chunk | Fragmento criptografado de um arquivo (~4MB) — nao expor ao usuario | — (usar "fragmento" se precisar) |
| Manifest | Mapa dos fragmentos de um arquivo — nao expor ao usuario | — |
| Membro | Pessoa que faz parte do cluster familiar | Usuario, Participante, Colaborador |
| Administrador | Membro com permissao para gerenciar o cluster | Admin, Super usuario |
| Galeria | Acervo de fotos, videos e documentos do cluster | Biblioteca, Albuns, Arquivos |
| Fila de upload | Lista de arquivos aguardando envio para o cluster | Pendentes, Enviando |
| Liberacao de espaco | Substituir arquivos ja sincronizados por miniaturas para liberar espaco no celular | Limpeza, Compressao, Deletar |
| Miniaturas | Versoes menores (~50KB) de fotos e videos armazenados no cluster | Thumbnails, Previews |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Textos de cada tela conforme 07-routes.md (21 telas).

---

### Login

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.login.title` | Entrar no Alexandria | Heading principal |
| Subtitulo | `auth.login.subtitle` | Acesse as memorias da sua familia | Abaixo do titulo |
| Label email | `auth.login.emailLabel` | Email | Label do campo |
| Placeholder email | `auth.login.emailPlaceholder` | seu@email.com | Campo de email |
| Label senha | `auth.login.passwordLabel` | Senha | Label do campo |
| Placeholder senha | `auth.login.passwordPlaceholder` | Sua senha | Campo de senha |
| Botao submit | `auth.login.submitButton` | Entrar | CTA principal |
| Erro credenciais invalidas | `auth.login.errorInvalid` | Email ou senha incorretos | Inline error |
| Erro conta nao encontrada | `auth.login.errorNotFound` | Conta nao encontrada neste cluster | Inline error |

<!-- APPEND:copies-login -->

---

### Vault Unlock (Desbloqueio do Vault)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.vaultUnlock.title` | Desbloqueie seu vault | Heading principal |
| Subtitulo | `auth.vaultUnlock.subtitle` | Digite sua senha para acessar suas memorias | Abaixo do titulo |
| Label senha | `auth.vaultUnlock.passwordLabel` | Senha do vault | Label do campo |
| Placeholder | `auth.vaultUnlock.placeholder` | Sua senha | Campo de senha |
| Botao desbloquear | `auth.vaultUnlock.submitButton` | Desbloquear | CTA principal |
| Link esqueceu senha | `auth.vaultUnlock.forgotPassword` | Esqueceu a senha? Recupere com sua seed phrase | Link secundario |
| Erro senha incorreta | `auth.vaultUnlock.errorWrong` | Senha incorreta. Tente novamente. | Inline error |
| Aviso root/jailbreak | `auth.vaultUnlock.rootWarning` | Dispositivo comprometido. O vault nao pode ser desbloqueado por seguranca. | Alert critico |

---

### Seed Recovery — Auth (Recuperacao via Seed)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `auth.seedRecovery.title` | Recuperar acesso | Heading principal |
| Subtitulo | `auth.seedRecovery.subtitle` | Digite as 12 palavras da sua seed phrase para recuperar o acesso ao cluster | Instrucao |
| Instrucao | `auth.seedRecovery.instruction` | Digite as palavras na ordem correta, separadas por espaco | Hint abaixo dos campos |
| Label seed | `auth.seedRecovery.seedLabel` | Seed phrase (12 palavras) | Label do campo |
| Placeholder seed | `auth.seedRecovery.placeholder` | palavra1 palavra2 palavra3... | Campo de seed |
| Botao recuperar | `auth.seedRecovery.submitButton` | Recuperar acesso | CTA principal |
| Aviso seguranca | `auth.seedRecovery.securityWarning` | Sua seed phrase nunca e enviada para nenhum servidor. A recuperacao acontece localmente no seu dispositivo. | Banner informativo |
| Erro seed invalida | `auth.seedRecovery.errorInvalid` | Seed phrase incorreta. Verifique as palavras e a ordem. | Erro |
| Sucesso | `auth.seedRecovery.success` | Acesso recuperado com sucesso! | Toast de sucesso |

---

### Criar Cluster (Onboarding — Admin via Mobile)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `onboarding.createCluster.title` | Criar seu cluster familiar | Heading principal |
| Subtitulo | `onboarding.createCluster.subtitle` | O cluster e o espaco privado e criptografado da sua familia | Descricao |
| Label nome | `onboarding.createCluster.nameLabel` | Nome do cluster | Label do campo |
| Placeholder nome | `onboarding.createCluster.namePlaceholder` | Ex.: Familia Prado | Campo de nome |
| Aviso importante | `onboarding.createCluster.warning` | Na proxima etapa voce recebera 12 palavras secretas. Tenha papel e caneta prontos. | Banner amarelo |
| Botao criar | `onboarding.createCluster.submitButton` | Criar cluster | CTA principal |

---

### Seed Phrase Display (Exibir Seed Phrase — Onboarding)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `onboarding.seedPhrase.title` | Anote suas 12 palavras | Heading critico |
| Aviso urgente | `onboarding.seedPhrase.urgentWarning` | Esta e a UNICA vez que estas palavras serao exibidas. Anote em papel e guarde em local seguro. Voce precisara delas para recuperar o cluster se perder o acesso. | Banner vermelho |
| Instrucao de privacidade | `onboarding.seedPhrase.privacyHint` | Certifique-se de que ninguem esta vendo sua tela | Hint |
| Confirmacao checkbox | `onboarding.seedPhrase.confirmCheck` | Anotei as 12 palavras em papel e guardei em local seguro | Checkbox obrigatorio |
| Botao continuar | `onboarding.seedPhrase.continueButton` | Confirmar e continuar | CTA (habilitado apos marcar checkbox) |
| Aviso screenshot | `onboarding.seedPhrase.screenshotWarning` | Nao tire screenshot — sua seed phrase nao e salva e capturas podem ser acessadas por outros apps | Alert se screenshot detectado |

---

### Galeria (Gallery Screen — Tab Principal)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo da tab | `gallery.tabTitle` | Galeria | Tab bar |
| Titulo da tela | `gallery.title` | Galeria | Header |
| Busca placeholder | `gallery.searchPlaceholder` | Buscar fotos, videos... | SearchBar |
| Filtro: todos | `gallery.filter.all` | Todos | Chip de filtro |
| Filtro: fotos | `gallery.filter.photos` | Fotos | Chip de filtro |
| Filtro: videos | `gallery.filter.videos` | Videos | Chip de filtro |
| Filtro: documentos | `gallery.filter.documents` | Documentos | Chip de filtro |
| Modo grid | `gallery.viewMode.grid` | Grade | Botao de alternancia |
| Modo timeline | `gallery.viewMode.timeline` | Linha do tempo | Botao de alternancia |
| Empty state titulo | `gallery.empty.title` | Nenhuma foto ainda | Empty state |
| Empty state corpo | `gallery.empty.body` | Toque no + para fazer o primeiro upload para o cluster familiar | Empty state |
| Empty state CTA | `gallery.empty.cta` | Fazer upload | Botao no empty state |
| Busca sem resultado | `gallery.search.noResults` | Nenhum resultado para "{{termo}}" | Empty state de busca |
| Busca sem resultado dica | `gallery.search.noResultsHint` | Tente outros termos ou remova os filtros | Hint |
| Pull to refresh | `gallery.pullToRefresh` | Puxe para atualizar | Hint de gesto |
| Offline banner | `gallery.offlineBanner` | Modo offline — exibindo cache local | Banner |

<!-- APPEND:copies-gallery -->

---

### Timeline (Galeria por Data)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `gallery.timeline.title` | Linha do tempo | Header |
| Secao hoje | `gallery.timeline.today` | Hoje | Section header |
| Secao ontem | `gallery.timeline.yesterday` | Ontem | Section header |
| Secao mes/ano | `gallery.timeline.monthYear` | {{mes}} de {{ano}} | Section header dinamico |
| Carregando mais | `gallery.timeline.loadingMore` | Carregando mais... | Footer de lista |

---

### Photo Detail (Detalhe de Foto/Video)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Botao download | `fileDetail.downloadButton` | Baixar | Botao no header |
| Botao compartilhar | `fileDetail.shareButton` | Compartilhar | Botao no header |
| Botao opcoes | `fileDetail.optionsButton` | Opcoes | Botao no header (kebab) |
| Status processando | `fileDetail.status.processing` | Processando... | Badge de status |
| Status pronto | `fileDetail.status.ready` | Pronto | Badge (visivel apenas se necessario) |
| Status erro | `fileDetail.status.error` | Erro no processamento | Badge vermelho |
| Label tamanho | `fileDetail.meta.size` | Tamanho | Metadata sheet |
| Label data | `fileDetail.meta.date` | Data | Metadata sheet |
| Label tipo | `fileDetail.meta.type` | Tipo | Metadata sheet |
| Label camera | `fileDetail.meta.camera` | Camera | Metadata sheet (EXIF) |
| Label localizacao | `fileDetail.meta.location` | Localizacao | Metadata sheet (EXIF GPS) |
| Label replicas | `fileDetail.meta.replicas` | Replicas no cluster | Metadata sheet |
| Icone nuvem | `fileDetail.cloudBadge` | Armazenado no cluster | Tooltip do badge ☁ |
| Download success | `fileDetail.downloadSuccess` | Arquivo salvo no seu dispositivo | Toast |
| Download error | `fileDetail.downloadError` | Nao foi possivel baixar. Tente novamente. | Toast |
| Indisponivel | `fileDetail.unavailable` | Arquivo temporariamente indisponivel | Toast quando no offline |

---

### Upload Queue (Fila de Upload — Tab)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo da tab | `upload.tabTitle` | Envios | Tab bar |
| Titulo da tela | `upload.title` | Fila de upload | Header |
| Secao em fila | `upload.section.queued` | Aguardando | Section header |
| Secao enviando | `upload.section.uploading` | Enviando | Section header |
| Secao processando | `upload.section.processing` | Processando | Section header |
| Secao concluidos | `upload.section.done` | Concluidos | Section header |
| Secao com erro | `upload.section.error` | Com erro | Section header |
| Botao cancelar item | `upload.item.cancel` | Cancelar | Swipe action |
| Botao tentar novamente | `upload.item.retry` | Tentar novamente | Botao em item com erro |
| Status percentual | `upload.item.progress` | {{percent}}% | Percentual no item |
| Empty state titulo | `upload.empty.title` | Nenhum arquivo em fila | Empty state |
| Empty state corpo | `upload.empty.body` | Seus uploads aparecerao aqui | Empty state |
| Sync ativo badge | `upload.syncActive` | Sync ativo | Badge verde |
| Sync pausado badge | `upload.syncPaused` | Sync pausado | Badge cinza |
| Nós insuficientes | `upload.error.nodesInsufficient` | Armazenamento indisponivel no cluster | Toast de erro |
| Cluster sem espaco | `upload.error.clusterFull` | Cluster sem espaco. Fale com o administrador. | Toast de erro |

---

### Sync Settings (Configuracoes de Sync)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `upload.syncSettings.title` | Sincronizacao automatica | Header |
| Toggle sync | `upload.syncSettings.syncToggle` | Sincronizar novas fotos automaticamente | Label do toggle |
| Toggle wifi only | `upload.syncSettings.wifiOnly` | Somente em Wi-Fi | Label do toggle |
| Toggle wifi hint | `upload.syncSettings.wifiOnlyHint` | Economiza dados moveis | Hint abaixo do toggle |
| Label frequencia | `upload.syncSettings.frequency` | Frequencia de verificacao | Label da selecao |
| Opcao 15min | `upload.syncSettings.freq15` | A cada 15 minutos | Opcao |
| Opcao 30min | `upload.syncSettings.freq30` | A cada 30 minutos | Opcao |
| Opcao 1h | `upload.syncSettings.freq1h` | A cada hora | Opcao |
| Salvo | `upload.syncSettings.saved` | Configuracoes salvas | Toast |

---

### Space Release (Liberacao de Espaco)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `upload.spaceRelease.title` | Liberar espaco | Header |
| Subtitulo | `upload.spaceRelease.subtitle` | Substitua arquivos ja sincronizados por miniaturas | Descricao |
| Espaco disponivel | `upload.spaceRelease.available` | Voce pode liberar ate {{size}} | Destaque |
| Secao elegivel | `upload.spaceRelease.eligible` | Prontos para liberar | Section |
| Hint 3 replicas | `upload.spaceRelease.replicaHint` | Apenas arquivos com 3+ replicas confirmadas | Hint informativo |
| Botao liberar | `upload.spaceRelease.releaseButton` | Liberar {{size}} | CTA principal |
| Confirmacao titulo | `upload.spaceRelease.confirmTitle` | Liberar espaco? | Alert title |
| Confirmacao corpo | `upload.spaceRelease.confirmBody` | {{count}} arquivos serao substituidos por miniaturas. Voce pode baixar os originais a qualquer momento. | Alert body |
| Confirmacao CTA | `upload.spaceRelease.confirmCta` | Liberar | Botao no alert |
| Progresso | `upload.spaceRelease.progress` | Liberando espaco... {{current}}/{{total}} arquivos | Barra de progresso |
| Sucesso titulo | `upload.spaceRelease.successTitle` | Espaco liberado! | Titulo da tela de resultado |
| Sucesso corpo | `upload.spaceRelease.successBody` | {{size}} liberados — {{count}} arquivos convertidos para miniatura | Corpo do resultado |
| Aguardando replicas | `upload.spaceRelease.waitingReplicas` | {{count}} arquivos aguardando replicacao completa | Toast informativo |
| Erro permissao | `upload.spaceRelease.errorPermission` | Permita acesso a galeria nas Configuracoes para liberar espaco | Alert |
| Auto-release toggle | `upload.spaceRelease.autoToggle` | Liberacao automatica | Toggle label |
| Auto-release threshold | `upload.spaceRelease.threshold` | Liberar quando disco atingir {{percent}}% | Label do slider |
| Notificacao automatica | `upload.spaceRelease.autoNotification` | {{size}} liberados automaticamente. Seus arquivos estao seguros no cluster. | Push notification |

---

### Cluster Dashboard (Tab)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo da tab | `cluster.tabTitle` | Cluster | Tab bar |
| Titulo da tela | `cluster.dashboard.title` | {{nomeDoCluster}} | Header dinamico |
| Card saude titulo | `cluster.dashboard.healthTitle` | Saude do cluster | Card title |
| Status saudavel | `cluster.dashboard.statusHealthy` | Cluster saudavel | Status label verde |
| Status degradado | `cluster.dashboard.statusDegraded` | Atencao necessaria | Status label amarelo |
| Status critico | `cluster.dashboard.statusCritical` | Acao urgente necessaria | Status label vermelho |
| Nos online | `cluster.dashboard.nodesOnline` | {{count}} nos ativos | Metrica |
| Replicacao ok | `cluster.dashboard.replication` | {{percent}}% dos arquivos replicados | Metrica |
| Espaco usado | `cluster.dashboard.storageUsed` | {{used}} de {{total}} usados | Metrica |
| Membros | `cluster.dashboard.members` | {{count}} membros | Metrica |
| Botao ver alertas | `cluster.dashboard.viewAlerts` | Ver alertas ({{count}}) | CTA com badge |
| Empty nos | `cluster.dashboard.emptyNodes` | Nenhum no registrado ainda | Empty state |
| Empty nos CTA | `cluster.dashboard.emptyNodesCta` | Adicionar no | CTA (admin only) |

---

### Members (Membros)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `cluster.members.title` | Membros | Header |
| Label role admin | `cluster.members.roleAdmin` | Administrador | Role badge |
| Label role membro | `cluster.members.roleMember` | Membro | Role badge |
| Label role leitura | `cluster.members.roleReader` | Somente leitura | Role badge |
| Label entrou em | `cluster.members.joinedAt` | Entrou em {{date}} | Metadata |
| Botao convidar | `cluster.members.inviteButton` | Convidar | CTA (admin only) |
| Remover membro | `cluster.members.remove` | Remover do cluster | Acao destrutiva (admin only) |
| Confirmar remocao titulo | `cluster.members.removeConfirmTitle` | Remover {{nome}}? | Alert title |
| Confirmar remocao corpo | `cluster.members.removeConfirmBody` | {{nome}} perdera acesso ao cluster e a todas as memorias da familia. | Alert body |
| Empty state | `cluster.members.empty` | Nenhum membro ainda | Empty state |

---

### Invite Member (Convidar Membro — Admin)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `cluster.invite.title` | Convidar membro | Header da sheet |
| Label email | `cluster.invite.emailLabel` | Email do convidado | Label |
| Placeholder email | `cluster.invite.emailPlaceholder` | email@exemplo.com | Campo |
| Label role | `cluster.invite.roleLabel` | Nivel de acesso | Label |
| Opcao membro | `cluster.invite.roleMember` | Membro — pode fazer upload e visualizar | Opcao |
| Opcao leitura | `cluster.invite.roleReader` | Somente leitura — apenas visualiza | Opcao |
| Opcao admin | `cluster.invite.roleAdmin` | Administrador — gerencia cluster e nos | Opcao |
| Aviso admin | `cluster.invite.adminWarning` | Administradores tem acesso total ao cluster. Certifique-se antes de conceder. | Aviso inline ao selecionar admin |
| Botao gerar convite | `cluster.invite.submitButton` | Gerar link de convite | CTA |
| Link gerado titulo | `cluster.invite.linkTitle` | Link de convite gerado | Titulo do resultado |
| Link gerado instrucao | `cluster.invite.linkInstruction` | Compartilhe este link com {{nome}}. Expira em 7 dias. | Instrucao |
| Botao copiar link | `cluster.invite.copyLink` | Copiar link | CTA secundario |
| Botao compartilhar | `cluster.invite.shareLink` | Compartilhar | CTA principal |
| Link copiado | `cluster.invite.linkCopied` | Link copiado! | Toast |
| Erro email duplicado | `cluster.invite.errorDuplicate` | Este email ja faz parte do cluster | Erro inline |
| Expiracao | `cluster.invite.expiry` | Expira em {{date}} | Info na tela de link |

---

### Alerts (Alertas)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `cluster.alerts.title` | Alertas | Header |
| Filtro: todos | `cluster.alerts.filterAll` | Todos | Chip |
| Filtro: criticos | `cluster.alerts.filterCritical` | Criticos | Chip |
| Filtro: avisos | `cluster.alerts.filterWarning` | Avisos | Chip |
| Filtro: info | `cluster.alerts.filterInfo` | Informativo | Chip |
| Swipe resolver | `cluster.alerts.swipeResolve` | Resolver | Acao de swipe |
| Badge resolvido | `cluster.alerts.resolved` | Resolvido | Badge verde |
| Badge auto-resolvido | `cluster.alerts.autoResolved` | Auto-resolvido | Badge azul |
| Acao ver no | `cluster.alerts.viewNode` | Ver no | Botao em alerta de no |
| Empty state | `cluster.alerts.empty` | Nenhum alerta ativo | Empty state (boas noticias!) |
| Empty state body | `cluster.alerts.emptyBody` | Seu cluster esta saudavel | Subtexto do empty state |

**Textos de alertas por tipo:**

| Tipo | Titulo | Corpo |
| --- | --- | --- |
| No lost | No perdido | "{{nomeNo}} esta sem resposta ha mais de 1 hora. Auto-healing iniciado." |
| No suspect | No instavel | "{{nomeNo}} esta com heartbeat atrasado. Monitorando." |
| Chunk irrecuperavel | Dados em risco | "Fragmentos sem replica saudavel. Acao imediata necessaria." |
| Replicacao baixa | Replicacao degradada | "{{count}} arquivos com menos de 3 replicas no momento." |
| Espaco baixo | Espaco acabando | "No {{nomeNo}} esta com {{percent}}% do espaco usado." |
| Token expirado | Credencial expirada | "As credenciais do no {{nomeNo}} expiraram. Reautentique." |

---

### Nodes (Nos — Admin)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.list.title` | Nos de armazenamento | Header |
| Status online | `nodes.status.online` | Online | Badge verde |
| Status suspect | `nodes.status.suspect` | Instavel | Badge amarelo |
| Status lost | `nodes.status.lost` | Perdido | Badge vermelho |
| Status draining | `nodes.status.draining` | Drenando | Badge azul |
| Label capacidade | `nodes.item.capacity` | {{used}} de {{total}} | Metrica |
| Label ultimo heartbeat | `nodes.item.lastHeartbeat` | Ultimo heartbeat: {{tempo}} | Metrica |
| Botao adicionar | `nodes.list.addButton` | Adicionar no | CTA (admin only) |
| Empty state | `nodes.list.empty` | Nenhum no registrado | Empty state |
| Empty state CTA | `nodes.list.emptyCta` | Adicionar primeiro no | CTA |

---

### Node Detail (Detalhe do No — Admin)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.detail.title` | {{nomeNo}} | Header dinamico |
| Secao info | `nodes.detail.sectionInfo` | Informacoes | Section header |
| Label tipo | `nodes.detail.type` | Tipo | Label |
| Label capacidade total | `nodes.detail.totalCapacity` | Capacidade total | Label |
| Label espaco usado | `nodes.detail.usedSpace` | Espaco usado | Label |
| Label chunks | `nodes.detail.chunks` | Fragmentos armazenados | Label |
| Secao heartbeats | `nodes.detail.sectionHeartbeats` | Historico de heartbeats | Section header |
| Botao desconectar | `nodes.detail.disconnectButton` | Desconectar no | Botao destrutivo |
| Confirmacao drain titulo | `nodes.detail.drainConfirmTitle` | Desconectar {{nomeNo}}? | Alert title |
| Confirmacao drain corpo | `nodes.detail.drainConfirmBody` | Os arquivos serao migrados para outros nos antes da remocao. Isso pode levar alguns minutos. | Alert body |
| Progresso drain | `nodes.detail.drainProgress` | Migrando arquivos... {{percent}}% concluido | Progresso inline |
| Drain concluido | `nodes.detail.drainDone` | No desconectado com sucesso | Toast |
| Erro nos insuficientes | `nodes.detail.errorMinNodes` | Nao e possivel remover — minimo de 3 nos necessario | Alert de erro |

---

### Register Node (Registrar No — Admin)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `nodes.register.title` | Adicionar no | Header da sheet |
| Step tipo | `nodes.register.stepType` | Escolha o tipo | Step 1 |
| Tipo local | `nodes.register.typeLocal` | PC / NAS local | Opcao |
| Tipo S3 | `nodes.register.typeS3` | Amazon S3 | Opcao |
| Tipo R2 | `nodes.register.typeR2` | Cloudflare R2 | Opcao |
| Tipo B2 | `nodes.register.typeB2` | Backblaze B2 | Opcao |
| Step credenciais | `nodes.register.stepCredentials` | Configure as credenciais | Step 2 |
| Label nome | `nodes.register.nameLabel` | Nome descritivo | Label |
| Placeholder nome | `nodes.register.namePlaceholder` | Ex.: NAS-Sala, S3-Backup | Campo |
| Label endpoint | `nodes.register.endpointLabel` | Endpoint | Label (S3/R2/B2) |
| Label bucket | `nodes.register.bucketLabel` | Bucket | Label |
| Label access key | `nodes.register.accessKeyLabel` | Access Key ID | Label |
| Label secret key | `nodes.register.secretKeyLabel` | Secret Access Key | Label |
| Step teste | `nodes.register.stepTest` | Testando conexao... | Step 3 |
| Teste sucesso | `nodes.register.testSuccess` | Conexao bem-sucedida! Capacidade: {{size}} | Resultado |
| Teste falha | `nodes.register.testFail` | Falha na conexao. Verifique as credenciais. | Resultado |
| Botao registrar | `nodes.register.submitButton` | Registrar no | CTA final |
| No registrado | `nodes.register.success` | No adicionado ao cluster! | Toast |
| Instrucao agente local | `nodes.register.localInstruction` | Instale o agente Alexandria no seu PC ou NAS. O no se registrara automaticamente. | Instrucao para tipo local |

---

### Settings (Configuracoes — Tab)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo da tab | `settings.tabTitle` | Ajustes | Tab bar |
| Titulo da tela | `settings.title` | Configuracoes | Header |
| Secao conta | `settings.sectionAccount` | Conta | Section header |
| Secao armazenamento | `settings.sectionStorage` | Armazenamento | Section header |
| Secao aparencia | `settings.sectionAppearance` | Aparencia | Section header |
| Secao seguranca | `settings.sectionSecurity` | Seguranca | Section header |
| Secao sobre | `settings.sectionAbout` | Sobre | Section header |
| Item perfil | `settings.itemProfile` | Perfil | Item |
| Item notificacoes | `settings.itemNotifications` | Notificacoes | Item |
| Item sync | `settings.itemSync` | Sincronizacao automatica | Item |
| Item espaco | `settings.itemStorage` | Armazenamento e espaco | Item |
| Item tema | `settings.itemTheme` | Tema | Item |
| Tema claro | `settings.themeLight` | Claro | Opcao |
| Tema escuro | `settings.themeDark` | Escuro | Opcao |
| Tema sistema | `settings.themeSystem` | Seguir o sistema | Opcao |
| Item recovery | `settings.itemRecovery` | Recuperacao do cluster | Item (admin only) |
| Item versao | `settings.itemVersion` | Versao | Item |
| Botao sair | `settings.logoutButton` | Sair da conta | Botao destrutivo |
| Confirmar saida | `settings.logoutConfirm` | Voce precisara do seu email e senha para entrar novamente. Sair? | Alert |

---

### Profile (Perfil do Membro)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `settings.profile.title` | Perfil | Header |
| Label nome | `settings.profile.nameLabel` | Seu nome | Label |
| Label email | `settings.profile.emailLabel` | Email | Label (readonly) |
| Label role | `settings.profile.roleLabel` | Funcao no cluster | Label |
| Label entrou em | `settings.profile.joinedAt` | Membro desde {{date}} | Info |
| Botao salvar | `settings.profile.saveButton` | Salvar alteracoes | CTA |
| Salvo | `settings.profile.saved` | Perfil atualizado | Toast |

---

### Notification Settings (Configuracoes de Notificacao)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `settings.notifications.title` | Notificacoes | Header |
| Toggle principal | `settings.notifications.masterToggle` | Receber notificacoes | Toggle principal |
| Secao alertas | `settings.notifications.sectionAlerts` | Alertas do cluster | Section (admin) |
| Toggle no perdido | `settings.notifications.nodeLost` | No perdido | Toggle |
| Toggle replicacao baixa | `settings.notifications.replication` | Replicacao baixa | Toggle |
| Toggle espaco baixo | `settings.notifications.lowSpace` | Espaco acabando | Toggle |
| Secao upload | `settings.notifications.sectionUpload` | Upload e sync | Section |
| Toggle sync concluido | `settings.notifications.syncDone` | Sync automatico concluido | Toggle |
| Toggle upload error | `settings.notifications.uploadError` | Erro no upload | Toggle |
| Solicitar permissao | `settings.notifications.requestPermission` | Permita notificacoes para receber alertas do cluster | Banner |
| Abrir ajustes | `settings.notifications.openSettings` | Abrir Configuracoes | CTA do banner |

---

### Seed Recovery — Settings (Admin)

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | `settings.recovery.title` | Recuperacao do cluster | Header |
| Aviso | `settings.recovery.warning` | Use apenas se o Orquestrador precisar ser reinstalado em nova VPS. | Banner amarelo |
| Instrucao | `settings.recovery.instruction` | Voce precisara das 12 palavras da seed phrase para recuperar o acesso ao cluster. | Instrucao |
| Botao iniciar | `settings.recovery.startButton` | Iniciar recuperacao | CTA (abre SeedRecoveryScreen) |

---

## Mensagens de Feedback

> Mensagens de sucesso, erro, validacao, aviso e informacao do app Alexandria.

### Sucesso

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.success.uploadComplete` | Arquivo enviado com sucesso! | Toast apos upload concluido |
| `feedback.success.syncComplete` | {{count}} fotos sincronizadas com o cluster | Push notification de sync automatico |
| `feedback.success.inviteCreated` | Link de convite gerado | Toast apos criar convite |
| `feedback.success.memberRemoved` | Membro removido do cluster | Toast |
| `feedback.success.nodeRegistered` | No adicionado ao cluster! | Toast |
| `feedback.success.nodeDrained` | No desconectado com sucesso | Toast |
| `feedback.success.alertResolved` | Alerta marcado como resolvido | Toast |
| `feedback.success.spaceReleased` | {{size}} liberados com sucesso! | Toast + tela de resultado |
| `feedback.success.settingsSaved` | Configuracoes salvas | Toast |
| `feedback.success.linkCopied` | Link copiado! | Toast |
| `feedback.success.downloaded` | Arquivo salvo no seu dispositivo | Toast |
| `feedback.success.vaultUnlocked` | Vault desbloqueado | (silencioso — apenas navega) |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.error.generic` | Algo deu errado. Tente novamente. | Fallback generico |
| `feedback.error.network` | Sem conexao. Verifique sua rede. | Toast + banner offline persistente |
| `feedback.error.unauthorized` | Sessao expirada. Faca login novamente. | Toast em 401 |
| `feedback.error.forbidden` | Voce nao tem permissao para esta acao. | Toast em 403 |
| `feedback.error.notFound` | Arquivo nao encontrado no cluster. | Toast em 404 |
| `feedback.error.vaultWrong` | Senha incorreta. Tente novamente. | Inline no VaultUnlockForm |
| `feedback.error.seedInvalid` | Seed phrase invalida. Verifique as palavras e a ordem. | Inline no SeedRecoveryForm |
| `feedback.error.inviteExpired` | Convite expirado. Solicite novo convite ao administrador. | Tela de convite |
| `feedback.error.inviteInvalid` | Convite invalido ou ja utilizado. | Tela de convite |
| `feedback.error.uploadFailed` | Falha no upload. Tente novamente. | Item na fila de upload |
| `feedback.error.nodesInsufficient` | Armazenamento indisponivel. O cluster precisa de ao menos 3 nos ativos. | Toast |
| `feedback.error.clusterFull` | O cluster esta sem espaco. Fale com o administrador. | Toast |
| `feedback.error.cannotRemoveNode` | Nao e possivel remover — minimo de 3 nos necessario para replicacao. | Alert |
| `feedback.error.permissionCamera` | Permita acesso a camera nas Configuracoes do dispositivo. | Alert com botao Abrir Ajustes |
| `feedback.error.permissionGallery` | Permita acesso a galeria nas Configuracoes do dispositivo. | Alert com botao Abrir Ajustes |
| `feedback.error.permissionNotifications` | Ative as notificacoes nas Configuracoes para receber alertas do cluster. | Banner |
| `feedback.error.fileUnavailable` | Arquivo temporariamente indisponivel. Tentando replica alternativa... | Toast |
| `feedback.error.rootDetected` | Dispositivo comprometido. O vault nao pode ser desbloqueado por seguranca. | Alert critico |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| `validation.required` | Campo obrigatorio | Campo vazio no submit |
| `validation.email` | Email invalido | Formato incorreto de email |
| `validation.minLength` | Minimo de {{min}} caracteres | Texto curto demais |
| `validation.maxLength` | Maximo de {{max}} caracteres | Texto longo demais |
| `validation.seedWords` | A seed phrase deve ter exatamente 12 palavras | Seed com numero errado de palavras |
| `validation.seedWordInvalid` | Palavra "{{word}}" nao e valida na wordlist BIP-39 | Palavra fora da lista |
| `validation.clusterNameRequired` | Informe um nome para o cluster | Nome do cluster vazio |
| `validation.nodeNameRequired` | Informe um nome descritivo para o no | Nome do no vazio |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| `feedback.warning.rootJailbreak` | Dispositivo comprometido detectado. Por seguranca, o vault permanece bloqueado. | Alert permanente |
| `feedback.warning.uploadPaused` | Uploads pausados — sem conexao | Banner sobre a fila |
| `feedback.warning.uploadResumed` | Conexao restaurada. Retomando uploads... | Toast |
| `feedback.warning.syncDisabledNetwork` | Sync automatico pausado (sem Wi-Fi) | Toast quando perde Wi-Fi com wifiOnly ativo |
| `feedback.info.offline` | Modo offline — exibindo cache local | Banner persistente ao perder conexao |
| `feedback.info.reconnected` | Conexao restaurada | Toast ao reconectar |
| `feedback.info.loading` | Carregando... | Estado de loading generico |
| `feedback.info.noResults` | Nenhum resultado encontrado | Busca vazia |
| `feedback.info.otaUpdating` | Atualizando app... | Durante OTA update |
| `feedback.info.otaUpdated` | App atualizado! | Toast apos OTA |
| `feedback.info.fileProcessing` | Seu arquivo esta sendo processado no cluster | Toast apos upload quando status ainda e processing |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Tab Bar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Tab Galeria | `global.tabBar.gallery` | Galeria |
| Tab Upload | `global.tabBar.upload` | Envios |
| Tab Cluster | `global.tabBar.cluster` | Cluster |
| Tab Ajustes | `global.tabBar.settings` | Ajustes |

<!-- APPEND:copies-tabbar -->

### Header

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Botao Voltar | `global.header.back` | Voltar |
| Busca placeholder | `global.header.searchPlaceholder` | Buscar... |
| Botao cancelar | `global.header.cancel` | Cancelar |
| Botao fechar | `global.header.close` | Fechar |

<!-- APPEND:copies-header -->

### Permissoes

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| Camera — titulo | `permissions.camera.title` | Acesso a camera |
| Camera — descricao | `permissions.camera.description` | Permita o acesso a camera para fotografar e enviar diretamente para o cluster familiar |
| Galeria — titulo | `permissions.gallery.title` | Acesso a galeria |
| Galeria — descricao | `permissions.gallery.description` | Permita o acesso a galeria para selecionar e sincronizar suas fotos e videos com o cluster |
| Notificacoes — titulo | `permissions.notifications.title` | Notificacoes |
| Notificacoes — descricao | `permissions.notifications.description` | Receba alertas quando um no ficar offline ou um arquivo precisar de atencao |
| Botao permitir | `permissions.allowButton` | Permitir |
| Botao negar | `permissions.denyButton` | Agora nao |
| Botao abrir ajustes | `permissions.openSettings` | Abrir Ajustes |

<!-- APPEND:copies-permissoes -->

### Alertas e Dialogs Genericos

| Alert | Titulo | Corpo | CTA confirmar | CTA cancelar |
| --- | --- | --- | --- | --- |
| Confirmar exclusao | Remover arquivo? | Este arquivo sera removido do cluster. Esta acao nao pode ser desfeita. | Remover | Cancelar |
| Sair sem salvar | Descartar alteracoes? | As alteracoes feitas nao serao salvas. | Descartar | Continuar editando |
| OTA disponivel | Atualizacao disponivel | Uma nova versao do app esta disponivel. Atualize para manter a seguranca e o desempenho. | Atualizar agora | Depois |
| OTA obrigatoria | Atualizacao necessaria | Para continuar usando o app, atualize para a versao mais recente. | Atualizar agora | — |
| Confirmar admin | Conceder acesso de administrador? | Administradores podem gerenciar nos, membros e configuracoes do cluster. Tem certeza? | Confirmar | Cancelar |

<!-- APPEND:copies-alertas -->

### Empty States

| Tela / Secao | Titulo | Corpo | CTA |
| --- | --- | --- | --- |
| Galeria vazia | Nenhuma foto ainda | Toque no + para fazer o primeiro upload para o cluster familiar | Fazer upload |
| Busca sem resultado | Nenhum resultado | Tente outros termos ou remova os filtros | Limpar filtros |
| Fila de upload vazia | Tudo sincronizado! | Novos uploads aparecerao aqui | — |
| Alertas — sem alertas | Tudo em ordem | Seu cluster esta saudavel e funcionando | — |
| Membros — sem membros | Nenhum membro ainda | Convide sua familia para comecar | Convidar (admin) |
| Nos — sem nos | Nenhum no registrado | Adicione um no para comecar a armazenar seus arquivos | Adicionar no (admin) |
| Erro de carregamento | Nao foi possivel carregar | Verifique sua conexao e tente novamente | Tentar novamente |
| Modo offline | Modo offline | Exibindo dados em cache. Voce esta sem conexao com o cluster. | — |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Regras de escrita a seguir em toda a interface.

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra em titulos | Fazer upload de foto | Fazer Upload De Foto |
| Use voz ativa e direta | Salve suas memorias | Suas memorias devem ser salvas |
| CTAs mobile: maximo 30 caracteres | Liberar espaco | Toque aqui para liberar espaco no dispositivo |
| Evite jargao tecnico nos erros | Algo deu errado. Tente novamente. | Erro 503: Service Unavailable |
| Use pontuacao em frases completas | Arquivo salvo com sucesso. | Arquivo salvo com sucesso |
| Nao use ponto final em labels e botoes | Fazer upload | Fazer upload. |
| Adapte o texto a tela pequena mobile | Sincronizado | Arquivo sincronizado com sucesso com o cluster |
| Textos de permissao explicam o motivo | Permita o acesso a galeria para sincronizar suas fotos | Permitir acesso a galeria |
| Mensagens de erro orientam a proxima acao | Tente novamente ou verifique sua conexao | Erro desconhecido |
| Seed phrase: sempre "12 palavras", nunca "chave" | Suas 12 palavras de recuperacao | Sua chave de recuperacao |
| Cluster: produto com identidade propria, maiusculo | Cluster | cluster, rede, servidor |
| Tom caloroso para contexto familiar | Suas memorias estao seguras | Dados armazenados com sucesso |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-24 | pt-BR como idioma padrao com suporte a en-US | Produto focado inicialmente no mercado brasileiro; i18n preparado para expansao sem refatoracao |
| 2026-03-24 | Tom caloroso e familiar em vez de tecnico | O produto guarda memorias de familia — linguagem fria ou tecnica desalinharia com o proposito emocional do produto |
| 2026-03-24 | "Vault" mantido em ingles (sem traducao) | Termo tecnico de dominio (cofre criptografico) com conotacao de seguranca que se perde na traducao "cofre"; mantido como termo de produto |
| 2026-03-24 | Seed phrase nunca descrita como "senha" ou "chave" | Evitar confusao com senhas comuns — seed phrase tem importancia unica e irreversivel; copy reforca isso com linguagem propria |

<!-- APPEND:decisoes -->
