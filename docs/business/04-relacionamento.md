# Relacionamento com Cliente

Esta secao define **como o produto constroi e mantem relacoes duradouras com os clientes**. Abrange ativacao, ciclo de vida, retencao, expansao e recuperacao de clientes. Um bom relacionamento transforma usuarios em promotores.

---

## Definicao de Ativacao

> O que significa um usuario "ativo"? Defina criterios claros para medir se o cliente atingiu o primeiro valor.

| Aspecto | Descricao |
| --- | --- |
| **Criterio de ativacao** | {{Ex.: "Completou 3 agendamentos na primeira semana"}} |
| **Momento "aha!"** | {{Ex.: "Quando recebe o primeiro agendamento feito pelo link, sem trocar mensagens"}} |
| **Prazo esperado** | {{Ex.: "Ate 7 dias apos cadastro"}} |
| **Taxa de ativacao alvo** | {{Ex.: "60% dos novos cadastros"}} |

> Todo o onboarding deve ser desenhado para chegar no momento "aha!" o mais rapido possivel.

---

## Ciclo de Vida e Estrategia

> Quais sao as fases do ciclo de vida e como o produto atua em cada uma?

| Fase | Objetivo | Modelo | Acao Principal | Metrica |
| --- | --- | --- | --- | --- |
| **Aquisicao** | {{Converter visitante em usuario}} | {{Self-service / Assistido / Automatizado}} | {{Ex.: "Trial gratuito, onboarding guiado"}} | {{Ex.: "Taxa de cadastro"}} |
| **Ativacao** | {{Fazer usuario atingir primeiro valor}} | {{Self-service / Assistido / Automatizado}} | {{Ex.: "Checklist de setup, primeiro agendamento"}} | {{Ex.: "Taxa de ativacao"}} |
| **Retencao** | {{Manter uso recorrente}} | {{Self-service / Assistido / Automatizado}} | {{Ex.: "Features de engajamento, relatorios de valor"}} | {{Ex.: "Retencao mensal"}} |
| **Receita** | {{Converter em pagante, expandir}} | {{Self-service / Assistido / Automatizado}} | {{Ex.: "Comunicacao de valor, oferta de upgrade"}} | {{Ex.: "Conversao trial→pago"}} |
| **Indicacao** | {{Transformar em promotor}} | {{Self-service / Assistido / Automatizado}} | {{Ex.: "Programa de indicacao"}} | {{Ex.: "Taxa de indicacao"}} |

> Na fase Growth, considere tambem **comunidade**: espacos para troca de experiencias entre clientes (WhatsApp, Discord, forum) como alavanca de retencao e aquisicao organica.

<details>
<summary>Exemplo</summary>

| Fase | Objetivo | Modelo | Acao Principal | Metrica |
| --- | --- | --- | --- | --- |
| Aquisicao | Converter visitante em usuario | Self-service | Trial de 14 dias, landing page otimizada | Taxa de cadastro: 8% |
| Ativacao | Atingir primeiro agendamento real | Automatizado | Checklist de setup + wizard | Taxa de ativacao: 55% |
| Retencao | Manter uso semanal | Automatizado | Relatorio semanal de valor, lembretes | Retencao M1: 80% |
| Receita | Converter trial em pagante | Self-service | E-mail de valor no dia 10, oferta no dia 12 | Conversao: 35% |
| Indicacao | Gerar boca-a-boca | Automatizado | Link de indicacao apos 45 dias | 15% indicam |

</details>

---

## Retencao

**Sinais de risco de churn:**

| Sinal | Acao Preventiva | Automacao |
| --- | --- | --- |
| {{Sinal 1 — ex.: "Login caiu 50% na ultima semana"}} | {{Ex.: "E-mail automatico + oferta de ajuda"}} | {{Sim / Nao}} |
| {{Sinal 2 — ex.: "Nao usou feature principal em 14 dias"}} | {{Ex.: "Push notification com dica de uso"}} | {{Sim / Nao}} |
| {{Sinal 3 — ex.: "Abriu ticket de reclamacao"}} | {{Ex.: "Contato proativo do CS em 24h"}} | {{Nao}} |

**Estrategias de retencao:**

- {{Estrategia 1 — ex.: "Onboarding progressivo que desbloqueia features conforme uso"}}
- {{Estrategia 2 — ex.: "Relatorios semanais mostrando valor gerado (tempo economizado, agendamentos)"}}
- {{Estrategia 3 — ex.: "Check-in proativo no dia 7, 30 e 60 apos cadastro"}}

