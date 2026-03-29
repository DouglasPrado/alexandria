/**
 * E2E tests — Upload + Download flow via HTTP real.
 * Fonte: docs/backend/14-tests.md
 *
 * Fluxo: upload photo → wait processing → verify ready → download → compare hash
 */
describe.skip('Upload/Download E2E', () => {
  it('POST /api/files/upload → should accept file and return 202', async () => {});
  it('GET /api/files/:id → should eventually transition to ready', async () => {});
  it('GET /api/files/:id/download → should return reassembled file with correct hash', async () => {});
  it('GET /api/files/:id/preview → should return thumbnail', async () => {});
});
