import { forwardRef, useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, Trash2, Bell } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { getAlerts, clearAlerts } from '@/lib/storage';
import { Alert } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  info: 'Informação',
  warning: 'Atenção',
  error: 'Crítico',
};

const AlertsPage = forwardRef<HTMLDivElement>((_, ref) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedAlerts = getAlerts();
    setAlerts(savedAlerts);
  }, []);

  const handleClearAlerts = () => {
    clearAlerts();
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
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alertCounts.info}</p>
                <p className="text-sm text-muted-foreground">Informativos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alertCounts.warning}</p>
                <p className="text-sm text-muted-foreground">Atenção</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alertCounts.error}</p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="rounded-xl border border-border bg-card">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground">Nenhum alerta</h3>
              <p className="text-sm text-muted-foreground">
                Sincronize os dados para verificar divergências
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
                    className={cn(
                      'flex items-start gap-4 p-4 transition-colors animate-fade-in',
                      styles.bg
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        styles.bg
                      )}
                    >
                      <Icon className={cn('h-5 w-5', styles.icon)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            styles.badge
                          )}
                        >
                          {typeLabels[alert.type]}
                        </span>
                        {alert.source && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {alert.source}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>

                      <h4 className="mt-1 font-medium text-foreground">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
});

AlertsPage.displayName = 'AlertsPage';

export default AlertsPage;
