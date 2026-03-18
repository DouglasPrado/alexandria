# Comunicacao

> Mensagens sao extensoes do produto. Projete-as como features, nao como afterthought.

Define todos os templates de mensagens enviadas ao usuario fora da interface — emails transacionais e de marketing, SMS (quando necessario) e WhatsApp (quando necessario). Documenta estrategia de canais, triggers, templates, variaveis e regras de envio.

---

## Estrategia de Comunicacao

> Quais canais de comunicacao o sistema utiliza? Qual a prioridade entre eles? Como funciona opt-in/opt-out?

| Aspecto | Definicao |
| --- | --- |
| Canal primario | Email |
| Canais secundarios | Nenhum |
| Prioridade de canais | Email (unico canal) |
| Opt-in obrigatorio | Nao — membros recebem emails transacionais ao aceitar convite do cluster (consentimento implicito) |
| Opt-out | Link de unsubscribe em emails de lifecycle; emails transacionais nao permitem opt-out (convite, alertas criticos) |
| Frequencia maxima | Maximo 3 emails/semana (lifecycle); transacionais sem limite |
| Horario de envio | Sem restricao para transacionais; lifecycle Seg-Sex 9h-18h BRT |
| Provedor de email | Resend |

<!-- APPEND:estrategia-comunicacao -->

---

## Templates de Email

> Quais emails transacionais e de marketing o sistema envia? Para cada template, defina assunto, preheader, corpo, CTA e versao texto.

### Emails Transacionais

> Emails disparados automaticamente por acoes do usuario ou do sistema.

#### Email: Convite para o Cluster

| Campo | Conteudo |
| --- | --- |
| Trigger | Admin convida membro via POST /clusters/:id/invite |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Voce foi convidado para o cluster {{cluster_name}} |
| Preheader | {{admin_name}} convidou voce para o Alexandria |
| Corpo | Ola {{nome}}, {{admin_name}} convidou voce para participar do cluster familiar "{{cluster_name}}" no Alexandria. Clique no botao abaixo para aceitar o convite. O link expira em 7 dias. |
| CTA | Aceitar convite |
| CTA URL | {{baseUrl}}/invite?token={{invite_token}} |
| Fallback texto | Ola {{nome}}, aceite o convite para o cluster "{{cluster_name}}" em: {{baseUrl}}/invite?token={{invite_token}} — Expira em 7 dias. |

<!-- APPEND:email-transacional-convite -->

#### Email: Boas-vindas ao Cluster

| Campo | Conteudo |
| --- | --- |
| Trigger | Membro aceita convite e entra no cluster (evento MemberJoined) |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Bem-vindo ao cluster {{cluster_name}}! |
| Preheader | Voce ja pode acessar o acervo da familia |
| Corpo | Ola {{nome}}, voce agora faz parte do cluster "{{cluster_name}}" no Alexandria. Seu acesso esta configurado como "{{role}}". Clique no botao abaixo para acessar a galeria do cluster. |
| CTA | Acessar galeria |
| CTA URL | {{baseUrl}}/gallery |
| Fallback texto | Ola {{nome}}, voce entrou no cluster "{{cluster_name}}" como {{role}}. Acesse: {{baseUrl}}/gallery |

<!-- APPEND:email-transacional-boas-vindas -->

#### Email: Alerta Critico — No Perdido

| Campo | Conteudo |
| --- | --- |
| Trigger | No marcado como "lost" apos 1h sem heartbeat (evento NodeLost) |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Alerta critico: no "{{node_name}}" perdido |
| Preheader | Sem heartbeat ha mais de 1 hora — auto-healing iniciado |
| Corpo | Ola {{admin_name}}, o no "{{node_name}}" ({{node_type}}) esta sem heartbeat ha mais de 1 hora e foi marcado como perdido. O auto-healing foi iniciado para re-replicar {{chunks_affected}} chunks afetados. Acesse o painel para acompanhar o progresso. |
| CTA | Ver status do cluster |
| CTA URL | {{baseUrl}}/admin/nodes |
| Fallback texto | Alerta critico: no "{{node_name}}" perdido. {{chunks_affected}} chunks em re-replicacao. Acesse: {{baseUrl}}/admin/nodes |

<!-- APPEND:email-transacional-alerta-no -->

#### Email: Alerta Critico — Chunks Irrecuperaveis

| Campo | Conteudo |
| --- | --- |
| Trigger | Chunk sem nenhuma replica restante detectado durante auto-healing ou scrubbing |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Alerta critico: {{files_affected}} arquivo(s) com dados irrecuperaveis |
| Preheader | Chunks sem replicas detectados — acao necessaria |
| Corpo | Ola {{admin_name}}, durante a verificacao de integridade, {{chunks_corrupted}} chunk(s) foram identificados sem nenhuma replica disponivel. Isso afeta {{files_affected}} arquivo(s) que foram marcados como "corrupted". Acesse o painel para detalhes e considere adicionar novos nos para aumentar a resiliencia. |
| CTA | Ver arquivos afetados |
| CTA URL | {{baseUrl}}/admin/alerts |
| Fallback texto | Alerta critico: {{chunks_corrupted}} chunks irrecuperaveis afetando {{files_affected}} arquivos. Acesse: {{baseUrl}}/admin/alerts |

