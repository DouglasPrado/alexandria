# Contexto do Sistema

Esta seção estabelece a visão de alto nível do sistema: quem o utiliza, com quais sistemas externos ele se comunica, onde terminam suas responsabilidades e quais restrições moldam as decisões de arquitetura. Use-a como ponto de partida para alinhar stakeholders e equipe técnica sobre o escopo do projeto.

---

## Atores

> Quem interage com o sistema? Liste pessoas, sistemas e dispositivos.

| Ator                    | Tipo        | Descrição                                                                                                                                                                    |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador Familiar  | Pessoa      | Membro técnico da família que cria o cluster, convida membros, adiciona/remove nós, configura provedores cloud, monitora saúde do sistema e executa recovery via seed phrase |
| Membro Familiar         | Pessoa      | Pai/mãe, tios, avós que usam o sistema no dia-a-dia para salvar e visualizar fotos, vídeos e documentos sem necessidade de conhecimento técnico                              |
| Fotógrafo Amador        | Pessoa      | Membro da família que produz alto volume de fotos/vídeos; precisa de upload automático e liberação de espaço no celular                                                      |
| Guardião de Memórias    | Pessoa      | Membro mais velho da família, curador do acervo; acessa fotos antigas, navega por timeline e organiza por eventos                                                            |
| Sync Engine             | Sistema     | Componente que roda nos dispositivos dos membros, detecta novos arquivos automaticamente e os envia ao cluster                                                               |
| Agente de Nó            | Sistema     | Processo que roda em cada dispositivo/nó local; armazena chunks, envia heartbeats e executa scrubbing                                                                        |
| Scheduler               | Sistema     | Componente interno do orquestrador que executa tarefas periódicas: scrubbing, garbage collection, rebalanceamento, auto-healing                                              |
| Dispositivos da família | Dispositivo | Computadores, celulares, NAS e VPS que atuam como nós de armazenamento no cluster                                                                                            |

---

## Sistemas Externos

> Com quais sistemas, serviços ou APIs externas o sistema precisa se integrar? Qual o propósito de cada integração?

| Sistema         | Protocolo / Tipo de Integração | Função                                                                                  | Observações                                                                             |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| AWS S3          | S3-compatible API (HTTPS)      | Armazenamento de chunks criptografados em buckets                                       | SLA 99.99%; custo por GB; alternativa primária de cloud storage                         |
| Cloudflare R2   | S3-compatible API (HTTPS)      | Armazenamento de chunks sem egress fees                                                 | Sem custo de saída de dados; S3-compatible nativo                                       |
| Backblaze B2    | S3-compatible API (HTTPS)      | Armazenamento de chunks como alternativa econômica                                      | Custo ~$5/TB/mês; S3-compatible                                                         |
| FFmpeg          | CLI local                      | Transcodificação de vídeo (H.265/AV1) e processamento de imagens                        | Dependência crítica do pipeline de mídia; open source; roda no servidor do orquestrador |
| libvips         | Biblioteca nativa              | Redimensionamento e conversão de imagens para WebP                                      | Alternativa a ImageMagick; mais performante para operações batch                        |
| PostgreSQL      | Driver nativo (TCP)            | Banco de metadados do orquestrador: clusters, membros, nós, arquivos, chunks, manifests | Crítico; sem PostgreSQL o orquestrador não funciona                                     |
| Redis           | Driver nativo (TCP)            | Fila de processamento do pipeline de mídia e pub/sub para eventos internos              | Crítico para pipeline; sem Redis, processamento de mídia para                           |
| DNS Provider    | DNS (UDP/TCP)                  | Descoberta do orquestrador pelos nós via domínio fixo; reconexão após troca de VPS      | Essencial para recovery; nós usam DNS para encontrar novo orquestrador                  |
| BIP-39 Wordlist | Biblioteca embarcada           | Geração e validação de seed phrase de 12 palavras                                       | Padrão criptográfico; wordlist embutida no app NestJS                                   |

---

## Limites do Sistema

> O que está dentro e fora do escopo deste sistema? Definir limites claros evita ambiguidades e retrabalho.

**O sistema É responsável por:**

