'use client';

/**
 * FilterChips — chips de filtro ativo para galeria.
 * Fonte: docs/frontend/web/04-components.md (FilterChips)
 */

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'photo', label: 'Fotos' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documentos' },
  { value: 'archive', label: 'Archives' },
] as const;

export function FilterChips({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selected === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
