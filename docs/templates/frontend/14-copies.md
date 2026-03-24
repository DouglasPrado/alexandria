# Copies

Define todos os textos e conteudos textuais das telas do frontend — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | {{pt-BR / en-US / outro}} |
| Suporte i18n | {{Sim — lib: react-intl / next-intl / i18next / Nao}} |
| Estrutura de chaves | {{namespace.screen.element — ex: auth.login.submitButton}} |
| Arquivos de traducao | {{locales/pt-BR.json, locales/en-US.json}} |
| Tom de voz | {{Profissional e direto / Casual e amigavel / Tecnico e preciso}} |
| Pessoa gramatical | {{Voce / Tu / Nos}} |
| Genero | {{Neutro quando possivel / Masculino generico}} |

### Glossario do Produto

> Termos do dominio que devem ser usados de forma consistente em toda a interface.

| Termo | Definicao | Nao usar |
| --- | --- | --- |
| {{Workspace}} | {{Espaco de trabalho do usuario}} | {{Projeto, Conta}} |
| {{Membro}} | {{Usuario dentro de um workspace}} | {{Participante, Colaborador}} |
| {{Plano}} | {{Nivel de assinatura}} | {{Pacote, Tier}} |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela? Organize por rota/pagina conforme definido em 07-rotas.md.

### {{Tela: Login}}

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | {{auth.login.title}} | {{Entrar na sua conta}} | {{Heading principal da pagina}} |
| Placeholder email | {{auth.login.emailPlaceholder}} | {{seu@email.com}} | {{Campo de email}} |
| Placeholder senha | {{auth.login.passwordPlaceholder}} | {{Sua senha}} | {{Campo de senha}} |
| Botao submit | {{auth.login.submitButton}} | {{Entrar}} | {{CTA principal}} |
| Link esqueceu senha | {{auth.login.forgotPassword}} | {{Esqueceu sua senha?}} | {{Link secundario}} |
| Link cadastro | {{auth.login.signupLink}} | {{Ainda nao tem conta? Cadastre-se}} | {{Link para registro}} |

<!-- APPEND:copies-login -->

### {{Tela: Cadastro}}

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | {{auth.signup.title}} | {{Criar sua conta}} | {{Heading principal}} |
| Botao submit | {{auth.signup.submitButton}} | {{Cadastrar}} | {{CTA principal}} |
| Termos | {{auth.signup.terms}} | {{Ao cadastrar, voce concorda com os Termos de Uso}} | {{Texto legal}} |

<!-- APPEND:copies-cadastro -->

### {{Tela: Dashboard}}

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | {{dashboard.title}} | {{Visao geral}} | {{Heading principal}} |
| Empty state | {{dashboard.empty}} | {{Nenhum dado disponivel ainda}} | {{Quando nao ha dados}} |
| CTA empty state | {{dashboard.emptyCta}} | {{Comecar agora}} | {{Botao no empty state}} |

<!-- APPEND:copies-dashboard -->

### {{Tela: Outra}}

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| {{Elemento}} | {{namespace.screen.element}} | {{Texto}} | {{Contexto}} |

<!-- APPEND:copies-telas -->

---

## Mensagens de Feedback

> Quais sao as mensagens de sucesso, erro, aviso e informacao exibidas ao usuario?

### Sucesso

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| {{feedback.success.saved}} | {{Alteracoes salvas com sucesso}} | {{Toast apos salvar}} |
| {{feedback.success.created}} | {{Item criado com sucesso}} | {{Toast apos criar}} |
| {{feedback.success.deleted}} | {{Item removido com sucesso}} | {{Toast apos deletar}} |

<!-- APPEND:feedback-sucesso -->

### Erro

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| {{feedback.error.generic}} | {{Algo deu errado. Tente novamente.}} | {{Fallback generico}} |
| {{feedback.error.network}} | {{Sem conexao com o servidor. Verifique sua internet.}} | {{Erro de rede}} |
| {{feedback.error.unauthorized}} | {{Sessao expirada. Faca login novamente.}} | {{401}} |
| {{feedback.error.forbidden}} | {{Voce nao tem permissao para esta acao.}} | {{403}} |
| {{feedback.error.notFound}} | {{Recurso nao encontrado.}} | {{404}} |

