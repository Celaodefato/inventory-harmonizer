import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Download, Upload, Search, CheckCircle2, AlertCircle, XCircle, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getCsvData, saveCsvData, getTerminatedEmployees } from '@/lib/storage';
import { parseJumpCloudUsersCsv, parseWarpUsersCsv, parseHackerRangersCsv, parseBaseRhCsv } from '@/lib/csv';
import { compareUsers, calculateUserStats, exportUsersToCSV } from '@/lib/users';
import { UserComparison, UserComplianceStatus, JumpCloudUser, WarpUser, HackerRangerUser, BaseRhUser } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function UserCompliancePage() {
    const [users, setUsers] = useState<UserComparison[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<UserComplianceStatus | 'all'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadUsers();

        const channel = supabase
            .channel('compliance-page-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'terminated_employees' },
                () => loadUsers()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_data' },
                () => loadUsers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const csvData = await getCsvData();
            const terminatedEmployees = await getTerminatedEmployees();

            const jumpCloudUsers: JumpCloudUser[] = (csvData.jumpcloud_users || []).map((row: any) => ({
                email: row.email || row.Email || row.username || '',
                firstname: row.firstname || row['first name'] || '',
                lastname: row.lastname || row['last name'] || '',
                state: row.state || 'ACTIVATED'
            })).filter(u => u.email);

            const warpUsers: WarpUser[] = (csvData.warp || []).map((row: any) => ({
                email: row.email || row.Email || row.userEmail || '',
                activeDeviceCount: typeof row.activeDeviceCount === 'number'
                    ? row.activeDeviceCount
                    : parseInt(row.activeDeviceCount || row['active device count'] || '0', 10)
            })).filter((u: WarpUser) => u.email);

            const hackerRangerUsers: HackerRangerUser[] = (csvData.hacker_ranger || []).map((row: any) => ({
                email: row.email || '',
                name: row.name || row.nome || '',
                status: row.status || 'Ativo'
            })).filter(u => u.email);

            const baseRhUsers: BaseRhUser[] = (csvData.base_rh || []).map((row: any) => ({
                email: row.email || '',
                name: row.name || row.nome || '',
                status: row.status || 'Ativo',
                department: row.department || row.departamento || ''
            })).filter(u => u.email);

            const comparedUsers = compareUsers(
                jumpCloudUsers,
                warpUsers,
                hackerRangerUsers,
                baseRhUsers,
                terminatedEmployees
            );
            setUsers(comparedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => calculateUserStats(users), [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || user.complianceStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [users, search, statusFilter]);

    const handleExport = () => {
        if (filteredUsers.length === 0) return;
        const csv = exportUsersToCSV(filteredUsers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `conformidade_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tool: 'jumpcloud_users' | 'warp' | 'hacker_ranger' | 'base_rh') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result as string;
            let result;

            if (tool === 'jumpcloud_users') result = parseJumpCloudUsersCsv(text);
            else if (tool === 'warp') result = parseWarpUsersCsv(text);
            else if (tool === 'hacker_ranger') result = parseHackerRangersCsv(text);
            else result = parseBaseRhCsv(text);

            if (result.error) {
                toast({ title: 'Erro no arquivo', description: result.error, variant: 'destructive' });
                setIsProcessing(false);
                return;
            }

            try {
                await saveCsvData(tool, result.data, {
                    tool,
                    filename: file.name,
                    timestamp: new Date().toISOString(),
                    count: result.count
                });
                toast({ title: 'Sucesso!', description: `${file.name} importado com sucesso.` });
            } catch (err) {
                toast({ title: 'Erro ao salvar', description: 'Erro ao persistir no banco.', variant: 'destructive' });
            } finally {
                setIsProcessing(false);
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const getStatusBadge = (status: UserComplianceStatus) => {
        switch (status) {
            case 'compliant':
                return (
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Compliant
                    </Badge>
                );
            case 'missing_warp':
                return <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="mr-1 h-3 w-3" /> Faltando Warp</Badge>;
            case 'missing_jumpcloud':
                return <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="mr-1 h-3 w-3" /> Faltando JumpCloud</Badge>;
            case 'missing_hacker_ranger':
                return <Badge variant="outline" className="border-orange-500 text-orange-500"><AlertCircle className="mr-1 h-3 w-3" /> Faltando Treino</Badge>;
            case 'terminated_active':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Desligado Ativo</Badge>;
            case 'ghost_account':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Zumbi (Fora do RH)</Badge>;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6 lg:p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Conformidade e De/Para</h1>
                        <p className="text-muted-foreground">RH vs Hacker Rangers vs JumpCloud vs Warp</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar Dados</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Importar Bases de Usuários</DialogTitle>
                                    <DialogDescription>Selecione os CSVs para atualizar a conformidade.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {[
                                        { id: 'rh-upload', label: 'BASE RH (Fonte Mestra)', color: 'bg-green-500', tool: 'base_rh' },
                                        { id: 'hr-upload', label: 'Hacker Rangers', color: 'bg-orange-500', tool: 'hacker_ranger' },
                                        { id: 'jc-upload', label: 'JumpCloud Users', color: 'bg-blue-500', tool: 'jumpcloud_users' },
                                        { id: 'warp-upload', label: 'Warp (Usuários)', color: 'bg-purple-500', tool: 'warp' },
                                    ].map((item) => (
                                        <div key={item.id} className="space-y-2">
                                            <label className="text-sm font-medium">{item.label}</label>
                                            <div className="relative">
                                                <input type="file" accept=".csv" id={item.id} className="hidden" onChange={(e) => handleFileUpload(e, item.tool as any)} disabled={isProcessing} />
                                                <Button variant="secondary" className="w-full justify-start border-2 border-dashed h-12 hover:border-primary/50" onClick={() => document.getElementById(item.id)?.click()} disabled={isProcessing}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(item.color + "/10", "p-1.5 rounded-lg text-" + item.color.split('-')[1] + "-500")}>
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase">{item.label} CSV</span>
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleExport} disabled={filteredUsers.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Exportar
                        </Button>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        { label: 'Total Usuários', value: stats.total, color: 'text-foreground' },
                        { label: 'Compliant', value: stats.compliant, color: 'text-success', icon: <CheckCircle2 className="h-3 w-3" /> },
                        { label: 'Faltando Treino', value: stats.missingHackerRanger, color: 'text-warning', icon: <AlertCircle className="h-3 w-3" /> },
                        { label: 'Contas Zumbi', value: stats.ghostAccounts, color: 'text-destructive', icon: <XCircle className="h-3 w-3" /> },
                        { label: 'Deslig. Ativo', value: stats.terminatedActive, color: 'text-destructive', icon: <XCircle className="h-3 w-3" /> },
                    ].map(stat => (
                        <Card key={stat.label}>
                            <CardHeader className="pb-3 px-4">
                                <CardDescription className="flex items-center gap-1">{stat.icon} {stat.label}</CardDescription>
                                <CardTitle className={cn("text-2xl", stat.color)}>{stat.value}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por nome ou email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="compliant">Compliant</SelectItem>
                                    <SelectItem value="missing_hacker_ranger">Faltando Treino</SelectItem>
                                    <SelectItem value="missing_jumpcloud">Faltando JumpCloud</SelectItem>
                                    <SelectItem value="missing_warp">Faltando Warp</SelectItem>
                                    <SelectItem value="ghost_account">Contas Zumbi</SelectItem>
                                    <SelectItem value="terminated_active">Desligados Ativos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Nome</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        {['RH', 'JC', 'HR', 'Warp'].map(h => (
                                            <th key={h} className="px-4 py-3 text-center text-[10px] font-bold uppercase">{h}</th>
                                        ))}
                                        <th className="px-4 py-3 text-left font-medium">Status de Conformidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={`${user.email}-${user.name}`} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{user.email}</td>
                                                {[user.inBaseRh, user.inJumpCloud, user.inHackerRanger, user.inWarp].map((present, i) => (
                                                    <td key={i} className="px-4 py-3 text-center">
                                                        {present ? <CheckCircle2 className="inline h-5 w-5 text-success" /> : <XCircle className="inline h-5 w-5 text-muted-foreground/20" />}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">{getStatusBadge(user.complianceStatus)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-border p-4 text-xs text-muted-foreground text-center">
                            Mostrando {filteredUsers.length} de {users.length} usuário(s)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
