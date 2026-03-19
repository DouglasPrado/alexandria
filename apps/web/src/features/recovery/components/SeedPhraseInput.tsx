"use client";

interface SeedPhraseInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SeedPhraseInput({ value, onChange, disabled }: SeedPhraseInputProps) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="palavra1 palavra2 palavra3 ... palavra12"
        rows={3}
        className="w-full p-3 border border-border rounded-lg font-mono text-sm bg-surface-elevated text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      />
      <p className="text-xs text-text-muted mt-1">{wordCount}/12 palavras</p>
    </div>
  );
}
