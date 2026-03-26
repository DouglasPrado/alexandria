# Value Proposition — Why Use / Why Contribute

<!-- updated: opensource — open-core -->This section defines **why someone would choose Alexandria** over available alternatives, and **why a developer would contribute** to the project. Maps user needs, articulates value propositions for both users and contributors, and identifies differentials that make the solution defensible.

> **Note:** Alexandria is an open-core project. "Value" is measured in **cost avoided**, **memories preserved**, **autonomy gained** (for users), and in **learning**, **portfolio**, **impact** (for contributors).

---

## For Users

**Freedom** — your data lives on your own devices and cloud accounts. No vendor lock-in. No account termination risk. No one can access your encrypted family memories.

**No vendor lock-in** — full data portability. Recover everything with 12 words. Switch cloud providers without re-uploading.

**Full customization** — self-hosted, open-source. Audit every line of code. Add custom storage providers. Run on any VPS.

**Community support** — GitHub Discussions, Discord, and a growing community of self-hosters who've solved the same problems you'll face.

**Code auditability** — MIT-licensed code. No black boxes. You can verify that encryption is real, data never leaves your control.

---

## For Contributors

**Learning** — systems distributed systems, cryptography (AES-256-GCM, BIP-39, envelope encryption), media processing (FFmpeg, libvips), TypeScript/NestJS at scale.

**Portfolio** — real production system solving a hard problem. Architecture decisions are documented in ADRs. Your contributions are tracked in the changelog and README.

**Networking** — join a community of self-hosters, privacy advocates, and distributed systems engineers.

**Impact** — your code runs in real family clusters preserving decades of memories. Every bug fix and improvement matters.

**Recognition** — contributors credited in README, release notes, and GitHub profile. No corporate anonymization of contributions.

---

## User Jobs-to-be-Done

> Quais trabalhos o usuário precisa realizar, quais dores enfrenta e quais ganhos espera?

| Job                                                         | Tipo      | Dor Associada                                                               | Severidade | Ganho Esperado                                                    | Evidência                                                          |
| ----------------------------------------------------------- | --------- | --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Preservar fotos e vídeos da família por décadas             | Funcional | HDs degradam em 5-10 anos; backup manual é esquecido; risco de perda total  | Alta       | Zero perda de memórias familiares, mesmo em desastre              | Dado: bit rot afeta mídias sem verificação (consenso da indústria) |
| Salvar fotos do celular automaticamente                     | Funcional | Celular enche rápido (15GB grátis insuficiente); sync manual é esquecido    | Alta       | Fotos salvas sem intervenção; espaço liberado automaticamente     | Dado: Google eliminou storage gratuito ilimitado em 2021           |
| Não depender de um único provedor cloud                     | Funcional | Vendor lock-in; preços sobem sem controle; conta pode ser encerrada         | Média      | Dados distribuídos em múltiplos provedores; portabilidade total   | Dado: preços Google One/iCloud crescem ano a ano                   |
| Manter privacidade de fotos íntimas e de crianças           | Emocional | Google/Apple/Dropbox veem todas as fotos; GPS revela endereço da família    | Alta       | Ninguém além da família acessa os dados; criptografia total       | Hipótese (validar com pesquisa de privacidade)                     |
| Recuperar tudo após desastre (incêndio, roubo, falha)       | Funcional | HD externo é ponto único de falha; sem recovery plan                        | Alta       | Sistema reconstruível com 12 palavras em qualquer lugar           | Hipótese H-04 (validar com disaster drills)                        |
| Não gastar dinheiro com armazenamento                       | Funcional | Planos pagos de cloud custam R$20-100/mês para família                      | Média      | Custo zero combinando free tiers + dispositivos existentes        | Dado: ~102GB gratuitos/pessoa combinando provedores                |
| Sentir que memórias estão seguras sem precisar pensar nisso | Emocional | Ansiedade sobre backup; culpa quando HD não é atualizado há meses           | Alta       | Paz de espírito: replicação automática, auto-healing, verificação | Hipótese (validar durante alpha)                                   |
| Encontrar fotos antigas rapidamente                         | Funcional | Fotos espalhadas entre celulares, computadores, nuvens; sem busca unificada | Média      | Galeria única com todas as fotos da família, navegável por data   | Entrevista informal com membros da família                         |

> **Job principal:** Preservar fotos e vídeos da família por décadas sem risco de perda total e sem custo recorrente. Se isso falhar, nenhuma outra feature importa.

---

## Value Statement

O Alexandria permite que famílias preservem suas memórias digitais por décadas com custo zero, privacidade total e resiliência a qualquer desastre — distribuindo dados criptografados entre dispositivos da família e provedores cloud, com auto-reparação e recovery completo via frase de 12 palavras.

