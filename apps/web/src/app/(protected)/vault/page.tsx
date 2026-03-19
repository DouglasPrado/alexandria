"use client";

export default function VaultPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Cofre Pessoal</h2>

      {/* OAuth Tokens */}
      <section className="mb-6">
        <h3 className="text-lg font-medium text-text mb-3">Tokens OAuth</h3>
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center text-text-muted">
          <p className="text-sm">Nenhum token configurado</p>
          <p className="text-xs mt-1">Conecte Google Drive, Dropbox ou OneDrive como nos de storage</p>
        </div>
      </section>

      {/* Node Credentials */}
      <section className="mb-6">
        <h3 className="text-lg font-medium text-text mb-3">Credenciais de Nos</h3>
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center text-text-muted">
          <p className="text-sm">Credenciais S3/R2 sao armazenadas no vault criptografado</p>
        </div>
      </section>

      {/* Passwords */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-text">Senhas</h3>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90">
            Adicionar
          </button>
        </div>
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center text-text-muted">
          <p className="text-sm">Nenhuma senha salva</p>
          <p className="text-xs mt-1">Armazene senhas de forma segura no vault criptografado</p>
        </div>
      </section>
    </div>
  );
}
