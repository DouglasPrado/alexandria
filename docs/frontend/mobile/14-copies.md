# Copies

Define todos os textos e conteudos textuais das telas do app mobile — labels, placeholders, mensagens de feedback, CTAs, tooltips e empty states. Centralizar copies facilita revisao por produto/UX, garante consistencia de tom de voz e prepara o terreno para internacionalizacao (i18n).

---

## Estrategia de Copy

> Qual o idioma padrao? Ha suporte a multiplos idiomas? Qual o tom de voz do produto?

| Aspecto | Definicao |
| --- | --- |
| Idioma padrao | {{pt-BR / en-US / outro}} |
| Suporte i18n | {{Sim — lib: expo-localization + i18next / react-native-localize + react-i18next / Nao}} |
| Deteccao de idioma | {{Automatica via expo-localization (idioma do dispositivo)}} |
| Estrutura de chaves | {{namespace.screen.element — ex: auth.login.submitButton}} |
| Arquivos de traducao | {{locales/pt-BR.json, locales/en-US.json}} |
| Tom de voz | {{Profissional e direto / Casual e amigavel / Tecnico e preciso}} |
| Pessoa gramatical | {{Voce / Tu / Nos}} |
| Genero | {{Neutro quando possivel / Masculino generico}} |

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
| {{Workspace}} | {{Espaco de trabalho do usuario}} | {{Projeto, Conta}} |
| {{Membro}} | {{Usuario dentro de um workspace}} | {{Participante, Colaborador}} |
| {{Plano}} | {{Nivel de assinatura}} | {{Pacote, Tier}} |

<!-- APPEND:glossario -->

---

## Copies por Tela

> Quais sao os textos de cada tela? Organize por tela/screen conforme definido em 07-routes.md.

### {{Tela: Login}}

| Elemento | Chave i18n | Texto Padrao | Contexto |
| --- | --- | --- | --- |
| Titulo | {{auth.login.title}} | {{Entrar na sua conta}} | {{Heading principal da tela}} |
| Placeholder email | {{auth.login.emailPlaceholder}} | {{seu@email.com}} | {{Campo de email}} |
| Placeholder senha | {{auth.login.passwordPlaceholder}} | {{Sua senha}} | {{Campo de senha}} |
| Botao submit | {{auth.login.submitButton}} | {{Entrar}} | {{CTA principal}} |
| Botao biometria | {{auth.login.biometric}} | {{Entrar com Face ID}} | {{CTA biometrico (dinamico por plataforma)}} |
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
| Pull to refresh hint | {{dashboard.pullRefresh}} | {{Puxe para atualizar}} | {{Hint de pull-to-refresh}} |

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
| {{feedback.error.network}} | {{Sem conexao com a internet. Verifique sua rede.}} | {{Erro de rede (banner persistente)}} |
| {{feedback.error.unauthorized}} | {{Sessao expirada. Faca login novamente.}} | {{401}} |
| {{feedback.error.forbidden}} | {{Voce nao tem permissao para esta acao.}} | {{403}} |
| {{feedback.error.notFound}} | {{Recurso nao encontrado.}} | {{404}} |
| {{feedback.error.offline}} | {{Voce esta offline. Algumas funcoes podem nao estar disponiveis.}} | {{Banner de offline}} |

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
| {{feedback.warning.unsavedChanges}} | {{Voce tem alteracoes nao salvas. Deseja sair?}} | {{Alert ao navegar}} |
| {{feedback.info.loading}} | {{Carregando...}} | {{Estado de loading}} |
| {{feedback.info.noResults}} | {{Nenhum resultado encontrado}} | {{Busca sem resultados}} |
| {{feedback.info.updating}} | {{Atualizando app...}} | {{Durante OTA update}} |

<!-- APPEND:feedback-aviso -->

---

## Componentes Globais

> Copies de elementos compartilhados entre todas as telas.

### Tab Bar

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Tab Home}} | {{global.tabBar.home}} | {{Inicio}} |
| {{Tab Dashboard}} | {{global.tabBar.dashboard}} | {{Dashboard}} |
| {{Tab Profile}} | {{global.tabBar.profile}} | {{Perfil}} |
| {{Tab Settings}} | {{global.tabBar.settings}} | {{Ajustes}} |