- Criar e gerenciar clusters familiares com identidade criptográfica
- Convidar membros e gerenciar permissões (admin, membro, leitura)
- Registrar e monitorar nós de armazenamento (locais e cloud)
- Pipeline completo de processamento: análise → otimização → preview → chunking → criptografia → distribuição
- Otimização de mídia: fotos para WebP Full HD (~300-600KB), vídeos para 1080p H.265/AV1 (~400-600MB)
- Criptografia ponta-a-ponta (AES-256-GCM) de todos os chunks antes do upload
- Distribuição de chunks via consistent hashing com replicação mínima de 3 cópias
- Auto-healing: re-replicação automática quando nós são perdidos
- Scrubbing periódico para detecção e correção de corrupção (bit rot)
- Garbage collection de chunks órfãos
- Rebalanceamento de chunks quando nós entram ou saem
- Vault criptografado individual por membro para tokens, credenciais de provedores cloud e senhas
- Recovery completo do sistema via seed phrase de 12 palavras
- Geração de previews e placeholders para navegação leve
- Web client para upload, galeria e download sob demanda
- Alertas de saúde do cluster (nó offline, replicação baixa, integridade)

**O sistema NÃO é responsável por:**

- Substituir aplicativos de visualização de fotos (Google Photos, Apple Photos) — Alexandria é storage, não viewer completo
- Armazenar arquivos originais sem otimização — decisão explícita de preservar apenas versões otimizadas + preview
- Gerenciar rede pública/aberta de armazenamento — somente clusters familiares permissionados
- Edição colaborativa de documentos
- Streaming de vídeo em tempo real — download sob demanda é suficiente
- Serviço comercial multi-tenant
- Rede peer-to-peer descentralizada sem orquestrador (adiado para versão futura)
- Gerenciamento de pagamentos ou assinaturas
- Backup de dados de aplicativos (apenas mídia e documentos do usuário)

---

## Restrições e Premissas

> Quais restrições técnicas, de negócio ou regulatórias influenciam as decisões de arquitetura? Quais premissas estão sendo assumidas como verdadeiras?

**Restrições:**

| Tipo        | Descrição                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Técnica     | Backend em TypeScript/NestJS para produtividade alta, ecossistema npm maduro e deploy via container Docker |
| Técnica     | Frontend web em Next.js para SSR, galeria responsiva e deploy simples                                      |
| Técnica     | PostgreSQL para metadados do orquestrador; Redis para filas de processamento                               |
| Técnica     | Monorepo com core-sdk compartilhado entre orquestrador, agentes de nó e clientes                           |
| Técnica     | Sem armazenamento de originais — somente versões otimizadas (WebP/H.265) + preview                         |
| Técnica     | Criptografia obrigatória em repouso (AES-256-GCM) e em trânsito (TLS 1.3)                                  |
| Escala      | Cluster máximo: 10 usuários, 50 nós, 100TB de armazenamento total                                          |
| Negócio     | Custo mínimo — priorizar free tiers de cloud e VPS barata (Contabo)                                        |
| Negócio     | Sistema self-hosted — usuário é responsável pela operação do orquestrador                                  |
| Operacional | Time de 1 pessoa (Douglas Prado) como owner, tech lead e desenvolvedor                                     |

**Premissas:**

- Famílias possuem pelo menos 3-5 dispositivos disponíveis como nós de armazenamento (computadores, celulares, NAS, contas cloud)
- Pelo menos 1 nó "âncora" (VPS, NAS ou cloud bucket) está sempre online para garantir disponibilidade
- Usuários guardam a seed phrase de 12 palavras com segurança (papel, cofre físico) — se perderem, não há recovery
- Provedores cloud (AWS, Cloudflare, Backblaze) manterão APIs S3-compatible estáveis e free tiers disponíveis
- Banda de internet doméstica é suficiente para sync em background sem saturar a rede
- FFmpeg e codecs modernos (WebP, H.265, AV1) continuarão disponíveis e mantidos pela comunidade open source
- Full HD (1920px) é qualidade suficiente para preservação de memórias familiares sem perda perceptível
- ~500GB gratuitos (5 pessoas × ~100GB por pessoa em provedores cloud) cobrem necessidades de uma família com mídia otimizada por 5-10 anos

> Se a premissa sobre seed phrase se provar falsa (usuários perdem seeds frequentemente), o sistema precisará de recovery guardians (RF-005) com múltiplas seeds. Se free tiers desaparecerem, o modelo de custo precisará ser revisitado para incluir storage pago.

---

## Diagrama de Contexto

> Represente visualmente os atores e sistemas externos que interagem com o sistema. Use o diagrama abaixo como ponto de partida (estilo C4 — nível de contexto).

> 📐 Diagrama: [system-context.mmd](../diagrams/context/system-context.mmd)
