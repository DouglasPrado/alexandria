"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text mb-6">Configuracoes</h2>

      <div className="space-y-4">
        {/* Theme */}
        <div className="p-4 bg-surface-elevated border border-border rounded-lg">
          <h3 className="font-medium text-text mb-2">Aparencia</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Tema</span>
            <select className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white text-text">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Sistema</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 bg-surface-elevated border border-border rounded-lg">
          <h3 className="font-medium text-text mb-2">Notificacoes</h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Alertas criticos</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Upload concluido</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-muted">No offline</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="p-4 bg-surface-elevated border border-border rounded-lg">
          <h3 className="font-medium text-text mb-2">Conta</h3>
          <p className="text-sm text-text-muted">Gerenciamento de conta sera implementado na proxima versao.</p>
        </div>
      </div>
    </div>
  );
}
