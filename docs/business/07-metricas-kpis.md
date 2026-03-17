# Métricas e KPIs

Esta seção define **como medir o sucesso do Alexandria**. Estabelece a North Star Metric, o funil AARRR adaptado para open-source, metas por milestone e o dashboard operacional.

> **Nota:** O Alexandria é open-source sem receita na v1. Métricas tradicionais SaaS (MRR, churn rate) são projetadas para o serviço gerenciado futuro (ano 2+). Na v1, o foco é em **adoção**, **durabilidade** e **contribuição da comunidade**.

---

## North Star Metric

**North Star Metric:** Fotos preservadas com integridade verificada

**Definição:** Total de arquivos (fotos + vídeos) armazenados em clusters Alexandria com 3+ réplicas saudáveis e último scrubbing sem erros.

**Valor atual:** 0 (pré-lançamento)

**Meta para os próximos 3 meses (pós-lançamento):** 100.000 arquivos preservados em 50+ clusters

**Métricas de suporte:**

| Métrica de Suporte | Valor Atual | Meta (3 meses) | Relação com a North Star |
| --- | --- | --- | --- |
| Clusters ativos (instalações com heartbeat nos últimos 7 dias) | 0 | 50 | Mais clusters = mais fotos preservadas |
| Taxa de replicação saudável (% chunks com 3+ réplicas) | N/A | >99% | Garante que fotos preservadas estão realmente seguras |
| Membros da família ativos (upload ou visualização nos últimos 30 dias) | 0 | 150 | Mais membros = mais fotos entrando nos clusters |

> A North Star reflete o **valor real** do Alexandria: memórias preservadas com segurança. Não é "stars no GitHub" nem "downloads" — é dados reais protegidos.

---

## Métricas AARRR / Pirate Metrics (Adaptado para Open-Source)

### Acquisition (Aquisição)

> Como os usuários descobrem o Alexandria?

| Métrica | Valor Atual | Meta (Ano 1) | Benchmark |
| --- | --- | --- | --- |
| GitHub stars | 0 | 1.000-5.000 | Immich: 50K em 2 anos; PhotoPrism: 35K em 4 anos <!-- inferido do PRD --> |
| Docker pulls/mês | 0 | 500-2.000 | Projetos self-hosted populares: 1K-10K pulls/mês <!-- inferido do PRD --> |

### Activation (Ativação)

> Em que momento o usuário percebe valor?

**Aha moment (admin):** Vê "3/3 réplicas saudáveis" no dashboard pela primeira vez.

**Aha moment (família):** Abre o web client e vê todas as fotos da família em uma timeline unificada.

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| % que completa setup (pull → cluster rodando) | N/A | 70% | >60% para self-hosted com Docker Compose <!-- inferido do PRD --> |
| Tempo até primeiro upload replicado | N/A | <2 horas | <1 dia ideal <!-- inferido do PRD --> |

### Retention (Retenção)

> Os clusters continuam rodando? As famílias continuam usando?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| Clusters ativos após 30 dias (M1) | N/A | 80% | >60% para projetos self-hosted <!-- inferido do PRD --> |
| Clusters ativos após 90 dias (M3) | N/A | 60% | >40% para projetos self-hosted <!-- inferido do PRD --> |

### Revenue (Receita) — Ano 2+

> Projeção para o serviço gerenciado futuro.

| Métrica | Valor Atual | Meta (Ano 2) | Benchmark |
| --- | --- | --- | --- |
| MRR (serviço gerenciado) | R$ 0 | R$ 10.000+ | — |
| SaaS Quick Ratio | N/A | >4 | >4 = crescimento saudável |

### Referral (Indicação)

> Os usuários indicam o Alexandria para outros?

| Métrica | Valor Atual | Meta | Benchmark |
| --- | --- | --- | --- |
| NPS (pesquisa opt-in) | N/A | >60 | >50 = excelente |
| % de instalações vindas por indicação (referral em telemetria opt-in) | N/A | >30% | >20% = forte viral <!-- inferido do PRD --> |

---

## Retenção por Coorte (Projeção)

