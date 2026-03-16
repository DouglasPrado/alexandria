# Plano Operacional

Esta seção detalha **como o negócio funciona no dia a dia**. Define processos, equipe, infraestrutura, timeline de lançamento, riscos e aspectos legais necessários para a operação.

---

## Processos Core

> Documente apenas processos que quebram o negócio se falharem. Se um processo falhar e a operação continua, ele não é core.

| Processo | Responsável | Frequência | Ferramenta/Método |
| --- | --- | --- | --- |
| {{Processo 1 — ex.: Desenvolvimento e manutenção da plataforma}} | {{Quem executa}} | {{Contínua}} | {{Como é feito}} |
| {{Processo 2 — ex.: Aquisição e onboarding de clientes}} | {{Quem executa}} | {{Diária}} | {{Como é feito}} |
| {{Processo 3 — ex.: Suporte ao cliente}} | {{Quem executa}} | {{Diária}} | {{Como é feito}} |

<details>
<summary>Exemplo</summary>

| Processo | Responsável | Frequência | Ferramenta/Método |
| --- | --- | --- | --- |
| Desenvolvimento e manutenção da plataforma | Dev full-stack | Contínua | CI/CD via GitHub Actions |
| Aquisição e onboarding de prestadores | Founder | Diária | Chamada de 15min + tutorial em vídeo |
| Suporte ao cliente | Founder | Diária | Intercom + WhatsApp |

</details>

---

## Roadmap de Equipe

> Qual a estrutura de time atual e futura? Defina triggers claros para cada contratação.

| Cargo | Pessoa | Quando | Custo Mensal (R$) | Trigger de Contratação |
| --- | --- | --- | --- | --- |
| {{Cargo 1}} | {{Nome}} | Atual | {{R$ X}} | — |
| {{Cargo 2}} | {{Nome}} | Atual | {{R$ X}} | — |
| {{Cargo 3}} | aberto | {{Mês X}} | {{R$ X}} | {{Ex.: > 200 clientes ativos ou > 50 tickets/semana}} |
| {{Cargo 4}} | aberto | {{Mês X}} | {{R$ X}} | {{Ex.: MRR > R$ 20.000 e canais pagos validados}} |

<details>
<summary>Exemplo</summary>

| Cargo | Pessoa | Quando | Custo Mensal (R$) | Trigger de Contratação |
| --- | --- | --- | --- | --- |
| Founder / CEO | João | Atual | R$ 0 (pró-labore após break-even) | — |
| Dev Full-stack | Maria | Atual | R$ 8.000 | — |
| Designer / PM | Pedro (part-time) | Atual | R$ 6.000 | — |
| Customer Success | aberto | Mês 6 | R$ 3.500 | > 200 prestadores ativos ou > 50 tickets/semana |
| Dev Backend | aberto | Mês 8 | R$ 9.000 | Backlog técnico > 3 sprints |
| Growth Marketer | aberto | Mês 10 | R$ 7.000 | MRR > R$ 20.000 |

</details>

> Fornecedores e infraestrutura: ver [06-estrutura-custos.md](06-estrutura-custos.md)

---

## Infraestrutura Digital

> Qual infraestrutura digital é necessária para operar o negócio?

| Componente | Ferramenta / Serviço | Custo Mensal (R$) | Finalidade |
| --- | --- | --- | --- |
| {{Componente 1 — ex.: Hospedagem}} | {{Ferramenta}} | {{R$ X}} | {{Para que serve}} |
| {{Componente 2 — ex.: Monitoramento}} | {{Ferramenta}} | {{R$ X}} | {{Para que serve}} |
| {{Componente 3 — ex.: Analytics}} | {{Ferramenta}} | {{R$ X}} | {{Para que serve}} |
| {{Componente 4 — ex.: Comunicação}} | {{Ferramenta}} | {{R$ X}} | {{Para que serve}} |

**Infraestrutura Física:**

{{Descreva a infraestrutura física necessária, ou "Operação 100% remota — sem infraestrutura física necessária nesta fase."}}

---

## Disaster Recovery

> Defina os alvos de recuperação e a estratégia de backup para garantir continuidade da operação.

| Parâmetro | Alvo | Detalhes |
| --- | --- | --- |
| RTO (Recovery Time Objective) | {{Ex.: 4 horas}} | {{Tempo máximo aceitável para restaurar o serviço}} |
| RPO (Recovery Point Objective) | {{Ex.: 1 hora}} | {{Perda máxima aceitável de dados (janela desde último backup)}} |

**Estratégia de backup:**

- {{Ex.: Backup automático do banco de dados a cada 1 hora (RDS automated backups)}}
- {{Ex.: Snapshots diários da infraestrutura}}
- {{Ex.: Código versionado no GitHub (cópia implícita)}}

