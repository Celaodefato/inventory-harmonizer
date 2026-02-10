import { Server, Shield, Key, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndpointChartProps {
  vicariusCount: number;
  cortexCount: number;
  warpCount: number;
  pamCount: number;
  jumpcloudCount: number;
}

const tools = [
  {
    name: 'Vicarius',
    key: 'vicarius' as const,
    icon: Server,
    color: 'bg-primary'
  },
  {
    name: 'Cortex',
    key: 'cortex' as const,
    icon: Shield,
    color: 'bg-orange-500'
  },
  {
    name: 'Warp',
    key: 'warp' as const,
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
  {
    name: 'PAM',
    key: 'pam' as const,
    icon: Key,
    color: 'bg-destructive'
  },
  {
    name: 'JumpCloud',
    key: 'jumpcloud' as const,
    icon: Users,
    color: 'bg-blue-500'
  },
];

export function EndpointChart({
  vicariusCount,
  cortexCount,
  warpCount,
  pamCount,
  jumpcloudCount
}: EndpointChartProps) {
  const counts = {
    vicarius: vicariusCount,
    cortex: cortexCount,
    warp: warpCount,
    pam: pamCount,
    jumpcloud: jumpcloudCount,
  };

  const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
  const maxCount = Math.max(...Object.values(counts));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in flex flex-col">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cobertura por Ferramenta</h3>
      </div>

      <div className="p-6 space-y-6 flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const count = counts[tool.key];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const Icon = tool.icon;

            return (
              <div key={tool.key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{tool.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500 rounded-full opacity-80", tool.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Monitorado</span>
          <span className="text-xl font-black text-foreground">{total.toLocaleString()}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-success uppercase tracking-wider">5 Fontes Ativas</p>
          <p className="text-[9px] text-muted-foreground font-medium uppercase font-mono">Status: Sincronizado</p>
        </div>
      </div>
    </div>
  );
}
