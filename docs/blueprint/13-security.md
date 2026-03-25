# 13. Segurança

> Segurança não é uma feature — é uma propriedade do sistema. Documente como o sistema se protege.

---

## 13.1 Modelo de Ameaças

> Abordagem baseada no modelo **STRIDE** aplicada aos componentes do Alexandria.

| Ameaça | Categoria | Impacto | Mitigação |
|--------|-----------|---------|-----------|
| Atacante se passa por membro do cluster | Spoofing | Alto — acesso não autorizado a fotos/vídeos familiares | Tokens de convite assinados (Ed25519) com expiração; JWT para sessões; autenticação mútua entre nós (mTLS ou Ed25519) |
| Adulteração de chunks durante transporte ou armazenamento | Tampering | Alto — corrupção silenciosa de dados | SHA-256 hash por chunk (content-addressable); scrubbing periódico recalcula e verifica; chunks criptografados com AES-256-GCM (autenticado — detecta adulteração) |
| Adulteração de manifests | Tampering | Alto — redirecionamento de chunks, perda de integridade | Assinatura criptográfica de manifests; manifests com assinatura inválida são rejeitados |
| Provedor cloud lê dados armazenados | Information Disclosure | Alto — fotos de família, dados de localização GPS expostos | Zero-knowledge: criptografia AES-256-GCM no cliente antes do upload; nem provedor, nem orquestrador veem dados em claro |
| Vazamento de tokens OAuth/credenciais S3/senhas do membro | Information Disclosure | Alto — acesso a buckets cloud e contas do membro | Vault criptografado individual por membro com sua senha; tokens e senhas em texto puro apenas em memória, nunca em disco; vaults replicados criptografados |
| Comprometimento da master key | Information Disclosure | Crítico — acesso a todos os dados do cluster | Master key derivada da seed em memória; nunca persistida em disco; envelope encryption limita blast radius por file key |
| Perda/roubo da seed phrase | Information Disclosure | Crítico — acesso total ao cluster | Seed nunca armazenada digitalmente pelo sistema; instruções claras ao admin; recovery guardians em fase futura |
| DDoS no orquestrador (API pública) | Denial of Service | Médio — uploads e galeria indisponíveis | Rate limiting via NestJS Guard; Caddy com rate limit; nós continuam servindo chunks cached localmente |
| Nó malicioso enviando chunks corrompidos | Tampering | Médio — dados corrompidos se scrubbing falhar | Verificação de hash na recepção; rejeitar chunks com hash inconsistente; scrubbing periódico como segunda camada |
| Membro com role "leitura" tenta fazer upload | Elevation of Privilege | Baixo — bypass de permissões | Verificação de role em cada endpoint (middleware NestJS); role stored em JWT e validado server-side |

---

## 13.2 Autenticação

O Alexandria usa autenticação em duas camadas: **membros** (pessoas) e **nós** (dispositivos/serviços).

### Autenticação de Membros

- **Método:** JWT (JSON Web Token) assinado com chave do cluster
- **Provedor:** Implementação própria (seed → cluster keys → JWT signing)
- **Fluxo:** Token de convite assinado → aceite → JWT emitido → usado em todas as requests

### Fluxo de Autenticação

```
1. Admin gera token de convite (assinado com Ed25519, expiração 7d)
2. Membro acessa link de convite
3. Orquestrador valida assinatura + expiração
4. Orquestrador cria registro de membro com role configurada
5. Orquestrador emite JWT com {membro_id, cluster_id, role, exp}
6. Web Client armazena JWT (httpOnly cookie)
7. Todas as requests incluem JWT no header Authorization
8. Middleware NestJS valida JWT em cada request
```

### Autenticação de Nós

- **Método:** Token de registro assinado + heartbeat autenticado
- **Fluxo:** Admin registra nó → nó recebe token → usa token em heartbeats e operações
- **Futuro (Should):** Mutual TLS ou Ed25519 para autenticação bidirecional (RF-051)

### Políticas de Credenciais

- Complexidade de senha: N/A (sem senhas — autenticação via convites e JWT)
- Expiração de tokens JWT: 24h
- Refresh tokens: JWT re-emitido automaticamente se válido e próximo de expirar
- Tentativas de login: N/A (sem senha); tokens de convite single-use
- MFA: Não na v1; seed phrase como segundo fator implícito para operações admin

