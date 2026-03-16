# Métricas e KPIs

Esta seção define **como medir o sucesso do negócio**. Estabelece a North Star Metric com métricas de suporte, o funil AARRR, metas por milestone e o dashboard operacional para acompanhamento contínuo.

---

## North Star Metric

> Qual é a métrica que melhor representa o valor entregue aos clientes? Defina uma North Star + 2-3 métricas de suporte que a influenciam diretamente.

**North Star Metric:** {{Nome da métrica}}

**Definição:** {{Como essa métrica é calculada — seja preciso}}

**Valor atual:** {{X}}

**Meta para os próximos 3 meses:** {{X}}

**Métricas de suporte:**

| Métrica de Suporte | Valor Atual | Meta | Relação com a North Star |
| --- | --- | --- | --- |
| {{Métrica 1}} | {{X}} | {{X}} | {{Como influencia a North Star}} |
| {{Métrica 2}} | {{X}} | {{X}} | {{Como influencia a North Star}} |
| {{Métrica 3}} | {{X}} | {{X}} | {{Como influencia a North Star}} |

> A North Star reflete valor entregue ao cliente (não apenas receita). As métricas de suporte são as alavancas que o time pode influenciar diretamente.

<details>
<summary>Exemplo</summary>

**North Star Metric:** Agendamentos concluídos por semana

**Definição:** Agendamentos confirmados e realizados (excluindo cancelamentos e no-shows) em uma semana.

**Valor atual:** 45/semana — **Meta:** 300/semana

**Métricas de suporte:**

| Métrica de Suporte | Valor Atual | Meta | Relação com a North Star |
| --- | --- | --- | --- |
| Prestadores ativos semanais | 30 | 150 | Mais prestadores = mais agendamentos |
| Taxa de conclusão (agendado → realizado) | 72% | 85% | Reduz no-shows, aumenta volume real |
| Agendamentos por prestador/semana | 1,5 | 2,0 | Maior frequência por prestador |

</details>

---

## Métricas AARRR / Pirate Metrics

> Mapeie 2 métricas essenciais para cada etapa do funil. Isso revela onde estão os gargalos e onde focar esforços de otimização.

### Acquisition (Aquisição)

> Como os usuários descobrem e chegam ao produto?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| {{Visitantes únicos/mês}} | {{X}} | {{X}} | {{Varia por canal}} |
| {{CAC por canal}} | {{R$ X}} | {{R$ X}} | {{< LTV/3}} |

### Activation (Ativação)

> Em que momento o usuário tem a primeira experiência de valor?

**Aha moment:** {{Descreva o momento — ex.: "Quando o prestador recebe seu primeiro agendamento online"}}

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| {{% que completa onboarding}} | {{X%}} | {{X%}} | {{> 60%}} |
| {{Tempo até primeiro valor}} | {{X dias}} | {{X dias}} | {{< 1 dia ideal}} |

### Retention (Retenção)

> Os usuários voltam a usar o produto? Com que frequência?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| {{Retenção D30}} | {{X%}} | {{X%}} | {{> 40% para SaaS}} |
| {{Churn mensal}} | {{X%}} | {{< X%}} | {{< 5% SMB, < 2% Enterprise}} |

### Revenue (Receita)

> Os usuários pagam? Quanto e com que frequência?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| {{MRR}} | {{R$ X}} | {{R$ X}} | {{Depende do estágio}} |
| {{SaaS Quick Ratio}} | {{X}} | {{> 4}} | {{> 4 = crescimento saudável}} |

> **SaaS Quick Ratio** = (New MRR + Expansion MRR) / (Churn MRR + Contraction MRR). Mede a eficiência do crescimento de receita.

### Referral (Indicação)

> Os usuários indicam o produto para outros?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| {{NPS}} | {{X}} | {{> X}} | {{> 50 = excelente}} |
| {{% de clientes vindos por indicação}} | {{X%}} | {{X%}} | {{> 20% = forte viral}} |

<details>
<summary>Exemplo</summary>

### Acquisition
| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| Visitantes únicos/mês | 3.200 | 10.000 | — |
| CAC médio | R$ 85 | R$ 60 | < R$ 198 (LTV/3) |

### Activation
**Aha moment:** Prestador recebe o primeiro agendamento online

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| % que completa setup da agenda | 62% | 80% | > 60% |
| Tempo até primeiro agendamento | 5 dias | 2 dias | < 1 dia |

### Retention
| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| Retenção D30 (prestadores) | 48% | 60% | > 40% |
| Churn mensal (pagantes) | 6,2% | < 5% | < 5% |

### Revenue
| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| MRR | R$ 4.900 | R$ 15.000 | — |
| SaaS Quick Ratio | 3,2 | > 4 | > 4 |

### Referral
| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| NPS | 32 | > 40 | > 50 |
| % vindos por indicação | 12% | 30% | > 20% |

</details>

---

## Retenção por Coorte

> Acompanhe a retenção de cada coorte ao longo do tempo. Isso revela se melhorias no produto estão funcionando e em que momento os usuários abandonam.

