/**
 * AddNodeDialog — wizard para registrar novo nó.
 * Fonte: docs/frontend/web/04-components.md (AddNodeDialog)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 5: Adicionar nó)
 *
 * Steps: tipo → configuração → confirmação
 */
'use client';

import { AlertCircle, CheckCircle2, Cloud, HardDrive, Loader2, Server, X } from 'lucide-react';
import { useState } from 'react';
import { useRegisterNode } from '../hooks/useNodeMutations';
import type { NodeType, RegisterNodeRequest } from '../types/node.types';

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
}

const NODE_TYPES: {
  value: NodeType;
  label: string;
  description: string;
  icon: typeof HardDrive;
}[] = [
  { value: 'local', label: 'Local', description: 'Dispositivo local (PC, NAS)', icon: HardDrive },
  { value: 's3', label: 'AWS S3', description: 'Bucket Amazon S3', icon: Cloud },
  { value: 'r2', label: 'Cloudflare R2', description: 'Bucket Cloudflare R2', icon: Cloud },
  { value: 'b2', label: 'Backblaze B2', description: 'Bucket Backblaze B2', icon: Cloud },
  { value: 'vps', label: 'VPS', description: 'Servidor remoto com agente', icon: Server },
];

type Step = 'type' | 'config' | 'result';

export function AddNodeDialog({ open, onClose }: AddNodeDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [bucket, setBucket] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');

  const registerNode = useRegisterNode();

  if (!open) return null;

  const isCloudType = selectedType === 's3' || selectedType === 'r2' || selectedType === 'b2';

  function reset() {
    setStep('type');
    setSelectedType(null);
    setName('');
    setEndpoint('');
    setBucket('');
    setAccessKey('');
    setSecretKey('');
    setRegion('');
    setError('');
    registerNode.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setError('');

    const data: RegisterNodeRequest = { name, type: selectedType };
    if (endpoint) data.endpoint = endpoint;
    if (bucket) data.bucket = bucket;
    if (accessKey) data.accessKey = accessKey;
    if (secretKey) data.secretKey = secretKey;
    if (region) data.region = region;

    try {
      await registerNode.mutateAsync(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar nó');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Adicionar Nó</h2>
          <button
            onClick={handleClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: Select type */}
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Selecione o tipo de nó de armazenamento:
              </p>
              <div className="space-y-2">
                {NODE_TYPES.map((nt) => {
                  const Icon = nt.icon;
                  return (
                    <button
                      key={nt.value}
                      onClick={() => {
                        setSelectedType(nt.value);
                        setStep('config');
                      }}
                      className="w-full flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius)] hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition-colors text-left"
                    >
                      <Icon size={20} className="text-[var(--muted-foreground)] flex-shrink-0" />
                      <div>
                        <div className="font-medium text-[var(--foreground)] text-sm">
                          {nt.label}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {nt.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 'config' && selectedType && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ← Voltar
              </button>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Nome do nó
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: NAS Casa, S3 Backup"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
                />
              </div>

              {selectedType === 'local' && (
                <div className="flex items-start gap-2 bg-[var(--secondary)] border border-[var(--border)] rounded-[var(--radius)] p-3 text-sm text-[var(--muted-foreground)]">
                  <HardDrive size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Os arquivos serão armazenados neste dispositivo. Nenhuma configuração adicional
                    necessária.
                  </span>
                </div>
              )}

              {(selectedType === 'vps' || selectedType === 'r2' || selectedType === 'b2') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Endpoint
                  </label>
                  <input
                    type="url"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    required
                    placeholder="https://192.168.1.100:8081"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
                  />
                </div>
              )}

              {isCloudType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Bucket
                    </label>
                    <input
                      type="text"
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                      required
                      placeholder="meu-bucket-alexandria"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Access Key
                    </label>
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Região {selectedType !== 'r2' ? '(obrigatória)' : '(opcional)'}
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required={selectedType !== 'r2'}
                      placeholder={selectedType === 'r2' ? 'auto' : 'us-east-1'}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--radius)] p-3 text-sm text-[var(--destructive)]">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={registerNode.isPending}
                className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
              >
                {registerNode.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Registrando...
                  </span>
                ) : (
                  'Registrar nó'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Result */}
          {step === 'result' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 size={48} className="mx-auto text-[var(--success)]" />
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Nó registrado</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  O nó &ldquo;{name}&rdquo; foi adicionado ao cluster. O primeiro heartbeat deve
                  chegar em instantes.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
