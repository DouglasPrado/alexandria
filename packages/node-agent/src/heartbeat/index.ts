/**
 * HeartbeatService — envia heartbeat periodico ao orquestrador.
 * Fonte: docs/blueprint/06-system-architecture.md (Agente de No)
 * Fonte: docs/backend/03-domain.md (Node heartbeat — 1/min)
 *
 * POST /api/nodes/:id/heartbeat a cada 1 minuto.
 * Resiliente a falhas de rede — log + retry no proximo ciclo.
 */
export class HeartbeatService {
  constructor(
    private readonly nodeId: string,
    private readonly orchestratorUrl: string,
  ) {}

  /** Envia heartbeat ao orquestrador. Nao lanca erro em caso de falha. */
  async sendHeartbeat(): Promise<void> {
    const url = `${this.orchestratorUrl}/api/nodes/${this.nodeId}/heartbeat`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.warn(`[Heartbeat] Non-2xx response: ${res.status}`);
      }
    } catch (err) {
      console.warn(
        '[Heartbeat] Failed to reach orchestrator:',
        err instanceof Error ? err.message : err,
      );
    }
  }
}
