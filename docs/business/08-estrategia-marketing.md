# Positioning & Community Awareness

<!-- updated: opensource — open-core -->This section defines **how Alexandria attracts, engages, and converts users and contributors**. Covers positioning, go-to-market, community channels, growth loops, content strategy, and community investment.

> **Note:** Alexandria has a zero marketing budget. The strategy is 100% organic: quality code + excellent documentation + community presence. "Marketing" here means content creation and active community participation, not paid ads.

---

## OSS Positioning

**Framework de posicionamento:** Anti-[Concorrente] + Feito exclusivamente para [nicho]

**Positioning statement:**

"The open-source alternative to Google Photos — without the vendor lock-in, without the privacy compromise, without the rising costs. Alexandria distributes your encrypted family memories across your own devices and cloud providers, recoverable with 12 words."

"Alexandria: the first distributed family storage system built for families who want to preserve memories for decades without depending on Big Tech."

**Atributos da marca:**

| Atributo      | Descrição                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------- |
| Personalidade | Técnico mas acessível, confiável, transparente, resiliente                                  |
| Tom de voz    | Direto e honesto; usa analogias (biblioteca, bibliotecário); sem hype; reconhece limitações |
| Valores       | Durabilidade acima de tudo, privacidade por design, código aberto, autonomia do usuário     |

**Tagline / Slogan:** "Your memories, your devices, your rules. Recovery in 12 words."

**Tagline alternatives:**

- "Lots of Copies Keep Stuff Safe — for your family."
- "The family storage system nobody can shut down."
- "Distributed storage that survives any disaster."

---

## OSS Launch Strategy (GTM)

**Estratégia de GTM:** Bottom-up / Community-led growth

**Mercado inicial:** Self-hosters técnicos com família (r/selfhosted, r/datahoarder, Hacker News)

**Plano de Lançamento:**

| Phase             | Period     | Actions                                                                                                                                   | Goal                                                |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Pre-launch**    | Weeks 1–2  | Polish README, real screenshots, functional Docker Compose, demo GIF. Submit to awesome-selfhosted. Public RFC for architecture feedback. | README "Quick Start" in <5 minutes                  |
| **Show HN**       | Week 3     | Post "Show HN: Alexandria — distributed family storage with 12-word recovery". Be available 24h to answer comments.                       | Front page; 100+ upvotes; 50+ stars                 |
| **First 30 days** | Weeks 4–8  | Post on r/selfhosted and r/datahoarder. Answer every issue in <24h. Technical blog post on architecture.                                  | 200 stars; 50 Docker pulls/week; 10 active clusters |
| **First 90 days** | Weeks 9–16 | Public disaster drill (video). CONTRIBUTING.md + "good first issue" labels. Second blog post. Cross-post Dev.to/Medium. YouTube tutorial. | 1,000 stars; 50 active clusters; 5 contributors     |

**Primeiros usuários (como conquistar os 10-50 iniciais):**

- Usar o próprio Alexandria para a Família Prado — ser o primeiro case real
- Postar "Show HN" com dados reais de disaster drill e otimização de fotos
- Responder a todo post em r/selfhosted que pergunte "how do you backup family photos?" com link para o Alexandria
- Criar issue "Early Adopter Feedback" no GitHub e convidar os primeiros 50 instaladores para contribuir
- Oferecer suporte 1:1 via Discord para os primeiros 20 instaladores (tática que não escala, mas gera feedback profundo)

---

## ICP Validation

**ICP atual:** Desenvolvedor/SRE com família, 30-45 anos, >500GB de fotos/vídeos, já usa Docker/VPS, insatisfeito com soluções atuais de backup

**Triggers de pivot:**

- Se <30% dos instaladores completam setup em 48h após 50 tentativas → setup está complexo demais; simplificar antes de escalar
- Se retenção M3 <40% após 100 clusters → investigar: produto não resolve a dor? Instabilidade? Setup complexo?
- Se NPS <40 após 30 respostas → o produto não está entregando o valor prometido; priorizar estabilidade e UX antes de growth

> Validar com pelo menos 50 instalações antes de concluir que o ICP está errado. Amostras pequenas mentem.

---

## Pricing Communication (Open-Core)

**Princípios (para o serviço gerenciado futuro):**

- Liderar com o plano gratuito: "O software é 100% open-source e sempre será."
- Posicionar o serviço gerenciado como conveniência, não como limitação: "Não quer configurar? A gente cuida para você."
- Comparação de custo: "Google One 2TB: R$35/mês para 2TB. Alexandria Cloud: R$49/mês para storage ilimitado + privacidade total."
- Mostrar economia anualizada: "Economize R$120/ano vs Google One com storage 5x maior"
- Sem trial com cartão — open-source é o "trial infinito"

