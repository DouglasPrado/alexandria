# Contexto do Sistema

Esta seção estabelece **o que é o sistema, quem o usa e onde ele termina**. É o ponto de partida para alinhar todos sobre o escopo da POC antes de entrar em detalhes técnicos.

---

## O que é

Sistema de armazenamento familiar distribuído que permite guardar fotos, vídeos e documentos por décadas, distribuindo dados criptografados entre dispositivos da família e provedores cloud, com recuperação completa via frase de 12 palavras.

---

## Quem usa

| Ator | Tipo | O que faz no sistema |
| --- | --- | --- |
| Administrador Familiar | Pessoa | Cria o cluster, convida membros, adiciona/remove nós, monitora saúde do sistema, executa recovery |
| Membro Familiar | Pessoa | Faz upload de fotos/vídeos, visualiza galeria, navega pelo acervo |
| Sync Engine | Sistema | Detecta novos arquivos nos dispositivos e envia ao cluster automaticamente |
| Orquestrador | Sistema | Coordena distribuição de chunks, gerencia metadados, executa replicação e auto-healing |
| Provedores Cloud (S3, R2) | Sistema | Armazenam chunks criptografados como nós de storage |

---

## Sistemas externos

| Sistema | Tipo de integração | Função |
| --- | --- | --- |
| AWS S3 / Cloudflare R2 | S3-compatible API | Armazenamento de chunks criptografados em buckets |
| FFmpeg | CLI / biblioteca | Transcodificação de vídeo (H.265/AV1) e processamento de mídia |
| PostgreSQL | Driver nativo | Banco de metadados do orquestrador (manifests, nós, chunks) |
| Redis | Driver nativo | Fila de processamento para pipeline de mídia |
| DNS Provider | DNS | Descoberta do orquestrador pelos nós via domínio fixo |

---

## Limites da POC

**A POC inclui:**

- Criar cluster familiar com identidade criptográfica e seed phrase
- Convidar membros com permissões (admin, membro, leitura)
- Registrar nós locais e S3/R2
- Upload com pipeline completo (resize → compress → chunk → encrypt → distribute)
- Replicação 3x com auto-healing
- Download e visualização com placeholder files
- Recovery do orquestrador via seed phrase + vault
- Web client básico (upload, galeria, download)
- Alertas de saúde do cluster (nó offline, replicação baixa)
- Heartbeat monitoring de nós

**A POC NÃO inclui:**

- Deduplicação global entre arquivos de diferentes membros (fase 2)
- Desktop client nativo via Tauri (fase 2)
- Mobile client nativo via React Native (fase 3)
- Integração OAuth com Google Drive, Dropbox, OneDrive (fase 2)
- Erasure coding (fase 3)
- Indexação inteligente: reconhecimento facial, OCR (fase 3)
- Versionamento de arquivos (fase 2)
- Streaming de vídeo em tempo real
- Dashboard completo de saúde do cluster (fase 2)

---

## Restrições e premissas

**Restrições:**

| Tipo | Descrição |
| --- | --- |
| Técnica | Backend em Go ou Rust para performance de IO e concorrência |
| Técnica | Frontend web em Next.js para o client da POC |
| Técnica | PostgreSQL para metadados, Redis para filas |
| Técnica | Monorepo com core-sdk compartilhado |
| Técnica | Sem armazenamento de originais — somente versões otimizadas + preview |
| Negócio | Custo mínimo — priorizar free tiers de cloud e VPS barata |
| Escala | Cluster máximo: 10 usuários, 50 nós, 100TB |

**Premissas:**

- Família possui pelo menos 3-5 dispositivos disponíveis como nós
- Pelo menos 1 nó "âncora" (VPS, NAS ou cloud bucket) está sempre online
- Usuários guardam seed phrase com segurança (papel, cofre)
- Provedores cloud manterão free tiers e APIs S3 estáveis
- Banda de internet doméstica é suficiente para sync em background
- FFmpeg e codecs modernos (WebP, H.265) continuarão disponíveis
