# Estrutura de Custos

Esta seção mapeia **quanto custa operar o Alexandria**, separando custos fixos e variáveis, identificando recursos e atividades-chave, e projetando sustentabilidade financeira.

> **Nota:** O Alexandria é um projeto open-source pessoal/familiar na v1. Os custos são mínimos — tempo do mantenedor + infraestrutura básica. Não há salários, escritório ou equipe paga. A seção inclui projeções para a fase de serviço gerenciado (ano 2+).

---

## Custos Fixos

### Ano 1 — Fase Open-Source

| Item | Valor Mensal (R$) | Categoria | Observações |
| --- | --- | --- | --- |
| VPS do orquestrador (Hetzner/Contabo) | R$ 30 | Infraestrutura | VPS ~4GB RAM, suficiente para orquestrador + demo |
| Domínio (alexandria.dev ou similar) | R$ 5 | Infraestrutura | Registro anual ~R$60, rateado |
| GitHub Pro (CI/CD minutes, packages) | R$ 0 | Ferramentas | Free tier suficiente para open-source |
| Cloudflare (DNS, CDN, R2 free tier) | R$ 0 | Infraestrutura | Free tier generoso |
| Docs site (Vercel/Netlify) | R$ 0 | Infraestrutura | Free tier para projetos open-source |
| Claude Code / Copilot (ferramentas de dev) | R$ 100 | Ferramentas | Assinatura pessoal do mantenedor <!-- inferido do PRD --> |
| **Total Custos Fixos (Ano 1)** | **R$ 135** | | |

### Ano 2+ — Fase Serviço Gerenciado (projeção)

| Item | Valor Mensal (R$) | Categoria | Observações |
| --- | --- | --- | --- |
| Infraestrutura base (controle, API, dashboard) | R$ 500 | Infraestrutura | VPS dedicada + banco + monitoring <!-- inferido do PRD --> |
| Domínio + SSL + CDN | R$ 50 | Infraestrutura | Cloudflare Pro ou similar |
| Ferramentas SaaS (CI/CD, monitoring, e-mail) | R$ 200 | Ferramentas | GitHub Actions, Grafana Cloud, Resend |
| Contabilidade (MEI → ME) | R$ 200 | Administrativo | Quando houver receita recorrente |
| Marketing de conteúdo (hosting de blog, vídeos) | R$ 50 | Marketing | Plataformas gratuitas + edição própria |
| **Total Custos Fixos (Ano 2)** | **R$ 1.000** | | |

---

## Custos Variáveis

### Ano 1 — Custo por instalação self-hosted: R$0 para o projeto

O software é self-hosted — cada usuário paga sua própria infraestrutura. O custo para o projeto é apenas suporte via comunidade (tempo do mantenedor).

### Ano 2+ — Serviço Gerenciado (por família)

| Item | Custo Unitário (R$) | Driver de Volume | Observações |
| --- | --- | --- | --- |
| VPS compartilhada por família | R$ 8-15/família | Nº de famílias | Multi-tenant; compartilha recursos |
| Storage em provedores cloud (R2, S3) | R$ 2-5/família | GB armazenados | Otimização 10-20x reduz drasticamente |
| Bandwidth (egress) | R$ 1-3/família | Downloads/visualizações | CDN + cache de thumbnails minimiza |
| Suporte (tempo de atendimento) | R$ 2-5/família | Tickets abertos | Self-service reduz volume |
| **Custo variável total por família** | **R$ 13-28** | | Média estimada: R$18/família <!-- inferido do PRD --> |

---

## COGS vs OpEx

### Ano 1 — Open-Source

| Item COGS | Valor Mensal (R$) |
| --- | --- |
| VPS demo/CI | R$ 30 |
| **Total COGS** | **R$ 30** |

| Item OpEx | Valor Mensal (R$) |
| --- | --- |
| Ferramentas de desenvolvimento | R$ 100 |
| Domínio | R$ 5 |
| **Total OpEx** | **R$ 105** |

**Margem Bruta (Ano 1):** N/A — sem receita direta. Se considerar doações como receita:
- Com R$500/mês em doações: (500 - 30) / 500 × 100 = **94%**

