'use client';

/**
 * Global ErrorBoundary — captura erros nao tratados.
 * Fonte: docs/shared/error-ux-mapping.md (Fallback Global)
 * Fonte: docs/frontend/web/04-components.md (ErrorBoundary)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao inicio.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Voltar ao inicio
          </a>
        </div>
      </div>
    </div>
  );
}