> Teste o restore pelo menos 1x por trimestre. Backup que nunca foi testado não é backup.

---

## Plano de Escala

> O que precisa mudar à medida que a base de usuários cresce? Identifique gargalos antes que eles aconteçam.

| Área | 1K Usuários | 10K Usuários | 100K Usuários |
| --- | --- | --- | --- |
| Infraestrutura | {{Ex.: 1 servidor, deploy manual}} | {{Ex.: Auto-scaling, CDN, cache}} | {{Ex.: Multi-region, microservices}} |
| Equipe | {{Ex.: 3 pessoas}} | {{Ex.: 8-10 pessoas}} | {{Ex.: 25+ pessoas, squads}} |
| Processos | {{Ex.: Manual, founder faz tudo}} | {{Ex.: Suporte tier 1/2, CS dedicado}} | {{Ex.: SRE, DevOps, compliance}} |
| Custo/usuário | {{R$ X}} | {{R$ X}} | {{R$ X}} |

---

## Timeline de Lançamento

> Cronograma de execução com marcos claros e critérios go/no-go para cada etapa.

| Marco | Data Prevista | Responsável | Critério de Sucesso | Critério Go/No-Go |
| --- | --- | --- | --- | --- |
| {{Marco 1}} | {{DD/MM/AAAA}} | {{Quem}} | {{Como saber que foi atingido}} | {{Se < X, fazer Y}} |
| {{Marco 2}} | {{DD/MM/AAAA}} | {{Quem}} | {{Como saber que foi atingido}} | {{Se < X, fazer Y}} |
| {{Marco 3}} | {{DD/MM/AAAA}} | {{Quem}} | {{Como saber que foi atingido}} | {{Se < X, fazer Y}} |
| {{Marco 4}} | {{DD/MM/AAAA}} | {{Quem}} | {{Como saber que foi atingido}} | {{Se < X, fazer Y}} |

> Marcos devem ser verificáveis — "sistema funcionando" é vago, "20 prestadores com agendamentos ativos" é concreto.

<details>
<summary>Exemplo</summary>

| Marco | Data Prevista | Responsável | Critério de Sucesso | Critério Go/No-Go |
| --- | --- | --- | --- | --- |
| MVP funcional | 15/04/2026 | Dev + Designer | Fluxo completo end-to-end | Se < 80% dos fluxos funcionando, adiar lançamento |
| Beta fechado (20 usuários) | 01/05/2026 | Founder | 10 agendamentos reais na 1ª semana | Se < 5 agendamentos, revisar proposta de valor |
| Monetização ativada | 01/06/2026 | Dev + Founder | 10 assinaturas pagas no 1º mês | Se < 5 pagantes, pivotar pricing |
| PMF checkpoint | 01/08/2026 | Founder | Retenção D30 > 50%, NPS > 30 | Se < 40% retenção, pausar growth e focar em produto |

</details>

---

## Riscos e Mitigações

> Quais são os principais riscos que podem impactar o negócio?

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| {{Risco 1}} | {{Alta / Média / Baixa}} | {{Crítico / Alto / Médio}} | {{Ação preventiva ou plano de contingência}} |
| {{Risco 2}} | {{Alta / Média / Baixa}} | {{Crítico / Alto / Médio}} | {{Ação preventiva ou plano de contingência}} |
| {{Risco 3}} | {{Alta / Média / Baixa}} | {{Crítico / Alto / Médio}} | {{Ação preventiva ou plano de contingência}} |
| {{Risco 4}} | {{Alta / Média / Baixa}} | {{Crítico / Alto / Médio}} | {{Ação preventiva ou plano de contingência}} |
| {{Risco 5}} | {{Alta / Média / Baixa}} | {{Crítico / Alto / Médio}} | {{Ação preventiva ou plano de contingência}} |

> Categorias: **Mercado** (concorrência, regulação), **Produto** (tecnologia, escalabilidade), **Time** (dependência, burnout), **Financeiro** (runway, custos inesperados).

---

## Aspectos Legais e Regulatórios

> Checklist dos itens legais essenciais para operar. Detalhes jurídicos completos devem ser documentados em documento específico.

- [ ] Termos de Uso
- [ ] Política de Privacidade
- [ ] Consentimento de dados (LGPD)
- [ ] Regime tributário definido
- [ ] Contratos com fornecedores

**Estrutura jurídica:**

| Item | Status |
| --- | --- |
| Tipo de empresa | {{MEI / ME / LTDA / SAS / Ainda não constituída}} |
| Regime tributário | {{Simples Nacional / Lucro Presumido / Lucro Real}} |
| CNPJ | {{Ativo / Em processo / Não constituído}} |

> Detalhes jurídicos completos devem ser documentados em documento específico. Esta seção serve como checklist mínimo para não esquecer o essencial.
