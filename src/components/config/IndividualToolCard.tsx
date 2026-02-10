import { useState } from 'react';
import { Save, Eye, EyeOff, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateUrl, sanitizeInput } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface IndividualToolCardProps {
    title: string;
    description: string;
    color: string;
    icon: React.ReactNode;
    config: { baseUrl: string; apiKey?: string; apiToken?: string };
    onSave: (baseUrl: string, key: string) => Promise<void>;
    keyLabel: string;
    keyPlaceholder: string;
    isConfigured: boolean;
}

export function IndividualToolCard({
    title,
    description,
    color,
    icon,
    config,
    onSave,
    keyLabel,
    keyPlaceholder,
    isConfigured,
}: IndividualToolCardProps) {
    const [showKey, setShowKey] = useState(false);
    const [urlError, setUrlError] = useState<string | undefined>();
    const [localBaseUrl, setLocalBaseUrl] = useState(config.baseUrl);
    const [localKey, setLocalKey] = useState(config.apiKey ?? config.apiToken ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { toast } = useToast();

    const handleUrlChange = (value: string) => {
        const sanitized = sanitizeInput(value);
        const validation = validateUrl(sanitized);
        setUrlError(validation.message);
        setLocalBaseUrl(sanitized);
        setHasChanges(true);
    };

    const handleKeyChange = (value: string) => {
        setLocalKey(sanitizeInput(value));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (urlError) {
            toast({
                title: 'Erro de validação',
                description: 'Corrija o URL antes de salvar.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(localBaseUrl, localKey);
            setHasChanges(false);
            toast({
                title: 'Configuração salva',
                description: `${title} configurado com sucesso.`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar a configuração.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isComplete = localBaseUrl && localKey && !urlError;

    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 animate-fade-in flex flex-col',
                isConfigured && !hasChanges ? 'border-success/30 ring-1 ring-success/5' :
                    hasChanges ? 'border-primary/30 ring-1 ring-primary/5 shadow-lg shadow-primary/5' :
                        'hover:border-primary/20'
            )}
        >
            <div className="p-6 space-y-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg shadow-sm shrink-0', color)}>
                            {icon}
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{description}</p>
                        </div>
                    </div>

                    {isConfigured && !hasChanges ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-success/10 border border-success/20">
                            <Check className="h-3 w-3 text-success" />
                            <span className="text-[10px] font-bold text-success uppercase tracking-widest">Ativo</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border">
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inativo</span>
                        </div>
                    )}
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor={`${title}-url`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                            URL Base da API
                        </Label>
                        <Input
                            id={`${title}-url`}
                            placeholder="https://api.example.com"
                            value={localBaseUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className={cn(
                                'h-10 text-xs bg-muted/5 border-border focus-visible:ring-primary/20',
                                urlError && 'border-destructive focus-visible:ring-destructive'
                            )}
                        />
                        {urlError && (
                            <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                <AlertCircle className="h-3 w-3" />
                                {urlError}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${title}-key`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                            {keyLabel}
                        </Label>
                        <div className="relative">
                            <Input
                                id={`${title}-key`}
                                type={showKey ? 'text' : 'password'}
                                placeholder={keyPlaceholder}
                                value={localKey}
                                onChange={(e) => handleKeyChange(e.target.value)}
                                className="h-10 pr-10 text-xs font-mono bg-muted/5 border-border focus-visible:ring-primary/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/20">
                <Button
                    onClick={handleSave}
                    disabled={!isComplete || isSaving || !hasChanges}
                    className={cn(
                        'w-full h-10 text-[10px] font-bold uppercase tracking-widest transition-all',
                        isComplete && hasChanges && 'shadow-lg shadow-primary/10'
                    )}
                >
                    {isSaving ? (
                        <>
                            <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Sincronizando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-3 w-3" />
                            {hasChanges ? 'Salvar Configuração' : 'Credencial Ativa'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
