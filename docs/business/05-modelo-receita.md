# Open-Core Sustainability Model

<!-- updated: opensource — open-core -->This section defines **how Alexandria sustains itself financially** using an open-core model: a free, fully-functional open-source core + a paid managed service for non-technical families. The OSS core drives adoption and trust; the managed service generates revenue.

> **Model: Open-Core** — free self-hosted core (MIT license) + paid "Alexandria Cloud" managed service. Software is and always will be free. Revenue comes from families who want convenience without self-hosting.

---

## Open-Core Feature Split

| Feature                                       | Self-Hosted (Free — MIT) | Cloud Starter ({{placeholder}}/mo) | Cloud Family ({{placeholder}}/mo) |
| --------------------------------------------- | ------------------------ | ---------------------------------- | --------------------------------- |
| Full open-source software                     | ✅                       | ✅                                 | ✅                                |
| Distributed storage + auto-healing            | ✅                       | ✅                                 | ✅                                |
| End-to-end encryption + seed phrase recovery  | ✅                       | ✅                                 | ✅                                |
| Media optimization pipeline (WebP, H.265/AV1) | ✅                       | ✅                                 | ✅                                |
| Setup & maintenance                           | Manual (you)             | Managed                            | Managed                           |
| VPS + infrastructure                          | Your own                 | Included (shared VPS)              | Included (dedicated VPS)          |
| Cloud nodes included                          | Your own accounts        | 2 providers (50GB each)            | 5 providers (100GB each)          |
| Family members                                | Unlimited                | Up to 5                            | Up to 15                          |
| Automated disaster recovery                   | Manual (seed phrase)     | Automated                          | Automated + monthly drill         |
| Support                                       | Community                | Email (<48h)                       | Priority chat (<4h)               |
| Automatic updates                             | Manual                   | Automatic                          | Automatic                         |

---

## Revenue Sources (Current & Planned)

| Source                           | Type                  | Phase   | Est. %                       | Description                                                                                          |
| -------------------------------- | --------------------- | ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| GitHub Sponsors / OpenCollective | Recurring / Voluntary | Year 1+ | 40% <!-- inferido do PRD --> | Satisfied users fund development. Proven model (Immich, Syncthing, Nextcloud).                       |
| Community code contributions     | Non-monetary          | Year 1+ | —                            | Reduces development cost. Each accepted PR is "revenue" in the form of saved work.                   |
| Managed service (future)         | Recurring / SaaS      | Year 2+ | 50% <!-- inferido do PRD --> | "Alexandria Cloud" — managed setup for non-technical families. Paying for convenience, not software. |
| Premium support (future)         | Recurring / Service   | Year 2+ | 10% <!-- inferido do PRD --> | Response SLA, assisted disaster recovery, guided migration for large families or small businesses.   |

> **Strategy:** Free software + paid service. The GitLab, Grafana, and Immich model: open source generates adoption and trust; managed service generates revenue.

---

## Monthly Funding / MRR (Year 2 Projection — Managed Service)

> Aplicável somente após lançamento do serviço gerenciado (Alexandria Cloud). Na v1, MRR = R$0.

**Fórmula:** New MRR + Expansion MRR - Churn MRR + Reactivation MRR = **Net New MRR**

| Componente       | Valor Estimado (R$)                   | Descrição                                               |
| ---------------- | ------------------------------------- | ------------------------------------------------------- |
| New MRR          | R$ 1.500 <!-- inferido do PRD -->     | ~30 novas famílias × R$50/mês (plano gerenciado básico) |
| Expansion MRR    | R$ 300 <!-- inferido do PRD -->       | Upgrade de storage ou adição de membros                 |
| Churn MRR        | R$ 400 <!-- inferido do PRD -->       | Famílias que migram para self-hosted ou abandonam       |
| Reactivation MRR | R$ 100 <!-- inferido do PRD -->       | Famílias que retornam (dados ainda nos nós)             |
| **Net New MRR**  | **R$ 1.500** <!-- inferido do PRD --> | Crescimento líquido positivo                            |

> **Risco de concentração:** Baixo — base de famílias naturalmente diversificada; nenhuma família representa >5% da receita potencial.

