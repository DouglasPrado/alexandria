# Modelo de Receita

Esta seção define **como o negócio gera dinheiro**. Detalha as fontes de receita, a estratégia de precificação, a economia unitária e as projeções financeiras que sustentam a viabilidade do modelo.

---

## Fontes de Receita

> De onde vem o dinheiro? Liste todas as formas pelas quais o negócio captura valor. Considere: assinaturas, transações, licenciamento, publicidade, marketplace fees, serviços adicionais.

| Fonte | Tipo | % da Receita Total | Descrição |
| --- | --- | --- | --- |
| {{Fonte 1}} | {{Recorrente / Transacional / Uso / Comissão}} | {{Ex.: 60%}} | {{Como essa receita é gerada}} |
| {{Fonte 2}} | {{Recorrente / Transacional / Uso / Comissão}} | {{Ex.: 25%}} | {{Como essa receita é gerada}} |
| {{Fonte 3}} | {{Recorrente / Transacional / Uso / Comissão}} | {{Ex.: 15%}} | {{Como essa receita é gerada}} |

> Dica: negócios com receita recorrente tendem a ter valuations mais altos. Se possível, priorize pelo menos uma fonte recorrente.

---

## Composição do MRR

> Como o MRR (Monthly Recurring Revenue) evolui mês a mês? Decomponha para entender a saúde real do crescimento.

**Fórmula:** New MRR + Expansion MRR - Churn MRR + Reactivation MRR = **Net New MRR**

| Componente | Valor (R$) | Descrição |
| --- | --- | --- |
| New MRR | {{R$ X}} | Receita de novos clientes no mês |
| Expansion MRR | {{R$ X}} | Upgrades e expansão de clientes existentes |
| Churn MRR | {{R$ X}} | Receita perdida por cancelamentos |
| Reactivation MRR | {{R$ X}} | Receita de clientes que retornaram |
| **Net New MRR** | **{{R$ X}}** | Variação líquida do MRR no mês |

> Concentração de Receita — Risco: se os top 10 clientes representam mais de 30% do MRR, há risco de concentração. Monitore e diversifique a base.

<details>
<summary>Exemplo</summary>

| Componente | Valor (R$) | Descrição |
| --- | --- | --- |
| New MRR | R$ 2.450 | 50 novos clientes × R$ 49 |
| Expansion MRR | R$ 600 | 12 upgrades de Starter → Pro |
| Churn MRR | R$ 980 | 20 cancelamentos |
| Reactivation MRR | R$ 196 | 4 clientes reativados |
| **Net New MRR** | **R$ 2.266** | Crescimento líquido positivo |

</details>

---

## Net Revenue Retention (NRR)

> O NRR mede quanto da receita de clientes existentes é mantida (e expandida) ao longo do tempo, sem contar novos clientes.

**Fórmula:** (MRR de clientes existentes no mês atual / MRR desses mesmos clientes no mês anterior) × 100

**NRR atual:** {{X%}}

**Meta:** {{X%}}

> Benchmark SaaS: NRR > 100% significa que expansão supera churn. Idealmente > 120% para SaaS B2B.

---

## Estratégia de Pricing

> Qual modelo de precificação será adotado? Como os preços foram definidos? Considere: valor percebido pelo cliente, preços da concorrência, disposição a pagar, custo de entrega.

**Modelo de precificação:** {{Freemium / Flat rate / Por uso / Tiered / Per seat / Marketplace fee / Híbrido}}

**Lógica de precificação:**

{{Explique o racional por trás dos preços. Ex.: "Preço baseado no valor entregue — cada agendamento economiza em média 15 minutos do prestador, o que justifica o valor da assinatura."}}

**Existe plano gratuito (free tier)?** {{Sim / Não}}

{{Se sim, descreva o que está incluído no plano gratuito e qual a estratégia de conversão para planos pagos.}}

---

## Tabela de Preços

> Monte a tabela de preços com os planos/tiers disponíveis. Inclua o que cada plano oferece para facilitar a comparação.

| Recurso | {{Plano Free}} | {{Plano Básico}} | {{Plano Pro}} | {{Plano Enterprise}} |
| --- | --- | --- | --- | --- |
| Preço mensal | {{R$ 0}} | {{R$ X/mês}} | {{R$ Y/mês}} | {{Sob consulta}} |
| Preço anual (desconto) | — | {{R$ X/ano}} | {{R$ Y/ano}} | {{Sob consulta}} |
| {{Recurso 1}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} |
| {{Recurso 2}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} |
| {{Recurso 3}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} | {{Limite / Sim / Não}} |
| Suporte | {{E-mail / Chat / Dedicado}} | {{E-mail / Chat / Dedicado}} | {{E-mail / Chat / Dedicado}} | {{E-mail / Chat / Dedicado}} |

<details>
<summary>Exemplo</summary>

| Recurso | Free | Starter (R$ 49/mês) | Pro (R$ 99/mês) | Business (R$ 249/mês) |
| --- | --- | --- | --- | --- |
| Agendamentos/mês | 30 | 200 | Ilimitado | Ilimitado |
| Página pública | Sim | Sim | Sim | Sim |
| Lembretes por WhatsApp | Não | Sim | Sim | Sim |
| Múltiplos profissionais | Não | Não | Até 5 | Ilimitado |
| API de integração | Não | Não | Não | Sim |
| Suporte | E-mail | E-mail | Chat prioritário | Dedicado |