<!-- APPEND:email-transacional-alerta-integridade -->

#### Email: Erro no Upload

| Campo | Conteudo |
| --- | --- |
| Trigger | Pipeline de midia falha no processamento de arquivo (evento FileError) |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Falha no upload de "{{file_name}}" |
| Preheader | Houve um erro ao processar seu arquivo |
| Corpo | Ola {{nome}}, o processamento do arquivo "{{file_name}}" falhou. Motivo: {{error_reason}}. Voce pode tentar novamente clicando no botao abaixo. Se o erro persistir, o arquivo pode estar corrompido ou em formato nao suportado. |
| CTA | Tentar novamente |
| CTA URL | {{baseUrl}}/gallery?retry={{file_id}} |
| Fallback texto | Falha no upload de "{{file_name}}": {{error_reason}}. Tente novamente em: {{baseUrl}}/gallery |

<!-- APPEND:email-transacional-upload-erro -->

#### Email: Recovery Concluido

| Campo | Conteudo |
| --- | --- |
| Trigger | Recovery via seed phrase concluido com sucesso (evento ClusterRecovered) |
| De | Alexandria <noreply@alexandria.app> |
| Assunto | Recovery do cluster "{{cluster_name}}" concluido |
| Preheader | Sistema restaurado via seed phrase |
| Corpo | Ola {{admin_name}}, o recovery do cluster "{{cluster_name}}" foi concluido. Resumo: {{files_recovered}} arquivos recuperados, {{nodes_reconnected}} nos reconectados, {{chunks_missing}} chunks pendentes de re-replicacao. Acesse o painel para verificar o status completo. |
| CTA | Ver relatorio de recovery |
| CTA URL | {{baseUrl}}/admin/recovery-report |
| Fallback texto | Recovery concluido: {{files_recovered}} arquivos, {{nodes_reconnected}} nos, {{chunks_missing}} chunks pendentes. Acesse: {{baseUrl}}/admin/recovery-report |

<!-- APPEND:email-transacional-recovery -->

<!-- APPEND:email-transacional -->

### Emails de Marketing / Lifecycle

> Emails enviados em campanhas, nurturing ou lifecycle (onboarding, reengajamento, etc.).

#### Email: Onboarding — Primeiro Upload

| Campo | Conteudo |
| --- | --- |
| Trigger | 1 dia apos membro entrar no cluster sem nenhum upload (role admin ou membro) |
| Segmento | Membros com role != "leitura" que nao fizeram upload |
| De | Douglas do Alexandria <douglas@alexandria.app> |
| Assunto | Que tal subir suas primeiras fotos? |
| Preheader | Leva menos de 1 minuto |
| Corpo | Ola {{nome}}, vi que voce entrou no cluster "{{cluster_name}}" ontem. Que tal comecar subindo algumas fotos? O Alexandria vai otimizar, criptografar e distribuir tudo automaticamente entre os nos da familia. Basta clicar em "Upload" na galeria. |
| CTA | Fazer meu primeiro upload |
| CTA URL | {{baseUrl}}/gallery |

<!-- APPEND:email-marketing -->

---

## Templates de SMS

> O sistema envia SMS? Se sim, quais mensagens? Lembre-se: maximo 160 caracteres por segmento.

| Status | Nao aplicavel |
| --- | --- |

O Alexandria nao utiliza SMS. Convites sao compartilhados pelo admin via canal de sua preferencia (WhatsApp pessoal, email manual, etc.). Alertas criticos sao enviados por email.

<!-- APPEND:sms -->

---

## Templates de WhatsApp

> O sistema envia mensagens via WhatsApp? Se sim, quais templates aprovados?

| Status | Nao aplicavel |
| --- | --- |

O Alexandria nao utiliza WhatsApp Business API. Convites sao compartilhados pelo admin diretamente via WhatsApp pessoal (link copiado da interface). <!-- inferido do PRD -->

<!-- APPEND:whatsapp -->

---

## Variaveis e Personalizacao

> Quais variaveis dinamicas estao disponiveis nos templates de comunicacao?

