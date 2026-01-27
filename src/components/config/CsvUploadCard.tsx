
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseCsv } from '@/lib/csv';
import { saveCsvData, CsvMetadata, CsvData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CsvUploadCardProps {
    tool: keyof CsvData;
    title: string;
    color: string;
    icon: React.ReactNode;
    metadata: CsvMetadata | null;
    onUpdate: () => void;
}

export function CsvUploadCard({
    tool,
    title,
    color,
    icon,
    metadata,
    onUpdate,
}: CsvUploadCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast({
                title: 'Formato inválido',
                description: 'Por favor, envie um arquivo CSV.',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const result = parseCsv(content, tool);

            if (result.error) {
                toast({
                    title: 'Erro na importação',
                    description: result.error,
                    variant: 'destructive',
                });
                setIsProcessing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Save data
            const meta: CsvMetadata = {
                tool,
                filename: file.name,
                timestamp: new Date().toISOString(),
                count: result.count,
            };

            saveCsvData(tool, result.data, meta);
            onUpdate();

            toast({
                title: 'Importação concluída',
                description: `${result.count} registros importados para ${title}.`,
            });

            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        reader.readAsText(file);
    };

    const clearData = () => {
        saveCsvData(tool, null, null);
        onUpdate();
        toast({ title: 'Dados removidos', description: `Importação de ${title} removida.` });
    };

    return (
        <div className={cn(
            'rounded-xl border bg-card p-6 transition-all',
            metadata ? 'border-primary/40 bg-primary/5' : 'border-border'
        )}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-card-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground">Importação Manual (CSV)</p>
                    </div>
                </div>
                {metadata && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
            </div>

            <div className="space-y-4">
                {!metadata ? (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:bg-muted/50 hover:border-primary/40 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    {isProcessing ? 'Processando...' : 'Clique para selecionar o CSV'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Coluna obrigatória: <strong>hostname</strong> (ip e uuid opcionais)
                                </p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-3 bg-background rounded-lg border border-border">
                            <FileText className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{metadata.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                    {metadata.count} registros • {format(new Date(metadata.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={clearData}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 p-2 rounded text-center justify-center">
                            <AlertCircle className="h-3 w-3" />
                            Precedência sobre API inativa
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
