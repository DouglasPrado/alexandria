'use client';

import { useState, useRef } from 'react';

/**
 * SeedPhraseInput — 12 inputs individuais para seed phrase.
 * Fonte: docs/frontend/web/04-components.md (SeedPhraseInput)
 */
export function SeedPhraseInput({
  onComplete,
}: {
  onComplete: (seedPhrase: string) => void;
}) {
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Handle paste of full seed phrase
    const pastedWords = value.trim().split(/\s+/);
    if (pastedWords.length === 12) {
      setWords(pastedWords);
      inputRefs.current[11]?.focus();
      onComplete(pastedWords.join(' '));
      return;
    }

    const updated = [...words];
    updated[index] = value.toLowerCase().trim();
    setWords(updated);

    // Auto-advance on space
    if (value.endsWith(' ') && index < 11) {
      updated[index] = value.trim();
      setWords(updated);
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all 12 filled
    if (updated.every((w) => w.length > 0)) {
      onComplete(updated.join(' '));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {words.map((word, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            value={word}
            onChange={(e) => handleChange(i, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ))}
    </div>
  );
}
