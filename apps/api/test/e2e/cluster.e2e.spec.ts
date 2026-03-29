/**
 * E2E tests — Cluster flow via HTTP real (supertest).
 * Fonte: docs/backend/14-tests.md (test/e2e/)
 *
 * Fluxo: create cluster → invite member → accept → list members
 */

// TODO: configurar supertest + test app
// import * as request from 'supertest';

describe.skip('Cluster E2E', () => {
  it('POST /api/clusters → should create cluster and return seed phrase', async () => {});
  it('POST /api/clusters/:id/invites → should generate invite token', async () => {});
  it('POST /api/invites/:token/accept → should create member and return JWT', async () => {});
  it('GET /api/clusters/:id/members → should list members', async () => {});
});
