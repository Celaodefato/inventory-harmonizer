import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    ShieldCheck,
    Monitor,
    FileText,
    UserCircle,
    AlertCircle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OffboardingAlert, OffboardingChecklist, OffboardingStatus } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { updateOffboardingAlert } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface OffboardingDetailModalProps {
    alert: OffboardingAlert | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function OffboardingDetailModal({ alert, isOpen, onClose, onUpdate }: OffboardingDetailModalProps) {
    const [formData, setFormData] = useState<OffboardingAlert | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (alert) {
            setFormData(JSON.parse(JSON.stringify(alert)));
        }
    }, [alert]);

    if (!formData) return null;

    const handleCheckChange = (key: keyof OffboardingChecklist) => {
        if (!formData) return;
        const updatedChecklist = { ...formData.checklist, [key]: !formData.checklist[key] };
        setFormData({ ...formData, checklist: updatedChecklist });
    };

    const isComplete = Object.values(formData.checklist).every(v => v === true);

    const handleSave = (newStatus?: OffboardingStatus) => {
        if (!formData) return;

        const updatedAlert = {
            ...formData,
            status: (newStatus || (Object.values(formData.checklist).some(v => v) && !isComplete ? 'in_progress' : formData.status))
        };

        if (newStatus === 'completed' && !isComplete) {
            toast({
                title: "Ação bloqueada",
                description: "Todos os itens do checklist devem estar concluídos.",
                variant: "destructive"
            });
            return;
        }

        updateOffboardingAlert(updatedAlert);
        onUpdate();
        if (newStatus === 'completed') {
            toast({ title: "Offboarding Concluído", description: `Processo de ${formData.employeeName} finalizado.` });
            onClose();
        } else {
            toast({ title: "Progresso salvo", description: "Alterações mantidas com sucesso." });
        }
    };

    const ChecklistItem = ({
        id,
        label,
        checked,
        onChange
    }: {
        id: keyof OffboardingChecklist,
        label: string,
        checked: boolean,
        onChange: (id: keyof OffboardingChecklist) => void
    }) => (
        <div className="flex items-center space-x-3 py-2 px-1 hover:bg-muted/30 rounded-md transition-colors">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => onChange(id)}
            />
            <Label
                htmlFor={id}
                className={cn(
                    "text-sm font-medium leading-none cursor-pointer flex-1",
                    checked ? "text-muted-foreground line-through" : "text-foreground"
                )}
            >
                {label}
            </Label>
            <Badge variant={checked ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5 uppercase tracking-wider">
                {checked ? "Concluído" : "Pendente"}
            </Badge>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                        <Badge className={cn(
                            "uppercase text-[10px] tracking-widest",
                            formData.status === 'pending' && "bg-destructive/20 text-destructive border-destructive/30",
                            formData.status === 'in_progress' && "bg-warning/20 text-warning border-warning/30",
                            formData.status === 'completed' && "bg-success/20 text-success border-success/30",
                        )}>
                            {formData.status === 'pending' ? 'Pendente de Análise - TI' :
                                formData.status === 'in_progress' ? 'Em Andamento' : 'Concluído'}
                        </Badge>
                    </div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        Offboarding: {formData.employeeName}
                    </DialogTitle>
                    <DialogDescription>
                        {formData.employeeEmail} • Criado em {new Date(formData.createdAt).toLocaleDateString('pt-BR')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Section: Identity */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <ShieldCheck className="w-4 h-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">🔐 Identidade & Acesso</h3>
                        </div>
                        <div className="grid gap-1 ml-6">
                            <ChecklistItem id="adDisabled" label="Desativado no AD" checked={formData.checklist.adDisabled} onChange={handleCheckChange} />
                            <ChecklistItem id="adMoved" label="Movido para OU 'Desligados' (AD)" checked={formData.checklist.adMoved} onChange={handleCheckChange} />
                            <ChecklistItem id="googleDisabled" label="Conta Google desativada" checked={formData.checklist.googleDisabled} onChange={handleCheckChange} />
                            <ChecklistItem id="googlePasswordChanged" label="Senha Google alterada" checked={formData.checklist.googlePasswordChanged} onChange={handleCheckChange} />
                            <ChecklistItem id="autoReplySet" label="Resposta automática configurada (Gmail)" checked={formData.checklist.autoReplySet} onChange={handleCheckChange} />
                            <ChecklistItem id="googleTakeoutDone" label="Google Takeout realizado (Email, Drive, Chat)" checked={formData.checklist.googleTakeoutDone} onChange={handleCheckChange} />
                        </div>
                    </section>

                    <Separator />

                    {/* Section: Assets */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <Monitor className="w-4 h-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">💻 Ativos & Máquina</h3>
                        </div>
                        <div className="grid gap-1 ml-6">
                            <ChecklistItem id="machineCollected" label="Máquina recolhida" checked={formData.checklist.machineCollected} onChange={handleCheckChange} />
                            <ChecklistItem id="machineBackup" label="Backup da máquina realizado" checked={formData.checklist.machineBackup} onChange={handleCheckChange} />
                            <ChecklistItem id="glpiUpdated" label="GLPI atualizado" checked={formData.checklist.glpiUpdated} onChange={handleCheckChange} />
                        </div>
                    </section>

                    <Separator />

                    {/* Section: Licenses */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <FileText className="w-4 h-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">📄 Licenças</h3>
                        </div>
                        <div className="grid gap-1 ml-6">
                            <ChecklistItem id="licensesRemoved" label="Licenças removidas" checked={formData.checklist.licensesRemoved} onChange={handleCheckChange} />
                            <ChecklistItem id="licensesConfirmed" label="Confirmação de remoção de licenças" checked={formData.checklist.licensesConfirmed} onChange={handleCheckChange} />
                        </div>
                    </section>

                    <Separator />

                    {/* Section: Governance */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <UserCircle className="w-4 h-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">👤 Governança</h3>
                        </div>
                        <div className="grid gap-4 ml-6">
                            <div className="grid gap-2">
                                <Label htmlFor="responsible">Responsável pelo offboarding *</Label>
                                <Input
                                    id="responsible"
                                    value={formData.responsible || ''}
                                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                                    placeholder="Nome do analista de TI"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="secondary" onClick={() => handleSave()}>Salvar Alterações</Button>
                    <Button
                        disabled={!isComplete || !formData.responsible}
                        onClick={() => handleSave('completed')}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                    >
                        Concluir Offboarding
                    </Button>
                </DialogFooter>
                <div className="pb-4 px-6 text-[10px] text-muted-foreground italic">
                    * Campo obrigatório para conclusão. Conclusão permitida apenas com 100% do checklist marcado.
                </div>
            </DialogContent>
        </Dialog>
    );
}
