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
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  error: 'border-destructive/30 bg-destructive/5',
};

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

export function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 transition-all duration-200 animate-fade-in',
        'hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', iconStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
