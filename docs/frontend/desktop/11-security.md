# Seguranca

Define o modelo de seguranca do frontend desktop, cobrindo autenticacao, protecao contra vulnerabilidades, seguranca de processos (IPC, sandbox, contextBridge), code signing e auto-update seguro. Seguranca em aplicacoes desktop e critica pois a aplicacao tem acesso privilegiado ao sistema operacional do usuario.

---

## Modelo de Autenticacao

> Como o frontend desktop gerencia autenticacao?

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | {{JWT / Session / OAuth 2.0 / outro}} |
| Armazenamento do token | {{safeStorage (encriptado no OS) / electron-store encriptado}} |
| Refresh token strategy | {{Refresh automatico / Redirect para login}} |
| Expiracao | {{Tempo de expiracao do token}} |
| Logout | {{Limpar token do disco + invalidar sessao no servidor}} |

<details>
<summary>Exemplo — Armazenamento seguro com safeStorage (Electron)</summary>

```typescript
import { safeStorage } from 'electron';

// Encriptar token antes de salvar
function saveToken(token: string): void {
  const encrypted = safeStorage.encryptString(token);
  store.set('auth-token', encrypted.toString('base64'));
}

// Desencriptar token ao ler
function getToken(): string | null {
  const encrypted = store.get('auth-token');
  if (!encrypted) return null;
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}
```

</details>

---

## Protecao de Rotas

> Como rotas protegidas sao implementadas?

- Client-side: {{Auth context / route guard component no renderer}}
- Fallback: {{Redirect para /login com return URL}}

> Para estrutura completa de janelas e rotas, (ver 07-rotas.md).

---

## Seguranca de Processos (IPC e Sandbox)

> Como garantimos seguranca na comunicacao entre processos?

### Context Isolation e Sandbox

| Configuracao | Valor Recomendado | Descricao |
|-------------|-------------------|-----------|
| `contextIsolation` | `true` | Isola contexto do preload do renderer |
| `sandbox` | `true` | Restringe acesso do renderer a APIs do Node.js |
| `nodeIntegration` | `false` | Desabilita Node.js no renderer |
| `webSecurity` | `true` | Mantem politicas de seguranca web |
| `allowRunningInsecureContent` | `false` | Bloqueia conteudo HTTP em HTTPS |

### Secure IPC (Validacao de Mensagens)

| Aspecto | Implementacao |
|---------|---------------|
| Canais tipados | Todos os canais IPC definidos em `shared/ipc-channels.ts` com tipos |
| Validacao de payload | Zod schemas para validar entrada de cada handler |
| Whitelist de canais | Preload expoe apenas canais permitidos via `contextBridge` |
| Rate limiting | Limitar frequencia de chamadas IPC do renderer |

<details>
<summary>Exemplo — Preload seguro com contextBridge</summary>

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// Whitelist explicita de canais permitidos
const ALLOWED_CHANNELS = ['user:get', 'file:save', 'app:get-version'] as const;
const ALLOWED_EVENTS = ['app:update-available', 'app:deep-link'] as const;

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!ALLOWED_CHANNELS.includes(channel as any)) {
      throw new Error(`IPC channel "${channel}" is not allowed`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!ALLOWED_EVENTS.includes(channel as any)) {
      throw new Error(`IPC event "${channel}" is not allowed`);
    }
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
});
```

</details>

---

## Protecao contra Vulnerabilidades

> Quais protecoes estao implementadas?

| Vulnerabilidade | Protecao | Implementacao |
|-----------------|----------|---------------|
| XSS (Cross-Site Scripting) | Sanitizacao de inputs, escape de output | {{React auto-escape + DOMPurify para HTML dinamico}} |
| Remote Code Execution | Sandbox + context isolation | {{nodeIntegration: false, sandbox: true}} |
| Prototype Pollution | Validacao de payloads IPC | {{Zod schemas + Object.freeze}} |
| Path Traversal | Validacao de caminhos de arquivo | {{Sanitizar paths no main process antes de acessar FS}} |
| Clickjacking | Frame protection | {{`webPreferences.webSecurity: true`}} |
| Injection | Validacao de inputs | {{Zod schemas + sanitizacao}} |
| Sensitive Data Exposure | Encriptacao de dados em disco | {{safeStorage para tokens, electron-store com encryptionKey}} |

<!-- APPEND:vulnerabilidades -->

---

## Content Security Policy (CSP)

> O renderer aplica CSP?

{{Descreva a politica CSP aplicada no renderer ou indique que sera configurada}}

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' {{api-domain}};
  font-src 'self';
  frame-ancestors 'none';
```

> Em apps desktop, CSP no renderer e especialmente importante para prevenir carregamento de scripts remotos maliciosos.

---

## Code Signing

> A aplicacao e assinada digitalmente?

| Plataforma | Ferramenta | Certificado | Descricao |
|------------|-----------|-------------|-----------|
| Windows | SignTool / electron-builder | {{EV Code Signing Certificate}} | Assinatura Authenticode para .exe e .msi |
| macOS | codesign / electron-builder | {{Apple Developer ID}} | Assinatura + Notarization via Apple |
| Linux | GPG | {{GPG key}} | Assinatura de pacotes .deb e .rpm |

> Aplicacoes nao assinadas geram alertas de seguranca no OS e podem ser bloqueadas pelo SmartScreen (Windows) ou Gatekeeper (macOS).

---

## Auto-Update Seguro

> Como garantimos que atualizacoes sao autenticas?

| Aspecto | Implementacao |
|---------|---------------|
| Canal de distribuicao | {{GitHub Releases / S3 + CloudFront / servidor proprio}} |
| Verificacao de assinatura | {{electron-updater verifica assinatura do binario}} |
| HTTPS obrigatorio | {{Sim — download apenas via HTTPS}} |
| Rollback | {{Manter versao anterior para rollback automatico em caso de falha}} |
| Verificacao de integridade | {{Checksum SHA-256 do pacote de update}} |

---

## File System Access Control

> Como controlamos o acesso ao file system?

| Regra | Implementacao |
|-------|---------------|
| Renderer nunca acessa FS diretamente | Todas as operacoes via IPC para o main process |
| Paths sao validados no main | Verificar que o path esta dentro de diretorios permitidos |
| Diretorios permitidos | `app.getPath('userData')`, `app.getPath('downloads')`, paths selecionados pelo usuario via dialog |
| Operacoes de escrita logadas | Registrar toda operacao de escrita no file system |

---

## Checklist de Seguranca

- [ ] `contextIsolation: true` e `sandbox: true` em todas as janelas
- [ ] `nodeIntegration: false` em todas as janelas
- [ ] Preload expoe apenas canais IPC necessarios via whitelist
- [ ] Tokens armazenados com `safeStorage` (encriptados pelo OS)
- [ ] Payloads IPC validados com Zod schemas
- [ ] CSP configurado no renderer
- [ ] Aplicacao assinada digitalmente (Windows, macOS, Linux)
- [ ] Auto-update verifica assinatura e integridade
- [ ] Paths de file system validados no main process
- [ ] Dependencias auditadas regularmente (`npm audit`)
- [ ] Secrets nunca commitados no repositorio
- [ ] HTTPS obrigatorio para comunicacao com APIs e updates

<!-- APPEND:checklist -->

> Para monitoramento de erros de seguranca, (ver 12-observabilidade.md).

---

## Historico de Decisoes

| Data | Decisao | Motivo |
|------|---------|--------|
| {{YYYY-MM-DD}} | {{Decisao sobre seguranca}} | {{Justificativa}} |
