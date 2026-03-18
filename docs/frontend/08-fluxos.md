# Fluxos de Interface

Documenta os fluxos criticos de interacao do usuario com o frontend. Cada fluxo mostra o caminho do usuario, os componentes envolvidos e os pontos de decisao/erro. Esses fluxos sao a base para testes E2E e validacao de requisitos.

---

## Fluxos Criticos

> Quais sao os 3-5 fluxos mais importantes da aplicacao?

| # | Fluxo | Atores | Criticidade |
|---|-------|--------|-------------|
| 1 | Onboarding — Criacao de Cluster e Convite de Membros | Administrador Familiar | Alta |
| 2 | Upload e Pipeline de Processamento de Midia | Membro Familiar, Fotografo Amador | Alta |
| 3 | Galeria e Visualizacao de Arquivos | Membro Familiar, Guardiao de Memorias | Alta |
| 4 | Registro e Gerenciamento de Nos de Armazenamento | Administrador Familiar | Alta |
| 5 | Recuperacao do Sistema via Seed Phrase | Administrador Familiar | Alta |

---

### Fluxo 1: Onboarding — Criacao de Cluster e Convite de Membros

> O administrador familiar cria o cluster, recebe a seed phrase de 12 palavras, e convida membros da familia para participarem do sistema.

**Passos:**

1. Admin acessa a pagina inicial e clica em "Criar Cluster Familiar"
2. Sistema gera o par de chaves criptograficas e o `cluster_id`
3. Sistema exibe a seed phrase de 12 palavras com instrucoes de backup seguro
4. Admin confirma que anotou a seed phrase (checkbox obrigatorio + campo de verificacao com 3 palavras aleatorias)
5. Admin define seu nome e senha para criar seu vault pessoal
6. Sistema cria o vault criptografado do admin e redireciona ao dashboard
7. Admin acessa "Convidar Membro" e gera um token de convite com expiracao
8. Membro recebe o link, acessa a pagina de convite, define nome e senha
9. Sistema cria o vault do membro e o adiciona ao cluster com permissao "membro"
10. Membro e redirecionado ao dashboard com acesso a galeria (upload integrado na galeria e sync automatico)

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| ClusterCreateWizard | Wizard multi-step de criacao do cluster |
| SeedPhraseDisplay | Exibe as 12 palavras com opcao de copiar e instrucoes de seguranca |
| SeedPhraseVerification | Solicita 3 palavras aleatorias para confirmar anotacao |
| VaultSetupForm | Captura nome e senha do membro para criar vault |
| InviteMemberDialog | Gera e exibe token/link de convite com expiracao configuravel |
| InviteAcceptPage | Pagina publica para aceitar convite e criar conta |
| ErrorToast | Exibe erros de validacao e falhas de rede |

**Tratamento de Erros:**

- Seed phrase nao confirmada corretamente → Exibe alerta inline indicando palavras incorretas; nao permite avancar
- Token de convite expirado → Pagina de convite exibe mensagem clara com orientacao para solicitar novo convite ao admin
- Falha na criacao do vault (erro de rede/servidor) → Toast de erro com botao de retry; dados do formulario preservados
- Tentativa de criar cluster com servidor offline → Mensagem de indisponibilidade com sugestao de verificar conexao

> Diagrama: [fluxo-1-onboarding.mmd](../diagrams/frontend/fluxo-1-onboarding.mmd)

---

### Fluxo 2: Upload e Pipeline de Processamento de Midia

> O membro envia fotos ou videos (manualmente ou via sync automatico). O frontend mostra o progresso do pipeline: analise, otimizacao, criptografia, distribuicao e confirmacao de replicacao.

**Passos:**

