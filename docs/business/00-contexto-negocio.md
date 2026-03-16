# Contexto de Negócio

Esta seção estabelece **o cenário de negócios** onde o produto será inserido. Define o mercado, a concorrência, as tendências e as premissas que fundamentam as decisões estratégicas.

---

## Estágio do Produto

> Em que fase o produto se encontra hoje?

- [x] Pré-lançamento (ideia / pesquisa)
- [ ] MVP (produto mínimo viável em teste)
- [ ] Em mercado (primeiros usuários)
- [ ] Growth (product-market fit validado, escalando)

**Estágio atual:** Fase de design e documentação. PRD v1.0.0 completo com 79 requisitos funcionais. Blueprint técnico finalizado. Nenhum código escrito ainda. Próximo passo é a Fase 0 (Fundação — Core SDK em Rust). Validações pendentes incluem: qualidade perceptual de Full HD para fotos familiares (H-01), taxa de deduplicação em acervo real (H-02) e recovery via seed phrase (H-04).

---

## Mercado

> O Alexandria atua no mercado de **armazenamento pessoal/familiar de dados** — especificamente na interseção entre backup pessoal, armazenamento cloud e preservação digital de longo prazo.

| Dimensão | Valor |
| --- | --- |
| Tamanho do mercado (TAM) | ~$90B/ano (mercado global de cloud storage pessoal — Statista 2025) <!-- inferido do PRD --> |
| Taxa de crescimento anual | ~20% ao ano (storage pessoal cresce com produção de mídia mobile) <!-- inferido do PRD --> |
| Estágio de maturidade | Crescimento — dominado por big techs mas insatisfação crescente com custo e privacidade |
| Região geográfica foco | Global (self-hosted, sem restrição geográfica); comunidade inicial: Brasil (família do dev) |

**Fontes de evidência (do PRD):**
- Google Photos eliminou armazenamento ilimitado gratuito em 2021; free tier reduzido a 15GB
- HDDs duram 5-10 anos, SSDs ~10 anos sem migração — dados de consenso da indústria
- ~102GB de armazenamento gratuito disponível por pessoa combinando provedores cloud
- 20-60% de duplicação em fotos familiares (WhatsApp, compartilhamento entre dispositivos)
- Custos de planos pagos (Google One, Dropbox Plus, iCloud+) crescem ano a ano

> O mercado é enorme mas dominado por incumbentes. A oportunidade não é competir em tamanho, mas atender um nicho mal servido: famílias técnicas que querem controle total, privacidade e custo zero.

---

## Concorrência

| Concorrente | Posicionamento | Pontos Fortes | Pontos Fracos | Pricing | Market Share |
| --- | --- | --- | --- | --- | --- |
| Google Photos / Drive | Storage cloud consumer mainstream | 15GB grátis; UX excelente; busca por IA; integração Android | Vendor lock-in; privacidade questionável; preços crescentes acima de 15GB | Freemium (R$7-35/mês para 100GB-2TB) | ~35% |
| iCloud | Ecossistema Apple | Integração nativa iOS/macOS; seamless para usuários Apple | Só Apple; 5GB grátis (insuficiente); caro para famílias | Freemium (R$4-35/mês para 50GB-2TB) | ~25% |
| Dropbox | Storage cloud profissional/pessoal | Sync confiável; cross-platform; integrações | 2GB grátis (menor do mercado); foco B2B; preço alto | Freemium (R$50/mês para 2TB) | ~10% |
| Syncthing | Sync P2P open-source entre dispositivos | Grátis; privado; sem cloud; open-source | Sem criptografia at-rest; sem otimização de mídia; sem redundância cloud; sem recovery | Gratuito | ~1% (nicho) |
| Nextcloud | Cloud pessoal self-hosted | Self-hosted; open-source; ecossistema de apps | Complexo de operar; sem otimização de mídia; sem distribuição entre provedores; performance | Gratuito (self-hosted) + hosting pago | ~2% (nicho) |
| BorgBackup / Restic | Backup incremental criptografado | Deduplicação excelente; criptografia forte; open-source | Apenas backup (sem galeria, sem sync); CLI-only; não é storage distribuído | Gratuito | ~1% (nicho) |

