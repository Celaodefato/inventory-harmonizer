
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

        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/x-csv', 'application/x-csv', 'text/comma-separated-values', 'text/x-comma-separated-values'];
        const isCsvExt = file.name.toLowerCase().endsWith('.csv');

        if (!validTypes.includes(file.type) && !isCsvExt) {
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
            const text = event.target?.result as string;
            const result = parseCsv(text, tool.toLowerCase());

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
                tool: (result.detectedType as keyof CsvData) || tool,
                filename: file.name,
                timestamp: new Date().toISOString(),
                count: result.count,
            };

            saveCsvData((result.detectedType as keyof CsvData) || tool, result.data, meta);
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
            'rounded-xl border bg-card overflow-hidden transition-all duration-300 animate-fade-in flex flex-col',
            metadata ? 'border-primary/30 ring-1 ring-primary/5' : 'border-border'
        )}>
            <div className="p-5 space-y-4 flex-1">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shadow-sm shrink-0', color)}>
                            {icon}
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Importação Manual</p>
                        </div>
                    </div>
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
                                className="w-full rounded-lg border-2 border-dashed border-border py-8 px-4 hover:bg-muted/30 hover:border-primary/30 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Upload className="mx-auto h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                                        {isProcessing ? 'PROCESSANDO...' : 'CLIQUE PARA IMPORTAR CSV'}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight max-w-[200px] mx-auto">
                                        Vínculo obrigatório: <b>hostname</b>
                                    </p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded border border-border">
                                <FileText className="h-4 w-4 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate text-foreground">{metadata.filename}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                        {metadata.count} registros • {format(new Date(metadata.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0" onClick={clearData}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 p-2 rounded justify-center border border-primary/10">
                                <AlertCircle className="h-3 w-3" />
                                Precedência sobre API
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
