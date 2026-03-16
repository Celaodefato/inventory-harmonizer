import { useState, useEffect } from 'react';
import { Server, Shield, Key, Users, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { IndividualToolCard } from '@/components/config/IndividualToolCard';
import { CsvUploadCard } from '@/components/config/CsvUploadCard';
import { getApiConfig, saveApiConfig, getCsvMetadata, CsvMetadata } from '@/lib/storage';
import { ApiConfig } from '@/types/inventory';
import { supabase } from '@/lib/supabase';

export default function ApiConfigPage() {
  const [config, setConfig] = useState<ApiConfig>({
    vicarius: { baseUrl: '', apiKey: '' },
    cortex: { baseUrl: '', apiToken: '' },
    warp: { baseUrl: '', apiToken: '' },
    pam: { baseUrl: '', apiToken: '' },
    jumpcloud: { baseUrl: '', apiToken: '' },
    gcp: { baseUrl: '', apiToken: '' },
    huawei: { baseUrl: '', apiToken: '' },
  });

  const [csvMetadata, setCsvMetadata] = useState<Record<string, CsvMetadata | null>>({
    vicarius: null,
    cortex: null,
    warp: null,
    pam: null,
    jumpcloud: null,
    gcp: null,
    huawei: null,
  });

  const refreshMetadata = async () => {
    const meta = await getCsvMetadata();
    setCsvMetadata(meta);
  };

  useEffect(() => {
    const loadData = async () => {
      const saved = await getApiConfig();
      setConfig(saved);
      await refreshMetadata();
    };
    loadData();

    // Subscribe to inventory changes to refresh metadata
    const channel = supabase
      .channel('api-config-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_data' },
        () => {
          refreshMetadata();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createSaveHandler = (tool: keyof ApiConfig, keyType: 'apiKey' | 'apiToken') => {
    return async (baseUrl: string, key: string) => {
      const updated = {
        ...config,
        [tool]: { baseUrl, [keyType]: key },
      };
      setConfig(updated);
      await saveApiConfig(updated);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
    };
  };

  const isVicariusConfigured = !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  const isCortexConfigured = !!(config.cortex.baseUrl && config.cortex.apiToken);
  const isWarpConfigured = !!(config.warp.baseUrl && config.warp.apiToken);
  const isPamConfigured = !!(config.pam.baseUrl && config.pam.apiToken);
  const isJumpcloudConfigured = !!(config.jumpcloud.baseUrl && config.jumpcloud.apiToken);
  const isGcpConfigured = !!(config.gcp.baseUrl && config.gcp.apiToken);
  const isHuaweiConfigured = !!(config.huawei.baseUrl && config.huawei.apiToken);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurar APIs</h1>
          <p className="text-muted-foreground text-lg">
            Configure as credenciais para conectar às 7 ferramentas de segurança
          </p>
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

            <IndividualToolCard
              title="Google Cloud (GCP)"
              description="Infraestrutura e Compute Engine"
              color="bg-blue-600"
              icon={<Server className="h-6 w-6 text-white" />}
              config={config.gcp}
              onSave={createSaveHandler('gcp', 'apiToken')}
              keyLabel="API Key / Token"
              keyPlaceholder="gcp_xxxxx..."
              isConfigured={isGcpConfigured}
            />

            <IndividualToolCard
              title="Huawei Cloud"
              description="Infraestrutura de Nuvem Huawei"
              color="bg-red-600"
              icon={<Server className="h-6 w-6 text-white" />}
              config={config.huawei}
              onSave={createSaveHandler('huawei', 'apiToken')}
              keyLabel="Access Key / Token"
              keyPlaceholder="hw_xxxxx..."
              isConfigured={isHuaweiConfigured}
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
              title="JumpCloud (Devices)"
              color="bg-blue-500"
              icon={<Server className="h-5 w-5 text-white" />}
              metadata={csvMetadata.jumpcloud}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="jumpcloud_users"
              title="JumpCloud (Users)"
              color="bg-blue-400"
              icon={<Users className="h-5 w-5 text-white" />}
              metadata={csvMetadata.jumpcloud_users}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="gcp"
              title="Google Cloud (GCP)"
              color="bg-blue-600"
              icon={<Server className="h-5 w-5 text-white" />}
              metadata={csvMetadata.gcp}
              onUpdate={refreshMetadata}
            />
            <CsvUploadCard
              tool="huawei"
              title="Huawei Cloud"
              color="bg-red-600"
              icon={<Server className="h-5 w-5 text-white" />}
              metadata={csvMetadata.huawei}
              onUpdate={refreshMetadata}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