</details>

---

## Unit Economics

> Qual a economia unitária do negócio? Esses números definem se o modelo é sustentável. Preencha com dados reais ou estimativas fundamentadas.

> **ARPU vs Ticket Médio:** ARPU (Average Revenue Per User) considera todos os usuários (incluindo free). Ticket Médio considera apenas pagantes. Para SaaS freemium, use ambos — ARPU para entender monetização geral, Ticket Médio para projeções de receita.

| Métrica | Valor | Benchmark | Observações |
| --- | --- | --- | --- |
| CAC (Custo de Aquisição de Cliente) | {{R$ X}} | Varia por canal | {{Total gasto em marketing / novos clientes}} |
| LTV (Lifetime Value) | {{R$ X}} | LTV/CAC > 3:1 | {{Ticket médio × margem bruta × tempo médio de retenção}} |
| Razão LTV/CAC | {{X:1}} | > 3:1 | {{Indica se o modelo é saudável}} |
| Payback Period | {{X meses}} | < 12 meses | {{Em quantos meses o CAC é recuperado}} |
| Margem Bruta | {{X%}} | > 70% (SaaS) | {{(Receita - COGS) / Receita}} |
| Ticket Médio | {{R$ X/mês}} | — | {{Receita média por usuário pagante por mês}} |
| ARPU | {{R$ X/mês}} | — | {{Receita total / total de usuários (free + pagos)}} |
| Churn Rate | {{X% ao mês}} | < 5% SMB, < 2% Enterprise | {{% de clientes que cancelam por mês}} |
| SaaS Magic Number | {{X}} | > 0,75 | {{Net New ARR trimestre / Gasto S&M trimestre anterior}} |

> Regras de ouro para SaaS:
> - LTV/CAC > 3:1 indica modelo saudável
> - Payback < 12 meses é ideal para startups
> - Churn < 5% mensal para SMB, < 2% para Enterprise
> - Magic Number > 0,75 indica eficiência de vendas

<details>
<summary>Exemplo</summary>

| Métrica | Valor | Benchmark | Observações |
| --- | --- | --- | --- |
| CAC | R$ 85 | — | Google Ads (R$ 3.000) + Conteúdo (R$ 1.500) / 53 clientes |
| LTV | R$ 594 | — | R$ 49 × 0,75 × 16,2 meses |
| Razão LTV/CAC | 7:1 | > 3:1 | Saudável — espaço para investir mais |
| Payback Period | 2,3 meses | < 12 meses | R$ 85 / (R$ 49 × 0,75) |
| Margem Bruta | 75% | > 70% | Infraestrutura + suporte = 25% do ticket |
| Ticket Médio | R$ 49/mês | — | Média ponderada entre planos |
| ARPU | R$ 12/mês | — | R$ 4.900 MRR / 408 usuários totais |
| Churn Rate | 6,2% ao mês | < 5% | Necessário melhorar onboarding |
| SaaS Magic Number | 0,9 | > 0,75 | Eficiência de vendas adequada |

</details>

---

## Projeções de Receita

> Projete a receita para os próximos 12 meses em 5 checkpoints. Seja conservador nas premissas e explicite-as na seção seguinte.

| Checkpoint | Usuários Totais | Usuários Pagantes | Taxa de Conversão | MRR (R$) | ARR Projetado (R$) |
| --- | --- | --- | --- | --- | --- |
| Mês 1 | {{X}} | {{X}} | {{X%}} | {{R$ X}} | {{R$ X}} |
| Mês 3 | {{X}} | {{X}} | {{X%}} | {{R$ X}} | {{R$ X}} |
| Mês 6 | {{X}} | {{X}} | {{X%}} | {{R$ X}} | {{R$ X}} |
| Mês 9 | {{X}} | {{X}} | {{X%}} | {{R$ X}} | {{R$ X}} |
| Mês 12 | {{X}} | {{X}} | {{X%}} | {{R$ X}} | {{R$ X}} |

---

## Premissas Financeiras

> Quais premissas sustentam as projeções acima? Seja explícito — premissas escondidas são a principal causa de projeções irrealistas.

| Premissa | Valor Assumido | Risco se Errada |
| --- | --- | --- |
| {{Ex.: Crescimento orgânico mês a mês nos primeiros 6 meses}} | {{30%}} | {{Alto}} |
| {{Ex.: Taxa de conversão free-to-paid estabiliza após mês 6}} | {{10%}} | {{Alto}} |
| {{Ex.: Churn mensal reduz após melhorias no onboarding}} | {{De 6% para 4%}} | {{Médio}} |
| {{Ex.: Distribuição de planos — maioria no Starter}} | {{70% Starter, 30% Pro}} | {{Baixo}} |
| {{Ex.: CAC se mantém estável nos primeiros 6 meses}} | {{R$ 85}} | {{Médio}} |
| {{Ex.: Custo de infraestrutura escala linearmente com usuários}} | {{R$ 0,50/usuário}} | {{Baixo}} |

> Para cada premissa com risco Alto, pergunte: "Se isso se provar errado, o modelo ainda funciona?" Se a resposta for não, essa premissa precisa ser validada o quanto antes.

