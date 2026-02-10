import { forwardRef, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getSyncLogs } from '@/lib/storage';
import { SyncLog } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusIcons = {
  success: CheckCircle2,
  error: XCircle,
  partial: AlertTriangle,
};

const statusColors = {
  success: 'text-success',
  error: 'text-destructive',
  partial: 'text-warning',
};

const statusLabels = {
  success: 'Sucesso',
  error: 'Erro',
  partial: 'Parcial',
};

const LogsPage = forwardRef<HTMLDivElement>((_, ref) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      const savedLogs = await getSyncLogs();
      setLogs(savedLogs);
    };
    loadLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <MainLayout ref={ref}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Logs / Erros</h1>
          <p className="text-muted-foreground">
            Histórico de sincronizações e eventos do sistema
          </p>
        </div>

        {/* Logs List */}
        <div className="rounded-xl border border-border bg-card">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground">Nenhum log encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Os logs de sincronização aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const StatusIcon = statusIcons[log.status];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 animate-fade-in"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        log.status === 'success' && 'bg-success/10',
                        log.status === 'error' && 'bg-destructive/10',
                        log.status === 'partial' && 'bg-warning/10'
                      )}
                    >
                      <StatusIcon className={cn('h-5 w-5', statusColors[log.status])} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            statusColors[log.status]
                          )}
                        >
                          {statusLabels[log.status]}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-foreground">{log.message}</p>

                      {log.details && (
                        <p className="mt-1 text-sm text-muted-foreground">{log.details}</p>
                      )}

                      {log.endpointCounts && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            Vicarius: {log.endpointCounts.vicarius}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                            Cortex: {log.endpointCounts.cortex}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                            Warp: {log.endpointCounts.warp}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                            PAM: {log.endpointCounts.pam}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                            JumpCloud: {log.endpointCounts.jumpcloud}
                          </span>
                        </div>
                      )}
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

LogsPage.displayName = 'LogsPage';

export default LogsPage;
