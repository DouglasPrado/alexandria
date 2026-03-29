# Mapeamento de Erros — Backend → UX Frontend

> Conecta codigos de erro do backend com acoes de UX no frontend. Este documento garante que cada erro tem uma resposta visual consistente.

---

## Mapa de Erros

> Para CADA codigo de erro do backend, documente a resposta no frontend.

| Codigo Backend               | Status HTTP | Mensagem para Usuario                              | Acao UI                                                        | Componente                | Retentavel                      |
| ---------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------- |
| VALIDATION_ERROR             | 400         | Exibir erros por campo (details[].field)           | Highlight campos invalidos, scroll para primeiro erro          | Form + FieldError         | Sim (usuario corrige)           |
| TOKEN_EXPIRED                | 401         | "Sua sessao expirou"                               | Tentar refresh; se falha: modal "Sessao expirada" → login      | AuthProvider              | Auto (refresh token)            |
| INVALID_TOKEN                | 401         | "Sessao invalida"                                  | Limpar cookies, redirect /login                                | AuthProvider              | Nao                             |
| INSUFFICIENT_PERMISSIONS     | 403         | "Voce nao tem permissao para esta acao"            | Toast erro + manter na pagina                                  | Toast                     | Nao                             |
| CLUSTER_NOT_FOUND            | 404         | "Cluster nao encontrado"                           | Redirect /setup (criar novo cluster)                           | Router                    | Nao                             |
| MEMBER_NOT_FOUND             | 404         | "Membro nao encontrado"                            | Toast erro + redirect /members                                 | Toast + Router            | Nao                             |
| NODE_NOT_FOUND               | 404         | "No de armazenamento nao encontrado"               | Toast erro + redirect /nodes                                   | Toast + Router            | Nao                             |
| FILE_NOT_FOUND               | 404         | "Arquivo nao encontrado"                           | Toast erro + fechar lightbox + refresh galeria                 | Toast + FileLightbox      | Nao                             |
| MEMBER_ALREADY_EXISTS        | 409         | "Este email ja esta cadastrado no cluster"         | Highlight campo email no InviteMemberDialog                    | Form + FieldError         | Sim (usar outro email)          |
| DUPLICATE_FILE               | 409         | "Este arquivo ja existe no cluster"                | Toast info + link para arquivo existente                       | Toast                     | Nao                             |
| INSUFFICIENT_NODES           | 422         | "Nos insuficientes para garantir replicacao"       | Toast erro + CTA "Adicionar no"                                | Toast + AddNodeDialog     | Nao (admin deve adicionar nos)  |
| INVALID_SEED_PHRASE          | 422         | "Seed phrase invalida"                             | Highlight campo seed + mensagem inline                         | SeedPhraseInput + FieldError | Sim (usuario corrige)        |
| FILE_TOO_LARGE               | 422         | "Arquivo excede o tamanho maximo permitido"        | Toast erro com limites por tipo                                | Toast + UploadDropzone    | Nao                             |
| CLUSTER_FULL                 | 422         | "Cluster atingiu o limite maximo"                  | Toast erro + desabilitar convite/registro                      | Toast                     | Nao                             |
| INVALID_STATE_TRANSITION     | 422         | "Acao nao permitida neste momento"                 | Toast aviso + desabilitar botao                                | Toast + ActionButton      | Nao                             |
| RATE_LIMIT_EXCEEDED          | 429         | "Muitas tentativas. Aguarde {X} segundos"          | Desabilitar form + countdown (X-RateLimit-Reset)               | RateLimitBanner           | Sim (apos cooldown)             |
| STORAGE_PROVIDER_ERROR       | 502         | "Erro no provedor de armazenamento"                | Toast + botao retry                                            | Toast + RetryButton       | Sim (retry com backoff)         |
| EMAIL_SERVICE_ERROR          | 502         | "Erro ao enviar email"                             | Toast warning (convite criado mas email falhou)                | Toast                     | Sim (retry)                     |
| FFMPEG_ERROR                 | 502         | "Erro ao processar midia"                          | Marcar upload como error + botao retry                         | UploadQueue + RetryButton | Sim (retry)                     |
| INSUFFICIENT_REPLICATION     | 503         | "Replicacao insuficiente, tente novamente"         | Toast + retry automatico em 5s                                 | Toast                     | Sim (retry automatico)          |
| INTERNAL_ERROR               | 500         | "Algo deu errado. Tente novamente"                 | Toast erro + log requestId para observabilidade                | Toast + ErrorBoundary     | Sim (retry)                     |

<!-- APPEND:erros -->

---

## Padroes de UI por Tipo de Erro

> Como cada categoria de erro e apresentada visualmente.

| Categoria                | Componente                  | Estilo                            | Duracao                     | Acao Secundaria                               |
| ------------------------ | --------------------------- | --------------------------------- | --------------------------- | --------------------------------------------- |
| Validacao (400)          | Inline em cada campo        | Borda vermelha + texto abaixo     | Permanente ate corrigir     | —                                             |
| Auth (401)               | Modal ou redirect           | Overlay + CTA para login          | Ate usuario agir            | Salvar URL atual para redirect apos login     |
| Permissao (403)          | Toast                       | Vermelho, icone cadeado           | 5s auto-dismiss             | —                                             |
| Nao encontrado (404)     | Toast + redirect para lista | Vermelho                          | 5s                          | Redirect automatico para listagem             |
| Conflito (409)           | Inline no campo + toast     | Amarelo warning                   | Permanente                  | Sugerir acao (ex: usar outro email)           |
| Negocio (422)            | Toast                       | Amarelo warning                   | 5s                          | Explicar por que a acao nao e possivel        |
| Rate limit (429)         | Banner topo                 | Amarelo + countdown               | Ate reset                   | Desabilitar interacoes                        |
| Servidor (500/502)       | Toast + retry               | Vermelho + botao                  | 10s ou ate retry            | Log request ID para suporte                   |

---

## Fallback Global (ErrorBoundary)

> Se um erro nao mapeado ocorrer:

```
1. Capturar via ErrorBoundary (React) ou onErrorCaptured (Vue)
2. Logar erro com requestId, stack, context no servico de observabilidade
3. Exibir tela generica: "Algo deu errado. [Tentar novamente] [Voltar ao inicio]"
4. Se o erro persistir apos retry: "Entre em contato com suporte. Ref: {{requestId}}"
```

> Referenciado por:
>
> - `docs/backend/09-errors.md` (catalogo de erros)
> - `docs/frontend/11-security.md` (protecao contra vazamento de info)
> - `docs/frontend/12-observability.md` (error tracking)
