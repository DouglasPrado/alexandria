'use client';

import { AlertCircle, CheckCircle2, Cloud, HardDrive, Loader2, Server, X, ArrowLeft } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(19, 27, 46, 0.4)' }}>
      <div
        className="w-full rounded-3xl shadow-2xl overflow-hidden"
        style={{
          maxWidth: step === 'type' ? '640px' : '480px',
          backgroundColor: 'var(--surface-container-lowest)',
          boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-extrabold font-display tracking-tight" style={{ color: 'var(--foreground)' }}>
              {step === 'type' ? 'Adicionar Nó' : step === 'config' ? selectedConfig?.label : 'Sucesso'}
            </h2>
            {step === 'type' && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Selecione o provedor de armazenamento
              </p>
            )}
          </div>
          <button
            aria-label="Fechar dialogo"
            onClick={handleClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1: Type selection — Grid 2 cols */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-3">
              {NODE_TYPES.map((nodeType) => {
                const Icon = nodeType.icon;
                const isOAuth = nodeType.mode === 'oauth';
                return (
                  <button
                    key={nodeType.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(nodeType.value);
                      setStep('config');
                    }}
                    className="p-5 rounded-2xl text-left transition-all group hover:shadow-md active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--surface-container-low)' }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                        style={{ backgroundColor: 'var(--surface-container-lowest)' }}
                      >
                        <Icon size={20} style={{ color: 'var(--primary-container)' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                            {nodeType.label}
                          </span>
                          {isOAuth && (
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'rgba(111, 251, 190, 0.2)', color: '#005236' }}
                            >
                              OAuth
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Config form */}
          {step === 'config' && selectedType && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="flex items-center gap-1.5 text-sm transition-colors mb-2"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <ArrowLeft size={14} />
                Voltar
              </button>

              <InputField
                id="node-name"
                label="Nome do nó"
                value={name}
                onChange={setName}
                required
                placeholder="Ex: NAS Casa, Drive da Familia"
              />

              {selectedType === 'local' && (
                <div
                  className="flex items-start gap-3 rounded-xl p-4 text-sm"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--muted-foreground)' }}
                >
                  <HardDrive size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Os arquivos serão armazenados neste dispositivo. Nenhuma configuração adicional necessária.
                  </span>
                </div>
              )}

              {(selectedType === 'vps' || selectedType === 'r2' || selectedType === 'b2') && (
                <InputField
                  id="node-endpoint"
                  label="Endpoint"
                  value={endpoint}
                  onChange={setEndpoint}
                  required
                  placeholder="https://192.168.1.100:8081"
                  type="url"
                />
              )}

              {isCloudType && (
                <>
                  <InputField id="node-bucket" label="Bucket" value={bucket} onChange={setBucket} required placeholder="meu-bucket-alexandria" />
                  <InputField id="node-access-key" label="Access Key" value={accessKey} onChange={setAccessKey} required mono />
                  <InputField id="node-secret-key" label="Secret Key" value={secretKey} onChange={setSecretKey} required mono type="password" />
                  <InputField
                    id="node-region"
                    label={`Região ${selectedType !== 'r2' ? '(obrigatória)' : '(opcional)'}`}
                    value={region}
                    onChange={setRegion}
                    required={selectedType !== 'r2'}
                    placeholder={selectedType === 'r2' ? 'auto' : 'us-east-1'}
                  />
                </>
              )}

              {isOAuthType && (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--muted-foreground)' }}
                >
                  Vamos abrir a autorização do provedor para conectar a conta cloud e registrar o nó automaticamente.
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl p-4 text-sm"
                  style={{ backgroundColor: 'rgba(186, 26, 26, 0.08)', color: 'var(--destructive)' }}
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--primary-container)' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {isOAuthType ? 'Conectando conta...' : 'Registrando...'}
                  </span>
                ) : isOAuthType ? (
                  'Conectar conta'
                ) : (
                  'Registrar nó'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Result */}
          {step === 'result' && (
            <div className="space-y-6 text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(111, 251, 190, 0.15)' }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold font-display" style={{ color: 'var(--foreground)' }}>
                  Nó registrado
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  O nó &ldquo;{name}&rdquo; foi adicionado ao cluster. O primeiro heartbeat deve chegar em instantes.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 hover:opacity-90"
                style={{ backgroundColor: 'var(--primary-container)' }}
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

function InputField({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
  mono,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-xl border-none px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${mono ? 'font-mono' : ''}`}
        style={{
          backgroundColor: 'var(--surface-container-low)',
          color: 'var(--foreground)',
          // @ts-expect-error CSS custom property
          '--tw-ring-color': 'var(--surface-tint)',
        }}
      />
    </div>
  );
}
