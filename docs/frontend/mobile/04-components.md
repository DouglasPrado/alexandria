# Componentes

Define a hierarquia de componentes, padroes de composicao e o template de documentacao que cada componente deve seguir. A organizacao em niveis garante reusabilidade e clareza de responsabilidades, evitando componentes que fazem "tudo" e dificultam manutencao.

---

## Hierarquia de Componentes

> Como os componentes sao classificados por nivel de complexidade?

### Primitive Components (UI)

> Componentes atomicos sem logica de negocio. Vivem em `components/ui/`. Baseados em primitivos do React Native (`View`, `Text`, `Pressable`, `TextInput`, `Image`, `ScrollView`).

<!-- do blueprint: shared/03-design-system.md (catalogo mobile), mobile/01-architecture.md (UI Layer) -->

| Componente  | Props Principais                                                                            | Variantes                                         |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Button      | `variant, size, disabled, loading, leftIcon, rightIcon, haptic`                             | `primary, secondary, ghost, destructive, outline` |
| TextInput   | `label, placeholder, value, onChangeText, error, disabled, secureTextEntry, autoCapitalize` | `text, password, search`                          |
| Card        | `padding, elevated, bordered, onPress`                                                      | `default, outlined, elevated, pressable`          |
| BottomSheet | `isOpen, onClose, title, snapPoints, children`                                              | `default, confirmation, fullscreen`               |
| Badge       | `variant, label, count, dot`                                                                | `status, counter, role, dot`                      |
| Avatar      | `source, name, size, fallback`                                                              | `image, initials, fallback`                       |
| Icon        | `name, size, color, animated, strokeWidth`                                                  | `static (lucide), animated (lucide-animated)`     |
| Skeleton    | `width, height, borderRadius, variant`                                                      | `text, circle, rectangle, gallery-thumb`          |
| ProgressBar | `value, max, label, animated, color`                                                        | `linear, indeterminate`                           |
| Divider     | `orientation, spacing, color`                                                               | `horizontal, vertical`                            |

<!-- APPEND:primitivos -->

### Composite Components

> Combinacao de primitivos para padroes recorrentes. Vivem em `components/` ou `components/forms/`.

<!-- do blueprint: 08-use_cases.md (UC-001 a UC-007), mobile/01-architecture.md (Application Layer) -->

| Componente    | Primitivos Usados                     | Contexto de Uso                                                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Form          | `TextInput, Button, View`             | Formularios com validacao: login, vault unlock, convite de membro, registro de no                 |
| TabBar        | `Pressable, Icon, Text, Badge`        | Bottom navigation com 4 tabs: Gallery, Upload, Cluster, Settings; badge de alertas no Cluster     |
| Header        | `Pressable, Text, Icon, View`         | Stack navigator header customizado: back button, titulo da tela, action icons (ex: busca, opcoes) |
| ListItem      | `View, Text, Icon, Pressable, Avatar` | Item de lista para membros, nos e alertas; swipe-to-action via `react-native-gesture-handler`     |
| SearchBar     | `TextInput, Icon, Pressable`          | Busca na galeria por nome/data/evento; exibe/oculta via animacao `reanimated`                     |
| EmptyState    | `Icon, Text, Button`                  | Estado vazio para galeria sem fotos, cluster sem nos ativos, sem alertas; sempre com CTA          |
| SectionHeader | `View, Text`                          | Cabecalho de secao em listas agrupadas (ex: timeline agrupada por mes/ano)                        |
| StatusPill    | `View, Text, Icon`                    | Pill colorido de status reutilizavel: `processing`, `ready`, `error`, `online`, `suspect`, `lost` |

<!-- APPEND:compostos -->

### Feature Components

> Componentes ligados a um dominio de negocio especifico. Vivem em `features/xxx/components/`.

<!-- do blueprint: 00-context.md (atores), 08-use_cases.md (UC-001 a UC-007), mobile/01-architecture.md (Feature Components por dominio) -->

| Componente           | Feature/Dominio | Dados que Consome                                                                                    |
| -------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `SeedPhraseDisplay`  | `auth`          | Array de 12 palavras; exibe em grid 3x4 com fundo de privacidade; obrigatoriamente uma unica vez     |
| `VaultUnlockForm`    | `auth`          | Input de senha do membro; chama `useVault.unlock(password)`; feedback de erro se senha errada        |
| `SeedRecoveryForm`   | `auth`          | Input de 12 palavras em ordem; chama `useAuth.recover(words)` para derivar master key                |
| `GalleryGrid`        | `gallery`       | `FileDTO[]` via `useGallery`; FlashList 3 colunas; `PhotoThumbnail` por item                         |
| `PhotoThumbnail`     | `gallery`       | `FileDTO` (id, preview url, status); blurhash placeholder via `expo-image`                           |
| `TimelineSection`    | `gallery`       | `FileDTO[]` agrupados por mes/ano; `SectionList` com `SectionHeader`                                 |
| `PhotoDetailSheet`   | `gallery`       | `FileDTO` completo (metadata EXIF, size, status, preview); BottomSheet fullscreen                    |
| `UploadQueueList`    | `upload`        | `UploadItem[]` do `uploadStore`; lista de arquivos em fila/processando/concluidos                    |
| `UploadProgressItem` | `upload`        | `UploadItem` (nome, percentual, status); `ProgressBar` + `StatusPill` + cancel action                |
| `SpaceReleaseModal`  | `upload`        | Lista de arquivos elegíveis (uploaded + 3 replicas); calculo de espaco liberavel em GB               |
| `SyncSettingsCard`   | `upload`        | Configuracoes de sync: ativo/inativo, apenas Wi-Fi, frequencia; `settingsStore`                      |
| `ClusterHealthCard`  | `cluster`       | `ClusterDTO` (status, capacidade total/usada, contagem de nos); via `useCluster`                     |
| `MemberCard`         | `cluster`       | `MemberDTO` (nome, role, joinedAt, avatar); admin ve botao de alterar role                           |
| `InviteMemberSheet`  | `cluster`       | Form de email + role; chama `useInviteMember`; exibe link de convite gerado                          |
| `NodeCard`           | `nodes`         | `NodeDTO` (nome, tipo, capacidade, status, lastHeartbeat); `NodeHealthBadge` inline                  |
| `NodeHealthBadge`    | `nodes`         | `NodeDTO.status`; variantes: `online`(verde), `suspect`(amarelo), `lost`(vermelho), `draining`(azul) |
| `RegisterNodeSheet`  | `nodes`         | Form multi-step: tipo (Local/S3/R2/B2) → credenciais → teste de conectividade                        |
| `AlertItem`          | `alerts`        | `AlertDTO` (tipo, mensagem, severity, createdAt); icone por severity; swipe to resolve               |
| `AlertBadge`         | `alerts`        | `alertsStore.unreadCount`; badge vermelho no tab do Cluster                                          |