1. Membro arrasta arquivos para a area de upload na galeria ou clica em "Enviar Arquivos"
2. Frontend valida tipo e tamanho dos arquivos (formatos suportados: fotos — JPEG, PNG, HEIC; videos — MP4, MOV; documentos — PDF, DOCX, XLSX, PPTX, TXT, MD, JSON, SQL, CSV, XML, ZIP, RAR, 7Z e outros). Limites: fotos ate 50MB, videos ate 10GB, documentos ate 2GB, archives ate 5GB
3. Sistema inicia o pipeline — status muda para "Analisando"
4. Pipeline otimiza midia (foto → WebP Full HD; video → 1080p H.265/AV1) — status "Otimizando"
5. Sistema gera thumbnail/preview — status "Gerando Preview"
6. Chunks sao criptografados e distribuidos — status "Criptografando e Distribuindo"
7. Replicacao atingida (3 copias) — status "Concluido" com check verde
8. Arquivo aparece na galeria com thumbnail disponivel imediatamente
9. Barra de progresso global mostra status de todos os uploads em andamento

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| UploadDropzone | Area de drag-and-drop e selecao de arquivos |
| UploadQueue | Lista de arquivos com progresso individual e status do pipeline |
| UploadProgressBar | Barra de progresso global com contagem de arquivos pendentes/concluidos |
| PipelineStatusBadge | Badge colorido indicando etapa atual (analisando, otimizando, distribuindo, concluido) |
| FileTypeValidator | Valida formato e tamanho antes de iniciar upload |
| ErrorToast | Exibe erros de upload e falhas de processamento |

**Tratamento de Erros:**

- Arquivo em formato nao suportado → Mensagem inline na fila de upload indicando formatos aceitos; arquivo removido da fila
- Falha de rede durante upload → Retry automatico com backoff; usuario ve icone de "pausado" com opcao de cancelar ou tentar novamente
- Pipeline de otimizacao falha (ex: video corrompido) → Item marcado com icone de erro e mensagem descritiva; opcao de remover ou tentar novamente
- Replicacao nao atingida (menos de 3 copias) → Badge amarelo "Replicacao pendente" com tooltip explicativo; resolve automaticamente quando nos ficam online

> Diagrama: [fluxo-2-upload.mmd](../diagrams/frontend/fluxo-2-upload.mmd)

---

### Fluxo 3: Galeria e Visualizacao de Arquivos

> O membro navega pela galeria cronologica de fotos e videos da familia, visualiza previews instantaneos e solicita download sob demanda de versoes em qualidade total.

**Passos:**

1. Membro acessa a galeria — sistema carrega thumbnails organizados por data (mais recentes primeiro)
2. Galeria exibe grid responsivo com thumbnails (~50KB) carregados via lazy loading
3. Membro pode filtrar por data, tipo de arquivo ou buscar por nome/tags
4. Ao clicar em uma foto, abre o lightbox com preview em resolucao maior
5. Membro pode navegar entre fotos no lightbox (setas ou swipe)
6. Para obter a versao otimizada completa, membro clica em "Baixar" — sistema inicia download sob demanda
7. Sistema reconstroi o arquivo a partir dos chunks (descriptografa e reagrupa)
8. Arquivo reconstruido e disponibilizado para download no navegador
9. Para videos, membro clica em play e o sistema inicia download progressivo do preview 480p

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| GalleryGrid | Grid responsivo com virtual scrolling para performance com milhares de itens |
| ThumbnailCard | Card individual com thumbnail, data e tipo de arquivo |
| Lightbox | Visualizador de imagem em tela cheia com navegacao |
| VideoPlayer | Player de video com download progressivo do preview |
| SearchBar | Busca por nome, data, tipo e tags |
| FilterPanel | Filtros por periodo, tipo de midia e membro |
| DownloadButton | Inicia reconstrucao e download do arquivo completo |
| SkeletonLoader | Placeholder visual durante carregamento de thumbnails |

**Tratamento de Erros:**

- Thumbnails falham ao carregar (CDN/rede) → Skeleton placeholder mantido com icone de imagem quebrada; retry automatico ao rolar de volta
- Download sob demanda falha (chunk indisponivel) → Mensagem "Arquivo temporariamente indisponivel" com explicacao de que a replicacao esta em andamento; botao de retry
- Busca retorna zero resultados → Estado vazio com sugestoes (ex: "Tente termos diferentes" ou "Nenhum arquivo encontrado para este periodo")
- Galeria vazia (primeiro acesso) → Estado vazio amigavel com CTA para "Enviar suas primeiras fotos"

