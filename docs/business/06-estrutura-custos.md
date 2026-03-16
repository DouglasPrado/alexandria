# Estrutura de Custos

Esta seção mapeia **quanto custa operar o negócio**, separando custos fixos e variáveis, identificando recursos e atividades-chave, e calculando métricas essenciais como burn rate, break-even e runway.

---

## Custos Fixos

> Quais custos existem independentemente do volume de vendas ou usuários? Inclua salários, ferramentas, infraestrutura base, escritório, contabilidade, etc.

| Item | Valor Mensal (R$) | Categoria | Observações |
| --- | --- | --- | --- |
| {{Item 1}} | {{R$ X}} | {{Pessoas / Infraestrutura / Ferramentas / Administrativo}} | {{Detalhes relevantes}} |
| {{Item 2}} | {{R$ X}} | {{Pessoas / Infraestrutura / Ferramentas / Administrativo}} | {{Detalhes relevantes}} |
| {{Item 3}} | {{R$ X}} | {{Pessoas / Infraestrutura / Ferramentas / Administrativo}} | {{Detalhes relevantes}} |
| **Total Custos Fixos** | **{{R$ X}}** | | |

<details>
<summary>Exemplo</summary>

| Item | Valor Mensal (R$) | Categoria | Observações |
| --- | --- | --- | --- |
| Salário — Dev Full-stack | R$ 8.000 | Pessoas | CLT, inclui encargos |
| Salário — Designer/Produto | R$ 6.000 | Pessoas | PJ meio período |
| AWS / Infraestrutura base | R$ 800 | Infraestrutura | Servidores, banco, CDN |
| Ferramentas SaaS (GitHub, Figma, Slack) | R$ 350 | Ferramentas | 3 licenças |
| Contabilidade | R$ 400 | Administrativo | Escritório terceirizado |
| **Total Custos Fixos** | **R$ 15.550** | | |

</details>

---

## Custos Variáveis

> Quais custos aumentam proporcionalmente ao volume de uso, vendas ou usuários? Inclua custos por transação, APIs, suporte incremental, comissões, etc.

| Item | Custo Unitário (R$) | Driver de Volume | Observações |
| --- | --- | --- | --- |
| {{Item 1}} | {{R$ X por unidade}} | {{Nº de usuários / transações / requisições}} | {{Detalhes relevantes}} |
| {{Item 2}} | {{R$ X por unidade}} | {{Nº de usuários / transações / requisições}} | {{Detalhes relevantes}} |
| {{Item 3}} | {{R$ X por unidade}} | {{Nº de usuários / transações / requisições}} | {{Detalhes relevantes}} |

> Dica: custos variáveis definem sua margem bruta. Quanto menor o custo variável por cliente, mais escalável é o modelo.

---

## COGS vs OpEx

> Separe os custos de entrega do produto (COGS) dos custos operacionais (OpEx). Essa distinção é fundamental para calcular a margem bruta.

**COGS (Custo de Entrega):** custos diretamente ligados a servir clientes — hosting, APIs de terceiros, ferramentas de suporte, custos de transação.

| Item COGS | Valor Mensal (R$) |
| --- | --- |
| {{Hosting / Infraestrutura}} | {{R$ X}} |
| {{APIs e serviços de terceiros}} | {{R$ X}} |
| {{Ferramentas de suporte}} | {{R$ X}} |
| **Total COGS** | **{{R$ X}}** |

**OpEx (Custos Operacionais):** salários, marketing, administrativo, escritório.

| Item OpEx | Valor Mensal (R$) |
| --- | --- |
| {{Salários e equipe}} | {{R$ X}} |
| {{Marketing}} | {{R$ X}} |
| {{Administrativo}} | {{R$ X}} |
| **Total OpEx** | **{{R$ X}}** |

**Margem Bruta** = (Receita - COGS) / Receita × 100 = **{{X%}}**

> Benchmark SaaS: margem bruta > 70% é considerada saudável. Se abaixo de 60%, revise os custos de entrega.

---

## Curva de Escala

> Como os custos se comportam à medida que o número de usuários cresce? Identifique gargalos antes que eles aconteçam.

| Métrica | 1K Usuários | 10K Usuários | 100K Usuários |
| --- | --- | --- | --- |
| Custo de infraestrutura/mês | {{R$ X}} | {{R$ X}} | {{R$ X}} |
| Custo de suporte/mês | {{R$ X}} | {{R$ X}} | {{R$ X}} |
| Custo por usuário | {{R$ X}} | {{R$ X}} | {{R$ X}} |
| Equipe necessária | {{X pessoas}} | {{X pessoas}} | {{X pessoas}} |

> O custo por usuário deve cair com escala. Se não cai, o modelo tem problema de escalabilidade.

---

## Recursos Críticos

> Quais são os recursos essenciais para o negócio funcionar? (Componente do Business Model Canvas)

