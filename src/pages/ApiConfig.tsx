import { useState, useEffect } from 'react';
import { Server, Shield, Key, Users, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { IndividualToolCard } from '@/components/config/IndividualToolCard';
import { CsvUploadCard } from '@/components/config/CsvUploadCard';
import { getApiConfig, saveApiConfig, getCsvMetadata, CsvMetadata } from '@/lib/storage';
import { ApiConfig } from '@/types/inventory';

export default function ApiConfigPage() {
  const [config, setConfig] = useState<ApiConfig>({
    vicarius: { baseUrl: '', apiKey: '' },
    cortex: { baseUrl: '', apiToken: '' },
    warp: { baseUrl: '', apiToken: '' },
    pam: { baseUrl: '', apiToken: '' },
    jumpcloud: { baseUrl: '', apiToken: '' },
  });

  const [csvMetadata, setCsvMetadata] = useState<Record<string, CsvMetadata | null>>({
    vicarius: null,
    cortex: null,
    warp: null,
    pam: null,
    jumpcloud: null,
  });

  const refreshMetadata = () => {
    setCsvMetadata(getCsvMetadata());
  };

  useEffect(() => {
    const saved = getApiConfig();
    setConfig(saved);
    refreshMetadata();
  }, []);

  const createSaveHandler = (tool: keyof ApiConfig, keyType: 'apiKey' | 'apiToken') => {
    return async (baseUrl: string, key: string) => {
      const updated = {
        ...config,
        [tool]: { baseUrl, [keyType]: key },
      };
      setConfig(updated);
      saveApiConfig(updated);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
    };
  };

  const isVicariusConfigured = !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  const isCortexConfigured = !!(config.cortex.baseUrl && config.cortex.apiToken);
  const isWarpConfigured = !!(config.warp.baseUrl && config.warp.apiToken);
  const isPamConfigured = !!(config.pam.baseUrl && config.pam.apiToken);
  const isJumpcloudConfigured = !!(config.jumpcloud.baseUrl && config.jumpcloud.apiToken);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurar APIs</h1>
          <p className="text-muted-foreground text-lg">
            Configure as credenciais para conectar às 5 ferramentas de segurança
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-10 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                Sobre o modo de demonstração
              </p>
              <p className="text-sm text-muted-foreground">
                Enquanto as APIs não estiverem configuradas, o sistema utilizará dados mockados para
                demonstração. Configure as credenciais abaixo para conectar às APIs reais. Cada ferramenta pode ser
                configurada individualmente.
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration Cards */}
        <div className="mb-16">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Ferramentas de Segurança</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Salvar Alterações" em cada card após preencher os dados
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <IndividualToolCard
              title="Vicarius"
              description="Gerenciamento de vulnerabilidades"
              color="bg-primary"
              icon={<Server className="h-6 w-6 text-primary-foreground" />}
              config={config.vicarius}
              onSave={createSaveHandler('vicarius', 'apiKey')}
              keyLabel="API Key"
              keyPlaceholder="vic_api_xxxxx..."
              isConfigured={isVicariusConfigured}
            />

            <IndividualToolCard
              title="Cortex"
              description="Plataforma de segurança XDR"
              color="bg-warning"
              icon={<Shield className="h-6 w-6 text-warning-foreground" />}
              config={config.cortex}
              onSave={createSaveHandler('cortex', 'apiToken')}
              keyLabel="API Token"
              keyPlaceholder="ctx_token_xxxxx..."
              isConfigured={isCortexConfigured}
            />

            <IndividualToolCard
              title="Warp"
              description="Inventário + Zero Trust"
              color="bg-purple-500"
              icon={<Server className="h-6 w-6 text-white" />}
              config={config.warp}
              onSave={createSaveHandler('warp', 'apiToken')}
              keyLabel="API Token"
              keyPlaceholder="warp_xxxxx..."
              isConfigured={isWarpConfigured}
            />

            <IndividualToolCard
              title="PAM (Senha Segura)"
              description="Gerenciamento de acesso privilegiado"
              color="bg-destructive"
              icon={<Key className="h-6 w-6 text-destructive-foreground" />}
              config={config.pam}
              onSave={createSaveHandler('pam', 'apiToken')}
              keyLabel="API Token"
              keyPlaceholder="pam_xxxxx..."
              isConfigured={isPamConfigured}
            />

            <IndividualToolCard
              title="JumpCloud"
              description="Diretório / Device Management"
              color="bg-blue-500"
              icon={<Users className="h-6 w-6 text-white" />}
              config={config.jumpcloud}
              onSave={createSaveHandler('jumpcloud', 'apiToken')}
              keyLabel="API Token"
              keyPlaceholder="jc_xxxxx..."
              isConfigured={isJumpcloudConfigured}
            />
          </div>
        </div>

        {/* CSV Import Section */}
        <div className="border-t-2 border-border pt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Importação Manual via CSV</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Utilize arquivos CSV para carregar inventários quando a API não estiver disponível.
              O arquivo deve conter a coluna:{' '}
              <code className="px-2 py-1 rounded-md bg-muted text-xs font-mono font-semibold">
                hostname
              </code>
              {' '}(obrigatória). As colunas{' '}
              <code className="px-2 py-1 rounded-md bg-muted text-xs font-mono font-semibold">ip</code> e{' '}
              <code className="px-2 py-1 rounded-md bg-muted text-xs font-mono font-semibold">uuid</code>
              {' '}são opcionais (valores padrão serão gerados).
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CsvUploadCard
              tool="vicarius"
              title="Vicarius"
              color="bg-primary"
              icon={<Server className="h-5 w-5 text-primary-foreground" />}
              metadata={csvMetadata.vicarius}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="cortex"
              title="Cortex"
              color="bg-warning"
              icon={<Shield className="h-5 w-5 text-warning-foreground" />}
              metadata={csvMetadata.cortex}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="warp"
              title="Warp"
              color="bg-purple-500"
              icon={<Server className="h-5 w-5 text-white" />}
              metadata={csvMetadata.warp}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="pam"
              title="PAM (Senha Segura)"
              color="bg-destructive"
              icon={<Key className="h-5 w-5 text-destructive-foreground" />}
              metadata={csvMetadata.pam}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="jumpcloud"
              title="JumpCloud"
              color="bg-blue-500"
              icon={<Users className="h-5 w-5 text-white" />}
              metadata={csvMetadata.jumpcloud}
              onUpdate={refreshMetadata}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
