import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { NodeTokenGuard } from '../../src/common/guards/node-token.guard';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Testes do NodeTokenGuard — autentica heartbeat via X-Node-Token.
 * Fonte: docs/backend/11-permissions.md (heartbeat autenticado por node token)
 * Fonte: docs/blueprint/13-security.md (token de registro)
 *
 * - Verifica header X-Node-Token contra o token armazenado do no
 * - Rejeita com 401 se token ausente ou invalido
 * - Permite se token corresponde ao nodeId do param
 */

const mockPrisma = {
  node: {
    findUnique: jest.fn(),
  },
};

function createMockContext(nodeId: string, token?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        params: { id: nodeId },
        headers: token ? { 'x-node-token': token } : {},
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('NodeTokenGuard', () => {
  let guard: NodeTokenGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new NodeTokenGuard(mockPrisma as unknown as PrismaService);
  });

  it('should allow when X-Node-Token matches node token in DB', async () => {
    mockPrisma.node.findUnique.mockResolvedValue({
      id: 'node-1',
      nodeToken: 'valid-token-abc',
    });
    const ctx = createMockContext('node-1', 'valid-token-abc');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should throw UnauthorizedException when X-Node-Token header is missing', async () => {
    const ctx = createMockContext('node-1');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token does not match', async () => {
    mockPrisma.node.findUnique.mockResolvedValue({
      id: 'node-1',
      nodeToken: 'valid-token-abc',
    });
    const ctx = createMockContext('node-1', 'wrong-token');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when node not found', async () => {
    mockPrisma.node.findUnique.mockResolvedValue(null);
    const ctx = createMockContext('non-existent', 'some-token');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