> Diagrama: [fluxo-3-galeria.mmd](../diagrams/frontend/fluxo-3-galeria.mmd)

---

### Fluxo 4: Registro e Gerenciamento de Nos de Armazenamento

> O administrador registra novos nos (dispositivos locais, buckets S3/R2, contas cloud via OAuth) e monitora a saude e capacidade de cada no.

**Passos:**

1. Admin acessa "Nos de Armazenamento" no dashboard
2. Dashboard exibe lista de nos com status (online/offline), capacidade (usado/total) e tier (hot/warm/cold)
3. Admin clica em "Adicionar No" e seleciona o tipo: Local, S3/R2, Google Drive, Dropbox ou OneDrive
4. Para S3/R2: admin insere endpoint, access key e secret key; sistema valida conexao
5. Para OAuth clouds: sistema redireciona para autorizacao OAuth; apos consentimento, token e armazenado no vault do admin
6. Sistema registra o no, calcula capacidade disponivel e inicia recebimento de chunks
7. No aparece no dashboard com status "Online" e barra de capacidade
8. Para desconectar um no, admin clica em "Remover" — sistema inicia drain (migra chunks para outros nos antes da remocao)
9. Progresso do drain e exibido em tempo real; no e removido somente apos conclusao

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| NodeDashboard | Lista de nos com status, capacidade e acoes |
| AddNodeWizard | Wizard de adicao com selecao de tipo e configuracao |
| S3ConfigForm | Formulario de credenciais S3/R2 com validacao de conexao |
| OAuthConnectButton | Inicia fluxo OAuth para Google Drive, Dropbox, OneDrive |
| NodeStatusCard | Card individual com status, tier, capacidade e heartbeat |
| DrainProgressBar | Barra de progresso de migracao de chunks durante remocao |
| CapacityChart | Grafico de uso de armazenamento por no |
| ErrorToast | Exibe erros de conexao e falhas de registro |

**Tratamento de Erros:**

- Credenciais S3 invalidas → Mensagem inline no formulario apos tentativa de validacao; campos destacados em vermelho
- OAuth falha ou usuario nega permissao → Retorna ao wizard com mensagem explicativa; opcao de tentar novamente
- No fica offline (sem heartbeat) → Card muda para status "Offline" com indicador visual amarelo/vermelho; tooltip mostra ultimo heartbeat
- Drain falha (nos destino sem espaco) → Alerta ao admin com detalhes; sugestao de adicionar mais nos antes de remover

> Diagrama: [fluxo-4-nos.mmd](../diagrams/frontend/fluxo-4-nos.mmd)

---

### Fluxo 5: Recuperacao do Sistema via Seed Phrase

> O administrador recupera o sistema completo em uma nova VPS usando a seed phrase de 12 palavras, reconectando todos os nos e reconstruindo o indice.

**Passos:**

1. Admin acessa a pagina de recuperacao em nova instancia do sistema
2. Admin insere a seed phrase de 12 palavras no formulario de recovery
3. Sistema deriva a master key a partir da seed
4. Sistema descriptografa os vaults dos membros e recupera credenciais de nos
5. Tela de progresso exibe etapas: "Derivando chaves" → "Descriptografando vaults" → "Reconectando nos" → "Reconstruindo indice"
6. Nos sao reconectados via DNS fixo + credenciais recuperadas dos vaults
7. Sistema escaneia chunks nos nos para reconstruir o indice de manifests
8. Progresso geral exibe: nos reconectados (X/Y), manifests recuperados (N), arquivos indexados (M)
9. Ao concluir, admin e redirecionado ao dashboard com sistema operacional
10. Admin pode convidar membros novamente ou membros reconectam com suas credenciais

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| RecoveryWizard | Wizard de recuperacao multi-step |
| SeedPhraseInput | Campo de entrada das 12 palavras com autocomplete do wordlist BIP-39 |
| RecoveryProgressTracker | Exibe etapas da recuperacao com status de cada fase |
| NodeReconnectList | Lista de nos sendo reconectados com status individual |
| IndexRebuildProgress | Progresso de escaneamento de chunks e reconstrucao de manifests |
| ErrorAlert | Alertas de erros durante recuperacao com opcoes de acao |

