'use client';

/**
 * DrainProgressBar — barra de progresso de migracao de chunks durante drain.
 * Fonte: docs/frontend/web/04-components.md (DrainProgressBar)
 */
export function DrainProgressBar({
  chunksRelocated,
  chunksTotal,
}: {
  chunksRelocated: number;
  chunksTotal: number;
}) {
  const percent = chunksTotal > 0 ? Math.round((chunksRelocated / chunksTotal) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Migrando chunks...</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {chunksRelocated} / {chunksTotal} chunks migrados
      </p>
    </div>
  );
}
