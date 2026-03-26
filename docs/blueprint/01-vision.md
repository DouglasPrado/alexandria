# Visão do Sistema

## Problema

> Qual dor ou necessidade este sistema resolve? Quem sofre com isso hoje?

Famílias acumulam centenas de gigabytes em fotos, vídeos e documentos digitais ao longo de décadas. Hoje, a maioria depende de um único provedor centralizado (Google Drive, Dropbox, iCloud) com espaço gratuito limitado — 15GB no Google, 5GB no iCloud, 2GB no Dropbox. Quando o espaço acaba, a escolha é pagar planos cada vez mais caros ou deletar memórias.

Backups manuais em HDs externos são esquecidos e não verificados; esses discos degradam silenciosamente em 5-10 anos (bit rot). Não existe solução acessível que automatize a distribuição de dados entre múltiplos dispositivos e provedores com auto-reparação.

**Impacto de não resolver:**

- Perda irreversível de memórias familiares por falha de disco, exclusão de conta ou desastre (incêndio, roubo)
- Custos crescentes de armazenamento cloud sem controle do usuário
- Dependência total de um único fornecedor (vendor lock-in)
- Dados familiares dispersos sem organização ou busca unificada
- 20-60% de duplicação em fotos familiares (WhatsApp, compartilhamento) consumindo espaço desnecessariamente

---

## Elevator Pitch

Para **famílias que precisam preservar memórias digitais por décadas**, o **Alexandria** é um **sistema de armazenamento distribuído** que **garante durabilidade, privacidade e custo mínimo distribuindo dados criptografados entre dispositivos da família e provedores cloud**. Diferente de **Google Drive, Dropbox ou iCloud**, nosso sistema **replica dados em 3+ locais com auto-reparação, otimiza mídia para reduzir 10-20x o espaço consumido e permite recuperação completa com apenas 12 palavras — sem dependência de nenhum provedor único**.

---

## Objetivo

> Quais resultados concretos esperamos alcançar com este sistema? Como saberemos que ele foi bem-sucedido?

- **OBJ-01:** Zero perda de dados com replicação mínima de 3 cópias por chunk em nós diferentes (durabilidade alvo: 11 nines)
- **OBJ-02:** Recuperação completa do sistema via seed phrase de 12 palavras em menos de 2 horas, validando que o orquestrador é descartável
- **OBJ-03:** Redução de 70%+ no armazenamento via otimização de mídia — fotos de ~5-8MB para ~300-600KB (WebP), vídeos 4K de ~2GB para ~400-600MB (1080p H.265/AV1)
- **OBJ-04:** Suportar 5+ provedores cloud simultaneamente como nós de armazenamento, eliminando vendor lock-in
- **OBJ-05:** Upload automático de fotos/vídeos sem intervenção do usuário após configuração inicial
- **OBJ-06:** Adoção de 100% dos membros da família Prado em 6 meses, validando que o sistema é acessível para usuários não-técnicos

---

## Usuários

> Quem são as pessoas (ou sistemas) que vão interagir diretamente com esta solução?

| Persona                | Necessidade                                                                                                | Frequência de Uso |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------- |
| Administrador Familiar | Garantir que memórias da família estejam seguras, replicadas e recuperáveis; configurar e manter o sistema | Semanal           |
| Membro Familiar        | Salvar e visualizar fotos/vídeos sem complicação técnica; acessar galeria compartilhada                    | Diário            |
| Fotógrafo Amador       | Upload automático de fotos/vídeos; liberar espaço no celular mantendo previews                             | Diário            |
| Guardião de Memórias   | Acessar fotos antigas, navegar por timeline, buscar por data/evento; curadoria do acervo                   | Mensal            |

---

## Valor Gerado

> Que valor tangível este sistema entrega para cada grupo de usuários e para o negócio?

- **Eliminação do risco de perda total:** dados replicados em 3+ locais com auto-reparação garantem que nenhum desastre único (falha de disco, exclusão de conta, incêndio) causa perda irreversível
- **Redução de 70-95% no espaço consumido:** pipeline de otimização converte fotos para WebP Full HD (~10-20x menor) e vídeos para 1080p H.265/AV1 (~3-5x menor), sem perda perceptível de qualidade
- **Custo zero ou mínimo de armazenamento:** combinando ~100GB de free tier por pessoa entre provedores cloud (Google Drive 15GB, OneDrive 5GB, MEGA 20GB, pCloud 10GB, etc.), uma família de 5 pessoas obtém ~500GB gratuitos
- **Independência de provedor:** dados não estão presos em nenhum vendor; sistema portável e recuperável com 12 palavras
- **Privacidade total:** criptografia ponta-a-ponta (zero-knowledge) — nem o orquestrador nem os provedores cloud conseguem ler os dados
- **Liberação de espaço nos dispositivos:** placeholder files substituem originais por thumbnails leves; download sob demanda quando necessário

---

## Métricas de Sucesso

> Como vamos medir se o sistema está cumprindo seus objetivos?

| Métrica                           | Meta                                    | Como Medir                                                   |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Durabilidade de dados             | 99.999999999% (11 nines)                | Simulação estatística + monitoramento contínuo de replicação |
| Taxa de replicação saudável       | >99% dos chunks com 3+ réplicas         | Dashboard de saúde do cluster                                |
| Redução de armazenamento (fotos)  | 10-20x vs JPEG original                 | Benchmark com acervo real (~5-8MB → ~300-600KB WebP)         |
| Redução de armazenamento (vídeos) | 3-5x vs H.264 4K original               | Benchmark com acervo real (~2GB → ~400-600MB 1080p AV1)      |
| Tempo de recovery do orquestrador | <2 horas via seed phrase                | Disaster drill real em nova VPS                              |
| Deduplicação familiar             | 30-70% redução                          | Análise de acervo real (fase 2)                              |
| Adoção familiar                   | 100% dos membros                        | Telemetria de uso — contagem de usuários ativos no cluster   |
| Tempo de resposta API             | p95 < 500ms para operações de metadata  | APM / métricas de latência                                   |
| Disponibilidade do orquestrador   | >99.5% uptime                           | Monitoramento externo                                        |
| Integridade de dados              | 0% de chunks corrompidos não detectados | Scrubbing periódico com SHA-256                              |

---

## Não-objetivos

> O que este sistema deliberadamente NÃO faz? Quais problemas adjacentes estão fora do escopo?

- **Não substitui Google Photos** como aplicativo de visualização completo — Alexandria é storage distribuído com galeria básica, não um editor ou organizador avançado de fotos
- **Não suporta rede pública/aberta** — somente clusters familiares permissionados; não é um serviço de armazenamento genérico
- **Não armazena arquivos originais** — somente versões otimizadas (WebP/H.265) + preview; decisão explícita de priorizar eficiência sobre fidelidade absoluta
- **Não implementa blockchain ou NFTs** para integridade — hashes SHA-256 com replicação são suficientes e mais simples
- **Não constrói rede peer-to-peer completa** na v1 — orquestrador centralizado (mas descartável) é suficiente
- **Não oferece serviço comercial multi-tenant** — projeto familiar, não SaaS
- **Não implementa edição colaborativa** de documentos
- **Não suporta streaming de vídeo em tempo real** — download sob demanda é suficiente para o caso de uso familiar