### Ano 2+ — Serviço Gerenciado (projeção com 100 famílias)

| Item COGS | Valor Mensal (R$) |
| --- | --- |
| Infra por família (100 × R$18) | R$ 1.800 |
| **Total COGS** | **R$ 1.800** |

| Item OpEx | Valor Mensal (R$) |
| --- | --- |
| Custos fixos (conforme acima) | R$ 1.000 |
| **Total OpEx** | **R$ 1.000** |

**Receita estimada (100 famílias):** R$6.500/mês (mix de planos)

**Margem Bruta** = (6.500 - 1.800) / 6.500 × 100 = **72%** <!-- inferido do PRD -->

---

## Curva de Escala (Serviço Gerenciado)

| Métrica | 100 Famílias | 500 Famílias | 2.000 Famílias |
| --- | --- | --- | --- |
| Custo de infraestrutura/mês | R$ 1.800 | R$ 7.500 | R$ 24.000 |
| Custo fixo/mês | R$ 1.000 | R$ 2.000 | R$ 5.000 |
| Custo total/mês | R$ 2.800 | R$ 9.500 | R$ 29.000 |
| Custo por família | R$ 28 | R$ 19 | R$ 14,50 |
| Receita estimada/mês | R$ 6.500 | R$ 32.500 | R$ 130.000 |
| Margem operacional | 57% | 71% | 78% |
| Equipe necessária | 1 (mantenedor) | 1-2 (+ suporte part-time) | 3-4 (eng + suporte + DevOps) |

> O custo por família cai de R$28 para R$14,50 com escala — economia de ~48%. O driver é a diluição dos custos fixos e eficiência de multi-tenancy.

---

## Recursos Críticos

| Recurso | Categoria | Custo Mensal (R$) | Essencial para |
| --- | --- | --- | --- |
| Douglas (mantenedor/dev) | Pessoa | Tempo próprio (não monetizado) | Desenvolvimento, arquitetura, decisões técnicas, suporte |
| Código-fonte open-source (Elixir/Phoenix) | Tecnologia | R$ 0 | Entrega do produto; contribuições da comunidade |
| Protocolo FSP (Family Storage Protocol) | IP/Conhecimento | — | Diferencial técnico; distribuição + criptografia + recovery |
| Infraestrutura cloud (VPS + provedores) | Tecnologia | R$ 30-500 | Disponibilidade do orquestrador e storage |
| Comunidade de contribuidores | Pessoa/Rede | R$ 0 | Desenvolvimento distribuído, testes, feedback, suporte |

---

## Atividades-Chave

| Atividade | Responsável | Frequência |
| --- | --- | --- |
| Desenvolvimento e manutenção do core (orquestrador, pipeline, replicação) | Douglas + comunidade | Contínua |
| Revisão de PRs, triagem de issues, release management | Douglas | Semanal |
| Documentação e onboarding (docs, guias, README) | Douglas + comunidade | Contínua |

> Se Douglas ficar indisponível por >1 mês, o projeto precisa de pelo menos 1 co-maintainer com contexto suficiente para manter releases e segurança. **Risco: bus factor = 1.**

---

## Fornecedores e Parceiros

| Fornecedor | Serviço | Custo Mensal (R$) | Criticidade | Alternativa | Custo de Troca |
| --- | --- | --- | --- | --- | --- |
| Hetzner / Contabo | VPS (orquestrador) | R$ 30 | Alto | DigitalOcean, Vultr, OVH | < 1 dia (Docker) |
| Cloudflare | DNS, CDN, R2 (storage) | R$ 0 | Alto | AWS CloudFront + Route53, Backblaze B2 | ~1 semana |
| GitHub | Repositório, CI/CD, Issues, Discussions | R$ 0 | Crítico | GitLab, Codeberg | ~2 semanas |
| Docker Hub / GHCR | Registry de containers | R$ 0 | Médio | GHCR, quay.io | < 1 dia |
| Provedores cloud dos usuários (Google Drive, S3, etc.) | Storage de chunks | R$ 0 (custo do usuário) | Crítico (para o usuário) | StorageProvider interface garante portabilidade (RF-022) | Minutos (adicionar novo nó) |

