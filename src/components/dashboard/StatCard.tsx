import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: 'border-border',
  success: 'border-success/20 bg-success/5',
  warning: 'border-warning/20 bg-warning/5',
  error: 'border-destructive/20 bg-destructive/5',
};

const iconStyles = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
};

export function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 transition-colors animate-fade-in',
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2', iconStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
