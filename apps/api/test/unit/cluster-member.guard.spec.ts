import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClusterMemberGuard } from '../../src/common/guards/cluster-member.guard';

/**
 * Testes do ClusterMemberGuard — verifica pertencimento ao cluster.
 * Fonte: docs/backend/07-controllers.md (ClusterMemberGuard)
 * Fonte: docs/backend/11-permissions.md (cross-cluster data access)
 *
 * - Verifica que user.clusterId === :id (ou :clusterId) do param
 * - Bloqueia acesso cross-cluster com 403
 * - Permite se usuario pertence ao cluster
 * - Pula se rota marcada com @Public()
 * - Pula se nao ha param de cluster na rota
 */

function createMockContext(
  userClusterId: string | undefined,
  paramId: string | undefined,
  isPublic = false,
): { context: ExecutionContext; reflector: Reflector } {
  const request = {
    user: userClusterId ? { memberId: 'member-1', clusterId: userClusterId, role: 'admin' } : undefined,
    params: paramId ? { clusterId: paramId } : {},
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;

  return { context, reflector };
}

describe('ClusterMemberGuard', () => {
  it('should allow access when user.clusterId matches route :id', () => {
    const { context, reflector } = createMockContext('cluster-abc', 'cluster-abc');
    const guard = new ClusterMemberGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user.clusterId does NOT match route :id', () => {
    const { context, reflector } = createMockContext('cluster-abc', 'cluster-xyz');
    const guard = new ClusterMemberGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should skip validation on @Public() routes', () => {
    const { context, reflector } = createMockContext(undefined, 'cluster-abc', true);
    const guard = new ClusterMemberGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should skip validation when no :id param exists (e.g. list-only routes)', () => {
    const { context, reflector } = createMockContext('cluster-abc', undefined);
    const guard = new ClusterMemberGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated and route is not public', () => {
    const { context, reflector } = createMockContext(undefined, 'cluster-abc', false);
    const guard = new ClusterMemberGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should include descriptive error message', () => {
    const { context, reflector } = createMockContext('cluster-abc', 'cluster-xyz');
    const guard = new ClusterMemberGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(
      /nao pertence a este cluster/i,
    );
  });
});
