/**
 * SearchBar — input com debounce 300ms, filtros de tipo e período.
 * Fonte: docs/frontend/web/04-components.md (SearchBar, FilterChips)
 * Fonte: docs/frontend/web/05-state.md (URL State)
 * Fonte: docs/blueprint/08-use_cases.md (UC-010 — busca por nome, data, tipo)
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
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

/** Converte ISO string para Date local (sem shift de timezone) */
function isoToDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  // Extrai yyyy-MM-dd e cria Date local para evitar shift de timezone
  const dateStr = iso.slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
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

  const handleFromChange = useCallback(
    (date: Date | undefined) => {
      onFromChange(date ? startOfDay(date).toISOString() : undefined);
    },
    [onFromChange],
  );

  const handleToChange = useCallback(
    (date: Date | undefined) => {
      onToChange(date ? endOfDay(date).toISOString() : undefined);
    },
    [onToChange],
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

      {/* Filtro de período — UC-010 RF-064 */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">De</span>
          <DatePicker
            value={isoToDate(from)}
            onChange={handleFromChange}
            placeholder="Data início"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Até</span>
          <DatePicker
            value={isoToDate(to)}
            onChange={handleToChange}
            placeholder="Data fim"
          />
        </div>
      </div>
    </div>
  );
}
