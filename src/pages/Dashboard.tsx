import { useState, useEffect, useCallback } from 'react';
import { Server, AlertTriangle, CheckCircle2, Clock, UserX, Shield, ShieldAlert } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SyncButton } from '@/components/dashboard/SyncButton';
import { EndpointChart } from '@/components/dashboard/EndpointChart';
import { ComparisonTable } from '@/components/dashboard/ComparisonTable';
import { AlertsPreview } from '@/components/dashboard/AlertsPreview';
import { ComplianceModal } from '@/components/dashboard/ComplianceModal';
import { Button } from '@/components/ui/button';
import {
  fetchVicariusEndpoints,
  fetchCortexEndpoints,
  fetchWarpEndpoints,
  fetchPamEndpoints,
  fetchJumpcloudEndpoints,
  compareInventories,
  generateAlerts,
} from '@/lib/inventory';
import {
  getLastSync,
  setLastSync,
  getAlerts,
  saveAlerts,
  clearAlerts,
  getOffboardingAlerts,
  getTerminatedEmployees,
  cleanupOrphanedOffboardingAlerts,
  addSyncLog
} from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { ComparisonResult, SyncStatus, Alert, SyncLog, OffboardingAlert } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSync: null,
    status: 'idle',
  });
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [offboardingAlerts, setOffboardingAlerts] = useState<OffboardingAlert[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [endpointCounts, setEndpointCounts] = useState({
    vicarius: 0,
    cortex: 0,
    warp: 0,
    pam: 0,
    jumpcloud: 0,
  });

  const { toast } = useToast();

  // Calculate non-compliance count based on new hostname-aware logic
  const nonComplianceCount = comparison?.nonCompliant.length || 0;

  useEffect(() => {
    const loadData = async () => {
      await cleanupOrphanedOffboardingAlerts();
      const savedAlerts = await getAlerts();
      setAlerts(savedAlerts);
      const savedOffboarding = await getOffboardingAlerts();
      setOffboardingAlerts(savedOffboarding);
      const lastSync = await getLastSync();
      setSyncStatus(prev => ({ ...prev, lastSync }));
    };
    loadData();

    // Realtime Subscriptions
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts((prev) => [payload.new as Alert, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            // Handle delete if needed, usually full refresh or filter
            getAlerts().then(setAlerts);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offboarding_alerts' },
        (payload) => {
          getOffboardingAlerts().then(setOffboardingAlerts);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sync_logs' },
        (payload) => {
          const newLog = payload.new as any;
          setSyncStatus(prev => ({ ...prev, lastSync: newLog.timestamp }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSync = useCallback(async () => {
    setSyncStatus({ isLoading: true, lastSync: syncStatus.lastSync, status: 'syncing' });

    try {
      const terminatedEmployees = await getTerminatedEmployees();

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

      // Sync endpoints with backend
      try {
        const { apiClient } = await import('@/lib/api');
        await apiClient.post('/endpoints/sync', {
          endpoints: result.allEndpoints.map(ep => ({
            hostname: ep.hostname,
            user: ep.userEmail,
            ip: ep.ip,
            lastSeen: ep.lastSeen,
            os: ep.os,
            inVicarius: ep.sources.includes('vicarius'),
            inCortex: ep.sources.includes('cortex'),
            inWarp: ep.sources.includes('warp'),
            inPam: ep.sources.includes('pam'),
            inJumpCloud: ep.sources.includes('jumpcloud'),
            isNonCompliant: result.nonCompliant.some(nc => nc.hostname === ep.hostname),
            isTerminated: result.terminatedWithActiveEndpoints.some(t => t.hostname === ep.hostname)
          }))
        });
      } catch (syncError) {
        console.warn('Failed to sync endpoints to backend', syncError);
      }

      const newAlerts = generateAlerts(result);
      setAlerts(newAlerts);
      await saveAlerts(newAlerts);

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
      await addSyncLog(log);
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
      await addSyncLog(log);

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

  const pendingOffboardingCount = offboardingAlerts.filter(a => a.status !== 'completed').length;

  return (
    <MainLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Monitoramento consolidado de ativos e conformidade de segurança
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-lg border border-border bg-card flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Última atualização</span>
              <span className="text-xs font-bold text-foreground">{formatLastSync(syncStatus.lastSync)}</span>
            </div>

            <div className="h-10 w-[1px] bg-border mx-2 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowComplianceModal(true)}
                variant="outline"
                size="sm"
                className={cn(
                  'h-10 border-destructive/20 bg-destructive/5 text-destructive font-bold hover:bg-destructive/10 transition-all',
                  nonComplianceCount > 0 && 'ring-2 ring-destructive/10 ring-offset-2 ring-offset-background'
                )}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {nonComplianceCount} NÃO CONFORMES
              </Button>

              <Button
                onClick={() => window.location.hash = '#/alerts?tab=offboarding'}
                variant="outline"
                size="sm"
                className={cn(
                  'h-10 border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-all',
                  pendingOffboardingCount > 0 && 'ring-2 ring-primary/10 ring-offset-2 ring-offset-background'
                )}
              >
                <UserX className="mr-2 h-4 w-4" />
                {pendingOffboardingCount} OFFBOARDINGS
              </Button>

              <SyncButton syncStatus={syncStatus} onSync={handleSync} />
            </div>
          </div>
        </div>

        {/* Technical Status Banner */}
        {terminatedRiskCount > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 animate-fade-in flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive tracking-tight uppercase">Riscos de Segurança Detectados</p>
              <p className="text-sm text-destructive/80 font-medium font-mono">Detectamos {terminatedRiskCount} endpoint(s) ativos vinculados a colaboradores desligados.</p>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive bg-transparent hover:bg-destructive/10 font-bold" onClick={() => window.location.hash = '#/alerts'}>
              REVISAR AGORA
            </Button>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="workstations">
              Workstations
              {comparison?.workstations && <Badge variant="secondary" className="ml-2 text-xs">{comparison.workstations.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="servers">
              Servidores
              {comparison?.servers && <Badge variant="secondary" className="ml-2 text-xs">{comparison.servers.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Primary Metrics Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Monitorado"
                value={comparison?.allEndpoints.length || 0}
                subtitle="Ativos únicos identificados"
                icon={<Server className="h-4 w-4" />}
              />
              <StatCard
                title="Sincronização Total"
                value={comparison?.inAllSources.length || 0}
                subtitle="Presentes em todas as bases"
                icon={<CheckCircle2 className="h-4 w-4" />}
                variant={comparison?.inAllSources.length && comparison.inAllSources.length > 0 ? 'success' : 'default'}
              />
              <StatCard
                title="Gaps de Inventário"
                value={divergencesCount}
                subtitle="Divergências entre ferramentas"
                icon={<AlertTriangle className="h-4 w-4" />}
                variant={divergencesCount > 0 ? 'warning' : 'default'}
              />
              <StatCard
                title="Saúde do Sistema"
                value={syncStatus.status === 'syncing' ? 'Sincronizando' : 'Pronto'}
                subtitle="Conexões com 5 APIs ativas"
                icon={<Shield className="h-4 w-4" />}
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
          </TabsContent>

          <TabsContent value="workstations" className="space-y-6 animate-fade-in">
            {comparison && (
              <ComparisonTable endpoints={comparison.workstations} title="Workstations (EXA-ARK/EXA-MAC)" />
            )}
          </TabsContent>

          <TabsContent value="servers" className="space-y-6 animate-fade-in">
            {comparison && (
              <ComparisonTable endpoints={comparison.servers} title="Servidores e Outros Devices" />
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* Compliance Modal */}
      {showComplianceModal && comparison && (
        <ComplianceModal
          endpoints={comparison.allEndpoints}
          onClose={() => setShowComplianceModal(false)}
        />
      )}
    </MainLayout>
  );
}