**Tratamento de Erros:**

- Seed phrase invalida (palavra nao pertence ao wordlist BIP-39) → Campo destaca palavra invalida em vermelho; autocomplete sugere correcoes
- Seed phrase valida mas nao corresponde a nenhum cluster → Mensagem "Nenhum cluster encontrado para esta seed" com orientacao de verificar se os nos estao acessiveis
- No nao responde durante reconexao → Item na lista marcado como "Indisponivel"; recuperacao continua com nos disponiveis; alerta para verificar no offline posteriormente
- Reconstrucao de indice incompleta → Dashboard exibe banner informativo com contagem de arquivos potencialmente nao indexados; sugere verificar nos offline

> Diagrama: [fluxo-5-recovery.mmd](../diagrams/frontend/fluxo-5-recovery.mmd)

### Fluxo 6: Gerenciamento de Senhas Pessoais no Vault

> O membro acessa seu vault criptografado para visualizar, adicionar ou copiar senhas pessoais armazenadas com seguranca.

**Passos:**

1. Membro acessa "Vault" na sidebar
2. Sistema exibe as 3 secoes: Tokens OAuth, Credenciais de nos, Senhas pessoais
3. Membro clica em "Adicionar senha"
4. Modal exibe formulario com campos: Titulo, Usuario ou email, Senha, Notas (opcional)
5. Membro preenche e clica em "Salvar no vault"
6. Sistema criptografa a senha com AES-256-GCM e re-criptografa o vault completo
7. Vault atualizado e replicado nos nos (dispara evento VaultUpdated)
8. Nova senha aparece na lista com mascara e botoes de acao (ver/copiar)
9. Para revelar, membro clica no icone de olho — senha visivel por 10 segundos
10. Para copiar, membro clica no icone de copiar — senha copiada para clipboard com auto-clear em 30 segundos

**Componentes envolvidos:**

| Componente | Responsabilidade |
|------------|-----------------|
| PasswordRow | Card individual de senha com titulo, usuario, data, mascara e acoes (ver/copiar) |
| AddPasswordModal | Modal com formulario de 4 campos para adicionar nova senha |
| TokenRow | Linha da tabela de tokens OAuth com status e acao de reconexao |
| CredentialRow | Card de credencial S3/R2 com access key mascarada |
| ReconnectOAuthModal | Modal de confirmacao para reconexao de token OAuth expirado |

**Tratamento de Erros:**

- Falha ao salvar senha (erro de criptografia ou rede) → Toast de erro com retry; dados do formulario preservados
- Vault bloqueado (sessao expirada) → Redireciona para re-autenticacao; apos login, retorna ao vault
- Falha na replicacao do vault atualizado → Banner informativo "Vault salvo localmente, replicacao pendente"; resolve automaticamente quando nos ficam online

> Diagrama: [fluxo-6-vault-senhas.mmd](../diagrams/frontend/fluxo-6-vault-senhas.mmd)

<!-- APPEND:fluxos -->

---

## Microfrontends (quando aplicavel)

> O sistema requer particionamento em microfrontends?

- [x] Nao — aplicacao monolitica e suficiente <!-- inferido do PRD -->
- [ ] Sim — microfrontends por rota
- [ ] Sim — microfrontends por componente

O Alexandria e uma aplicacao de uso familiar com ate 10 usuarios por cluster. A complexidade nao justifica particionamento em microfrontends. Uma aplicacao Next.js monolitica com code splitting por rota oferece a separacao necessaria sem overhead de infraestrutura. <!-- inferido do PRD -->

> Para detalhes sobre testes de fluxos, (ver 09-testes.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| 2026-03-17 | 5 fluxos criticos identificados (onboarding, upload, galeria, nos, recovery) | Cobrem todos os requisitos Must-Have do PRD e as 4 personas principais |
| 2026-03-17 | Aplicacao monolitica Next.js sem microfrontends | Escala familiar (ate 10 usuarios) nao justifica complexidade de microfrontends |
| 2026-03-17 | Seed phrase verification com 3 palavras aleatorias no onboarding | Garantir que admin anotou a seed antes de prosseguir — criticidade alta (R-01 do PRD) |
