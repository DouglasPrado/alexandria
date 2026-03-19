"use client";
import { useState } from "react";

interface SeedPhraseDisplayProps {
  seedPhrase: string; // 12 words space-separated
  onConfirm: () => void;
}

export function SeedPhraseDisplay({ seedPhrase, onConfirm }: SeedPhraseDisplayProps) {
  const [confirmed, setConfirmed] = useState(false);
  const words = seedPhrase.split(" ");

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-amber-900">Sua Seed Phrase</h3>
        <div className="grid grid-cols-3 gap-3">
          {words.map((word, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white rounded px-3 py-2 border border-amber-200 font-mono text-sm"
            >
              <span className="text-gray-400 text-xs w-5">{i + 1}.</span>
              <span className="text-gray-900">{word}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-amber-700">
        Anote estas 12 palavras em papel. Esta é a <strong>ÚNICA vez</strong> que serão exibidas.
        Elas são necessárias para recuperar o sistema em caso de perda de acesso.
      </p>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">Anotei minha seed phrase em local seguro</span>
      </label>

      <button
        onClick={onConfirm}
        disabled={!confirmed}
        className="w-full py-2 px-4 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 text-sm font-medium"
      >
        Continuar
      </button>
    </div>
  );
}
