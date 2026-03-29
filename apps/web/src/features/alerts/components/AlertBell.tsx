'use client';

import { useState, useRef, useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertDropdown } from './AlertDropdown';

/**
 * AlertBell — icone de sino com badge de contagem no header.
 * Fonte: docs/frontend/web/04-components.md (AlertBell)
 */
export function AlertBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useAlerts(false);

  const activeCount = data?.data?.length ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Alertas"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>
      {open && <AlertDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
