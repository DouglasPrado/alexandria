# Seguranca

Define o modelo de seguranca do app mobile, cobrindo autenticacao, protecao de dados no dispositivo, comunicacao segura e protecoes contra ameacas especificas de mobile. Seguranca no app mobile envolve camadas adicionais comparado a web, incluindo armazenamento seguro, biometria e protecao do binario.

---

## Modelo de Autenticacao

> Como o app gerencia autenticacao?

| Aspecto                | Implementacao                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipo de autenticacao   | JWT assinado com chave do cluster (Ed25519); emitido pelo Orquestrador apos aceite de convite                                                       |
| Armazenamento do token | `expo-secure-store` — mapeado para Keychain (iOS) e Android Keystore via AES-256; nunca em AsyncStorage                                             |
| Refresh token strategy | Re-emissao automatica se JWT valido e proximo de expirar (< 1h restante); redirect para login se expirado ou invalido (HTTP 401)                    |
| Expiracao              | JWT: 24h; Tokens de convite: 7 dias, single-use, assinados com Ed25519                                                                              |
| Vault local            | Vault criptografado individualmente por senha do membro — unlock no cold start via `VaultUnlockScreen`; chave derivada da senha com PBKDF2          |
| Logout                 | `SecureStore.deleteItemAsync('auth-token')` + `SecureStore.deleteItemAsync('vault-key')` + limpar stores Zustand + invalidar sessao no Orquestrador |

<!-- do blueprint: 13-security.md (autenticacao JWT 24h, tokens de convite Ed25519, vault por membro) -->

<details>
<summary>Exemplo — Fluxo de autenticacao com SecureStore</summary>

```
1. Usuario submete credenciais no LoginForm
2. POST /api/auth/login -> Backend valida credenciais
3. Backend retorna { accessToken, refreshToken }
4. App armazena tokens no SecureStore (Keychain/Keystore)
5. App configura Authorization header para requests
6. App navega para tela principal
7. Em cada request, interceptor injeta token automaticamente
8. Se 401, tenta refresh. Se falhar, redireciona para login
9. Opcionalmente, oferece login biometrico para proximas sessoes
```

</details>

---

## Armazenamento Seguro

> Como dados sensiveis sao armazenados no dispositivo?

| Dado                         | Storage                           | Motivo                          |
| ---------------------------- | --------------------------------- | ------------------------------- |
| Access token                 | SecureStore / Keychain / Keystore | Criptografado pelo SO           |
| Refresh token                | SecureStore / Keychain / Keystore | Criptografado pelo SO           |
| Dados do usuario             | MMKV (encriptado)                 | Performance + seguranca         |
| Preferencias (nao-sensiveis) | AsyncStorage / MMKV               | Sem necessidade de criptografia |
| Credenciais biometricas      | Keychain com flag biometric       | Acesso requer biometria         |

> **Regra:** NUNCA armazene tokens ou dados sensiveis em AsyncStorage sem criptografia. AsyncStorage grava em texto puro no disco.

---

## Protecao de Rotas/Telas

> Como telas protegidas sao implementadas?

- Root layout: Auth guard em `app/_layout.tsx` — verifica `isAuthenticated` e `vaultUnlocked`; redireciona para `/(auth)/login` ou `/(auth)/vault-unlock` conforme estado
- Vault lock: Vault relockado automaticamente apos inatividade configuravel (padrao: 15 min em background); retorno para `/(auth)/vault-unlock` ao abrir o app
- Admin guard: `app/nodes/_layout.tsx` verifica `member.role === 'admin'`; redireciona para `/(tabs)/cluster` se nao for admin
- Fallback: Redirect para login preservando deep link de retorno via `router.replace('/(auth)/login')`

<!-- do blueprint: 13-security.md (RBAC admin/membro/leitura), 07-routes.md (auth guard no root layout) -->

> Para estrutura completa de navegacao, (ver 07-routes.md).

---

## Comunicacao Segura

> Quais protecoes estao implementadas na comunicacao com o backend?

| Protecao               | Descricao                                                          | Implementacao                                                                       |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| HTTPS obrigatorio      | Toda comunicacao via TLS                                           | App Transport Security (iOS) + network security config (Android)                    |
| Certificate Pinning    | Validar certificado do Orquestrador — nao na v1; planejado para v2 | `react-native-ssl-pinning` (planejado); v1 confia no Let's Encrypt via Caddy + HSTS |
| Token rotation         | Reemissao automatica de JWT proximo de expirar (< 1h)              | Interceptor Axios verifica `exp` antes de cada request                              |
| Request signing        | Manifests assinados com chave do cluster (Ed25519)                 | Core SDK assina manifests antes de enviar ao Orquestrador                           |
| Zero-knowledge payload | Chunks enviados ja criptografados (AES-256-GCM)                    | Core SDK criptografa no device — Orquestrador nunca ve dados em claro               |

<!-- do blueprint: 13-security.md (TLS 1.3, certificate pinning nao na v1, assinatura de manifests RF-052) -->

---

## App Transport Security (iOS)

