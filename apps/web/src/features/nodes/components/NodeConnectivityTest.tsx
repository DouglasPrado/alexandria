'use client';

import { useState } from 'react';

/**
 * NodeConnectivityTest — feedback visual do teste PUT/GET no AddNodeDialog.
 * Fonte: docs/frontend/web/04-components.md (NodeConnectivityTest)
 */
export function NodeConnectivityTest({
  status,
}: {
  status: 'idle' | 'testing' | 'success' | 'failed';
}) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border p-3">
      {status === 'testing' && (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Testando conectividade...</span>
        </>
      )}
      {status === 'success' && (
        <>
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-success">Conectividade verificada</span>
        </>
      )}
      {status === 'failed' && (
        <>
          <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm text-destructive">Falha na conectividade</span>
        </>
      )}
    </div>
  );
}