<!-- APPEND:feedback-erro -->

### Validacao de Formularios

| Chave i18n | Texto | Quando aparece |
| --- | --- | --- |
| {{validation.required}} | {{Campo obrigatorio}} | {{Campo vazio no submit}} |
| {{validation.email}} | {{Email invalido}} | {{Formato de email incorreto}} |
| {{validation.minLength}} | {{Minimo de {{min}} caracteres}} | {{Texto curto demais}} |
| {{validation.maxLength}} | {{Maximo de {{max}} caracteres}} | {{Texto longo demais}} |
| {{validation.passwordMismatch}} | {{As senhas nao coincidem}} | {{Confirmacao de senha}} |

<!-- APPEND:feedback-validacao -->

### Aviso e Informacao

| Chave i18n | Texto | Onde aparece |
| --- | --- | --- |
| {{feedback.warning.unsavedChanges}} | {{Voce tem alteracoes nao salvas. Deseja sair?}} | {{Modal ao navegar}} |
| {{feedback.info.loading}} | {{Carregando...}} | {{Estado de loading}} |
| {{feedback.info.noResults}} | {{Nenhum resultado encontrado}} | {{Busca sem resultados}} |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Navbar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Logo alt}} | {{global.navbar.logoAlt}} | {{Logo do {{NomeProduto}}}} |
| {{Busca placeholder}} | {{global.navbar.searchPlaceholder}} | {{Buscar...}} |
| {{Menu perfil}} | {{global.navbar.profile}} | {{Meu perfil}} |
| {{Sair}} | {{global.navbar.logout}} | {{Sair}} |

<!-- APPEND:copies-navbar -->

### Sidebar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Item menu}} | {{global.sidebar.menuItem}} | {{Texto do item}} |

<!-- APPEND:copies-sidebar -->

### Footer

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Copyright}} | {{global.footer.copyright}} | {{© {{ano}} {{NomeProduto}}. Todos os direitos reservados.}} |
| {{Termos}} | {{global.footer.terms}} | {{Termos de Uso}} |
| {{Privacidade}} | {{global.footer.privacy}} | {{Politica de Privacidade}} |

<!-- APPEND:copies-footer -->

### Modais Genericos

| Modal | Chave i18n titulo | Texto titulo | Chave i18n corpo | Texto corpo |
| --- | --- | --- | --- | --- |
| Confirmacao de exclusao | {{modal.delete.title}} | {{Confirmar exclusao}} | {{modal.delete.body}} | {{Tem certeza que deseja excluir? Esta acao nao pode ser desfeita.}} |
| Confirmacao de saida | {{modal.leave.title}} | {{Sair sem salvar?}} | {{modal.leave.body}} | {{Suas alteracoes serao perdidas.}} |

<!-- APPEND:copies-modais -->

### Empty States

| Tela/Secao | Chave i18n | Texto | CTA |
| --- | --- | --- | --- |
| {{Lista vazia}} | {{empty.list}} | {{Nenhum item encontrado}} | {{Criar primeiro item}} |
| {{Busca sem resultado}} | {{empty.search}} | {{Nenhum resultado para "{{termo}}"}} | {{Limpar filtros}} |
| {{Erro de carregamento}} | {{empty.error}} | {{Nao foi possivel carregar os dados}} | {{Tentar novamente}} |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra em titulos | Criar nova conta | Criar Nova Conta |
| Use voz ativa | Salve suas alteracoes | Suas alteracoes devem ser salvas |
| Seja direto — maximo {{60}} caracteres em CTAs | Salvar | Clique aqui para salvar as alteracoes |
| Evite jargao tecnico | Algo deu errado | Erro 500: Internal Server Error |
| Use pontuacao em frases completas | Suas alteracoes foram salvas. | Suas alteracoes foram salvas |
| Nao use ponto em labels e botoes | Salvar alteracoes | Salvar alteracoes. |
| Tooltips devem ser autoexplicativos | Exportar dados em CSV | Clique para exportar |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| {{YYYY-MM-DD}} | {{Decisao tomada}} | {{Por que foi decidido}} |

<!-- APPEND:decisoes -->