<!-- APPEND:feature-components -->

---

## Template de Documentacao

> Todo componente deve seguir este padrao de documentacao:

```
### {{NomeDoComponente}}

**Descricao:** {{O que o componente faz}}

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| {{prop}} | {{tipo}} | {{default}} | {{sim/nao}} | {{descricao}} |

**Exemplo de Uso:**
\`\`\`tsx
<{{NomeDoComponente}} prop="valor">
  <Text>Conteudo</Text>
</{{NomeDoComponente}}>
\`\`\`

**Storybook:** [Link para story]({{url}})
```

<details>
<summary>Exemplo — Documentacao do Button</summary>

### Button

**Descricao:** Botao reutilizavel com variantes visuais, suporte a loading state e icones. Baseado em `Pressable` com feedback haptico.

**Props:**
| Prop | Tipo | Default | Obrigatoria | Descricao |
| --- | --- | --- | --- | --- |
| variant | `"primary" \| "secondary" \| "ghost" \| "destructive"` | `"primary"` | Nao | Estilo visual do botao |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Nao | Tamanho do botao |
| loading | `boolean` | `false` | Nao | Exibe ActivityIndicator e desabilita toque |
| disabled | `boolean` | `false` | Nao | Desabilita o botao |
| leftIcon | `ReactNode` | — | Nao | Icone a esquerda do label |
| haptic | `boolean` | `true` | Nao | Feedback haptico ao pressionar |

**Exemplo de Uso:**

```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  <Text>Salvar alteracoes</Text>
</Button>
```

**Storybook:** [Link para story](http://localhost:6006/?path=/story/button)

</details>

---

## Padroes de Composicao

> Quais padroes de composicao sao adotados?

- **Compound Components** — componentes que funcionam juntos via contexto compartilhado
  - Ex: `<List><ListItem /><ListSeparator /></List>`
- **Render Props** — quando o consumidor precisa controlar a renderizacao
  - Usar apenas quando children pattern nao resolve
- **Children pattern** — composicao via `children` para flexibilidade
  - Ex: `<Card><CardHeader /><CardBody /></Card>`
- **Headless components** — logica sem UI, o consumidor fornece a renderizacao
  - Ex: `useBottomSheet()`, `useSwipeable()`
- **FlatList renderItem** — pattern para listas performaticas
  - Ex: `<FlatList renderItem={({ item }) => <ListItem data={item} />} />`

---

## Componentes Nativos Essenciais

> Quais componentes do React Native sao utilizados como base?

| Componente RN          | Uso                                    | Observacao                           |
| ---------------------- | -------------------------------------- | ------------------------------------ |
| `View`                 | Container base para layout (Flexbox)   | Equivalente a `div`                  |
| `Text`                 | Todo texto deve estar dentro de `Text` | Obrigatorio no RN                    |
| `Pressable`            | Botoes e areas tocaveis                | Preferir sobre `TouchableOpacity`    |
| `FlatList`             | Listas longas e performaticas          | Com `keyExtractor` e `getItemLayout` |
| `SectionList`          | Listas agrupadas por secao             | Headers de secao nativos             |
| `ScrollView`           | Conteudo scrollavel (nao-lista)        | Evitar para listas longas            |
| `Image`                | Imagens locais e remotas               | Considerar FastImage para cache      |
| `TextInput`            | Campos de entrada de texto             | Suporte a `secureTextEntry`          |
| `Modal`                | Modais nativos                         | Ou usar bottom sheets                |
| `ActivityIndicator`    | Spinner de loading nativo              | Respeita plataforma                  |
| `KeyboardAvoidingView` | Evita que teclado cubra inputs         | Comportamento diferente iOS/Android  |

---

## Quando Criar vs Reutilizar

> Pergunta-guia para decidir se criar novo componente:

| Situacao                               | Acao                               | Onde criar                     |
| -------------------------------------- | ---------------------------------- | ------------------------------ |
| Sera usado em 2+ lugares               | Crie como componente compartilhado | `components/ui/`               |
| E especifico de uma feature            | Crie dentro da feature             | `features/xxx/components/`     |
| Ja existe no design system             | Reutilize                          | —                              |
| E uma variante de componente existente | Adicione variante ao existente     | Componente original            |
| Requer interacao com API nativa        | Crie wrapper na camada de infra    | `services/` ou `features/xxx/` |

> Antes de criar, verifique o Storybook e o catalogo de componentes. (ver 03-design-system.md)