---

## 13.3 Autorização

- **Modelo:** RBAC (Role-Based Access Control) com 3 roles fixos

### Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| admin | Administrador do cluster; criador ou designado | Criar cluster, convidar/remover membros, registrar/remover nós, upload/download, gerenciar configurações, executar recovery, ver alertas, aprovar drains |
| membro | Membro regular da família | Upload de arquivos, visualizar galeria, download, ver próprios uploads |
| leitura | Acesso somente leitura (ex.: avós) | Visualizar galeria, download, navegar timeline; NÃO pode fazer upload, gerenciar nós ou membros |

### Regras de Acesso

- **Princípio do menor privilégio:** Novos membros entram como "leitura" por padrão; admin promove explicitamente
- **Segregação:** Apenas admin pode gerenciar nós e membros; operações destrutivas (drain, remover membro) requerem confirmação
- **Verificação:** Role validado em cada request via middleware NestJS (extraído do JWT, verificado server-side contra banco)
- **Imutabilidade:** Criador do cluster é admin permanente; não pode ser rebaixado (apenas transferir admin)

---

## 13.4 Proteção de Dados

### Dados em Trânsito

- **Protocolo:** TLS 1.3 obrigatório em toda comunicação (Caddy para terminação externa; NestJS com TLS nativo Node.js para inter-nó)
- **Certificate Pinning:** Não na v1; Caddy usa Let's Encrypt com auto-renovação
- **Cifras permitidas:** TLS 1.3 cipher suites (AES-256-GCM-SHA384, CHACHA20-POLY1305-SHA256)
- **HSTS:** Habilitado via Caddy (max-age=31536000; includeSubDomains)

### Dados em Repouso

- **Criptografia:** AES-256-GCM em todos os chunks (encrypt-before-upload, zero-knowledge)
- **Gerenciamento de chaves:** Envelope encryption próprio — seed → master key → file keys → chunk keys. Vault criptografado individual por membro (não KMS externo)
- **Backups criptografados:** pg_dump criptografado antes de enviar ao S3; vaults dos membros já criptografados por design

### Dados Sensíveis (PII)

| Dado | Classificação | Proteção | Retenção |
|------|---------------|----------|----------|
| Fotos e vídeos familiares | Pessoal / Sensível | AES-256-GCM em repouso; TLS 1.3 em trânsito; acesso restrito por cluster_id e role | Indefinida (até exclusão pelo membro) |
| Metadados EXIF (GPS, data) | PII | Criptografados dentro do manifest; GPS pode revelar localização de casa/escola | Indefinida; excluídos com o arquivo |
| Tokens OAuth (Google, S3) | Sensível | Vault do membro criptografado; texto puro apenas em memória | Até revogação ou troca de credenciais |
| Senhas do membro | Sensível | Vault do membro criptografado; texto puro apenas em memória | Até exclusão ou atualização pelo membro |
| Seed phrase (12 palavras) | Crítico | NUNCA armazenada digitalmente pelo sistema; apenas com o usuário (papel, cofre) | N/A (offline) |
| Master key | Crítico | Derivada da seed em memória (RAM); nunca persistida em disco | Duração da sessão do orquestrador |
| E-mail de membros | PII | Armazenado em PostgreSQL; criptografado em trânsito | Até remoção do membro |
| Nomes de arquivos originais | Pessoal | Armazenados em PostgreSQL; metadata do manifest criptografado | Até exclusão do arquivo |

- **Mascaramento:** Não aplicável (dados criptografados end-to-end)
- **Direito ao esquecimento:** Membro pode deletar seus dados — manifests, chunks e metadata removidos
- **Política de descarte:** Chunks de arquivo deletado viram órfãos → GC remove periodicamente

---

## 13.5 Checklist de Segurança

Checklist baseado no **OWASP Top 10** adaptado para o Alexandria.

