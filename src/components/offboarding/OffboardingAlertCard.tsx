import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    UserX,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { OffboardingAlert } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface OffboardingAlertCardProps {
    alert: OffboardingAlert;
    onClick: () => void;
}

export function OffboardingAlertCard({ alert, onClick }: OffboardingAlertCardProps) {
    const totalItems = Object.keys(alert.checklist).length;
    const completedItems = Object.values(alert.checklist).filter(v => v === true).length;
    const progressPercent = Math.round((completedItems / totalItems) * 100);

    const statusConfig = {
        pending: {
            label: 'Pendente',
            icon: AlertCircle,
            badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
            iconClass: 'text-destructive'
        },
        in_progress: {
            label: 'Em Andamento',
            icon: Clock,
            badgeClass: 'bg-warning/10 text-warning border-warning/20',
            iconClass: 'text-warning'
        },
        completed: {
            label: 'Concluído',
            icon: CheckCircle2,
            badgeClass: 'bg-success/10 text-success border-success/20',
            iconClass: 'text-success'
        }
    };

    const config = statusConfig[alert.status];
    const Icon = config.icon;

    return (
        <Card
            className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden animate-fade-in"
            onClick={onClick}
        >
            <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                    <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors",
                        alert.status === 'pending' && "bg-destructive/5 text-destructive"
                    )}>
                        <UserX className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground truncate">{alert.employeeName}</h4>
                            <Badge variant="outline" className={cn("text-[10px] uppercase", config.badgeClass)}>
                                <Icon className={cn("mr-1 h-3 w-3", config.iconClass)} />
                                {config.label}
                            </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground truncate">{alert.employeeEmail}</p>

                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-500",
                                        alert.status === 'completed' ? "bg-success" : "bg-primary"
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                {completedItems}/{totalItems} itens
                            </span>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

                {alert.responsible && (
                    <div className="bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground border-t">
                        Responsável: <span className="font-medium">{alert.responsible}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