---

## Net Revenue Retention (NRR) — Managed Service

**NRR projetado (serviço gerenciado):** ~95% <!-- inferido do PRD -->

**Meta:** >100% (expansão supera churn)

> Para open-source self-hosted, NRR não se aplica diretamente. Para o serviço gerenciado futuro, famílias tendem a **expandir** (mais storage, mais membros) e **raramente cancelar** (dados acumulados criam lock-in natural). NRR >100% é alcançável se o path de expansão for fluido.

---

## Pricing Strategy

**Modelo de precificação:** Open-core (software gratuito + serviço pago futuro)

**Lógica de precificação:**

O software é e sempre será gratuito. O valor monetizável é a **conveniência**: famílias não-técnicas pagariam para não precisar configurar VPS, DNS, buckets cloud e manter o sistema. O preço do serviço gerenciado deve ser competitivo com Google One/iCloud+ mas com privacidade total e storage ilimitado (via otimização).

**Comparação de custo para o usuário:**

| Opção                     | Custo Mensal                | Storage Efetivo                   | Privacidade                  |
| ------------------------- | --------------------------- | --------------------------------- | ---------------------------- |
| Google One 2TB            | R$35/mês                    | 2TB                               | Nenhuma — Google vê tudo     |
| iCloud+ 2TB               | R$35/mês                    | 2TB                               | Parcial — Apple pode acessar |
| Alexandria self-hosted    | R$25-50/mês (VPS + domínio) | Ilimitado (com otimização 10-20x) | Total — zero-knowledge       |
| Alexandria Cloud (futuro) | R$40-80/mês (estimativa)    | Ilimitado (com otimização)        | Total — zero-knowledge       |

**Existe plano gratuito?** Sim — o software inteiro é gratuito e open-source. O serviço gerenciado (futuro) pode ter free tier limitado para onboarding.

---

## Pricing Table (Projection — Future Managed Service)

| Recurso              | Self-Hosted (Grátis) | Cloud Starter (R$49/mês)     | Cloud Family (R$89/mês)     |
| -------------------- | -------------------- | ---------------------------- | --------------------------- |
| Software completo    | Sim                  | Sim                          | Sim                         |
| Setup e manutenção   | Faça você mesmo      | Gerenciado                   | Gerenciado                  |
| VPS + infraestrutura | Por sua conta        | Incluído (VPS compartilhada) | Incluído (VPS dedicada)     |
| Nós cloud incluídos  | Seus próprios        | 2 provedores (50GB cada)     | 5 provedores (100GB cada)   |
| Membros da família   | Ilimitado            | Até 5                        | Até 15                      |
| Disaster recovery    | Manual (seed phrase) | Automatizado                 | Automatizado + drill mensal |
| Suporte              | Comunidade           | E-mail (<48h)                | Chat prioritário (<4h)      |
| Atualizações         | Manual               | Automáticas                  | Automáticas                 |

> **Nota:** Esta tabela é uma projeção para planejamento. Os preços e features serão validados com pesquisa de mercado antes do lançamento do serviço gerenciado.

---

## Sustainability Unit Economics

### Year 1 — Open-Source Phase (no direct revenue)

| Métrica                     | Valor                                    | Observações                                                               |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Receita direta              | R$0                                      | Software 100% gratuito                                                    |
| Doações estimadas           | R$500-2.000/mês <!-- inferido do PRD --> | Baseado em projetos similares (Immich: ~$8K/mês via sponsors após 2 anos) |
| Custo do mantenedor         | Tempo próprio (Douglas)                  | Não monetizado — projeto pessoal/familiar                                 |
| Custo de infra (projeto)    | ~R$50/mês                                | VPS para demo + CI/CD + docs site                                         |
| Valor gerado por instalação | ~R$420/ano de cloud evitado              | vs Google One 2TB (R$35/mês)                                              |

### Year 2+ — Managed Service (projection)

