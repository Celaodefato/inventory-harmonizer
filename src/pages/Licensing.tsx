
import { useState, useEffect, useCallback } from 'react';
import {
    Key, Plus, Trash2, Edit3, AlertTriangle, CheckCircle2, XCircle,
    TrendingUp, DollarSign, ShieldCheck, Calendar, BarChart3, Save, X
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { License } from '@/types/licensing';
import { getLicenses, saveLicenses } from '@/lib/storage-licensing';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// ─── Tool color config ────────────────────────────────────────────────────
const TOOL_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    'Vicarius': { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', accent: 'bg-primary' },
    'Cortex XDR': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', accent: 'bg-orange-500' },
    'Warp': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', accent: 'bg-purple-500' },
    'JumpCloud': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', accent: 'bg-blue-500' },
    'SenhaSegura (PAM)': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', accent: 'bg-red-500' },
};

function getToolColors(tool: string) {
    return TOOL_COLORS[tool] || { bg: 'bg-muted/30', text: 'text-muted-foreground', border: 'border-border', accent: 'bg-muted-foreground' };
}

function calcStatus(lic: License): License['status'] {
    if (!lic.renewalDate && lic.usedLicenses === 0) return 'healthy';
    const usage = lic.totalLicenses > 0 ? lic.usedLicenses / lic.totalLicenses : 0;
    if (usage >= 1) return 'critical';

    if (lic.renewalDate) {
        const days = differenceInDays(parseISO(lic.renewalDate), new Date());
        if (days < 0) return 'expired';
        if (days < 30) return 'critical';
        if (days < 90) return 'warning';
    }

    if (usage >= 0.85) return 'warning';
    return 'healthy';
}

// ─── License Form Modal ────────────────────────────────────────────────────
function LicenseModal({
    license,
    onSave,
    onClose,
}: {
    license: License | null;
    onSave: (lic: License) => void;
    onClose: () => void;
}) {
    const isNew = !license?.id || license.id === '';
    const [form, setForm] = useState<License>(license || {
        id: `lic-${Date.now()}`,
        tool: '',
        vendor: '',
        type: 'per-device',
        totalLicenses: 0,
        usedLicenses: 0,
        renewalDate: '',
        notes: '',
        status: 'healthy',
    });

    const set = (field: keyof License, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                        {isNew ? 'Nova Licença' : 'Editar Licença'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ferramenta *</label>
                        <Input value={form.tool} onChange={e => set('tool', e.target.value)} placeholder="ex: Vicarius, Cortex XDR..." className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fornecedor</label>
                        <Input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="ex: Palo Alto Networks" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Licença</label>
                        <select
                            value={form.type}
                            onChange={e => set('type', e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
                        >
                            <option value="per-device">Por Dispositivo</option>
                            <option value="per-user">Por Usuário</option>
                            <option value="flat">Flat (Ilimitado)</option>
                            <option value="subscription">Assinatura</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total de Licenças</label>
                        <Input type="number" value={form.totalLicenses} onChange={e => set('totalLicenses', Number(e.target.value))} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Licenças em Uso</label>
                        <Input type="number" value={form.usedLicenses} onChange={e => set('usedLicenses', Number(e.target.value))} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custo por Unidade (R$)</label>
                        <Input type="number" value={form.costPerUnit || ''} onChange={e => set('costPerUnit', Number(e.target.value))} placeholder="0.00" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Renovação</label>
                        <Input type="date" value={form.renewalDate || ''} onChange={e => set('renewalDate', e.target.value)} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observações</label>
                        <Input value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notas opcionais..." className="h-9 text-xs" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-9 text-xs font-bold uppercase tracking-wider">Cancelar</Button>
                    <Button size="sm" onClick={() => onSave({ ...form, status: calcStatus(form) })} className="h-9 text-xs font-bold uppercase tracking-wider" disabled={!form.tool}>
                        <Save className="mr-2 h-3.5 w-3.5" />
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Usage Bar ─────────────────────────────────────────────────────────────
function UsageBar({ used, total, accent }: { used: number; total: number; accent: string }) {
    const pct = total > 0 ? Math.min(used / total, 1) : 0;
    const color = pct >= 1 ? 'bg-destructive' : pct >= 0.85 ? 'bg-warning' : accent;
    return (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
                className={cn('h-full rounded-full transition-all duration-700', color)}
                style={{ width: `${pct * 100}%` }}
            />
        </div>
    );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: License['status'] }) {
    const config = {
        healthy: { label: 'SAUDÁVEL', cls: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="h-3 w-3" /> },
        warning: { label: 'ATENÇÃO', cls: 'bg-warning/10 text-warning border-warning/20', icon: <AlertTriangle className="h-3 w-3" /> },
        critical: { label: 'CRÍTICO', cls: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="h-3 w-3" /> },
        expired: { label: 'EXPIRADO', cls: 'bg-muted text-muted-foreground border-border', icon: <XCircle className="h-3 w-3" /> },
    }[status] || { label: 'OK', cls: '', icon: null };

    return (
        <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold', config.cls)}>
            {config.icon}
            {config.label}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Licensing() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [modalLic, setModalLic] = useState<License | null | 'new'>(null);
    const { toast } = useToast();

    useEffect(() => {
        getLicenses().then(lics => {
            setLicenses(lics.map(l => ({ ...l, status: calcStatus(l) })));
        });
    }, []);

    const save = useCallback(async (updated: License[]) => {
        setLicenses(updated);
        await saveLicenses(updated);
    }, []);

    const handleSave = async (lic: License) => {
        const existing = licenses.findIndex(l => l.id === lic.id);
        const updated = existing >= 0
            ? licenses.map(l => l.id === lic.id ? lic : l)
            : [...licenses, lic];
        await save(updated);
        setModalLic(null);
        toast({ title: 'Licença salva', description: `${lic.tool} atualizado com sucesso.` });
    };

    const handleDelete = async (id: string) => {
        await save(licenses.filter(l => l.id !== id));
        toast({ title: 'Licença removida', variant: 'destructive' });
    };

    // ─── KPIs ─────────────────────────────────────────────────────────────
    const totalLicenses = licenses.reduce((acc, l) => acc + l.totalLicenses, 0);
    const totalUsed = licenses.reduce((acc, l) => acc + l.usedLicenses, 0);
    const totalCost = licenses.reduce((acc, l) => acc + (l.costPerUnit || 0) * l.totalLicenses, 0);
    const criticalCount = licenses.filter(l => l.status === 'critical' || l.status === 'expired').length;
    const warningCount = licenses.filter(l => l.status === 'warning').length;

    const soon = licenses
        .filter(l => l.renewalDate)
        .map(l => ({ ...l, daysLeft: differenceInDays(parseISO(l.renewalDate!), new Date()) }))
        .filter(l => l.daysLeft >= 0 && l.daysLeft <= 90)
        .sort((a, b) => a.daysLeft - b.daysLeft);

    return (
        <MainLayout>
            <div className="p-8 max-w-[1600px] mx-auto space-y-8">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Key className="h-7 w-7 text-primary" />
                            Licenciamentos
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Gestão centralizada de licenças e compliance de ferramentas de segurança
                        </p>
                    </div>
                    <Button
                        onClick={() => setModalLic('new')}
                        className="h-10 font-bold uppercase tracking-wider text-xs gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Licença
                    </Button>
                </div>

                {/* ── Executive KPI Cards ─────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total de Licenças</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{totalLicenses.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{totalUsed.toLocaleString('pt-BR')} em uso · {licenses.length} ferramentas</p>
                        </div>
                        <UsageBar used={totalUsed} total={totalLicenses} accent="bg-primary" />
                    </div>

                    {/* Custo */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custo Total Estimado</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">
                                {totalCost > 0
                                    ? `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Investimento em segurança</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-green-500/20">
                            <div className="h-full w-3/4 rounded-full bg-green-500 transition-all duration-700" />
                        </div>
                    </div>

                    {/* Alertas */}
                    <div className={cn(
                        'rounded-xl border bg-card p-5 space-y-3 animate-fade-in',
                        criticalCount > 0 ? 'border-destructive/20' : 'border-border'
                    )}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status de Alertas</span>
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', criticalCount > 0 ? 'bg-destructive/10' : 'bg-muted/30')}>
                                <AlertTriangle className={cn('h-4 w-4', criticalCount > 0 ? 'text-destructive' : 'text-muted-foreground')} />
                            </div>
                        </div>
                        <div>
                            <p className={cn('text-3xl font-bold', criticalCount > 0 ? 'text-destructive' : 'text-foreground')}>{criticalCount}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{criticalCount} críticos · {warningCount} em atenção</p>
                        </div>
                        <div className="flex gap-1">
                            {licenses.map(l => (
                                <div
                                    key={l.id}
                                    className={cn('flex-1 h-1.5 rounded-full', {
                                        'bg-success': l.status === 'healthy',
                                        'bg-warning': l.status === 'warning',
                                        'bg-destructive': l.status === 'critical' || l.status === 'expired',
                                    })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Próximas renovações */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Próximas Renovações</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Calendar className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{soon.length}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">nos próximos 90 dias</p>
                        </div>
                        {soon[0] && (
                            <p className="text-[10px] font-bold text-warning uppercase tracking-tight truncate">
                                ⏰ {soon[0].tool} — {soon[0].daysLeft}d
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Renewal Alert Banner ─────────────────────────────── */}
                {soon.length > 0 && (
                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 animate-fade-in flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-warning uppercase tracking-tight">Renovações Próximas</p>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {soon.map(l => (
                                    <span key={l.id} className="text-[11px] font-medium text-warning/80 bg-warning/10 px-2.5 py-1 rounded-md border border-warning/20">
                                        {l.tool} — {l.daysLeft === 0 ? 'Hoje!' : `${l.daysLeft} dias`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── License Cards Grid ───────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Licenças Cadastradas</h2>
                        <span className="text-xs text-muted-foreground">{licenses.length} ferramenta{licenses.length !== 1 ? 's' : ''}</span>
                    </div>

                    {licenses.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center animate-fade-in">
                            <Key className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-sm font-bold text-muted-foreground">Nenhuma licença cadastrada</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Clique em "Nova Licença" para começar</p>
                            <Button size="sm" onClick={() => setModalLic('new')} className="font-bold uppercase tracking-wider text-xs">
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Adicionar Licença
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {licenses.map(lic => {
                                const colors = getToolColors(lic.tool);
                                const pct = lic.totalLicenses > 0 ? Math.min(lic.usedLicenses / lic.totalLicenses, 1) : 0;
                                const available = lic.totalLicenses - lic.usedLicenses;
                                const daysLeft = lic.renewalDate ? differenceInDays(parseISO(lic.renewalDate), new Date()) : null;

                                return (
                                    <div
                                        key={lic.id}
                                        className={cn(
                                            'group rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/10 animate-fade-in',
                                            lic.status === 'critical' || lic.status === 'expired' ? 'border-destructive/30' : 'border-border'
                                        )}
                                    >
                                        {/* Card Header */}
                                        <div className={cn('px-5 py-4 border-b border-border/50', colors.bg)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className={cn('text-sm font-bold tracking-tight', colors.text)}>{lic.tool}</h3>
                                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{lic.vendor}</p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <StatusBadge status={lic.status} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="px-5 py-4 space-y-4">
                                            {/* Usage */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        {lic.type === 'per-user' ? 'Usuários' : 'Dispositivos'}
                                                    </span>
                                                    <span className={cn('text-xs font-bold tabular-nums',
                                                        pct >= 1 ? 'text-destructive' : pct >= 0.85 ? 'text-warning' : 'text-foreground'
                                                    )}>
                                                        {lic.usedLicenses.toLocaleString('pt-BR')} / {lic.totalLicenses.toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                                <UsageBar used={lic.usedLicenses} total={lic.totalLicenses} accent={colors.accent} />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        {(pct * 100).toFixed(0)}% em uso
                                                    </span>
                                                    <span className={cn('text-[9px] font-bold uppercase tracking-widest',
                                                        available <= 0 ? 'text-destructive' : 'text-muted-foreground'
                                                    )}>
                                                        {available.toLocaleString('pt-BR')} disponíveis
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {lic.costPerUnit ? (
                                                    <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">CUSTO UNIT.</p>
                                                        <p className="text-xs font-bold text-foreground">
                                                            R$ {lic.costPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">TIPO</p>
                                                        <p className="text-xs font-bold text-foreground capitalize">
                                                            {lic.type === 'per-device' ? 'Por Dispositivo' : lic.type === 'per-user' ? 'Por Usuário' : lic.type}
                                                        </p>
                                                    </div>
                                                )}
                                                {lic.renewalDate ? (
                                                    <div className={cn('rounded-lg px-3 py-2 space-y-0.5',
                                                        daysLeft !== null && daysLeft < 30 ? 'bg-destructive/10' : daysLeft !== null && daysLeft < 90 ? 'bg-warning/10' : 'bg-muted/30'
                                                    )}>
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">RENOVAÇÃO</p>
                                                        <p className={cn('text-xs font-bold',
                                                            daysLeft !== null && daysLeft < 30 ? 'text-destructive' : daysLeft !== null && daysLeft < 90 ? 'text-warning' : 'text-foreground'
                                                        )}>
                                                            {daysLeft !== null && daysLeft >= 0
                                                                ? `${daysLeft}d restantes`
                                                                : 'Expirado!'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">RENOVAÇÃO</p>
                                                        <p className="text-xs font-bold text-muted-foreground/60">—</p>
                                                    </div>
                                                )}
                                            </div>

                                            {lic.notes && (
                                                <p className="text-[10px] text-muted-foreground/70 font-medium leading-relaxed border-t border-border pt-3">
                                                    {lic.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Footer */}
                                        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                                onClick={() => setModalLic(lic)}
                                            >
                                                <Edit3 className="mr-1.5 h-3 w-3" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                onClick={() => handleDelete(lic.id)}
                                            >
                                                <Trash2 className="mr-1.5 h-3 w-3" />
                                                Remover
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add card shortcut */}
                            <button
                                onClick={() => setModalLic('new')}
                                className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            >
                                <Plus className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Adicionar Licença</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalLic !== null && (
                <LicenseModal
                    license={modalLic === 'new' ? null : modalLic}
                    onSave={handleSave}
                    onClose={() => setModalLic(null)}
                />
            )}
        </MainLayout>
    );
}