| Recurso | Categoria | Custo Mensal (R$) | Essencial para |
| --- | --- | --- | --- |
| {{Ex.: Dev full-stack}} | Pessoa | {{R$ X}} | {{Desenvolvimento e manutenção da plataforma}} |
| {{Ex.: Plataforma web (Next.js + PostgreSQL)}} | Tecnologia | {{R$ X}} | {{Entrega do produto ao usuário}} |
| {{Ex.: Algoritmo proprietário de matching}} | IP | {{—}} | {{Diferencial competitivo}} |
| {{Ex.: Infraestrutura cloud (AWS)}} | Tecnologia | {{R$ X}} | {{Disponibilidade e performance}} |

---

## Atividades-Chave

> Quais são as top 3 atividades que param o negócio se não forem executadas? (Componente do Business Model Canvas)

| Atividade | Responsável | Frequência |
| --- | --- | --- |
| {{Atividade 1 — ex.: Desenvolvimento e manutenção da plataforma}} | {{Quem executa}} | {{Contínua}} |
| {{Atividade 2 — ex.: Aquisição e onboarding de clientes}} | {{Quem executa}} | {{Diária}} |
| {{Atividade 3 — ex.: Suporte ao cliente}} | {{Quem executa}} | {{Diária}} |

> Se não consegue listar em 3, priorize. Tudo além disso é importante, mas não crítico.

---

## Fornecedores e Parceiros

> Quais fornecedores e parceiros são essenciais para a operação? Avalie o risco de dependência e o custo de troca de cada um.

| Fornecedor | Serviço | Custo Mensal (R$) | Criticidade | Alternativa | Custo de Troca |
| --- | --- | --- | --- | --- | --- |
| {{Fornecedor 1}} | {{O que fornece}} | {{R$ X}} | {{Crítico / Alto / Médio}} | {{Alternativa}} | {{Ex.: 2 semanas / R$ 5.000}} |
| {{Fornecedor 2}} | {{O que fornece}} | {{R$ X}} | {{Crítico / Alto / Médio}} | {{Alternativa}} | {{Ex.: 1 dia / R$ 0}} |
| {{Fornecedor 3}} | {{O que fornece}} | {{R$ X}} | {{Crítico / Alto / Médio}} | {{Alternativa}} | {{Ex.: 1 mês / R$ 10.000}} |

> Para fornecedores com criticidade "Crítico", tenha sempre um plano B documentado. Custo de Troca alto = risco de vendor lock-in.

---

## Burn Rate

> Qual o custo mensal total de operação do negócio? O burn rate é a velocidade com que o dinheiro está sendo gasto.

| Componente | Valor Mensal (R$) |
| --- | --- |
| Total Custos Fixos | {{R$ X}} |
| Total Custos Variáveis (estimativa para volume atual) | {{R$ X}} |
| **Burn Rate Bruto** | **{{R$ X}}** |
| (-) Receita atual (MRR) | {{R$ X}} |
| **Burn Rate Líquido** | **{{R$ X}}** |

> Burn Rate Bruto = tudo que é gasto por mês. Burn Rate Líquido = gasto menos a receita. Quando o burn rate líquido chega a zero, você atingiu o break-even.

---

## Break-even

> Em que ponto a receita cobre todos os custos? Calcule quantos clientes pagantes ou qual MRR é necessário para atingir o equilíbrio.

**MRR necessário para break-even:** {{R$ X/mês}}

**Número de clientes pagantes necessário:** {{X clientes}} (com ticket médio de {{R$ X/mês}})

**Previsão de quando atingir break-even:** {{Mês X — ex.: "Mês 8 com as premissas atuais"}}

**Cálculo:**

{{Custos fixos / (Ticket médio - Custo variável por cliente) = Nº de clientes para break-even}}

---

## Runway

> Com o capital disponível e o burn rate atual, por quanto tempo o negócio sobrevive sem receita adicional ou investimento?

| Item | Valor |
| --- | --- |
| Capital disponível | {{R$ X}} |
| Burn Rate Líquido mensal | {{R$ X}} |
| **Runway** | **{{X meses}}** |
| Data estimada de fim do runway | {{Mês/Ano}} |

> Regra geral: mantenha pelo menos 6 meses de runway. Com menos de 3 meses, a prioridade absoluta deve ser captação ou geração de receita.

---

## Análise de Sensibilidade

> O que acontece com o runway se as premissas mudarem? Modele 3 cenários para se preparar.

| Cenário | Burn Rate (R$) | Runway | Premissa Principal |
| --- | --- | --- | --- |
| Otimista | {{R$ X}} | {{X meses}} | {{Ex.: MRR cresce 40%/mês, break-even no mês 6}} |
| Base | {{R$ X}} | {{X meses}} | {{Ex.: MRR cresce 25%/mês conforme projetado}} |
| Pessimista | {{R$ X}} | {{X meses}} | {{Ex.: MRR estagna, sem crescimento de receita}} |

> Para o cenário pessimista, defina um plano de ação: corte de custos, captação de emergência ou pivot.

<details>
<summary>Exemplo</summary>

| Cenário | Burn Rate (R$) | Runway | Premissa Principal |
| --- | --- | --- | --- |
| Otimista | R$ 5.500 (média) | 14,5 meses | MRR cresce 40%/mês |
| Base | R$ 8.200 (média) | 9,8 meses | MRR cresce 25%/mês |
| Pessimista | R$ 11.900 | 6,7 meses | MRR estagna em R$ 4.900 |

</details>
