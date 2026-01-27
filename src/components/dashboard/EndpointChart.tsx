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
    color: 'from-cyan-500 to-cyan-400',
    bgGlow: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  {
    name: 'Cortex',
    key: 'cortex' as const,
    icon: Shield,
    color: 'from-orange-500 to-orange-400',
    bgGlow: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  {
    name: 'Warp',
    key: 'warp' as const,
    icon: TrendingUp,
    color: 'from-purple-500 to-purple-400',
    bgGlow: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  {
    name: 'PAM',
    key: 'pam' as const,
    icon: Key,
    color: 'from-red-500 to-red-400',
    bgGlow: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  {
    name: 'JumpCloud',
    key: 'jumpcloud' as const,
    icon: Users,
    color: 'from-blue-500 to-blue-400',
    bgGlow: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
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
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">
          Cobertura por Ferramenta
        </h3>
        <p className="text-sm text-muted-foreground">
          Total de {total.toLocaleString()} endpoints monitorados
        </p>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tools.map((tool) => {
          const count = counts[tool.key];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const Icon = tool.icon;

          return (
            <div
              key={tool.key}
              className={cn(
                "relative rounded-lg border p-4 transition-all duration-300",
                "hover:scale-105 hover:shadow-lg",
                tool.bgGlow,
                tool.borderColor
              )}
            >
              {/* Icon */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background/50">
                <Icon className="h-5 w-5 text-foreground" />
              </div>

              {/* Count - Large Number */}
              <div className="mb-1">
                <p className="text-3xl font-black text-foreground leading-none">
                  {count.toLocaleString()}
                </p>
              </div>

              {/* Label */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {tool.name}
              </p>

              {/* Progress Bar */}
              <div className="h-1 w-full bg-background/30 rounded-full overflow-hidden">
                <div
                  className={cn("h-full bg-gradient-to-r transition-all duration-500", tool.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </span>
        <span className="text-primary font-semibold">
          5 ferramentas ativas
        </span>
      </div>
    </div>
  );
}
