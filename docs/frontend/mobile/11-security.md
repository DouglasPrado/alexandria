# Seguranca

Define o modelo de seguranca do app mobile, cobrindo autenticacao, protecao de dados no dispositivo, comunicacao segura e protecoes contra ameacas especificas de mobile. Seguranca no app mobile envolve camadas adicionais comparado a web, incluindo armazenamento seguro, biometria e protecao do binario.

---

## Modelo de Autenticacao

> Como o app gerencia autenticacao?

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | {{JWT / OAuth 2.0 / outro}} |
| Armazenamento do token | {{SecureStore (Expo) / Keychain (iOS) / Keystore (Android)}} |
| Refresh token strategy | {{Refresh automatico / Redirect para login}} |
| Expiracao | {{Tempo de expiracao do token}} |
| Biometria | {{Face ID / Touch ID / Fingerprint — para acesso rapido}} |
| Logout | {{Limpar SecureStore + invalidar sessao no servidor}} |

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

| Dado | Storage | Motivo |
|------|---------|--------|
| Access token | SecureStore / Keychain / Keystore | Criptografado pelo SO |
| Refresh token | SecureStore / Keychain / Keystore | Criptografado pelo SO |
| Dados do usuario | MMKV (encriptado) | Performance + seguranca |
| Preferencias (nao-sensiveis) | AsyncStorage / MMKV | Sem necessidade de criptografia |
| Credenciais biometricas | Keychain com flag biometric | Acesso requer biometria |

> **Regra:** NUNCA armazene tokens ou dados sensiveis em AsyncStorage sem criptografia. AsyncStorage grava em texto puro no disco.

---

## Protecao de Rotas/Telas

> Como telas protegidas sao implementadas?

- Root layout: {{Auth guard que redireciona para login}}
- Biometric lock: {{Requer biometria ao voltar do background (opcional)}}
- Fallback: {{Redirect para login com deep link de retorno}}

> Para estrutura completa de navegacao, (ver 07-routes.md).

---

## Comunicacao Segura

> Quais protecoes estao implementadas na comunicacao com o backend?

| Protecao | Descricao | Implementacao |
|----------|-----------|---------------|
| HTTPS obrigatorio | Toda comunicacao via TLS | App Transport Security (iOS) + network security config (Android) |
| Certificate Pinning | Validar certificado do servidor | {{react-native-ssl-pinning / TrustKit}} |
| Token rotation | Rotacao automatica de tokens | Interceptor de refresh token |
| Request signing | Assinatura de requests criticos | {{HMAC no header para operacoes sensiveis}} |

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

| Protecao | Plataforma | Implementacao |
|----------|-----------|---------------|
| ProGuard / R8 | Android | Ofuscacao de codigo Java/Kotlin |
| Hermes bytecode | iOS + Android | JS compilado para bytecode (nao texto puro) |
| Root/Jailbreak detection | iOS + Android | {{react-native-jail-monkey / custom check}} |
| Tamper detection | iOS + Android | {{Verificar integridade do binario}} |
| Debug detection | iOS + Android | {{Detectar debugger anexado em producao}} |
| Code obfuscation | iOS + Android | {{react-native-obfuscating-transformer}} |

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade | Protecao | Implementacao |
|-----------------|----------|---------------|
| Man-in-the-Middle | Certificate pinning + HTTPS | TLS + pin de certificado |
| Data at rest exposure | Armazenamento criptografado | SecureStore / Keychain / Keystore |
| Clipboard sniffing | Limpar clipboard apos uso | Limpar apos copiar dados sensiveis |
| Screenshot/Screen recording | Protecao de tela | {{FLAG_SECURE (Android) / UIScreen notification (iOS)}} |
| Reverse engineering | Ofuscacao + deteccao de tamper | ProGuard + Hermes bytecode |
| Injection via deep link | Validacao de parametros | Sanitizar todos os params de deep link |

<!-- APPEND:vulnerabilidades -->

---

## Checklist de Seguranca

- [ ] Tokens armazenados em SecureStore / Keychain / Keystore (nunca AsyncStorage)
- [ ] Certificate pinning configurado para APIs de producao
- [ ] App Transport Security habilitado (iOS)
- [ ] Network Security Config restritivo (Android)
- [ ] Root/Jailbreak detection implementado
- [ ] ProGuard habilitado para builds de producao (Android)
- [ ] Hermes habilitado (JS como bytecode, nao texto puro)
- [ ] Deep links validados e sanitizados
- [ ] Dependencias auditadas regularmente (`npm audit`)
- [ ] Secrets nunca commitados no repositorio
- [ ] Biometria disponivel para acesso rapido
- [ ] Dados sensiveis nao aparecem em logs
- [ ] Screenshot protection em telas sensiveis

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observability.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre seguranca}} | {{Justificativa}} |
