import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle2, AlertCircle, Server, Shield, Key, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiConfig, saveApiConfig } from '@/lib/storage';
import { validateUrl, sanitizeInput } from '@/lib/validation';
import { ApiConfig } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ToolConfigCardProps {
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  config: { baseUrl: string; apiKey?: string; apiToken?: string };
  onBaseUrlChange: (value: string) => void;
  onKeyChange: (value: string) => void;
  keyLabel: string;
  keyPlaceholder: string;
  isConfigured: boolean;
}

function ToolConfigCard({
  title,
  description,
  color,
  icon,
  config,
  onBaseUrlChange,
  onKeyChange,
  keyLabel,
  keyPlaceholder,
  isConfigured,
}: ToolConfigCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>();

  const handleUrlChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    const validation = validateUrl(sanitized);
    setUrlError(validation.message);
    onBaseUrlChange(sanitized);
  };

  const keyValue = config.apiKey ?? config.apiToken ?? '';

  return (
    <div className={cn(
      'rounded-xl border bg-card p-6 transition-all animate-fade-in',
      isConfigured ? 'border-success/30' : 'border-border'
    )}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isConfigured ? (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Configurado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Não configurado</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${title}-url`}>API Base URL</Label>
          <Input
            id={`${title}-url`}
            placeholder="https://api.example.com"
            value={config.baseUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={cn(urlError && 'border-destructive')}
          />
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${title}-key`}>{keyLabel}</Label>
          <div className="relative">
            <Input
              id={`${title}-key`}
              type={showKey ? 'text' : 'password'}
              placeholder={keyPlaceholder}
              value={keyValue}
              onChange={(e) => onKeyChange(sanitizeInput(e.target.value))}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApiConfigPage() {
  const [config, setConfig] = useState<ApiConfig>({
    vicarius: { baseUrl: '', apiKey: '' },
    cortex: { baseUrl: '', apiToken: '' },
    warp: { baseUrl: '', apiToken: '' },
    pam: { baseUrl: '', apiToken: '' },
    jumpcloud: { baseUrl: '', apiToken: '' },
  });
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const saved = getApiConfig();
    setConfig(saved);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    const urls = [
      config.vicarius.baseUrl,
      config.cortex.baseUrl,
      config.warp.baseUrl,
      config.pam.baseUrl,
      config.jumpcloud.baseUrl,
    ];
    for (const url of urls) {
      if (url) {
        const validation = validateUrl(url);
        if (!validation.valid) {
          toast({
            title: 'Erro de validação',
            description: validation.message,
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    saveApiConfig(config);
    setIsSaving(false);

    toast({
      title: 'Configurações salvas',
      description: 'As configurações das APIs foram atualizadas com sucesso',
    });
  };

  const isVicariusConfigured = !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  const isCortexConfigured = !!(config.cortex.baseUrl && config.cortex.apiToken);
  const isWarpConfigured = !!(config.warp.baseUrl && config.warp.apiToken);
  const isPamConfigured = !!(config.pam.baseUrl && config.pam.apiToken);
  const isJumpcloudConfigured = !!(config.jumpcloud.baseUrl && config.jumpcloud.apiToken);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurar APIs</h1>
            <p className="text-muted-foreground">
              Configure as credenciais para conectar às 5 ferramentas de segurança
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">
            <strong>Nota:</strong> Enquanto as APIs não estiverem configuradas, o sistema utilizará
            dados mockados para demonstração. Configure as credenciais abaixo para conectar às APIs reais.
          </p>
        </div>

        {/* Config Cards - Row 1 */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <ToolConfigCard
            title="Vicarius"
            description="Gerenciamento de vulnerabilidades"
            color="bg-primary"
            icon={<Server className="h-5 w-5 text-primary-foreground" />}
            config={config.vicarius}
            onBaseUrlChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                vicarius: { ...prev.vicarius, baseUrl: value },
              }))
            }
            onKeyChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                vicarius: { ...prev.vicarius, apiKey: value },
              }))
            }
            keyLabel="API Key"
            keyPlaceholder="vic_api_xxxxx..."
            isConfigured={isVicariusConfigured}
          />

          <ToolConfigCard
            title="Cortex"
            description="Plataforma de segurança XDR"
            color="bg-warning"
            icon={<Shield className="h-5 w-5 text-warning-foreground" />}
            config={config.cortex}
            onBaseUrlChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                cortex: { ...prev.cortex, baseUrl: value },
              }))
            }
            onKeyChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                cortex: { ...prev.cortex, apiToken: value },
              }))
            }
            keyLabel="API Token"
            keyPlaceholder="ctx_token_xxxxx..."
            isConfigured={isCortexConfigured}
          />

          <ToolConfigCard
            title="Warp"
            description="Cloudflare Zero Trust"
            color="bg-purple-500"
            icon={<Server className="h-5 w-5 text-white" />}
            config={config.warp}
            onBaseUrlChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                warp: { ...prev.warp, baseUrl: value },
              }))
            }
            onKeyChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                warp: { ...prev.warp, apiToken: value },
              }))
            }
            keyLabel="API Token"
            keyPlaceholder="warp_xxxxx..."
            isConfigured={isWarpConfigured}
          />
        </div>

        {/* Config Cards - Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ToolConfigCard
            title="PAM (Senha Segura)"
            description="Gerenciamento de acesso privilegiado"
            color="bg-destructive"
            icon={<Key className="h-5 w-5 text-destructive-foreground" />}
            config={config.pam}
            onBaseUrlChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                pam: { ...prev.pam, baseUrl: value },
              }))
            }
            onKeyChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                pam: { ...prev.pam, apiToken: value },
              }))
            }
            keyLabel="API Token / Key"
            keyPlaceholder="pam_xxxxx..."
            isConfigured={isPamConfigured}
          />

          <ToolConfigCard
            title="JumpCloud"
            description="Diretório / Device Management"
            color="bg-blue-500"
            icon={<Users className="h-5 w-5 text-white" />}
            config={config.jumpcloud}
            onBaseUrlChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                jumpcloud: { ...prev.jumpcloud, baseUrl: value },
              }))
            }
            onKeyChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                jumpcloud: { ...prev.jumpcloud, apiToken: value },
              }))
            }
            keyLabel="API Token"
            keyPlaceholder="jc_xxxxx..."
            isConfigured={isJumpcloudConfigured}
          />
        </div>
      </div>
    </MainLayout>
  );
}
