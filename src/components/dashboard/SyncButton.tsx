import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SyncStatus } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  syncStatus: SyncStatus;
  onSync: () => void;
}

export function SyncButton({ syncStatus, onSync }: SyncButtonProps) {
  const getButtonContent = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        );
      case 'success':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Sincronizado
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Erro - Tentar novamente
          </>
        );
      default:
        return (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar agora
          </>
        );
    }
  };

  return (
    <Button
      onClick={onSync}
      disabled={syncStatus.status === 'syncing'}
      className={cn(
        'min-w-[180px] transition-all duration-300',
        syncStatus.status === 'success' && 'bg-success hover:bg-success/90',
        syncStatus.status === 'error' && 'bg-destructive hover:bg-destructive/90'
      )}
    >
      {getButtonContent()}
    </Button>
  );
}
