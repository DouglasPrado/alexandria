# Princípios Arquiteturais

Liste 3 a 7 princípios que guiam todas as decisões técnicas do sistema. Esses princípios funcionam como um filtro: quando houver dúvida entre duas abordagens, os princípios devem apontar o caminho.

> Se dois engenheiros discordarem sobre uma decisão técnica, quais princípios devem guiar a resolução?

---

### LOCKSS — Muitas Cópias Mantêm Dados Seguros

**Descrição:** A durabilidade vem da redundância. Todo dado deve existir em pelo menos 3 cópias, em locais e provedores diferentes. A perda de qualquer nó individual nunca deve significar perda de dados.

**Justificativa:** O propósito central do Alexandria é preservar memórias familiares por décadas. HDDs degradam em 5-10 anos, contas cloud podem ser encerradas, dispositivos podem ser roubados ou destruídos. Sem replicação diversificada, o sistema não cumpre sua razão de existir.

**Implicações:**
- Nenhum chunk é considerado "salvo" até ter 3 réplicas confirmadas em nós diferentes
- Auto-healing é obrigatório: quando um nó é perdido, re-replicação inicia automaticamente em até 1 hora
- Diversidade de nós é incentivada: réplicas preferencialmente em mix de local + cloud + outro dispositivo
- Manifests (índices dos arquivos) também são replicados em múltiplos nós, não apenas no orquestrador

---

### Orquestrador Descartável

**Descrição:** O orquestrador é o bibliotecário, não a biblioteca. Ele coordena, indexa e monitora, mas pode ser destruído e reconstruído a qualquer momento sem perda de dados. Os dados vivem nos nós.

**Justificativa:** Se o sistema inteiro depender de um único servidor, ele é tão frágil quanto um HD externo — exatamente o problema que estamos resolvendo. A seed phrase de 12 palavras é o ponto de recovery do universo inteiro.

**Implicações:**
- O orquestrador nunca é a única cópia de nenhum dado ou metadado
- Manifests, vault e configuração do cluster são replicados nos nós de storage
- Recovery via seed phrase deve ser testável e funcional: seed → master key → vault → reconectar nós → rebuild índice
- Toda informação no PostgreSQL deve ser reconstruível a partir dos manifests distribuídos

---

### Zero-Knowledge por Padrão

**Descrição:** Nenhum componente além do cliente local vê dados em texto puro. Chunks são criptografados antes de sair do dispositivo. Nem o orquestrador, nem os provedores cloud, nem os nós de storage conseguem ler o conteúdo.

**Justificativa:** Fotos e vídeos familiares são dados pessoais sensíveis (incluem menores, localizações GPS, momentos íntimos). Privacidade não é feature opcional — é requisito fundamental. Confiar em provedores cloud para proteger dados é aceitar uma dependência desnecessária.

**Implicações:**
- Criptografia AES-256-GCM acontece no cliente, antes de qualquer upload
- Envelope encryption (seed → master key → file keys → chunk keys) isola comprometimento
- Tokens OAuth, credenciais de provedores e senhas do usuário vivem exclusivamente no vault criptografado, nunca em texto puro
- Master key é derivada em memória e nunca persistida em disco
- TLS 1.3 obrigatório em toda comunicação entre componentes

---

### Embrace Failure — Assuma que Tudo Vai Quebrar

**Descrição:** O sistema assume que nós vão falhar, discos vão corromper, redes vão cair e tokens vão expirar. Em vez de tentar prevenir falhas, o sistema é projetado para detectá-las rapidamente e se auto-reparar.

**Justificativa:** Em um cluster com dezenas de dispositivos heterogêneos (celulares, PCs velhos, NAS, buckets cloud), falhas são certeza estatística, não exceção. Um sistema familiar precisa funcionar por décadas sem intervenção constante de um admin técnico.

**Implicações:**
- Heartbeat monitoring detecta nós offline em minutos; auto-healing re-replica chunks em até 1 hora
- Scrubbing periódico recalcula hashes de todos os chunks para detectar corrupção silenciosa (bit rot)
- Retry com backoff exponencial em toda comunicação com nós e provedores cloud
- Rate limiting por provedor para respeitar limites de API sem falhas em cascata
- Alertas proativos ao admin: nó offline, replicação abaixo do mínimo, token expirado, espaço baixo

---

### Eficiência sobre Fidelidade Absoluta

**Descrição:** Para memórias familiares, Full HD (1920px) é qualidade suficiente. O sistema prioriza otimização perceptual — o que o olho humano percebe como equivalente — sobre preservação bit-a-bit do original.

**Justificativa:** A maioria das telas tem ~2 megapixels. Uma foto de 8MB em JPEG não é visivelmente melhor que uma de 400KB em WebP Full HD na tela de um celular ou notebook. Otimizar mídia permite armazenar 10-20x mais fotos e 3-5x mais vídeos no mesmo espaço, viabilizando o modelo de custo zero com free tiers.

**Implicações:**
- Fotos são convertidas para WebP max 1920px (~300-600KB vs ~5-8MB original)
- Vídeos são transcodificados para 1080p H.265/AV1 (~400-600MB vs ~2GB original 4K)
- Originais não são preservados — decisão explícita e comunicada ao usuário
- Metadados EXIF (data, GPS, câmera) são extraídos e preservados separadamente no manifest
- Previews leves (thumbnail ~50KB, vídeo 480p ~5MB) são gerados para navegação instantânea

---

### Simplicidade Operacional

**Descrição:** Prefira soluções que um time de 1 pessoa consiga operar e manter por anos. Complexidade operacional é dívida técnica composta — cresce exponencialmente com o tempo.

**Justificativa:** O Alexandria é mantido por uma pessoa (Douglas Prado) e operado por famílias sem conhecimento técnico. Cada componente extra, cada dependência adicional, cada serviço que precisa de monitoramento aumenta o custo de manutenção. O sistema precisa rodar por décadas, não meses.

**Implicações:**
- Monólito (orquestrador único) em vez de microserviços — um binário, um deploy, um docker-compose
- Dependências externas minimizadas: PostgreSQL + Redis + FFmpeg, sem message brokers complexos ou service meshes
- Deploy via Docker em VPS barata — sem Kubernetes, sem cloud proprietário
- Vault como arquivo criptografado local — sem HashiCorp Vault ou cloud KMS
- Preferir soluções que funcionam "out of the box" sem configuração avançada

---

### Interfaces sobre Implementações

**Descrição:** Todo componente que pode variar (storage, transporte, codec) deve ser acessado através de uma interface estável. A implementação concreta pode mudar sem afetar o resto do sistema.

**Justificativa:** O Alexandria precisa sobreviver a décadas de mudanças: provedores cloud vão surgir e desaparecer, codecs vão evoluir, dispositivos vão mudar. Se o sistema estiver acoplado a implementações específicas, cada mudança exige reescrita.

**Implicações:**
- StorageProvider interface unificada (put/get/exists/delete/list/capacity) para todos os provedores cloud e storage local
- Trocar de S3 para R2 ou adicionar Backblaze B2 não afeta lógica de replicação ou distribuição
- Pipeline de mídia isolado: trocar FFmpeg por outro transcodificador ou mudar de WebP para AVIF requer mudança em um único ponto
- Protocolo de comunicação entre nós (FSP — Family Storage Protocol) é versionado para permitir evolução sem breaking changes