**Core message:** "Use it free forever (self-hosted) or pay for convenience (managed). Your data, your rules, either way."

---

## Content Channels

| Canal                                | Objetivo                           | Investimento (Tempo/mês)           | ROI Esperado                                        |
| ------------------------------------ | ---------------------------------- | ---------------------------------- | --------------------------------------------------- |
| GitHub + README                      | Aquisição + Conversão (instalação) | 4h (manter docs, responder issues) | Alto — principal vitrine do projeto; stars virais   |
| Reddit (r/selfhosted, r/datahoarder) | Awareness + Aquisição              | 4h (posts, respostas, engajamento) | Alto — público-alvo exato; custo zero               |
| Blog técnico (Dev.to / site próprio) | Awareness + SEO                    | 8h (1 post técnico/mês)            | Médio-Alto — conteúdo evergreen; SEO de longa cauda |

> **Regra:** 1 canal por vez. Validar GitHub + Reddit primeiro. Só adicionar blog quando os dois primeiros estiverem gerando tração consistente.

---

## OSS Growth Loops

### Primary Loop (Family Viral)

Admin instala o Alexandria → Adiciona família ao cluster → Membros da família usam diariamente → Membros comentam com amigos/família estendida ("como vocês guardam fotos?") → Amigo técnico instala para sua família → Ciclo repete.

```
Admin instala → Família usa → Família comenta → Amigo técnico descobre → Instala para sua família
```

> **Motor do loop:** A família é o canal de distribuição. Cada admin "converte" 3-6 membros da família que se tornam evangelistas involuntários.

### Secondary Loop (Content + Community)

Mantenedor publica post técnico (arquitetura, disaster drill, benchmark) → Post rankeia no Google/HN/Reddit → Dev técnico descobre → Instala e contribui código/issues → Melhorias geram novo conteúdo → Ciclo repete.

```
Post técnico → Tráfego orgânico → Instalação → Contribuição → Melhoria → Novo conteúdo
```

> **Loop prioritário:** Viral familiar — custo zero e já acontece naturalmente quando o produto funciona bem. O loop de conteúdo acelera mas não é pré-requisito.

---

## Content Strategy

**Formato principal:** Blog post técnico (long-form, 1.500-3.000 palavras)

**Frequência:** 1 por mês (sustentável para mantenedor solo)

**Canal:** Dev.to + cross-post no blog próprio (SEO)

**Pilares de conteúdo:**

| Pilar                            | Objetivo                       | Exemplo de Temas                                                                                                                |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Arquitetura e decisões técnicas  | Awareness (comunidade técnica) | "Como funciona o consistent hashing do Alexandria", "Por que escolhemos envelope encryption", "Erasure coding vs replicação 3x" |
| Durabilidade e disaster recovery | Awareness + Confiança          | "Disaster drill público: destruímos o servidor e recuperamos tudo em 47 minutos", "Bit rot é real: como o scrubbing nos salvou" |
| Comparativos e migração          | Aquisição                      | "Alexandria vs Immich vs Syncthing: qual o certo para você?", "Migrei 500GB do Google Photos para o Alexandria — o que aprendi" |

**Formatos opcionais (adicionar quando o principal estiver estável):**

- Vídeo demo/tutorial no YouTube (1x/trimestre) — setup, disaster drill, comparativo visual
- Thread no Twitter/Mastodon com highlights dos posts (amplificação)

---

## Community Investment (Marketing Budget)

**Total monthly marketing budget:** $0 (investment = maintainer time)

**Time allocated for community:** ~16h/month (4h/week)

| Atividade / Canal                         | Tempo Mensal | % do Total | Resultado Esperado                                         |
| ----------------------------------------- | ------------ | ---------- | ---------------------------------------------------------- |
| GitHub (README, issues, docs)             | 4h           | 25%        | README sempre atualizado; issues respondidas em <24h       |
| Reddit + HN (posts, respostas)            | 4h           | 25%        | 2-4 participações relevantes/mês; tráfego para GitHub      |
| Blog post técnico                         | 6h           | 37,5%      | 1 post/mês; SEO de longa cauda; material para compartilhar |
| Discord/comunidade (suporte, engajamento) | 2h           | 12,5%      | Comunidade ativa; feedback direto; retenção                |
| **Total**                                 | **16h**      | **100%**   |                                                            |

> **Princípio:** para projeto open-source solo, 4h/semana de "marketing" é o máximo sustentável sem comprometer o desenvolvimento. Se a tração justificar, aumentar para 8h/semana após o mês 6.

> **Quando investir dinheiro:** Somente se/quando o serviço gerenciado gerar receita (ano 2+). Nesse caso, alocar 15-20% do MRR para marketing pago (Reddit Ads, Google Ads, sponsorships em newsletters de self-hosting).
