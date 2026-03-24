# Seguranca

Define o modelo de seguranca do frontend desktop, cobrindo autenticacao, protecao contra vulnerabilidades, seguranca de processos (IPC, sandbox, contextBridge), code signing e auto-update seguro. Seguranca em aplicacoes desktop e critica pois a aplicacao tem acesso privilegiado ao sistema operacional do usuario.

---

## Modelo de Autenticacao

> Como o frontend desktop gerencia autenticacao?

| Aspecto | Implementacao |
|---------|---------------|
| Tipo de autenticacao | JWT assinado com chave do cluster (Ed25519); sem senhas — acesso via convite + vault unlock |
| Armazenamento do token | `safeStorage.encryptString()` → electron-store key `auth.token`; nunca em texto puro em disco |
| Refresh token strategy | JWT re-emitido automaticamente quando valido e com < 1h restante; vault deve estar desbloqueado |
| Expiracao | 24h (alinhado com `13-security.md`); sessao encerrada se vault for bloqueado antes disso |
| Logout | Limpa `auth.token` do electron-store + zera Zustand stores em memoria + POST `/auth/logout` no orquestrador |

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

- Client-side: `AuthGuard` component verifica `authStore.isVaultUnlocked` em cada rota protegida
- Fallback: Redirect para `/unlock` (vault nao desbloqueado) ou `/onboarding` (cluster nao configurado)

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

// Whitelist explicita de canais Alexandria
const ALLOWED_CHANNELS = [
  'vault:unlock', 'vault:lock', 'vault:status',
  'file:list', 'file:download', 'file:upload-batch',
  'sync:start', 'sync:stop', 'sync:add-folder', 'sync:remove-folder',
  'cluster:health', 'cluster:nodes-list',
  'node:register', 'node:drain',
  'settings:get', 'settings:set',
  'app:get-version', 'app:get-metrics',
] as const;
const ALLOWED_EVENTS = [
  'app:update-available', 'sync:progress', 'sync:queue-update',
  'node:status-changed', 'file:ready', 'cluster:alert-fired',
  'app:online-status', 'app:theme-changed',
] as const;

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
| XSS (Cross-Site Scripting) | Sanitizacao de inputs, escape de output | React auto-escapa output por padrao; DOMPurify para qualquer HTML dinamico (ex: preview de doc) |
| Remote Code Execution | Sandbox + context isolation | `nodeIntegration: false`, `sandbox: true`, `contextIsolation: true` em todas as janelas |
| Prototype Pollution | Validacao de payloads IPC | Zod schemas validam entrada de cada handler; `Object.freeze` em constantes criticas |
| Path Traversal | Validacao de caminhos de arquivo | Main process valida que paths estao dentro de `userData`, `downloads` ou pastas selecionadas pelo usuario |
| Clickjacking | Frame protection | `webPreferences.webSecurity: true`; CSP `frame-ancestors 'none'` |
| Injection | Validacao de inputs | Zod schemas em todos os handlers IPC; Prisma type-safe elimina SQL injection no orquestrador |
| Sensitive Data Exposure | Encriptacao de dados em disco | JWT via `safeStorage` (OS keychain); vault em arquivo AES-256-GCM separado; secrets nunca em texto puro |
| Supply Chain Attack | Lockfile + auditoria de dependencias | `pnpm-lock.yaml` commitado; `pnpm audit` no CI; Dependabot para alertas de vulnerabilidades |

<!-- APPEND:vulnerabilidades -->

---

## Content Security Policy (CSP)

> O renderer aplica CSP?

O renderer nunca chama a API do orquestrador diretamente — toda comunicacao externa passa pelo main process via IPC. Por isso, `connect-src` pode ser `'none'`, eliminando uma superficie de ataque inteira. Fonts sao bundled localmente (`@font-face` WOFF2), sem CDN.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'none';
  font-src 'self';
  media-src 'self' blob:;
  frame-ancestors 'none';
  object-src 'none';
```

> `blob:` em `img-src` e `media-src` e necessario para thumbnails gerados localmente (URL.createObjectURL). `connect-src 'none'` e possivel porque o renderer nunca faz fetch direto — tudo passa por `window.electronAPI.invoke()`.

<!-- do blueprint: 13-security.md — zero-knowledge; renderer nao acessa API diretamente -->

> Em apps desktop, CSP no renderer e especialmente importante para prevenir carregamento de scripts remotos maliciosos.

---

## Code Signing

> A aplicacao e assinada digitalmente?

| Plataforma | Ferramenta | Certificado | Descricao |
|------------|-----------|-------------|-----------|
| Windows | SignTool via electron-builder | Code Signing Certificate (Standard OV para distribuicao interna familiar; EV se publicar na Microsoft Store) | Assinatura Authenticode para .exe e NSIS installer |
| macOS | codesign + notarytool via electron-builder | Apple Developer ID Application ($99/ano) + notarization obrigatoria para macOS 15+ | Assinatura + notarization evita bloqueio do Gatekeeper |
| Linux | GPG via electron-builder | Chave GPG do projeto (Douglas Prado) | Assinatura de .deb, .rpm e AppImage; verificavel por `gpg --verify` |

> Aplicacoes nao assinadas geram alertas de seguranca no OS e podem ser bloqueadas pelo SmartScreen (Windows) ou Gatekeeper (macOS).

---

## Auto-Update Seguro

> Como garantimos que atualizacoes sao autenticas?

| Aspecto | Implementacao |
|---------|---------------|
| Canal de distribuicao | GitHub Releases (`electron-updater` com `provider: 'github'`); publico e verificavel |
| Verificacao de assinatura | `electron-updater` verifica assinatura do binario automaticamente (usando certificado embutido no app) |
| HTTPS obrigatorio | Sim — `electron-updater` rejeita downloads via HTTP |
| Rollback | Versao anterior mantida em cache local; rollback manual se nova versao falhar ao iniciar |
| Verificacao de integridade | `electron-updater` gera e verifica SHA-512 checksum de cada artefato de update |

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
| 2026-03-24 | `safeStorage` para JWT em vez de keychain nativo direto | API Electron abstrai OS keychain (macOS), DPAPI (Windows) e libsecret (Linux) sem dependencias nativas extras; integra com electron-store via base64 |
| 2026-03-24 | `connect-src 'none'` no CSP do renderer | Renderer nao faz fetch direto — toda comunicacao e via IPC. CSP mais restritiva elimina superficie de SSRF/exfiltration no renderer |
| 2026-03-24 | GitHub Releases como canal de auto-update | Distribuicao publica e auditavel; electron-updater tem suporte nativo; sem custo de infraestrutura adicional para projeto familiar open-source |
