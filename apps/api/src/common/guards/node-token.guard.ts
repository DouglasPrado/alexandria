import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * NodeTokenGuard — autentica heartbeat via header X-Node-Token.
 * Fonte: docs/backend/11-permissions.md (heartbeat autenticado por node token)
 *
 * O token e gerado no registro do no e retornado ao agente.
 * O agente envia o token no header X-Node-Token em cada heartbeat.
 */
@Injectable()
export class NodeTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-node-token'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('X-Node-Token header obrigatorio para heartbeat');
    }

    const nodeId = request.params?.id;
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      select: { nodeToken: true },
    });

    if (!node || node.nodeToken !== token) {
      throw new UnauthorizedException('Node token invalido');
    }

    return true;
  }
}