**Concorrentes indiretos (substitutos):**

- **HD externo manual** — backup esquecido em gaveta; sem verificação; degrada em 5-10 anos (40% das famílias usam apenas isso)
- **WhatsApp/Telegram** — fotos compartilhadas via chat; compressão severa; sem organização; sem backup confiável
- **NAS doméstico (Synology, QNAP)** — robusto mas caro (R$1500+); ponto único de falha; sem distribuição cloud; complexo para família
- **Impressão física** — fotos impressas; durável mas sem escalabilidade; custo alto por unidade

---

## Tendências

| Tendência | Tipo | Impacto no Negócio | Horizonte |
| --- | --- | --- | --- |
| Eliminação de armazenamento gratuito ilimitado | Mercado | Diretamente positivo — famílias buscam alternativas ao Google/Apple pagos | Curto prazo (já acontecendo) |
| Crescimento exponencial de produção de mídia mobile | Comportamento | Aumenta urgência — celulares produzem ~1GB/mês de fotos/vídeos por pessoa | Contínuo |
| Preocupação crescente com privacidade digital | Comportamento | Fortalece proposta de zero-knowledge encryption; diferencial vs big techs | Médio prazo |
| Codecs modernos (WebP, AVIF, AV1) amadurecendo | Tecnologia | Viabiliza redução de 10-20x em fotos e 3-5x em vídeos sem perda perceptível | Curto prazo (já disponível) |
| Descentralização e self-hosting ganhando tração | Tecnologia | Comunidade crescente de self-hosters (Nextcloud, Syncthing, Immich) valida demanda | Médio prazo |
| Regulamentações de proteção de dados (LGPD, GDPR) | Regulatório | Reforça valor de criptografia e controle do usuário sobre seus dados | Longo prazo |
| Custo de storage cloud caindo (R2 sem egress, B2 barato) | Mercado | Viabiliza modelo de custo zero combinando free tiers de múltiplos provedores | Curto prazo |
| IA generativa para organização de fotos | Tecnologia | Oportunidade futura (indexação inteligente Fase 3); big techs têm vantagem aqui | Longo prazo |

---

## Oportunidade

**Lacuna identificada:**

Não existe solução que combine: (1) distribuição de dados entre múltiplos provedores e dispositivos com auto-reparação, (2) criptografia ponta-a-ponta zero-knowledge, (3) otimização automática de mídia para reduzir 10-20x o espaço, (4) custo zero usando free tiers combinados, e (5) recovery completo com 12 palavras. Cada concorrente resolve 1-2 desses problemas; nenhum resolve todos.

**Por que agora?**

- Google eliminou storage gratuito ilimitado em 2021; preços de planos pagos crescem todo ano — famílias sentem o custo
- Codecs modernos (WebP, H.265, AV1) atingiram maturidade suficiente para otimização agressiva sem perda perceptível
- Provedores cloud com free tier generoso (R2 sem egress, B2 a $5/TB) e S3-compatible API viabilizam arquitetura multi-cloud
- Rust atingiu maturidade (ecossistema async Tokio/Axum estável) — permite performance nativa com safety para sistema de storage
- Comunidade self-hosting em crescimento (Immich, Nextcloud, Syncthing) valida que existe demanda por alternativas às big techs
- ~102GB de free tier disponível por pessoa combinando provedores — uma família de 5 pessoas obtém ~500GB gratuitos

