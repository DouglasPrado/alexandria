# Requisitos da POC

Esta seção lista **o que a POC precisa fazer** para ter valor, organizado por prioridade. Use a classificação MoSCoW simplificada: o que é obrigatório (Must), o que é desejável (Should) e o que fica para depois.

---

## Must have

- [ ] Criar cluster familiar com identidade criptográfica (cluster_id = hash da chave pública) e seed phrase de 12 palavras (BIP-39)
- [ ] Convidar membros via token assinado com expiração e definir permissões (admin, membro, leitura)
- [ ] Registrar nós de armazenamento (computador local, VPS, bucket S3/R2) com reporte de capacidade
- [ ] Heartbeat monitoring de nós com detecção de nós offline/perdidos
- [ ] Desconectar nó com drain (migrar chunks antes de remover)
- [ ] Upload manual de arquivos com pipeline completo: resize → transcode → preview → encrypt → chunk → distribute
- [ ] Fotos: redimensionar para max 1920px, converter para WebP (~300-600KB)
- [ ] Vídeos: downscale para 1080p, transcodificar para H.265 ou AV1 (~400-600MB)
- [ ] Gerar preview (thumbnail ~50KB para fotos; 480p ~5MB para vídeos)
- [ ] Chunking em blocos de ~4MB com hash SHA-256 por chunk
- [ ] Criptografia AES-256-GCM de chunks no cliente antes do upload
- [ ] Distribuição de chunks via consistent hashing entre nós
- [ ] Replicação mínima de 3 cópias por chunk em nós diferentes
- [ ] Auto-healing: re-replicar chunks quando nó é perdido
- [ ] Scrubbing periódico (recalcular hashes, detectar corrupção, restaurar de réplica)
- [ ] Garbage collection de chunks órfãos
- [ ] Vault criptografado para tokens e credenciais (desbloqueado via chave derivada da seed)
- [ ] Recuperar orquestrador com seed phrase em nova VPS
- [ ] Manifests replicados em múltiplos nós
- [ ] Placeholder files com download sob demanda
- [ ] Alertas automáticos (nó offline, replicação baixa, erro de integridade)
- [ ] Web client básico: upload, galeria com thumbnails, download

---

## Should have

- [ ] Sync engine para detecção automática de novos arquivos em pastas monitoradas
- [ ] Compressão de chunks com Zstandard quando vantajosa (>10% redução)
- [ ] Diversidade obrigatória de nós nas réplicas (local + cloud + outro dispositivo)
- [ ] Timeline de fotos/vídeos com navegação cronológica
- [ ] Busca por nome, data, tipo e metadados
- [ ] Dashboard de saúde do cluster (capacidade, replicação, nós online)
- [ ] Logs estruturados de todas as operações
- [ ] Preservar metadados EXIF em metadata separado do manifest

---

## Fora do escopo

- Deduplicação global entre arquivos de diferentes membros — complexidade alta; validar fluxo básico primeiro
- Desktop client nativo (Tauri) — web client é suficiente para POC
- Mobile client nativo (React Native) — web responsivo cobre a POC
- Integração OAuth com Google Drive, Dropbox, OneDrive — S3/R2 cobre a POC; OAuth clouds na fase 2
- Erasure coding — replicação 3x é suficiente para validação
- Reconhecimento facial, OCR, indexação inteligente — fase 3
- Versionamento de arquivos — fase 2
- Streaming de vídeo em tempo real — download sob demanda é suficiente
- Proteção contra ransomware — fase 3
- Multi-admin e recovery guardians — fase 3

---

## Requisitos não-funcionais

| Categoria | Requisito | Meta |
| --- | --- | --- |
| Durabilidade | Dados no cluster com replicação 3x | Zero perda de dados em 1 mês de uso |
| Performance | Tempo de resposta API de metadata | p95 < 500ms |
| Segurança | Criptografia de dados em repouso | AES-256-GCM em todos os chunks |
| Segurança | Criptografia em trânsito | TLS 1.3 em todas as comunicações |
| Segurança | Tokens OAuth/credenciais | Nunca em texto puro; vault criptografado |
| Disponibilidade | Uptime do orquestrador | >99.5% |
| Recuperabilidade | Reconstrução via seed phrase | <2 horas em nova VPS |
