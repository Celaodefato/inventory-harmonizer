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
                'group relative rounded-2xl border-2 bg-card transition-all duration-300',
                'hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
                isConfigured && !hasChanges
                    ? 'border-success/40 shadow-lg shadow-success/10'
                    : hasChanges
                        ? 'border-warning/40 shadow-lg shadow-warning/10'
                        : 'border-border/50 hover:border-primary/30'
            )}
        >
            {/* Status Indicator */}
            {isConfigured && !hasChanges && (
                <div className="absolute -top-3 -right-3 z-10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success shadow-lg">
                        <Check className="h-4 w-4 text-success-foreground" />
                    </div>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl shadow-md', color)}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-card-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                        </div>
                    </div>

                    {isConfigured && !hasChanges ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            <span className="text-xs font-semibold text-success">Ativo</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Inativo</span>
                        </div>
                    )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${title}-url`} className="text-sm font-semibold">
                            URL Base da API
                        </Label>
                        <Input
                            id={`${title}-url`}
                            placeholder="https://api.example.com"
                            value={localBaseUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className={cn(
                                'h-11 text-sm',
                                urlError && 'border-destructive focus-visible:ring-destructive'
                            )}
                        />
                        {urlError && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3" />
                                {urlError}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${title}-key`} className="text-sm font-semibold">
                            {keyLabel}
                        </Label>
                        <div className="relative">
                            <Input
                                id={`${title}-key`}
                                type={showKey ? 'text' : 'password'}
                                placeholder={keyPlaceholder}
                                value={localKey}
                                onChange={(e) => handleKeyChange(e.target.value)}
                                className="h-11 pr-11 text-sm font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleSave}
                    disabled={!isComplete || isSaving || !hasChanges}
                    className={cn(
                        'w-full h-11 font-semibold shadow-md transition-all',
                        isComplete && hasChanges && 'shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
                    )}
                >
                    {isSaving ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {hasChanges ? 'Salvar Alterações' : 'Salvo'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
