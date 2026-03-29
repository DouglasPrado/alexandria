/**
 * Integration tests — Photo pipeline completo.
 * Fonte: docs/backend/14-tests.md
 *
 * Fluxo: upload JPEG → Sharp resize → chunk → encrypt → distribute → verify
 */
describe.skip('Photo Pipeline (integration)', () => {
  it('should process JPEG through full pipeline: resize → chunk → encrypt → manifest', async () => {});
  it('should generate WebP thumbnail preview', async () => {});
  it('should reject corrupt image with status error', async () => {});
});
