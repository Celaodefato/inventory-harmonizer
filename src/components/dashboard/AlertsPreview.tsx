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

const iconStyles = {
  info: 'text-primary',
  warning: 'text-warning',
  error: 'text-destructive',
};

export function AlertsPreview({ alerts }: AlertsPreviewProps) {
  const recentAlerts = alerts.slice(0, 5);

  if (recentAlerts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card h-full flex flex-col animate-fade-in">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alertas Recentes</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <Info className="mb-2 h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Log limpo</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tight">Nenhuma divergência crítica detectada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card h-full flex flex-col animate-fade-in">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alertas Recentes</h3>
        <Link to="/alerts">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-wider font-bold text-primary hover:text-primary hover:bg-primary/5">
            Ver todos
          </Button>
        </Link>
      </div>
      <div className="divide-y divide-border overflow-hidden">
        {recentAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div
              key={alert.id}
              className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted/30"
            >
              <div className={cn('mt-0.5 rounded-full p-1 bg-transparent', iconStyles[alert.type])}>
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-foreground tracking-tight">{alert.title}</p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