**Mapeamento Necessidade → Solução:**

| Dor / Job do Usuário                        | Como o Produto Resolve                                                       | Funcionalidade Chave                         |
| ------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Fotos perdidas por HD que falhou            | Replicação 3x em nós diferentes + auto-healing quando nó é perdido           | Replicação automática + auto-healing         |
| Celular sempre cheio                        | Pipeline otimiza fotos 10-20x (5MB→400KB); placeholders substituem originais | Pipeline de mídia + placeholder files        |
| Vendor lock-in (Google, Apple)              | Dados distribuídos entre S3, R2, dispositivos locais; portabilidade total    | StorageProvider interface + multi-cloud      |
| Privacidade (Google vê suas fotos)          | Criptografia AES-256-GCM antes do upload; zero-knowledge                     | Envelope encryption + vault                  |
| Desastre (incêndio, roubo, conta encerrada) | Recovery completo do zero com 12 palavras em nova VPS                        | Seed phrase BIP-39 + manifests distribuídos  |
| Custo de R$20-100/mês para cloud            | Combina ~100GB grátis/pessoa entre provedores + otimização 10-20x            | Multi-cloud free tiers + otimização de mídia |
| Corrupção silenciosa de dados (bit rot)     | Scrubbing periódico recalcula hashes; repara automaticamente de réplica      | Scrubbing + auto-repair                      |
| Fotos espalhadas sem organização            | Galeria única com thumbnails instantâneos e navegação por timeline           | Web client + previews pré-gerados            |

---

## Value Unit

| Aspecto                     | Descrição                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unidade de valor**        | Por família (cluster) — uso ilimitado dentro do cluster                                                                                                                |
| **O que o usuário "ganha"** | Armazenamento distribuído criptografado ilimitado (limitado pela capacidade dos nós que a família adiciona)                                                            |
| **Modelo de custo**         | Custo zero para o software (open-source). Custo operacional: ~€5-10/mês por VPS + free tiers de cloud. A família "paga" com seus próprios dispositivos e contas cloud. |
| **Alinhamento com valor**   | Sim — quanto mais nós a família adiciona (dispositivos, contas cloud), mais capacidade e redundância ganha. O valor escala com o engajamento.                          |

> **Comparação de custo mensal:**
>
> - Google One 2TB: R$35/mês = R$420/ano
> - Alexandria (VPS + free tiers): ~R$50/mês = R$600/ano, mas com storage potencialmente ilimitado e privacidade total
> - Alexandria (VPS compartilhada + free tiers apenas): ~R$25/mês = R$300/ano
> - Com otimização 10-20x, 500GB grátis equivalem a ~5-10TB de fotos originais

---

## Differentials & Defensibility

| Diferencial                                                   | Tipo    | Copiável?                                                                      | Como fortalecer                                                                                     |
| ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Distribuição multi-cloud + multi-dispositivo com auto-healing | Produto | Difícil — requer expertise em sistemas distribuídos + criptografia + mídia     | Amadurecer protocolo FSP; acumular edge cases resolvidos em produção; testes de durabilidade reais  |
| Recovery completo via 12 palavras (orquestrador descartável)  | Produto | Médio — conceito simples, implementação complexa                               | Disaster drills mensais comprovando que funciona; documentação pública; confiança do usuário        |
| Otimização de mídia 10-20x sem perda perceptível              | Produto | Fácil — codecs são públicos                                                    | Refinar pipeline; benchmark público comparando qualidade; suporte a novos codecs (AV1, AVIF)        |
| Zero-knowledge encryption (envelope encryption + vault)       | Produto | Médio — padrões são públicos mas integração com storage distribuído é complexa | Auditoria de segurança; documentação do modelo criptográfico; contribuições da comunidade           |
| Open-source com comunidade self-hosting                       | Rede    | Médio — depende de massa crítica de contribuidores                             | Documentação excelente; contribuições fáceis; presença em comunidades (r/selfhosted, r/datahoarder) |
| Dados acumulados da família ao longo de anos                  | Dado    | Difícil — switching cost altíssimo (migrar TB de fotos é doloroso)             | Facilitar export (portabilidade); nunca criar lock-in; confiança a longo prazo                      |
| Confiança de 10+ anos de uso sem perda de dados               | Marca   | Difícil — construída apenas com tempo                                          | Disaster drills públicos; métricas de durabilidade transparentes; presença constante na comunidade  |

> **Se o concorrente copiar tudo amanhã:** o que diferencia é a integração completa (distribuição + criptografia + otimização + recovery em um sistema coeso), a confiança acumulada em anos de uso real sem perda de dados, e o switching cost de migrar um acervo de TBs. Nenhum feature individual é incopiável, mas o conjunto + histórico de confiabilidade é.