> **Nenhum fornecedor é insubstituível.** A arquitetura Docker + StorageProvider interface garante que trocar qualquer fornecedor leva no máximo dias. O maior risco é GitHub (centraliza código + CI + comunidade).

---

## Burn Rate

### Ano 1 — Open-Source

| Componente | Valor Mensal (R$) |
| --- | --- |
| Total Custos Fixos | R$ 135 |
| Total Custos Variáveis | R$ 0 |
| **Burn Rate Bruto** | **R$ 135** |
| (-) Doações estimadas (após mês 6) | R$ 500 |
| **Burn Rate Líquido** | **R$ 0 (ou positivo após mês 6)** |

### Ano 2 — Serviço Gerenciado (primeiros meses)

| Componente | Valor Mensal (R$) |
| --- | --- |
| Total Custos Fixos | R$ 1.000 |
| Total Custos Variáveis (20 famílias × R$18) | R$ 360 |
| **Burn Rate Bruto** | **R$ 1.360** |
| (-) Receita (20 famílias × R$65 ARPU) | R$ 1.300 |
| **Burn Rate Líquido** | **R$ 60** |

> Burn rate extremamente baixo — projeto pessoal com custos mínimos. O maior "custo" é o tempo do Douglas, que não é monetizado na v1.

---

## Break-even

### Cenário Open-Source (doações cobrem infra)

**MRR necessário para break-even:** R$135/mês (custos fixos)

**Estimativa:** ~15 sponsors a R$10/mês ou ~3 sponsors a R$50/mês

**Previsão:** Mês 3-6 após lançamento (se adoção mínima ocorrer) <!-- inferido do PRD -->

### Cenário Serviço Gerenciado

**MRR necessário para break-even:** R$1.000/mês (custos fixos) / (R$65 ARPU - R$18 custo variável) = **~22 famílias pagantes**

**Previsão:** Mês 2-3 do serviço gerenciado (com 22+ famílias convertidas da base self-hosted) <!-- inferido do PRD -->

---

## Runway

### Ano 1

| Item | Valor |
| --- | --- |
| Capital necessário (investimento pessoal) | R$ 1.620 (12 meses × R$135) |
| Burn Rate Líquido mensal | R$ 135 (sem doações) → R$0 (com doações após mês 6) |
| **Runway** | **Ilimitado** — custo baixo o suficiente para ser absorvido como despesa pessoal |
| Risco financeiro | Mínimo — R$135/mês é equivalente a 1 jantar fora |

> O runway do Alexandria é efetivamente ilimitado na v1 porque o custo é desprezível. O recurso escasso é **tempo do mantenedor**, não dinheiro.

---

## Análise de Sensibilidade

### Ano 1 (Open-Source)

| Cenário | Burn Rate (R$) | Runway | Premissa Principal |
| --- | --- | --- | --- |
| Otimista | R$ 0 (doações > custos) | Ilimitado | 500+ stars, 30+ sponsors, R$300+/mês em doações a partir do mês 4 |
| Base | R$ 135 | Ilimitado (custo pessoal) | Crescimento moderado; doações cobrem infra após mês 6 |
| Pessimista | R$ 135 | Ilimitado (custo pessoal) | Pouca adoção; sem doações; mas custo é desprezível |

### Ano 2 (Serviço Gerenciado)

| Cenário | Burn Rate Líquido (R$) | Break-even em | Premissa Principal |
| --- | --- | --- | --- |
| Otimista | R$ 0 (break-even imediato) | Mês 1 | 30+ famílias convertem da base self-hosted no lançamento |
| Base | R$ 500 | Mês 3 | 5-10 famílias/mês; break-even com 22 famílias |
| Pessimista | R$ 1.000 | Mês 8+ | Conversão lenta; <5 famílias/mês; precisa de mais marketing |

> **Plano de ação para cenário pessimista (Ano 2):** Se o serviço gerenciado não atingir break-even em 6 meses, reavaliar: (a) pricing muito alto? (b) mercado não quer gerenciado? (c) onboarding do cloud muito complexo? Pivotar para modelo de suporte premium se necessário, mantendo software open-source.
