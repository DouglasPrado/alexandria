import { HeartbeatService } from '../src/heartbeat';

/**
 * Testes do HeartbeatService — envio periodico de heartbeat ao orquestrador.
 * Fonte: docs/blueprint/06-system-architecture.md (Agente de No)
 * Fonte: docs/backend/03-domain.md (Node lifecycle — heartbeat 1/min)
 *
 * - Envia POST /api/nodes/:id/heartbeat a cada 1 minuto
 * - Configurado via NODE_ID e ORCHESTRATOR_URL
 * - Resiliente a falhas de rede (log + retry no proximo ciclo)
 */

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('HeartbeatService', () => {
  let service: HeartbeatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HeartbeatService('node-123', 'http://localhost:3333');
  });

  it('should send POST to orchestrator heartbeat endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await service.sendHeartbeat();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/nodes/node-123/heartbeat',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should not throw on network failure (resilient)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    // Should not throw — logs error and continues
    await expect(service.sendHeartbeat()).resolves.not.toThrow();
  });

  it('should not throw on non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(service.sendHeartbeat()).resolves.not.toThrow();
  });

  it('should use configured nodeId and orchestratorUrl', async () => {
    const custom = new HeartbeatService('my-node', 'https://api.alexandria.dev');
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await custom.sendHeartbeat();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.alexandria.dev/api/nodes/my-node/heartbeat',
      expect.any(Object),
    );
  });
});
