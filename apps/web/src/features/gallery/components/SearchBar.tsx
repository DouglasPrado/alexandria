/**
 * SearchBar — input com debounce 300ms, filtros de tipo e período.
 * Fonte: docs/frontend/web/04-components.md (SearchBar, FilterChips)
 * Fonte: docs/frontend/web/05-state.md (URL State)
 * Fonte: docs/blueprint/08-use_cases.md (UC-010 — busca por nome, data, tipo)
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import type { MediaType } from '../types/file.types';

interface SearchBarProps {
  query: string;
  mediaType: MediaType | undefined;
  from: string | undefined;
  to: string | undefined;
  onQueryChange: (q: string) => void;
  onMediaTypeChange: (type: MediaType | undefined) => void;
  onFromChange: (iso: string | undefined) => void;
  onToChange: (iso: string | undefined) => void;
}

const FILTER_CHIPS: { label: string; value: MediaType }[] = [
  { label: 'Fotos', value: 'photo' },
  { label: 'Vídeos', value: 'video' },
  { label: 'Documentos', value: 'document' },
  { label: 'Arquivos', value: 'archive' },
];

function dateToISOStart(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function dateToISOEnd(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function SearchBar({
  query,
  mediaType,
  from,
  to,
  onQueryChange,
  onMediaTypeChange,
  onFromChange,
  onToChange,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => onQueryChange(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onQueryChange]);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const toggleMediaType = useCallback(
    (type: MediaType) => {
      onMediaTypeChange(mediaType === type ? undefined : type);
    },
    [mediaType, onMediaTypeChange],
  );

  const hasAnyFilter = !!(mediaType || query || from || to);

  const clearAll = useCallback(() => {
    setLocalQuery('');
    onQueryChange('');
    onMediaTypeChange(undefined);
    onFromChange(undefined);
    onToChange(undefined);
  }, [onQueryChange, onMediaTypeChange, onFromChange, onToChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => toggleMediaType(chip.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mediaType === chip.value
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            {chip.label}
          </button>
        ))}
        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="search-from" className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">De</label>
          <input
            id="search-from"
            type="date"
            value={isoToDateInput(from)}
            onChange={(e) => onFromChange(e.target.value ? dateToISOStart(e.target.value) : undefined)}
            className="px-2 py-1.5 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="search-to" className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">Até</label>
          <input
            id="search-to"
            type="date"
            value={isoToDateInput(to)}
            onChange={(e) => onToChange(e.target.value ? dateToISOEnd(e.target.value) : undefined)}
            className="px-2 py-1.5 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>
    </div>
  );
}