**Meta de retencao:**

| Metrica | Meta | Benchmark do Mercado |
| --- | --- | --- |
| Retencao mensal (M1) | {{Ex.: 80%}} | {{Ex.: 70-75% para SaaS SMB}} |
| Retencao trimestral (M3) | {{Ex.: 60%}} | {{Ex.: 50-55% para SaaS SMB}} |
| Churn mensal | {{Ex.: < 5%}} | {{Ex.: 5-7% para SaaS SMB}} |

---

## Expansion Revenue

> Como expandir a receita de clientes existentes?

| Aspecto | Descricao |
| --- | --- |
| **Path de upgrade** | {{Ex.: Free → Starter (R$ 29/mes) → Pro (R$ 79/mes)}} |
| **Sinais de readiness** | {{Ex.: "Atingiu limite de agendamentos do plano, usa 3+ integracoes, tem 2+ profissionais"}} |
| **Meta de expansion revenue** | {{Ex.: "20% da receita recorrente vem de upgrades e add-ons"}} |

> Expansion revenue saudavel indica que clientes estao crescendo com o produto.

---

## Health Score

> Como medir a saude de cada cliente de forma simples e acionavel?

**Formula sugerida:**

| Componente | Peso | Como medir |
| --- | --- | --- |
| Uso do produto | {{Ex.: 40%}} | {{Ex.: Frequencia de login + uso de features-chave}} |
| Satisfacao | {{Ex.: 30%}} | {{Ex.: Ultimo CSAT ou NPS coletado}} |
| Tickets de suporte | {{Ex.: 30%}} | {{Ex.: Volume e severidade dos tickets abertos}} |

**Faixas:** Saudavel (>80) / Atencao (50-80) / Risco (<50)

> Como tickets de suporte alimentam o backlog de produto?

---

## Suporte

> Quais canais de suporte serao oferecidos?

| Canal | Disponibilidade | Tempo de Primeira Resposta | Publico |
| --- | --- | --- | --- |
| {{Canal 1 — ex.: "Central de ajuda (FAQ)"}} | {{Ex.: "24/7"}} | {{Imediato (self-service)}} | {{Todos}} |
| {{Canal 2 — ex.: "Chat in-app"}} | {{Ex.: "Seg-Sex, 9h-18h"}} | {{Ex.: "< 2 horas"}} | {{Todos}} |
| {{Canal 3 — ex.: "WhatsApp / E-mail"}} | {{Ex.: "Seg-Sex, 9h-18h"}} | {{Ex.: "< 4 horas"}} | {{Plano pago}} |

**Tiers de suporte:**

| Tier | Descricao | Exemplos de Chamados | Escalacao |
| --- | --- | --- | --- |
| **Self-service** | {{Ex.: "Duvidas gerais, problemas simples"}} | {{Ex.: "Como configurar horarios, resetar senha"}} | {{FAQ, base de conhecimento, chatbot}} |
| **Assistido** | {{Ex.: "Problemas tecnicos, bugs, questoes complexas"}} | {{Ex.: "Agendamento nao aparece, integracao falhou, perda de dados"}} | {{Time de suporte → Engenharia se necessario}} |

---

## Programa de Indicacao

> Como incentivar clientes satisfeitos a trazerem novos clientes?

| Aspecto | Descricao |
| --- | --- |
| **Mecanica** | {{Como funciona — ex.: "Cliente compartilha link unico; quando indicado se cadastra e paga, ambos recebem beneficio"}} |
| **Incentivo** | {{Ex.: "Quem indica: 1 mes gratis. Indicado: 30 dias de trial estendido."}} |
| **Quando ativar** | {{Ex.: "Apos 30 dias de uso ativo e Health Score > 80"}} |

---

## Win-back

> Como re-engajar clientes que cancelaram?

| Aspecto | Descricao |
| --- | --- |
| **Periodo de espera** | {{Ex.: "30 dias apos cancelamento"}} |
| **Estrategia** | {{Ex.: "E-mail com novidades desde o cancelamento + oferta de retorno (1 mes gratis)"}} |
| **Oferta** | {{Ex.: "Desconto de 30% por 3 meses ou acesso a feature premium por 30 dias"}} |

> Nem todo churn vale recuperar. Foque em clientes que cancelaram por motivos resolvidos.

---

> Metricas detalhadas de relacionamento: ver 07-metricas-kpis.md