| Métrica        | Valor                             | Benchmark       | Observações                                                  |
| -------------- | --------------------------------- | --------------- | ------------------------------------------------------------ |
| CAC            | ~R$50 <!-- inferido do PRD -->    | Varia por canal | Orgânico predominante; custo = tempo de conteúdo             |
| LTV            | ~R$2.136 <!-- inferido do PRD --> | LTV/CAC > 3:1   | R$89 × 0,80 margem × 30 meses retenção média                 |
| Razão LTV/CAC  | ~43:1 <!-- inferido do PRD -->    | > 3:1           | Muito alto por CAC orgânico baixo                            |
| Payback Period | < 1 mês <!-- inferido do PRD -->  | < 12 meses      | R$50 / (R$89 × 0,80)                                         |
| Margem Bruta   | ~80% <!-- inferido do PRD -->     | > 70% (SaaS)    | Infra por família ~R$15-20/mês (VPS compartilhada + storage) |
| ARPU           | R$65/mês <!-- inferido do PRD --> | —               | Média ponderada Starter (R$49) + Family (R$89)               |
| Churn Rate     | ~3%/mês <!-- inferido do PRD -->  | < 5% SMB        | Dados acumulados criam switching cost alto                   |

> **Nota:** Todos os valores de unit economics do Ano 2+ são projeções baseadas em benchmarks de SaaS similares. Devem ser validados com dados reais.

---

## Funding Targets (12-Month Projection)

### Year 1 — Open-Source Phase

| Checkpoint | Instalações Ativas | Doações (R$/mês) | Valor Gerado (custo evitado) |
| ---------- | ------------------ | ---------------- | ---------------------------- |
| Mês 1      | 10                 | R$ 0             | R$ 350/mês                   |
| Mês 3      | 50                 | R$ 200           | R$ 1.750/mês                 |
| Mês 6      | 150                | R$ 500           | R$ 5.250/mês                 |
| Mês 9      | 350                | R$ 1.000         | R$ 12.250/mês                |
| Mês 12     | 500-1.000          | R$ 1.500-2.000   | R$ 17.500-35.000/mês         |

### Year 2 — Managed Service Phase (projection)

| Checkpoint | Self-Hosted | Cloud (pagantes) | MRR (R$)  | ARR Projetado (R$) |
| ---------- | ----------- | ---------------- | --------- | ------------------ |
| Mês 13     | 1.200       | 20               | R$ 1.380  | R$ 16.560          |
| Mês 15     | 1.500       | 60               | R$ 4.140  | R$ 49.680          |
| Mês 18     | 2.000       | 150              | R$ 10.350 | R$ 124.200         |
| Mês 21     | 2.500       | 300              | R$ 20.700 | R$ 248.400         |
| Mês 24     | 3.000       | 500              | R$ 34.500 | R$ 414.000         |

---

## Financial Assumptions

| Premissa                                                                | Valor Assumido       | Risco se Errada                                                      |
| ----------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------- |
| Crescimento orgânico de instalações: ~30% mês/mês nos primeiros 6 meses | 30% MoM              | Alto — depende de viralidade em Reddit/HN                            |
| Taxa de conversão self-hosted → cloud gerenciado                        | 5-10% da base        | Alto — famílias técnicas podem nunca querer serviço gerenciado       |
| Churn do serviço gerenciado estabiliza em ~3%/mês                       | 3%                   | Médio — dados acumulados criam barreira de saída natural             |
| Custo de infra por família no serviço gerenciado                        | ~R$15-20/mês         | Baixo — custos de VPS e storage são previsíveis                      |
| Doações crescem linearmente com base de usuários                        | R$2-3/instalação/mês | Alto — doações são imprevisíveis; maioria não doa                    |
| Otimização de mídia 10-20x se mantém para acervos reais                 | 10-20x               | Médio — depende do mix de fotos/vídeos do usuário                    |
| Famílias não-técnicas representam mercado 10x maior que self-hosters    | 10x                  | Médio — validar com pesquisa antes de investir no serviço gerenciado |

> **Premissa mais arriscada:** "Famílias não-técnicas pagariam por um serviço gerenciado de storage distribuído." Validar com landing page + lista de espera antes de construir o serviço cloud.

> **Premissa mais segura:** "Otimização de mídia 10-20x economiza storage significativo." Isso é validável com benchmark técnico no MVP.