<!-- APPEND:copies-tabbar -->

### Header

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Voltar}} | {{global.header.back}} | {{Voltar}} |
| {{Busca placeholder}} | {{global.header.searchPlaceholder}} | {{Buscar...}} |

<!-- APPEND:copies-header -->

### Permissoes

| Elemento | Chave i18n | Texto Padrao |
| --- | --- | --- |
| {{Camera permissao}} | {{permissions.camera.title}} | {{Acesso a camera}} |
| {{Camera descricao}} | {{permissions.camera.description}} | {{Precisamos de acesso a camera para tirar fotos}} |
| {{Notificacoes permissao}} | {{permissions.notifications.title}} | {{Notificacoes}} |
| {{Notificacoes descricao}} | {{permissions.notifications.description}} | {{Ative as notificacoes para receber atualizacoes}} |
| {{Localizacao permissao}} | {{permissions.location.title}} | {{Localizacao}} |
| {{Localizacao descricao}} | {{permissions.location.description}} | {{Precisamos da sua localizacao para {{motivo}}}} |

<!-- APPEND:copies-permissoes -->

### Alertas e Dialogs Genericos

| Alert | Chave i18n titulo | Texto titulo | Chave i18n corpo | Texto corpo |
| --- | --- | --- | --- | --- |
| Confirmacao de exclusao | {{alert.delete.title}} | {{Confirmar exclusao}} | {{alert.delete.body}} | {{Tem certeza que deseja excluir? Esta acao nao pode ser desfeita.}} |
| Confirmacao de saida | {{alert.leave.title}} | {{Sair sem salvar?}} | {{alert.leave.body}} | {{Suas alteracoes serao perdidas.}} |
| Atualizacao disponivel | {{alert.update.title}} | {{Atualizacao disponivel}} | {{alert.update.body}} | {{Uma nova versao do app esta disponivel.}} |
| Forcar atualizacao | {{alert.forceUpdate.title}} | {{Atualizacao necessaria}} | {{alert.forceUpdate.body}} | {{Para continuar usando o app, atualize para a versao mais recente.}} |

<!-- APPEND:copies-alertas -->

### Empty States

| Tela/Secao | Chave i18n | Texto | CTA |
| --- | --- | --- | --- |
| {{Lista vazia}} | {{empty.list}} | {{Nenhum item encontrado}} | {{Criar primeiro item}} |
| {{Busca sem resultado}} | {{empty.search}} | {{Nenhum resultado para "{{termo}}"}} | {{Limpar filtros}} |
| {{Erro de carregamento}} | {{empty.error}} | {{Nao foi possivel carregar os dados}} | {{Tentar novamente}} |
| {{Sem conexao}} | {{empty.offline}} | {{Voce esta offline}} | {{Verificar conexao}} |

<!-- APPEND:copies-empty-states -->

---

## Convencoes de Copy

> Quais regras de escrita devem ser seguidas em toda a interface?

| Regra | Exemplo correto | Exemplo incorreto |
| --- | --- | --- |
| Capitalize apenas a primeira palavra em titulos | Criar nova conta | Criar Nova Conta |
| Use voz ativa | Salve suas alteracoes | Suas alteracoes devem ser salvas |
| Seja direto — maximo {{40}} caracteres em CTAs mobile | Salvar | Clique aqui para salvar as alteracoes |
| Evite jargao tecnico | Algo deu errado | Erro 500: Internal Server Error |
| Use pontuacao em frases completas | Suas alteracoes foram salvas. | Suas alteracoes foram salvas |
| Nao use ponto em labels e botoes | Salvar alteracoes | Salvar alteracoes. |
| Adapte texto a tela pequena | Salvar | Salvar todas as alteracoes feitas nesta pagina |
| Textos de permissao devem explicar o motivo | Precisamos da camera para escanear documentos | Permitir acesso a camera |

<!-- APPEND:convencoes -->

---

## Historico de Decisoes

| Data | Decisao | Motivo |
| --- | --- | --- |
| {{YYYY-MM-DD}} | {{Decisao tomada}} | {{Por que foi decidido}} |

<!-- APPEND:decisoes -->