| Item | Status | Responsável | Observações |
|------|--------|-------------|-------------|
| Prevenção de Injection | Planejado | Douglas | Prisma com type-safe queries elimina SQL injection; validação de input em todos os endpoints NestJS |
| Autenticação e Sessão | Planejado | Douglas | JWT assinado com chave do cluster; expiração 24h; httpOnly cookies; sem senhas |
| Exposição de Dados Sensíveis | Planejado | Douglas | Zero-knowledge: tudo criptografado antes do upload; sem dados sensíveis em logs (pino com redaction) |
| Controle de Acesso | Planejado | Douglas | RBAC com 3 roles; middleware NestJS verifica role em cada endpoint; testes de autorização |
| Configuração de Segurança | Planejado | Douglas | HSTS via Caddy; CORS restrito à origem do web client; TLS 1.3 only |
| XSS | Planejado | Douglas | Next.js 16 escapa output por padrão (React); CSP header via Caddy; sem renderização de HTML user-supplied |
| CSRF | Planejado | Douglas | SameSite=Strict em cookies; JWT em header (não cookie) para API; origin validation |
| Dependências vulneráveis | Planejado | Douglas | `npm audit` no CI; Dependabot para packages npm; pin de versões major |

---

## 13.6 Auditoria e Compliance

### Regulamentações Aplicáveis

- **LGPD (Lei Geral de Proteção de Dados):** Dados pessoais de membros (e-mail, nomes); fotos podem conter dados de menores; GPS pode revelar endereço residencial
- **Consentimento:** Implícito ao aceitar convite do cluster; membro pode sair e solicitar exclusão de dados
- **Direito ao esquecimento:** Implementado — membro pode deletar seus dados, manifests e metadata

### Logging de Auditoria

- **Eventos auditados:** Login/logout, criação de cluster, convite de membro, registro de nó, upload de arquivo, download, drain de nó, recovery, alterações de permissão, alertas gerados/resolvidos
- **Formato:** JSON estruturado via `pino` + `nestjs-pino` — timestamp, evento, ator, recurso, resultado
- **Destino:** stdout (Docker logs) → agregador futuro (Grafana Loki em fase 2)
- **Imutabilidade:** Logs em stdout são append-only por design; rotação via Docker log driver

### Retenção

| Tipo de Log | Período de Retenção | Armazenamento | Justificativa |
|-------------|---------------------|---------------|---------------|
| Logs de auditoria (operações) | 90 dias | Docker logs + rotação | Troubleshooting e compliance LGPD |
| Logs de acesso (API requests) | 30 dias | Docker logs + rotação | Debugging e monitoramento |
| Alertas | Indefinido | PostgreSQL (tabela alerts) | Histórico de saúde do cluster |
| Scrubbing reports | 90 dias | Logs estruturados | Prova de verificação de integridade |

### Resposta a Incidentes

- **Plano de resposta:** 1) Detectar via alertas/logs; 2) Isolar (revogar tokens, desconectar nó comprometido); 3) Investigar (logs de auditoria); 4) Remediar (re-encriptar se necessário); 5) Comunicar (família afetada)
- **Equipe responsável:** Douglas Prado (único maintainer)
- **SLA de notificação:** 72h para LGPD (dados pessoais comprometidos)
- **Runbook:** A ser documentado em `docs/runbooks/security-incident.md` (Fase 1)

---

<!-- added: opensource -->
## Vulnerability Disclosure Policy

- **Channel**: security@alexandria.app OR [GitHub Security Advisories](https://github.com/douglas-prado/alexandria/security/advisories/new)
- **PGP**: public key available in `SECURITY.md` at the repository root
- **Timeline**:
  - Acknowledgment: within 48 hours
  - Assessment: within 7 days
  - Fix for critical: within 14 days
  - Fix for high: within 30 days
  - Coordinated public disclosure: 90 days after report
- **CVE**: request CVE for confirmed vulnerabilities via MITRE or GitHub Advisory Database
- **Supply Chain Security**:
  - Dependabot enabled for automatic dependency updates
  - `npm audit` runs on every CI build
  - SBOM (Software Bill of Materials) generated per release
  - Release artifacts signed with GitHub Actions OIDC (SLSA Level 2 target)
  - All release tags GPG-signed by BDFL maintainer

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [STRIDE Threat Model](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [BIP-39 — Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- ADR-005: Envelope encryption com seed phrase BIP-39
