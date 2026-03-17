# Estratégia de Marketing

Esta seção define **como o Alexandria atrai, engaja e converte usuários**. Cobre posicionamento, go-to-market, canais de aquisição, growth loops, conteúdo e orçamento.

> **Nota:** O Alexandria é open-source com orçamento de marketing zero. A estratégia é 100% orgânica: código de qualidade + documentação excelente + presença em comunidades. "Marketing" aqui é produção de conteúdo e participação ativa em comunidades, não anúncios pagos.

---

## Posicionamento

**Framework de posicionamento:** Anti-[Concorrente] + Feito exclusivamente para [nicho]

**Declaração de posicionamento:**

"Somos o anti-Google Photos. Enquanto eles centralizam suas memórias em um único provedor que vê tudo, cobra cada vez mais e pode encerrar sua conta a qualquer momento, o Alexandria distribui seus dados criptografados entre seus próprios dispositivos e provedores — com recovery completo via 12 palavras."

"Alexandria: armazenamento familiar distribuído feito exclusivamente para famílias que querem preservar memórias por décadas sem depender de Big Tech."

**Atributos da marca:**

| Atributo | Descrição |
| --- | --- |
| Personalidade | Técnico mas acessível, confiável, transparente, resiliente |
| Tom de voz | Direto e honesto; usa analogias (biblioteca, bibliotecário); sem hype; reconhece limitações |
| Valores | Durabilidade acima de tudo, privacidade por design, código aberto, autonomia do usuário |

**Tagline / Slogan:** "Suas memórias, seus dispositivos, suas regras. Recovery em 12 palavras."

**Alternativas de tagline:**
- "Lots of Copies Keep Stuff Safe — para sua família."
- "O Google Drive familiar que ninguém pode encerrar."
- "Armazenamento distribuído que sobrevive a qualquer desastre."

---

## Go-to-Market

**Estratégia de GTM:** Bottom-up / Community-led growth

**Mercado inicial:** Self-hosters técnicos com família (r/selfhosted, r/datahoarder, Hacker News)

**Plano de Lançamento:**

| Fase | Período | Ações | Meta |
| --- | --- | --- | --- |
| Pré-lançamento | Semanas 1-2 | README polido, screenshots reais, Docker Compose funcional, demo GIF. Submeter ao awesome-selfhosted. | README com "Quick Start" em <5 minutos |
| Show HN | Semana 3 | Post "Show HN: Alexandria — distributed family storage with 12-word recovery". Estar disponível 24h para responder comments. | Front page; 100+ upvotes; 50+ stars |
| Primeiros 30 dias | Semanas 4-8 | Post em r/selfhosted e r/datahoarder. Responder toda issue em <24h. Blog post técnico sobre a arquitetura. | 200 stars; 50 Docker pulls/semana; 10 clusters ativos |
| Primeiros 90 dias | Semanas 9-16 | Disaster drill público (vídeo). CONTRIBUTING.md + "good first issue". Segundo blog post. Cross-post em Dev.to/Medium. | 1.000 stars; 50 clusters ativos; 5 contribuidores |

**Primeiros usuários (como conquistar os 10-50 iniciais):**

- Usar o próprio Alexandria para a Família Prado — ser o primeiro case real
- Postar "Show HN" com dados reais de disaster drill e otimização de fotos
- Responder a todo post em r/selfhosted que pergunte "how do you backup family photos?" com link para o Alexandria
- Criar issue "Early Adopter Feedback" no GitHub e convidar os primeiros 50 instaladores para contribuir
- Oferecer suporte 1:1 via Discord para os primeiros 20 instaladores (tática que não escala, mas gera feedback profundo)

---

## Validação de ICP

**ICP atual:** Desenvolvedor/SRE com família, 30-45 anos, >500GB de fotos/vídeos, já usa Docker/VPS, insatisfeito com soluções atuais de backup

**Triggers de pivot:**

- Se <30% dos instaladores completam setup em 48h após 50 tentativas → setup está complexo demais; simplificar antes de escalar
- Se retenção M3 <40% após 100 clusters → investigar: produto não resolve a dor? Instabilidade? Setup complexo?
- Se NPS <40 após 30 respostas → o produto não está entregando o valor prometido; priorizar estabilidade e UX antes de growth

> Validar com pelo menos 50 instalações antes de concluir que o ICP está errado. Amostras pequenas mentem.

---

## Comunicação de Pricing

**Princípios (para o serviço gerenciado futuro):**

- Liderar com o plano gratuito: "O software é 100% open-source e sempre será."
- Posicionar o serviço gerenciado como conveniência, não como limitação: "Não quer configurar? A gente cuida para você."
- Comparação de custo: "Google One 2TB: R$35/mês para 2TB. Alexandria Cloud: R$49/mês para storage ilimitado + privacidade total."
- Mostrar economia anualizada: "Economize R$120/ano vs Google One com storage 5x maior"
- Sem trial com cartão — open-source é o "trial infinito"

