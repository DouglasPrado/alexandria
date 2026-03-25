import { createHash } from 'node:crypto';

/**
 * Numero base de virtual nodes por unidade de capacidade.
 * Nodes com mais capacidade recebem mais vnodes proporcionalmente.
 * 150 vnodes por "unidade" garante boa distribuicao com poucos nos reais.
 */
const VNODES_PER_UNIT = 150;

/** Capacidade de referencia para calculo de vnodes (em mesma unidade que capacity) */
const REFERENCE_CAPACITY = 100;

interface VNode {
  hash: number;
  nodeId: string;
}

/**
 * ConsistentHashRing — distribui chunks entre nos proporcionalmente a capacidade.
 *
 * ADR-006: Consistent hashing com virtual nodes.
 * - Virtual nodes proporcionais a capacidade do no
 * - Redistribuicao minima: apenas K/N chunks migram quando no entra/sai
 * - Deterministico: mesmo chunk hash → mesmos nos destino
 *
 * Usado pelo StorageService para selecionar nos destino na distribuicao de chunks
 * e pelo HealthService para selecionar nos destino na re-replicacao (auto-healing).
 */
export class ConsistentHashRing {
  private ring: VNode[] = [];
  private nodes = new Map<string, number>(); // nodeId → capacity

  /**
   * Calcula hash numerico de 32 bits a partir de uma string.
   * Usa MD5 truncado para velocidade (nao precisa ser criptografico aqui).
   */
  private hashKey(key: string): number {
    const digest = createHash('md5').update(key).digest();
    return digest.readUInt32BE(0);
  }

  /**
   * Calcula numero de virtual nodes baseado na capacidade.
   * Mais capacidade → mais vnodes → mais chunks atribuidos.
   */
  private vnodeCount(capacity: number): number {
    return Math.max(1, Math.round((capacity / REFERENCE_CAPACITY) * VNODES_PER_UNIT));
  }

  /**
   * Reordena o ring por hash (binary search depende de ordenacao).
   */
  private sortRing(): void {
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Adiciona no ao ring com virtual nodes proporcionais a capacidade.
   *
   * @param nodeId - Identificador unico do no
   * @param capacity - Capacidade do no (em qualquer unidade consistente — bytes, GB, etc.)
   * @throws Error se nodeId ja existe ou capacity <= 0
   */
  addNode(nodeId: string, capacity: number): void {
    if (this.nodes.has(nodeId)) {
      throw new Error(`Node "${nodeId}" already exists in the ring.`);
    }
    if (capacity <= 0) {
      throw new Error(`Invalid capacity: ${capacity}. Must be positive.`);
    }

    this.nodes.set(nodeId, capacity);

    const count = this.vnodeCount(capacity);
    for (let i = 0; i < count; i++) {
      this.ring.push({
        hash: this.hashKey(`${nodeId}:vnode:${i}`),
        nodeId,
      });
    }

    this.sortRing();
  }

  /**
   * Remove no e todos os seus virtual nodes do ring.
   *
   * @throws Error se nodeId nao existe
   */
  removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node "${nodeId}" not found in the ring.`);
    }

    this.nodes.delete(nodeId);
    this.ring = this.ring.filter((vnode) => vnode.nodeId !== nodeId);
  }

  /**
   * Retorna N nos destino para uma chave (chunk hash).
   * Deterministico: mesma chave → mesmos nos (enquanto ring nao mudar).
   * Retorna apenas nos distintos (RN-CR1: replicas em nos diferentes).
   *
   * @param key - Chave para lookup (ex: chunk SHA-256 hash)
   * @param count - Numero de nos a retornar (ex: 3 para replicacao 3x)
   * @param exclude - Lista de nodeIds a excluir do resultado (ex: no perdido)
   * @returns Array de nodeIds ordenados por proximidade no ring
   * @throws Error se ring vazio ou nos insuficientes
   */
  getNodes(key: string, count: number, exclude: string[] = []): string[] {
    const excludeSet = new Set(exclude);
    const availableNodes = [...this.nodes.keys()].filter((id) => !excludeSet.has(id));

    if (availableNodes.length === 0) {
      throw new Error('Ring is empty. Add nodes before querying.');
    }
    if (availableNodes.length < count) {
      throw new Error(
        `Not enough nodes: requested ${count}, available ${availableNodes.length}` +
          (exclude.length > 0 ? ` (after excluding ${exclude.length})` : '') +
          '.',
      );
    }

    const keyHash = this.hashKey(key);
    const result: string[] = [];
    const seen = new Set<string>();

    // Find starting position via binary search
    let start = this.binarySearch(keyHash);

    // Walk clockwise around the ring collecting distinct nodes
    for (let i = 0; i < this.ring.length && result.length < count; i++) {
      const idx = (start + i) % this.ring.length;
      const vnode = this.ring[idx]!;

      if (!seen.has(vnode.nodeId) && !excludeSet.has(vnode.nodeId)) {
        seen.add(vnode.nodeId);
        result.push(vnode.nodeId);
      }
    }

    return result;
  }

  /**
   * Numero de nos fisicos no ring.
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Binary search para encontrar o primeiro vnode com hash >= target.
   * Se nenhum encontrado, wraps para o inicio (ring circular).
   */
  private binarySearch(target: number): number {
    let lo = 0;
    let hi = this.ring.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.ring[mid]!.hash < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return lo % this.ring.length;
  }
}
