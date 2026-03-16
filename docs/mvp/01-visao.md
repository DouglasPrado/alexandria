# Visão

Esta seção captura o **porquê** do sistema existir. Define o problema, a solução proposta e como saberemos se a POC teve sucesso.

---

## Problema

Famílias acumulam centenas de gigabytes em fotos, vídeos e documentos digitais, mas dependem de um único provedor centralizado com espaço gratuito limitado (15GB no Google, 5GB no iCloud). Backups manuais em HDs externos são esquecidos e degradam em 5-10 anos. Não existe solução que automatize a distribuição de dados entre múltiplos dispositivos e provedores com auto-reparação. O resultado é risco real de perda irreversível de memórias familiares por falha de disco, exclusão de conta ou desastre.

---

## Solução

O Alexandria permite que famílias armazenem suas memórias digitais de forma distribuída e criptografada entre dispositivos próprios e provedores cloud, com replicação automática, otimização de mídia e recuperação completa via frase de 12 palavras — eliminando dependência de provedor único e risco de perda total.

---

## Público-alvo

| Persona | Necessidade principal | Frequência de uso |
| --- | --- | --- |
| Administrador Familiar | Garantir que memórias da família estejam seguras, replicadas e recuperáveis | Semanal |
| Membro Familiar | Salvar e visualizar fotos/vídeos sem complicação técnica | Diário |
| Fotógrafo Amador | Upload automático, economizar espaço no celular | Diário |

---

## Métricas de sucesso da POC

| Métrica | Meta | Como medir |
| --- | --- | --- |
| Zero perda de dados | 0 chunks corrompidos ou perdidos em 1 mês de uso | Monitoramento de replicação + scrubbing periódico |
| Replicação saudável | >99% dos chunks com 3+ réplicas | Dashboard de saúde do cluster |
| Redução de armazenamento (fotos) | 10-20x vs JPEG original (~5-8MB → ~300-600KB WebP) | Benchmark com acervo real da família |
| Recovery via seed | Orquestrador reconstruído em <2 horas | Disaster drill real em nova VPS |
| Adoção familiar | 100% dos membros da família usando | Contagem de usuários ativos no cluster |

---

## Não-objetivos

- Não substituir Google Photos como aplicativo de visualização completo nesta fase
- Não suportar rede pública/aberta — somente clusters familiares permissionados
- Não armazenar arquivos originais — somente versões otimizadas + preview
- Não implementar desktop/mobile nativos na POC (web client é suficiente)
- Não oferecer streaming de vídeo em tempo real (download sob demanda é suficiente)
- Não implementar deduplicação global entre membros (fase 2)
