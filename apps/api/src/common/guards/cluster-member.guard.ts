import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * ClusterMemberGuard — verifica que o membro autenticado pertence ao cluster da rota.
 * Fonte: docs/backend/07-controllers.md (ClusterMemberGuard)
 * Fonte: docs/backend/11-permissions.md (cross-cluster data access)
 *
 * Compara user.clusterId (do JWT) com o param :clusterId da rota.
 * Rotas que usam :id para outro recurso (nodes, files) nao sao afetadas.
 * Bloqueia acesso cross-cluster com 403.
 */
@Injectable()
export class ClusterMemberGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Membro nao pertence a este cluster');
    }

    // Somente compara quando a rota tem :clusterId explícito
    const paramClusterId = request.params?.clusterId;
    if (paramClusterId && user.clusterId !== paramClusterId) {
      throw new ForbiddenException('Membro nao pertence a este cluster');
    }

    return true;
  }
}
