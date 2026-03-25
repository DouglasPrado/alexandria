import { ConsistentHashRing } from '../src/consistent-hash';

/**
 * Testes do ConsistentHashRing — distribuicao de chunks entre nos.
 * Fonte: docs/blueprint/10-architecture_decisions.md (ADR-006)
 * Fonte: docs/shared/glossary.md (Consistent Hashing)
 *
 * - Virtual nodes proporcionais a capacidade do no
 * - Redistribuicao minima quando nos entram/saem
 * - Deterministico: mesmo key → mesmos nos
 * - getNodes() retorna nos distintos (RN-CR1: replicas em nos diferentes)
 */

describe('ConsistentHashRing', () => {
  describe('constructor', () => {
    it('should create an empty ring', () => {
      const ring = new ConsistentHashRing();
      expect(ring.getNodeCount()).toBe(0);
    });
  });

  describe('addNode()', () => {
    it('should add a node to the ring', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      expect(ring.getNodeCount()).toBe(1);
    });

    it('should add multiple nodes', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 200);
      ring.addNode('node-3', 150);
      expect(ring.getNodeCount()).toBe(3);
    });

    it('should throw on duplicate node id', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      expect(() => ring.addNode('node-1', 200)).toThrow();
    });

    it('should throw on zero or negative capacity', () => {
      const ring = new ConsistentHashRing();
      expect(() => ring.addNode('node-1', 0)).toThrow();
      expect(() => ring.addNode('node-2', -10)).toThrow();
    });
  });

  describe('removeNode()', () => {
    it('should remove a node from the ring', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.removeNode('node-1');
      expect(ring.getNodeCount()).toBe(1);
    });

    it('should throw on non-existent node', () => {
      const ring = new ConsistentHashRing();
      expect(() => ring.removeNode('non-existent')).toThrow();
    });

    it('after removal, keys should map to remaining nodes', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.removeNode('node-1');

      const nodes = ring.getNodes('any-key', 1);
      expect(nodes).toEqual(['node-2']);
    });
  });

  describe('getNodes()', () => {
    it('should return requested number of distinct nodes', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.addNode('node-3', 100);

      const nodes = ring.getNodes('chunk-hash-abc', 3);
      expect(nodes).toHaveLength(3);
      expect(new Set(nodes).size).toBe(3); // all distinct (RN-CR1)
    });

    it('should be deterministic — same key returns same nodes', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.addNode('node-3', 100);

      const a = ring.getNodes('deterministic-key', 2);
      const b = ring.getNodes('deterministic-key', 2);
      expect(a).toEqual(b);
    });

    it('should return different nodes for different keys', () => {
      const ring = new ConsistentHashRing();
      for (let i = 0; i < 10; i++) {
        ring.addNode(`node-${i}`, 100);
      }

      // With 10 nodes and many keys, we should see variation
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const nodes = ring.getNodes(`key-${i}`, 1);
        results.add(nodes[0]!);
      }
      // Should hit multiple distinct nodes
      expect(results.size).toBeGreaterThan(1);
    });

    it('should throw if requesting more nodes than available', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);

      expect(() => ring.getNodes('key', 3)).toThrow();
    });

    it('should throw on empty ring', () => {
      const ring = new ConsistentHashRing();
      expect(() => ring.getNodes('key', 1)).toThrow();
    });

    it('should work with count = 1', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);

      const nodes = ring.getNodes('key', 1);
      expect(nodes).toEqual(['node-1']);
    });
  });

  describe('capacity-proportional distribution', () => {
    it('should distribute more keys to nodes with higher capacity', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('small', 100);  // 100 GB
      ring.addNode('large', 400);  // 400 GB — 4x more capacity

      const counts: Record<string, number> = { small: 0, large: 0 };
      const totalKeys = 10_000;

      for (let i = 0; i < totalKeys; i++) {
        const nodes = ring.getNodes(`chunk-${i}`, 1);
        counts[nodes[0]!]!++;
      }

      // Large node should get roughly 4x more than small
      // Allow wide tolerance (2x-6x) due to hash distribution variance
      const ratio = counts['large']! / counts['small']!;
      expect(ratio).toBeGreaterThan(2);
      expect(ratio).toBeLessThan(6);
    });
  });

  describe('minimal redistribution', () => {
    it('should redistribute minimal keys when a node is added', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);

      // Record assignments before
      const totalKeys = 1000;
      const before = new Map<string, string>();
      for (let i = 0; i < totalKeys; i++) {
        const key = `chunk-${i}`;
        before.set(key, ring.getNodes(key, 1)[0]!);
      }

      // Add a third node
      ring.addNode('node-3', 100);

      // Count how many keys changed assignment
      let changed = 0;
      for (let i = 0; i < totalKeys; i++) {
        const key = `chunk-${i}`;
        const after = ring.getNodes(key, 1)[0]!;
        if (before.get(key) !== after) changed++;
      }

      // Ideal: ~1/3 of keys move (K/N). Allow up to 60%
      const changeRatio = changed / totalKeys;
      expect(changeRatio).toBeLessThan(0.6);
      expect(changeRatio).toBeGreaterThan(0.05); // some keys must move
    });

    it('should redistribute minimal keys when a node is removed', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.addNode('node-3', 100);

      const totalKeys = 1000;
      const before = new Map<string, string>();
      for (let i = 0; i < totalKeys; i++) {
        const key = `chunk-${i}`;
        before.set(key, ring.getNodes(key, 1)[0]!);
      }

      ring.removeNode('node-2');

      let changed = 0;
      for (let i = 0; i < totalKeys; i++) {
        const key = `chunk-${i}`;
        const after = ring.getNodes(key, 1)[0]!;
        if (before.get(key) !== after) changed++;
      }

      // Only keys that were on node-2 should move (~1/3)
      const changeRatio = changed / totalKeys;
      expect(changeRatio).toBeLessThan(0.6);
    });
  });

  describe('exclude nodes', () => {
    it('should exclude specified nodes from results', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);
      ring.addNode('node-3', 100);

      const nodes = ring.getNodes('key', 2, ['node-1']);
      expect(nodes).toHaveLength(2);
      expect(nodes).not.toContain('node-1');
    });

    it('should throw if not enough nodes after exclusion', () => {
      const ring = new ConsistentHashRing();
      ring.addNode('node-1', 100);
      ring.addNode('node-2', 100);

      expect(() => ring.getNodes('key', 2, ['node-1'])).toThrow();
    });
  });
});
