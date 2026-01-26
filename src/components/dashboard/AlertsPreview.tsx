import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Alert } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AlertsPreviewProps {
  alerts: Alert[];
}

const alertIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const alertStyles = {
  info: 'border-primary/30 bg-primary/5',
  warning: 'border-warning/30 bg-warning/5',
  error: 'border-destructive/30 bg-destructive/5',
};

const iconStyles = {
  info: 'text-primary',
  warning: 'text-warning',
  error: 'text-destructive',
};

export function AlertsPreview({ alerts }: AlertsPreviewProps) {
  const recentAlerts = alerts.slice(0, 5);

  if (recentAlerts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Alertas Recentes</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Info className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          <p className="text-xs text-muted-foreground/70">Sincronize para verificar divergências</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Alertas Recentes</h3>
        <Link to="/alerts">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todos
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {recentAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                alertStyles[alert.type]
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconStyles[alert.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-card-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