> Configuracao de ATS no Info.plist:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <!-- Permitir apenas dominios especificos se necessario -->
</dict>
```

> **Regra:** Nunca desabilitar ATS em producao (`NSAllowsArbitraryLoads: true`). Apenas para desenvolvimento local.

---

## Protecao do Binario

> Quais protecoes sao aplicadas ao binario do app?

| Protecao                 | Plataforma         | Implementacao                                                                                                          |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| ProGuard / R8            | Android            | Ofuscacao de codigo Java/Kotlin                                                                                        |
| Hermes bytecode          | iOS + Android      | JS compilado para bytecode (nao texto puro)                                                                            |
| Root/Jailbreak detection | iOS + Android      | `expo-device` (Device.isRootedExperimentalAsync) — alertar usuario e desabilitar vault unlock em devices comprometidos |
| Tamper detection         | iOS + Android      | Verificacao de assinatura do IPA/APK pelo SO; builds EAS assinados com chave propria                                   |
| Debug detection          | Android (producao) | `__DEV__ === false` garante modo producao; ProGuard/R8 remove codigo de debug                                          |
| Code obfuscation         | Android            | ProGuard / R8 habilitado em builds de producao via `android/app/proguard-rules.pro`                                    |

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade             | Protecao                                                                 | Implementacao                                                                                     |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Man-in-the-Middle           | Certificate pinning + HTTPS                                              | TLS + pin de certificado                                                                          |
| Data at rest exposure       | Armazenamento criptografado                                              | SecureStore / Keychain / Keystore                                                                 |
| Clipboard sniffing          | Limpar clipboard apos uso                                                | Limpar apos copiar dados sensiveis                                                                |
| Screenshot/Screen recording | Protecao de tela em telas sensiveis (SeedPhraseDisplay, VaultUnlockForm) | `FLAG_SECURE` via `expo-screen-capture` (Android); `UIScreen.capturedDidChangeNotification` (iOS) |
| Reverse engineering         | Ofuscacao + deteccao de tamper                                           | ProGuard + Hermes bytecode                                                                        |
| Injection via deep link     | Validacao de parametros                                                  | Sanitizar todos os params de deep link                                                            |

<!-- APPEND:vulnerabilidades -->

---

## Checklist de Seguranca

**Armazenamento e Criptografia:**

- [ ] JWT e vault-key armazenados em `expo-secure-store` (nunca AsyncStorage)
- [ ] Vault lock ativo apos inatividade (15 min em background)
- [ ] Screenshot protection ativa em `SeedPhraseDisplay` e `VaultUnlockScreen`
- [ ] Core SDK criptografa chunks com AES-256-GCM antes de qualquer transmissao

**Comunicacao:**

- [ ] HTTPS obrigatorio (ATS no iOS, Network Security Config no Android)
- [ ] JWT valido em todas as requests autenticadas
- [ ] Orquestrador com HSTS habilitado (verificar header `Strict-Transport-Security`)

**Controle de Acesso:**

- [ ] Auth guard no root layout redireciona unauthenticated para login
- [ ] Admin guard no NodesStack bloqueia membros sem role `admin`
- [ ] Role validado server-side em cada endpoint (nao confiar no JWT client-only)

**Protecao do Binario:**

- [ ] ProGuard / R8 habilitado para builds Android de producao
- [ ] Hermes habilitado (JS como bytecode)
- [ ] Root/jailbreak detection bloqueia vault unlock em devices comprometidos
- [ ] `__DEV__ === false` em todos os builds de producao

**Dados e Logs:**

- [ ] Seed phrase nunca armazenada digitalmente pelo app
- [ ] Dados sensiveis (token, vault-key, credentials) nunca aparecem em logs
- [ ] Deep link params (token de convite) validados e sanitizados antes de uso
- [ ] `npm audit` sem vulnerabilidades criticas ou high em CI

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observability.md).

---

## Historico de Decisoes

| Data       | Decisao                                                            | Motivo                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-24 | `expo-secure-store` em vez de AsyncStorage para JWT e vault-key    | AsyncStorage grava em texto puro no disco — inaceitavel para um app zero-knowledge; SecureStore usa Keychain (iOS) e Keystore (Android) com criptografia gerenciada pelo SO           |
| 2026-03-24 | Vault unlock como tela separada do login                           | O vault e desbloqueado localmente via derivacao de chave (PBKDF2) sem chamada de API; separar evita re-autenticar no Orquestrador a cada abertura do app, preservando sessao JWT      |
| 2026-03-24 | Screenshot protection obrigatoria em `SeedPhraseDisplay`           | Seed phrase e a chave mestre de recuperacao; captura de tela (por malware ou acidentalmente) seria catastrofica; `expo-screen-capture` desabilita antes de exibir e reabilita ao sair |
| 2026-03-24 | Certificate pinning planejado para v2 (nao na v1)                  | Pinning aumenta risco de lock-out se certificado renovar; Let's Encrypt + HSTS + Caddy e suficiente para v1 familiar; adicionar pinning quando escalar para multiplos clusters        |
| 2026-03-24 | Root/jailbreak detection bloqueia vault unlock (nao o app inteiro) | Bloquear o app inteiro causa ma UX e pode frustrar usuarios legitimos; bloquear apenas o vault unlock preserva funcionalidades basicas enquanto protege o dado mais sensivel          |