> **Por que ninguém fez isso antes?** A combinação de storage distribuído + criptografia + otimização de mídia + multi-cloud requer expertise em sistemas distribuídos, criptografia e processamento de mídia simultaneamente. É um projeto complexo para uma startup típica. O Alexandria é viável como projeto pessoal porque o tech lead (Douglas) tem experiência em todas essas áreas e o escopo familiar (5-10 usuários) reduz drasticamente os requisitos de escala.

---

## Análise SWOT

| | **Positivo** | **Negativo** |
| --- | --- | --- |
| **Interno** | **Forças** | **Fraquezas** |
| | Tech lead com experiência full-stack em sistemas distribuídos, criptografia e processamento de mídia | Time de 1 pessoa — capacidade de desenvolvimento limitada |
| | Rust como stack: performance nativa, memory safety, binário único | Sem base de usuários; sem marca; sem marketing |
| | Arquitetura "orquestrador descartável" — resilience by design | Curva de aprendizado para família não-técnica usar o sistema |
| | Custo operacional ~€5-10/mês (VPS + free tiers) | Sem funding; sem runway comercial; projeto pessoal |
| **Externo** | **Oportunidades** | **Ameaças** |
| | Insatisfação crescente com preços de Google/Apple/Dropbox | Big techs podem oferecer features similares (criptografia, multi-device) |
| | Comunidade self-hosting em crescimento (Immich tem 50k+ stars) | Provedores cloud eliminam free tiers ou mudam APIs S3 |
| | Codecs modernos viabilizam redução 10-20x sem perda perceptível | Formatos de mídia tornam-se obsoletos em 50 anos (risco de preservação) |
| | Open-source pode atrair contribuidores e acelerar desenvolvimento | Projetos concorrentes open-source (Immich, Photoprism) podem adicionar features de distribuição |

---

## Premissas de Negócio

| Premissa | Risco se falsa | Impacto | Como validar | Status |
| --- | --- | --- | --- | --- |
| Full HD (1920px) é qualidade suficiente para memórias familiares | Usuários rejeitam qualidade otimizada; precisam de originais | Alto | Pesquisa com membros da família; teste A/B fotos originais vs otimizadas (H-01) | A validar |
| Deduplicação reduz 30-70% do storage em acervos familiares | Economia de espaço menor que esperada; modelo de custo zero inviável | Médio | Análise de acervo real piloto — fotos de WhatsApp, múltiplos dispositivos (H-02) | A validar |
| Família média tem 5+ dispositivos utilizáveis como nós | Poucos nós disponíveis; replicação 3x difícil | Médio | Pesquisa com famílias-alvo (H-03) | A validar |
| Recovery via seed phrase funciona de forma confiável | Perda de dados em cenário de desastre; promessa core do produto quebrada | Alto | Disaster drills mensais com reconstrução real (H-04) | A validar |
| ~500GB gratuitos (free tiers combinados) cobrem família por 5-10 anos | Espaço insuficiente; modelo de custo zero inviável | Alto | Cálculo com acervo piloto: 100k fotos + 500h vídeo otimizados (H-07) | A validar |
| Provedores cloud manterão free tiers e APIs S3 estáveis | StorageProvider abstração quebra; migração forçada | Médio | Monitorar políticas de provedores; diversificar em 3+ provedores | A validar |
| Usuários guardam seed phrase com segurança | Perda total de dados; sistema falha na promessa principal | Alto | Instruções claras; alerta persistente; recovery guardians em fase futura | A validar |
| Membros não-técnicos da família conseguem usar o web client | Baixa adoção; sistema usado apenas pelo admin | Médio | Teste de usabilidade com 3-5 membros da família durante alpha | A validar |

> **Regulamentação aplicável:**
> - **LGPD:** Dados pessoais de membros (e-mail, nomes, GPS em fotos); consentimento implícito ao aceitar convite; direito ao esquecimento implementado
> - **Termos de provedores cloud:** Tokens OAuth em conformidade com políticas de Google, Microsoft, Dropbox
> - **Dados de menores:** Fotos de crianças protegidas pela criptografia zero-knowledge do cluster