**Mensagem central:** "Use grátis para sempre (self-hosted) ou pague pela conveniência (gerenciado). Seus dados, suas regras, em qualquer caso."

---

## Canais de Marketing

| Canal | Objetivo | Investimento (Tempo/mês) | ROI Esperado |
| --- | --- | --- | --- |
| GitHub + README | Aquisição + Conversão (instalação) | 4h (manter docs, responder issues) | Alto — principal vitrine do projeto; stars virais |
| Reddit (r/selfhosted, r/datahoarder) | Awareness + Aquisição | 4h (posts, respostas, engajamento) | Alto — público-alvo exato; custo zero |
| Blog técnico (Dev.to / site próprio) | Awareness + SEO | 8h (1 post técnico/mês) | Médio-Alto — conteúdo evergreen; SEO de longa cauda |

> **Regra:** 1 canal por vez. Validar GitHub + Reddit primeiro. Só adicionar blog quando os dois primeiros estiverem gerando tração consistente.

---

## Growth Loops

### Loop Primário (Viral Familiar)

Admin instala o Alexandria → Adiciona família ao cluster → Membros da família usam diariamente → Membros comentam com amigos/família estendida ("como vocês guardam fotos?") → Amigo técnico instala para sua família → Ciclo repete.

```
Admin instala → Família usa → Família comenta → Amigo técnico descobre → Instala para sua família
```

> **Motor do loop:** A família é o canal de distribuição. Cada admin "converte" 3-6 membros da família que se tornam evangelistas involuntários.

### Loop Secundário (Conteúdo + Comunidade)

Mantenedor publica post técnico (arquitetura, disaster drill, benchmark) → Post rankeia no Google/HN/Reddit → Dev técnico descobre → Instala e contribui código/issues → Melhorias geram novo conteúdo → Ciclo repete.

```
Post técnico → Tráfego orgânico → Instalação → Contribuição → Melhoria → Novo conteúdo
```

> **Loop prioritário:** Viral familiar — custo zero e já acontece naturalmente quando o produto funciona bem. O loop de conteúdo acelera mas não é pré-requisito.

---

## Estratégia de Conteúdo

**Formato principal:** Blog post técnico (long-form, 1.500-3.000 palavras)

**Frequência:** 1 por mês (sustentável para mantenedor solo)

**Canal:** Dev.to + cross-post no blog próprio (SEO)

**Pilares de conteúdo:**

| Pilar | Objetivo | Exemplo de Temas |
| --- | --- | --- |
| Arquitetura e decisões técnicas | Awareness (comunidade técnica) | "Como funciona o consistent hashing do Alexandria", "Por que escolhemos envelope encryption", "Erasure coding vs replicação 3x" |
| Durabilidade e disaster recovery | Awareness + Confiança | "Disaster drill público: destruímos o servidor e recuperamos tudo em 47 minutos", "Bit rot é real: como o scrubbing nos salvou" |
| Comparativos e migração | Aquisição | "Alexandria vs Immich vs Syncthing: qual o certo para você?", "Migrei 500GB do Google Photos para o Alexandria — o que aprendi" |

**Formatos opcionais (adicionar quando o principal estiver estável):**

- Vídeo demo/tutorial no YouTube (1x/trimestre) — setup, disaster drill, comparativo visual
- Thread no Twitter/Mastodon com highlights dos posts (amplificação)

---

## Orçamento de Marketing

**Orçamento total mensal de marketing:** R$ 0 (investimento = tempo do mantenedor)

**Tempo alocado para marketing:** ~16h/mês (4h/semana)

| Atividade / Canal | Tempo Mensal | % do Total | Resultado Esperado |
| --- | --- | --- | --- |
| GitHub (README, issues, docs) | 4h | 25% | README sempre atualizado; issues respondidas em <24h |
| Reddit + HN (posts, respostas) | 4h | 25% | 2-4 participações relevantes/mês; tráfego para GitHub |
| Blog post técnico | 6h | 37,5% | 1 post/mês; SEO de longa cauda; material para compartilhar |
| Discord/comunidade (suporte, engajamento) | 2h | 12,5% | Comunidade ativa; feedback direto; retenção |
| **Total** | **16h** | **100%** | |

> **Princípio:** para projeto open-source solo, 4h/semana de "marketing" é o máximo sustentável sem comprometer o desenvolvimento. Se a tração justificar, aumentar para 8h/semana após o mês 6.

> **Quando investir dinheiro:** Somente se/quando o serviço gerenciado gerar receita (ano 2+). Nesse caso, alocar 15-20% do MRR para marketing pago (Reddit Ads, Google Ads, sponsorships em newsletters de self-hosting).