| Coorte | Mês 0 | Mês 1 | Mês 2 | Mês 3 | Mês 6 | Mês 12 |
| --- | --- | --- | --- | --- | --- | --- |
| {{Coorte 1 — ex.: Jan/2026}} | 100% | {{X%}} | {{X%}} | {{X%}} | {{X%}} | {{X%}} |
| {{Coorte 2 — ex.: Fev/2026}} | 100% | {{X%}} | {{X%}} | {{X%}} | {{X%}} | — |
| {{Coorte 3 — ex.: Mar/2026}} | 100% | {{X%}} | {{X%}} | {{X%}} | — | — |

> Se a retenção melhora entre coortes, o produto está evoluindo na direção certa. Se piora, há regressão de experiência ou mudança de perfil de usuário.

---

## Metas e Milestones

> Defina metas por fase do negócio. No estágio inicial, use milestones concretos. Conforme crescer, adote OKRs trimestrais.

### Milestones (Early-Stage)

| Fase | Período | Meta Principal | Critério de Saída |
| --- | --- | --- | --- |
| Lançamento | {{Mês X-Y}} | {{Ex.: Validar que prestadores usam a plataforma}} | {{Ex.: 50 prestadores ativos, 200 agendamentos/semana}} |
| Crescimento | {{Mês X-Y}} | {{Ex.: Provar unit economics e escalar aquisição}} | {{Ex.: LTV/CAC > 3:1, MRR > R$ 15.000}} |
| Maturidade | {{Mês X+}} | {{Ex.: Otimizar margens e expandir segmentos}} | {{Ex.: Margem bruta > 70%, churn < 3%}} |

### OKRs (Growth-Stage — opcional)

**Período:** {{Q1/Q2/Q3/Q4 de 20XX}}

**Objetivo 1:** {{Objetivo qualitativo e inspirador}}

| Key Result | Valor Atual | Meta | Status |
| --- | --- | --- | --- |
| {{KR 1.1}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |
| {{KR 1.2}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |
| {{KR 1.3}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |

**Objetivo 2:** {{Objetivo qualitativo e inspirador}}

| Key Result | Valor Atual | Meta | Status |
| --- | --- | --- | --- |
| {{KR 2.1}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |
| {{KR 2.2}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |
| {{KR 2.3}} | {{X}} | {{X}} | {{No track / Em risco / Atingido}} |

---

## Dashboard Operacional

> Quais métricas o time deve acompanhar no dia a dia? Mantenha o dashboard enxuto — excesso de métricas dilui o foco.

**Métricas Diárias (2):**

| Métrica | Fonte | Alerta se... |
| --- | --- | --- |
| {{Métrica 1 — ex.: Novos cadastros}} | {{Ferramenta}} | {{< X por dia}} |
| {{Métrica 2 — ex.: Agendamentos criados}} | {{Ferramenta}} | {{< X por dia}} |

**Métricas Semanais (3):**

| Métrica | Fonte | Alerta se... |
| --- | --- | --- |
| {{Métrica 1 — ex.: MRR}} | {{Ferramenta}} | {{Crescimento < X%}} |
| {{Métrica 2 — ex.: Churn semanal}} | {{Ferramenta}} | {{> X%}} |
| {{Métrica 3 — ex.: Taxa de conversão}} | {{Ferramenta}} | {{< X%}} |

---

## Glossário de Métricas SaaS

> Definições canônicas das principais métricas SaaS. Referenciadas ao longo de todo o blueprint.

| Métrica | Definição | Fórmula |
| --- | --- | --- |
| **MRR** | Monthly Recurring Revenue — receita recorrente mensal | Soma de todas as assinaturas ativas no mês |
| **ARR** | Annual Recurring Revenue — receita recorrente anual | MRR × 12 |
| **ARPU** | Average Revenue Per User — receita média por usuário | MRR / total de usuários (free + pagos) |
| **CAC** | Customer Acquisition Cost — custo de aquisição de cliente | Total gasto em vendas e marketing / novos clientes no período |
| **LTV** | Lifetime Value — valor do ciclo de vida do cliente | Ticket médio × margem bruta × tempo médio de retenção (meses) |
| **LTV/CAC** | Razão entre valor do cliente e custo de aquisição | LTV / CAC (saudável: > 3:1) |
| **Payback Period** | Tempo para recuperar o CAC | CAC / (Ticket médio × margem bruta) |
| **Churn Rate** | Taxa de cancelamento mensal | Clientes que cancelaram no mês / clientes no início do mês × 100 |
| **NRR** | Net Revenue Retention — retenção líquida de receita | (MRR clientes existentes mês atual / MRR mesmos clientes mês anterior) × 100 |
| **Quick Ratio** | Eficiência do crescimento de MRR | (New MRR + Expansion MRR) / (Churn MRR + Contraction MRR) |
| **Magic Number** | Eficiência de vendas e marketing | Net New ARR no trimestre / Gasto S&M no trimestre anterior |