| Variavel | Descricao | Exemplo | Disponivel em |
| --- | --- | --- | --- |
| nome | Nome do membro destinatario | Maria | Todos os emails |
| email | Email do membro destinatario | maria@email.com | Todos os emails |
| admin_name | Nome do admin que executou a acao | Douglas | Convite, alertas |
| cluster_name | Nome do cluster familiar | Familia Prado | Todos os emails |
| role | Role atribuida ao membro | membro | Boas-vindas |
| baseUrl | URL base do web client | https://app.alexandria.app | Todos os emails |
| invite_token | Token assinado de convite (Ed25519, exp 7d) | eyJhbG... | Convite |
| node_name | Nome descritivo do no afetado | MacBook do Douglas | Alertas de no |
| node_type | Tipo do no (local, s3, r2, vps) | s3 | Alertas de no |
| chunks_affected | Quantidade de chunks afetados | 1.247 | Alerta no perdido |
| chunks_corrupted | Quantidade de chunks irrecuperaveis | 3 | Alerta integridade |
| files_affected | Quantidade de arquivos afetados | 2 | Alerta integridade |
| file_name | Nome original do arquivo | ferias-2025.jpg | Erro upload |
| file_id | ID do arquivo para retry | abc123 | Erro upload |
| error_reason | Motivo do erro de processamento | Codec nao suportado | Erro upload |
| files_recovered | Arquivos recuperados no recovery | 12.450 | Recovery |
| nodes_reconnected | Nos reconectados apos recovery | 4 | Recovery |
| chunks_missing | Chunks pendentes de re-replicacao | 23 | Recovery |

<!-- APPEND:variaveis -->

---

## Regras de Envio

> Quais eventos disparam cada comunicacao? Existem condicoes, cooldowns ou prioridades?

### Mapa de Triggers

| Evento | Canal | Template | Condicao | Cooldown |
| --- | --- | --- | --- | --- |
| Admin convida membro | Email | Convite para o Cluster | Token de convite valido | 1 por email por hora |
| Membro aceita convite | Email | Boas-vindas ao Cluster | Nenhuma | Unico (1 por membro) |
| No marcado como lost | Email | Alerta Critico — No Perdido | Severidade = critical | 1 por no por 24h |
| Chunks irrecuperaveis detectados | Email | Alerta Critico — Chunks Irrecuperaveis | Severidade = critical; chunks sem replica | 1 por evento por 24h |
| Pipeline de midia falha | Email | Erro no Upload | File status = error | 1 por arquivo |
| Recovery via seed concluido | Email | Recovery Concluido | Recovery finalizado com sucesso | Unico por recovery |
| 1d apos ingresso sem upload | Email | Onboarding — Primeiro Upload | Role != leitura; 0 uploads | Unico (1 por membro) |

<!-- APPEND:triggers -->

### Prioridade entre Canais

> Quando uma mensagem pode ser enviada por mais de um canal, qual a ordem de preferencia?

| Prioridade | Canal | Condicao de fallback |
| --- | --- | --- |
| 1 | Email | Sempre disponivel (email obrigatorio no cadastro de membro) |

Canal unico — sem fallback necessario. <!-- inferido do PRD -->

<!-- APPEND:prioridade-canais -->

### Rate Limits e Throttling

| Canal | Rate limit | Janela |
| --- | --- | --- |
| Email transacional | 10 por membro por hora | 1 hora |
| Email transacional (alertas) | 5 por admin por dia | 24 horas |
| Email lifecycle | 1 por membro por semana | 7 dias |
| API Resend (global) | 100 emails por hora | 1 hora |

<!-- APPEND:rate-limits -->

---

## Convencoes de Escrita por Canal

> Quais regras de tom de voz e formatacao se aplicam a cada canal?

### Email

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Use o nome do membro no greeting | Ola Maria, | Prezado usuario, |
| Assunto com maximo 60 caracteres | Voce foi convidado para o cluster Familia Prado | Notificacao importante sobre convite para participar do cluster familiar |
| Um CTA principal por email | [Aceitar convite] | [Aceitar convite] [Ver cluster] [Saiba mais] |
| Preheader complementa o assunto, nao repete | Douglas convidou voce para o Alexandria | Voce foi convidado para o cluster |
| Inclua fallback texto para todo email | Aceite o convite em: https://... | (sem versao texto) |
| Tom informal e familiar (produto para familias) | Que tal subir suas primeiras fotos? | Prezado(a), informamos que sua conta foi provisionada |
| Alertas criticos com linguagem clara e direta | No "MacBook do Douglas" perdido | Ocorreu uma anomalia no subsistema de armazenamento |
| Nao usar jargoes tecnicos em emails para membros | Houve um erro ao processar seu arquivo | FFmpeg retornou exit code 1 no transcoding H.265 |

<!-- APPEND:convencoes-email -->

### SMS

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| N/A | Canal nao utilizado | — |

<!-- APPEND:convencoes-sms -->

### WhatsApp

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| N/A | Canal nao utilizado | — |

<!-- APPEND:convencoes-whatsapp -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| 2026-03-18 | Resend como provedor de email | API moderna, SDK Rust disponivel, free tier de 3k emails/mes suficiente para uso familiar |
| 2026-03-18 | SMS e WhatsApp nao aplicaveis | Sistema familiar de pequena escala; convites compartilhados manualmente pelo admin |
| 2026-03-18 | Alertas por email apenas para severidade critical | Evitar excesso de notificacoes; warnings e info ficam apenas na UI |
| 2026-03-18 | Sem email de reset de senha | Sistema usa autenticacao via tokens de convite + JWT, sem senhas tradicionais |

<!-- APPEND:decisoes-comunicacao -->
