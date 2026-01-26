import { useState, useEffect, useCallback } from 'react';
import { Server, AlertTriangle, CheckCircle2, Clock, UserX, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SyncButton } from '@/components/dashboard/SyncButton';
import { EndpointChart } from '@/components/dashboard/EndpointChart';
import { ComparisonTable } from '@/components/dashboard/ComparisonTable';
import { AlertsPreview } from '@/components/dashboard/AlertsPreview';
import {
  fetchVicariusEndpoints,
  fetchCortexEndpoints,
  fetchWarpEndpoints,
  fetchPamEndpoints,
  fetchJumpcloudEndpoints,
  compareInventories,
  generateAlerts,
} from '@/lib/inventory';
import { addSyncLog, getAlerts, saveAlerts, setLastSync, getLastSync, getTerminatedEmployees } from '@/lib/storage';
import { ComparisonResult, SyncStatus, Alert, SyncLog } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSync: getLastSync(),
    status: 'idle',
  });
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [endpointCounts, setEndpointCounts] = useState({
    vicarius: 0,
    cortex: 0,
    warp: 0,
    pam: 0,
    jumpcloud: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    const savedAlerts = getAlerts();
    setAlerts(savedAlerts);
  }, []);

  const handleSync = useCallback(async () => {
    setSyncStatus({ isLoading: true, lastSync: syncStatus.lastSync, status: 'syncing' });

    try {
      const terminatedEmployees = getTerminatedEmployees();

      const [vicariusData, cortexData, warpData, pamData, jumpcloudData] = await Promise.all([
        fetchVicariusEndpoints(),
        fetchCortexEndpoints(),
        fetchWarpEndpoints(),
        fetchPamEndpoints(),
        fetchJumpcloudEndpoints(),
      ]);

      setEndpointCounts({
        vicarius: vicariusData.length,
        cortex: cortexData.length,
        warp: warpData.length,
        pam: pamData.length,
        jumpcloud: jumpcloudData.length,
      });

      const result = compareInventories(
        vicariusData,
        cortexData,
        warpData,
        pamData,
        jumpcloudData,
        terminatedEmployees
      );
      setComparison(result);

      const newAlerts = generateAlerts(result);
      setAlerts(newAlerts);
      saveAlerts(newAlerts);

      const timestamp = new Date().toISOString();
      const log: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp,
        status: 'success',
        message: 'Sincronização concluída com sucesso',
        endpointCounts: {
          vicarius: vicariusData.length,
          cortex: cortexData.length,
          warp: warpData.length,
          pam: pamData.length,
          jumpcloud: jumpcloudData.length,
        },
      };
      addSyncLog(log);
      setLastSync(timestamp);

      setSyncStatus({
        isLoading: false,
        lastSync: timestamp,
        status: 'success',
      });

      toast({
        title: 'Sincronização concluída',
        description: `${result.allEndpoints.length} endpoints processados de 5 fontes`,
      });

      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, status: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error('Sync error:', error);

      const timestamp = new Date().toISOString();
      const log: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp,
        status: 'error',
        message: 'Erro durante sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      };
      addSyncLog(log);

      setSyncStatus({
        isLoading: false,
        lastSync: syncStatus.lastSync,
        status: 'error',
        message: 'Erro ao sincronizar',
      });

      toast({
        title: 'Erro na sincronização',
        description: 'Verifique as configurações das APIs',
        variant: 'destructive',
      });
    }
  }, [syncStatus.lastSync, toast]);

  useEffect(() => {
    if (!comparison) {
      handleSync();
    }
  }, []);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca sincronizado';
    try {
      return format(new Date(timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const divergencesCount =
    (comparison?.missingFromVicarius.length || 0) +
    (comparison?.missingFromCortex.length || 0) +
    (comparison?.missingFromWarp.length || 0) +
    (comparison?.missingFromPam.length || 0) +
    (comparison?.missingFromJumpcloud.length || 0);

  const terminatedRiskCount = comparison?.terminatedWithActiveEndpoints.length || 0;
  const terminatedInSystemsCount = 
    (comparison?.terminatedInJumpcloud.length || 0) + 
    (comparison?.terminatedInPam.length || 0);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Comparação de inventário entre 5 ferramentas de segurança
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Última sincronização</p>
              <p className="font-medium text-foreground">{formatLastSync(syncStatus.lastSync)}</p>
            </div>
            <SyncButton syncStatus={syncStatus} onSync={handleSync} />
          </div>
        </div>

        {/* Risk Alert Banner */}
        {terminatedRiskCount > 0 && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  ⚠️ Alerta de Segurança: {terminatedRiskCount} endpoint(s) de colaboradores desligados detectado(s)
                </p>
                <p className="text-sm text-destructive/80">
                  Verifique a página de Alertas para mais detalhes e tome as ações necessárias
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total de Endpoints"
            value={comparison?.allEndpoints.length || 0}
            subtitle="Em todas as fontes"
            icon={<Server className="h-5 w-5" />}
          />
          <StatCard
            title="Divergências"
            value={divergencesCount}
            subtitle="Endpoints com diferenças"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant={divergencesCount > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Sincronizados"
            value={comparison?.inAllSources.length || 0}
            subtitle="Presentes em todas as fontes"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Risco Desligados"
            value={terminatedRiskCount + terminatedInSystemsCount}
            subtitle="Endpoints ou acessos ativos"
            icon={<UserX className="h-5 w-5" />}
            variant={terminatedRiskCount > 0 ? 'error' : 'default'}
          />
          <StatCard
            title="Status"
            value={syncStatus.status === 'syncing' ? 'Sincronizando' : 'Pronto'}
            subtitle="5 fontes monitoradas"
            icon={<Shield className="h-5 w-5" />}
          />
        </div>

        {/* Charts and Alerts Row */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <EndpointChart
            vicariusCount={endpointCounts.vicarius}
            cortexCount={endpointCounts.cortex}
            warpCount={endpointCounts.warp}
            pamCount={endpointCounts.pam}
            jumpcloudCount={endpointCounts.jumpcloud}
          />
          <AlertsPreview alerts={alerts} />
        </div>

        {/* Comparison Table */}
        {comparison && (
          <ComparisonTable endpoints={comparison.allEndpoints} title="Inventário Consolidado" />
        )}
      </div>
    </MainLayout>
  );
}
