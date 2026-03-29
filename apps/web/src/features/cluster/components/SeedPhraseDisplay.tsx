'use client';

import { useState } from 'react';

/**
 * SeedPhraseDisplay — grid 3x4 de palavras com destaque visual.
 * Fonte: docs/frontend/web/04-components.md (SeedPhraseDisplay)
 */
export function SeedPhraseDisplay({
  seedPhrase,
  onConfirm,
}: {
  seedPhrase: string;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const words = seedPhrase.split(' ');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">
          Guarde estas 12 palavras em local seguro. Elas sao a unica forma de recuperar seu cluster.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {words.map((word, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
              <span className="text-sm font-medium text-foreground">{word}</span>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded border-border" />
        <span className="text-sm text-muted-foreground">Anotei as 12 palavras em local seguro</span>
      </label>
      <button onClick={onConfirm} disabled={!confirmed} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        Continuar
      </button>
    </div>
  );
}