> Acompanhar a retenção de cada coorte mensal de instalações ao longo do tempo.

| Coorte | Mês 0 | Mês 1 | Mês 2 | Mês 3 | Mês 6 | Mês 12 |
| --- | --- | --- | --- | --- | --- | --- |
| Coorte alpha (early adopters) | 100% | 85% | 75% | 70% | 55% | 40% |
| Coorte beta (pós Show HN) | 100% | 80% | 68% | 60% | 45% | 30% |
| Coorte v1.0 (release estável) | 100% | 82% | 72% | 65% | 50% | 35% |

> **Meta:** cada coorte subsequente deve ter retenção igual ou melhor que a anterior. Se a retenção piora, investigar: setup ficou mais complexo? Bug introduzido? Perfil de usuário mudou?

> **Nota:** Valores são projeções baseadas em benchmarks de projetos self-hosted. Atualizar com dados reais após lançamento.

---

## Metas e Milestones

### Milestones (Early-Stage)

| Fase | Período | Meta Principal | Critério de Saída |
| --- | --- | --- | --- |
| **Alpha** | Mês 1-3 | Validar que o core funciona (upload → otimização → replicação → recovery) | 10 clusters rodando; 0 perda de dados; disaster drill bem-sucedido |
| **Beta** | Mês 4-6 | Provar adoção e retenção com early adopters | 50 clusters ativos; M3 retenção >60%; 5+ contribuidores de código |
| **v1.0** | Mês 7-9 | Release estável com todos os Must-have implementados | 200+ clusters; 0 bugs críticos abertos; docs completa para setup |
| **Crescimento** | Mês 10-12 | Escalar adoção e preparar serviço gerenciado | 500-1.000 clusters; lista de espera para cloud; 10+ contribuidores |

### OKRs — Q1 Pós-Lançamento

**Objetivo 1:** Provar que o Alexandria preserva dados de forma confiável

| Key Result | Valor Atual | Meta | Status |
| --- | --- | --- | --- |
| KR 1.1: Clusters ativos com 3+ réplicas saudáveis | 0 | 50 | Não iniciado |
| KR 1.2: Zero perda de dados reportada | N/A | 0 perdas | Não iniciado |
| KR 1.3: 3 disaster drills bem-sucedidos (recovery via seed phrase) | 0 | 3 | Não iniciado |

**Objetivo 2:** Construir comunidade engajada de early adopters

| Key Result | Valor Atual | Meta | Status |
| --- | --- | --- | --- |
| KR 2.1: GitHub stars | 0 | 500 | Não iniciado |
| KR 2.2: Pull requests da comunidade mergeados | 0 | 20 | Não iniciado |
| KR 2.3: Membros ativos no Discord/Discussions | 0 | 100 | Não iniciado |

---

## Dashboard Operacional

**Métricas Diárias (2):**

| Métrica | Fonte | Alerta se... |
| --- | --- | --- |
| Novos Docker pulls | Docker Hub / GHCR API | < 5 por dia (após lançamento) |
| Issues/PRs abertos sem triagem | GitHub API | > 10 sem label por >24h |

**Métricas Semanais (3):**

| Métrica | Fonte | Alerta se... |
| --- | --- | --- |
| Clusters ativos (heartbeat nos últimos 7 dias) | Telemetria opt-in | Queda >10% semana/semana |
| Taxa de replicação saudável (média dos clusters) | Telemetria opt-in | < 95% |
| GitHub stars + forks (crescimento semanal) | GitHub API | Crescimento < 2% semana/semana por 3 semanas consecutivas |

> **Ferramenta sugerida:** Grafana Cloud (free tier) com dados de telemetria opt-in + GitHub API. Dashboard público para transparência com a comunidade.

---

## Glossário de Métricas SaaS

> Definições canônicas das principais métricas. Referenciadas ao longo de todo o blueprint. Aplicáveis principalmente ao serviço gerenciado (ano 2+).

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

> **Para open-source na v1**, substitua mentalmente: MRR → doações/mês; CAC → tempo investido em conteúdo por instalação; LTV → meses de uso ativo × valor gerado (custo evitado); Churn → % de clusters que param de rodar.
