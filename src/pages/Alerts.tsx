import { forwardRef, useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, Trash2, Bell, UserX, ShieldAlert } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { getAlerts, clearAlerts, getOffboardingAlerts } from '@/lib/storage';
import { Alert, OffboardingAlert } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OffboardingAlertCard } from '@/components/offboarding/OffboardingAlertCard';
import { OffboardingDetailModal } from '@/components/offboarding/OffboardingDetailModal';
import { StatCard } from '@/components/dashboard/StatCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const alertIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const alertStyles = {
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: 'text-primary',
    badge: 'bg-primary/20 text-primary',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: 'text-warning',
    badge: 'bg-warning/20 text-warning',
  },
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: 'text-destructive',
    badge: 'bg-destructive/20 text-destructive',
  },
};

const typeLabels = {
  info: 'INFORMATIVO',
  warning: 'ATENÇÃO',
  error: 'CRÍTICO',
};

const AlertsPage = forwardRef<HTMLDivElement>((_, ref) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [offboardingAlerts, setOffboardingAlerts] = useState<OffboardingAlert[]>([]);
  const [selectedOffboarding, setSelectedOffboarding] = useState<OffboardingAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const loadAlerts = async () => {
    const sAlerts = await getAlerts();
    setAlerts(sAlerts);
    setOffboardingAlerts(getOffboardingAlerts());
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleClearAlerts = async () => {
    await clearAlerts();
    setAlerts([]);
    toast({
      title: 'Alertas limpos',
      description: 'Todos os alertas foram removidos',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const alertCounts = {
    info: alerts.filter((a) => a.type === 'info').length,
    warning: alerts.filter((a) => a.type === 'warning').length,
    error: alerts.filter((a) => a.type === 'error').length,
    offboarding: offboardingAlerts.filter(a => a.status !== 'completed').length
  };

  return (
    <MainLayout ref={ref}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground">
              Divergências e notificações do sistema
            </p>
          </div>
          {alerts.length > 0 && (
            <Button variant="outline" onClick={handleClearAlerts}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar alertas
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-4">
          <StatCard
            title="Informativos"
            value={alertCounts.info}
            icon={<Info className="h-4 w-4" />}
          />
          <StatCard
            title="Atenção"
            value={alertCounts.warning}
            icon={<AlertTriangle className="h-4 w-4" />}
            variant={alertCounts.warning > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Críticos"
            value={alertCounts.error}
            icon={<AlertCircle className="h-4 w-4" />}
            variant={alertCounts.error > 0 ? 'error' : 'default'}
          />
          <StatCard
            title="Offboardings"
            value={alertCounts.offboarding}
            subtitle="Pendentes TI"
            icon={<ShieldAlert className="h-4 w-4" />}
            variant={alertCounts.offboarding > 0 ? 'warning' : 'default'}
          />
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="system">Alertas do Sistema ({alerts.length})</TabsTrigger>
            <TabsTrigger value="offboarding">Offboarding TI Corp ({offboardingAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-0">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="mb-4 h-10 w-10 text-muted-foreground/20" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Log de alertas limpo</h3>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Nenhuma divergência detectada nas fontes sincronizadas
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map((alert) => {
                    const Icon = alertIcons[alert.type];
                    const styles = alertStyles[alert.type];
                    return (
                      <div
                        key={alert.id}
                        className="group flex items-start gap-5 p-5 transition-colors hover:bg-muted/30 animate-fade-in"
                      >
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent',
                            styles.icon
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={cn('text-[10px] font-bold uppercase tracking-widest', styles.icon)}>
                              {typeLabels[alert.type]}
                            </span>
                            {alert.source && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {alert.source}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">
                              {formatTimestamp(alert.timestamp)}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-foreground tracking-tight">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="offboarding" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {offboardingAlerts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card">
                  <UserX className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium text-foreground">Nenhum offboarding pendente</h3>
                  <p className="text-sm text-muted-foreground">
                    Novos alertas serão gerados automaticamente ao cadastrar desligados
                  </p>
                </div>
              ) : (
                offboardingAlerts.map((oAlert) => (
                  <OffboardingAlertCard
                    key={oAlert.id}
                    alert={oAlert}
                    onClick={() => {
                      setSelectedOffboarding(oAlert);
                      setIsModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <OffboardingDetailModal
          alert={selectedOffboarding}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={loadAlerts}
        />
      </div>
    </MainLayout>
  );
});

AlertsPage.displayName = 'AlertsPage';

export default AlertsPage;
