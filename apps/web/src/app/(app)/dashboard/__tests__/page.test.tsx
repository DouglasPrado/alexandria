import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Teste estático: verifica que o botão Upload do dashboard
 * NÃO restringe tipos de arquivo via accept.
 *
 * O accept="image/*,video/*,application/pdf" fazia o macOS Finder
 * desabilitar arquivos ZIP/DMG — a validação deve ser no backend.
 */
describe('Dashboard Upload Button', () => {
  it('should not have a restrictive accept attribute in the source code', () => {
    const source = readFileSync(
      resolve(__dirname, '../page.tsx'),
      'utf-8',
    );

    // Must NOT have the old restrictive accept
    expect(source).not.toContain('accept="image/*,video/*,application/pdf"');

    // If accept exists, it should not restrict to only images/videos/pdf
    const acceptMatches = source.match(/accept="([^"]*)"/g);
    if (acceptMatches) {
      for (const match of acceptMatches) {
        expect(match).not.toMatch(/accept="image\/\*,video\/\*/);
      }
    }
  });
});
