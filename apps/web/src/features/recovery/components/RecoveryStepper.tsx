'use client';

/**
 * RecoveryStepper — stepper vertical com 6 etapas de recovery.
 * Fonte: docs/frontend/web/04-components.md (RecoveryStepper)
 */

const STEPS = [
  'Inserir seed phrase',
  'Validar mnemonic',
  'Derivar chaves',
  'Localizar cluster',
  'Desbloquear vaults',
  'Verificar integridade',
] as const;

export function RecoveryStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="space-y-3">
      {STEPS.map((label, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isComplete
                  ? 'bg-success text-success-foreground'
                  : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isComplete ? '✓' : i + 1}
            </div>
            <span
              className={`text-sm ${
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
