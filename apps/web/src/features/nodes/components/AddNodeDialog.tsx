'use client';

import { AlertCircle, CheckCircle2, Cloud, HardDrive, Loader2, Server, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRegisterNode, useStartNodeOAuth } from '../hooks/useNodeMutations';
import type { NodeType, OAuthNodeProvider, RegisterNodeRequest } from '../types/node.types';

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'type' | 'config' | 'result';

const NODE_TYPES: {
  value: NodeType;
  label: string;
  description: string;
  icon: typeof HardDrive;
  mode: 'manual' | 'oauth';
}[] = [
  {
    value: 'local',
    label: 'Local',
    description: 'Dispositivo local (PC, NAS)',
    icon: HardDrive,
    mode: 'manual',
  },
  { value: 's3', label: 'AWS S3', description: 'Bucket Amazon S3', icon: Cloud, mode: 'manual' },
  {
    value: 'r2',
    label: 'Cloudflare R2',
    description: 'Bucket Cloudflare R2',
    icon: Cloud,
    mode: 'manual',
  },
  {
    value: 'b2',
    label: 'Backblaze B2',
    description: 'Bucket Backblaze B2',
    icon: Cloud,
    mode: 'manual',
  },
  {
    value: 'vps',
    label: 'VPS',
    description: 'Servidor remoto com agente',
    icon: Server,
    mode: 'manual',
  },
  {
    value: 'google_drive',
    label: 'Google Drive',
    description: 'Conta Google Drive via OAuth',
    icon: Cloud,
    mode: 'oauth',
  },
  {
    value: 'onedrive',
    label: 'OneDrive',
    description: 'Conta Microsoft OneDrive via OAuth',
    icon: Cloud,
    mode: 'oauth',
  },
  {
    value: 'dropbox',
    label: 'Dropbox',
    description: 'Conta Dropbox via OAuth',
    icon: Cloud,
    mode: 'oauth',
  },
];

function waitForOAuthMessage(popup: Window | null): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.clearInterval(timerId);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'alexandria:oauth-node') {
        return;
      }

      cleanup();
      if (event.data.status === 'success') {
        resolve(event.data.payload);
      } else {
        reject(new Error(event.data.payload?.message ?? 'Falha ao conectar conta cloud'));
      }
    };

    const timerId = window.setInterval(() => {
      if (popup?.closed) {
        cleanup();
        reject(new Error('A janela de autorizacao foi fechada antes da conclusao.'));
      }
    }, 500);

    window.addEventListener('message', handleMessage);
  });
}

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
  const startNodeOAuth = useStartNodeOAuth();

  const selectedConfig = useMemo(
    () => NODE_TYPES.find((nodeType) => nodeType.value === selectedType) ?? null,
    [selectedType],
  );

  const isCloudType = selectedType === 's3' || selectedType === 'r2' || selectedType === 'b2';
  const isOAuthType = selectedConfig?.mode === 'oauth';

  useEffect(() => {
    if (!open) {
      setStep('type');
    }
  }, [open]);

  if (!open) return null;

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
    startNodeOAuth.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType) return;
    setError('');

    try {
      if (isOAuthType) {
        const oauthProvider = selectedType as OAuthNodeProvider;
        const { authorizationUrl } = await startNodeOAuth.mutateAsync({
          provider: oauthProvider,
          nodeName: name,
        });

        const popup = window.open(
          authorizationUrl,
          'oauth-node-provider',
          'width=560,height=720,menubar=no,toolbar=no,status=no',
        );
        if (!popup) {
          throw new Error(
            'Nao foi possivel abrir a janela de autorizacao. Verifique o bloqueador de pop-up.',
          );
        }

        await waitForOAuthMessage(popup);
        setStep('result');
        return;
      }

      const data: RegisterNodeRequest = { name, type: selectedType };
      if (endpoint) data.endpoint = endpoint;
      if (bucket) data.bucket = bucket;
      if (accessKey) data.accessKey = accessKey;
      if (secretKey) data.secretKey = secretKey;
      if (region) data.region = region;

      await registerNode.mutateAsync(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar no');
    }
  }

  const isSubmitting = registerNode.isPending || startNodeOAuth.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Adicionar No</h2>
          <button
            aria-label="Fechar dialogo"
            onClick={handleClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Selecione o tipo de no de armazenamento:
              </p>
              <div className="space-y-2">
                {NODE_TYPES.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.value}
                      type="button"
                      onClick={() => {
                        setSelectedType(nodeType.value);
                        setStep('config');
                      }}
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] p-3 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0 text-[var(--muted-foreground)]" />
                        <div>
                          <div className="text-sm font-medium text-[var(--foreground)]">
                            {nodeType.label}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {nodeType.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                <label
                  htmlFor="node-name"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  Nome do no
                </label>
                <input
                  id="node-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: NAS Casa, Drive da Familia"
                  className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              {selectedType === 'local' && (
                <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm text-[var(--muted-foreground)]">
                  <HardDrive size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Os arquivos serao armazenados neste dispositivo. Nenhuma configuracao adicional
                    necessaria.
                  </span>
                </div>
              )}

              {(selectedType === 'vps' || selectedType === 'r2' || selectedType === 'b2') && (
                <div>
                  <label
                    htmlFor="node-endpoint"
                    className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                  >
                    Endpoint
                  </label>
                  <input
                    id="node-endpoint"
                    type="url"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    required
                    placeholder="https://192.168.1.100:8081"
                    className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              )}

              {isCloudType && (
                <>
                  <div>
                    <label
                      htmlFor="node-bucket"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Bucket
                    </label>
                    <input
                      id="node-bucket"
                      type="text"
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                      required
                      placeholder="meu-bucket-alexandria"
                      className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="node-access-key"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Access Key
                    </label>
                    <input
                      id="node-access-key"
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      required
                      className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="node-secret-key"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Secret Key
                    </label>
                    <input
                      id="node-secret-key"
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      required
                      className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="node-region"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Regiao {selectedType !== 'r2' ? '(obrigatoria)' : '(opcional)'}
                    </label>
                    <input
                      id="node-region"
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required={selectedType !== 'r2'}
                      placeholder={selectedType === 'r2' ? 'auto' : 'us-east-1'}
                      className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                </>
              )}

              {isOAuthType && (
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm text-[var(--muted-foreground)]">
                  Vamos abrir a autorizacao do provedor para conectar a conta cloud e registrar o no
                  automaticamente.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--destructive)] bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[var(--radius)] bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {isOAuthType ? 'Conectando conta...' : 'Registrando...'}
                  </span>
                ) : isOAuthType ? (
                  'Conectar conta'
                ) : (
                  'Registrar no'
                )}
              </button>
            </form>
          )}

          {step === 'result' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 size={48} className="mx-auto text-[var(--success)]" />
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">No registrado</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  O no &ldquo;{name}&rdquo; foi adicionado ao cluster. O primeiro heartbeat deve
                  chegar em instantes.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-[var(--radius)] bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
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
