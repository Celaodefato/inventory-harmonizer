import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NormalizedEndpoint } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { isEndpointCompliant, isWorkstation } from '@/lib/inventory';

interface ComplianceModalProps {
    endpoints: NormalizedEndpoint[];
    onClose: () => void;
}

export function ComplianceModal({ endpoints, onClose }: ComplianceModalProps) {
    // Filter non-compliant: machines based on hostname patterns
    const nonCompliant = endpoints.filter(e => !isEndpointCompliant(e));

    // Track checked machines
    const [checkedMachines, setCheckedMachines] = useState<Set<string>>(new Set());

    const toggleCheck = (hostname: string) => {
        const newChecked = new Set(checkedMachines);
        if (newChecked.has(hostname)) {
            newChecked.delete(hostname);
        } else {
            newChecked.add(hostname);
        }
        setCheckedMachines(newChecked);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[85vh] m-4 rounded-2xl border-2 border-destructive/40 bg-card shadow-2xl shadow-destructive/20">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-6 bg-destructive/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive shadow-md">
                            <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                Máquinas Fora de Compliance
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {nonCompliant.length} máquina(s) • {checkedMachines.size} verificada(s)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(85vh-180px)] scrollbar-thin">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-12">
                                    ✓
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Hostname
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    IP
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Fontes Presentes
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Ausente Em
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {nonCompliant.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                                                <AlertTriangle className="h-8 w-8 text-success" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Todas as máquinas estão em compliance!
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Todos os endpoints estão com as ferramentas obrigatórias instaladas.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                nonCompliant.map((endpoint, index) => {
                                    const allSources = ['vicarius', 'cortex', 'warp', 'pam', 'jumpcloud'];
                                    const expectedSources = isWorkstation(endpoint.hostname)
                                        ? allSources
                                        : ['vicarius', 'cortex'];

                                    const missing = expectedSources.filter(s => !endpoint.sources.includes(s as any));
                                    const isChecked = checkedMachines.has(endpoint.hostname);

                                    return (
                                        <tr
                                            key={`${endpoint.hostname}-${index}`}
                                            className={cn(
                                                'border-b border-border last:border-0 transition-all',
                                                isChecked
                                                    ? 'bg-success/5 opacity-60'
                                                    : 'hover:bg-destructive/5'
                                            )}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleCheck(endpoint.hostname)}
                                                    className="border-2"
                                                />
                                            </td>
                                            <td className={cn(
                                                "px-4 py-4 text-sm font-medium",
                                                isChecked ? "line-through text-muted-foreground" : "text-card-foreground"
                                            )}>
                                                {endpoint.hostname}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                                                {endpoint.ip}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {endpoint.sources.map((source) => (
                                                        <span
                                                            key={source}
                                                            className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                                        >
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {missing.map((source) => (
                                                        <span
                                                            key={source}
                                                            className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                                                        >
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Workstations (EXA-*):</strong> Requerem as 5 ferramentas.</p>
                        <p><strong>Servidores/Outros:</strong> Requerem apenas Vicarius e Cortex (XDR).</p>
                    </div>
                    <Button onClick={onClose} variant="outline">
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
}
