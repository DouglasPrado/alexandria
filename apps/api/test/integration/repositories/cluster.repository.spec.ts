/**
 * Integration tests — ClusterRepository contra PostgreSQL real.
 * Fonte: docs/backend/14-tests.md (integration/repositories/)
 *
 * Requer: testcontainers (PostgreSQL) — rodar com `pnpm test:integration`
 */

// TODO: configurar testcontainers para PostgreSQL
// import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe.skip('ClusterRepository (integration)', () => {
  it('should create and findById a cluster', async () => {
    // const container = await new PostgreSqlContainer().start();
    // Setup Prisma com DATABASE_URL do container
    // const repo = new ClusterRepository(prisma);
    // const created = await repo.create({ ... });
    // const found = await repo.findById(created.id);
    // expect(found.name).toBe(created.name);
  });

  it('should findByClusterId (SHA-256 lookup)', async () => {
    // ...
  });

  it('should updateStatus (active → suspended)', async () => {
    // ...
  });
});
