'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedPhrasePage() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [clusterName, setClusterName] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const seed = sessionStorage.getItem('seedPhrase');
    const name = sessionStorage.getItem('clusterName');
    if (!seed) { router.push('/setup'); return; }
    setSeedPhrase(seed);
    setClusterName(name || '');
  }, [router]);

  function handleContinue() {
    sessionStorage.removeItem('seedPhrase');
    sessionStorage.removeItem('clusterName');
    router.push('/login');
  }

  if (!seedPhrase) return null;

  const words = seedPhrase.split(' ');

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-lg space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Guarde sua seed phrase</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Cluster <span className="font-semibold text-[var(--foreground)]">{clusterName}</span> criado com sucesso
          </p>
        </div>

        <div className="bg-[var(--warning)]/10 border border-[var(--warning)] rounded-[var(--radius)] p-4">
          <p className="font-semibold text-[var(--warning-foreground)] text-sm">Anote em papel. Esta e a UNICA vez que ela sera exibida.</p>
          <p className="text-[var(--muted-foreground)] text-xs mt-1">
            Estas 12 palavras sao a unica forma de recuperar o sistema caso o servidor seja perdido. Sem elas, os dados nao podem ser recuperados.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3" aria-label="Suas 12 palavras da seed phrase">
          {words.map((word, i) => (
            <div key={i} className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)] text-xs font-mono w-5">{i + 1}.</span>
              <span className="text-[var(--foreground)] font-mono font-medium">{word}</span>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 text-sm text-[var(--foreground)] cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 rounded border-[var(--input)]" />
          <span>Anotei as 12 palavras em local seguro e entendo que nao poderei recupera-las depois</span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!confirmed}
          className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          title={!confirmed ? 'Confirme que anotou para continuar' : undefined}
        >
          {confirmed ? 'Ir para o dashboard' : 'Confirme que anotou para continuar'}
        </button>
      </div>
    </main>
  );
}
