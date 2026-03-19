"use client";

export default function SeedPhrasePage() {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text mb-2">Seed Phrase</h2>
      <p className="text-sm text-text-muted mb-6">
        A seed phrase e a unica forma de recuperar o sistema. Guarde em local seguro.
      </p>

      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg mb-6">
        <p className="text-sm text-warning font-medium mb-1">Atencao</p>
        <p className="text-xs text-text-muted">
          A seed phrase so e exibida na criacao do cluster. Se voce ja a anotou, nao e
          possivel exibi-la novamente por seguranca. Se perdeu a seed, nao ha como recuperar.
        </p>
      </div>

      <div className="p-4 bg-surface-elevated border border-border rounded-lg">
        <p className="text-sm text-text-muted text-center">
          Para exibir a seed phrase, recrie o cluster ou use o endpoint de recovery.
        </p>
        <div className="flex justify-center mt-4">
          <a href="/recovery" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            Ir para Recovery
          </a>
        </div>
      </div>
    </div>
  );
}
