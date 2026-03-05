import { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Download, Upload, Search, CheckCircle2, AlertCircle, XCircle, User, FileText } from 'lucide-react';
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
    DialogFooter,
} from "@/components/ui/dialog";
import { getCsvData, saveCsvData } from '@/lib/storage';
import { getTerminatedEmployees } from '@/lib/storage';
import { parseJumpCloudUsersCsv, parseWarpUsersCsv } from '@/lib/csv';
import { compareUsers, calculateUserStats, exportUsersToCSV } from '@/lib/users';
import { UserComparison, UserComplianceStatus, JumpCloudUser, WarpUser } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
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
            .channel('users-page-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'terminated_employees' },
                () => {
                    loadUsers();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_data' },
                () => {
                    loadUsers();
                }
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

            console.log('[Debug] Dados CSV carregados:', Object.keys(csvData).filter(k => (csvData as any)[k]));
            console.log('[Debug] JumpCloud Users Raw:', csvData.jumpcloud_users?.length);
            console.log('[Debug] Warp Users Raw:', csvData.warp?.length);

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

            // Pass empty arrays for the new sources as this page doesn't manage them
            const comparedUsers = compareUsers(
                jumpCloudUsers,
                warpUsers,
                [],
                [],
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

        try {
            const csv = exportUsersToCSV(filteredUsers);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Erro na exportação',
                description: 'Não foi possível gerar o arquivo CSV.',
                variant: 'destructive',
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tool: 'jumpcloud_users' | 'warp') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result as string;
            let result;

            if (tool === 'jumpcloud_users') {
                result = parseJumpCloudUsersCsv(text);
            } else {
                result = parseWarpUsersCsv(text);
            }

            if (result.error) {
                toast({
                    title: 'Erro no arquivo',
                    description: result.error,
                    variant: 'destructive',
                });
                setIsProcessing(false);
                return;
            }

            try {
                await saveCsvData(tool, result.data, {
                    tool: tool,
                    filename: file.name,
                    timestamp: new Date().toISOString(),
                    count: result.count
                });

                toast({
                    title: 'Sucesso!',
                    description: `${file.name} importado com sucesso (${result.count} usuários).`,
                });

                // loadUsers will be triggered by supabase subscription
            } catch (err) {
                toast({
                    title: 'Erro ao salvar',
                    description: 'Não foi possível persistir os dados no banco.',
                    variant: 'destructive',
                });
            } finally {
                setIsProcessing(false);
                // Clear input
                event.target.value = '';
            }
        };

        reader.onerror = () => {
            toast({
                title: 'Erro na leitura',
                description: 'Não foi possível ler o arquivo selecionado.',
                variant: 'destructive',
            });
            setIsProcessing(false);
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
                return (
                    <Badge variant="outline" className="border-warning text-warning">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Faltando Warp
                    </Badge>
                );
            case 'missing_jumpcloud':
                return (
                    <Badge variant="outline" className="border-warning text-warning">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Faltando JumpCloud
                    </Badge>
                );
            case 'missing_hacker_ranger':
                return (
                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Faltando Hacker Rangers
                    </Badge>
                );
            case 'terminated_active':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Desligado Ativo
                    </Badge>
                );
            case 'ghost_account':
                return (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                        <XCircle className="mr-1 h-3 w-3" />
                        Conta Zumbi (Fora do RH)
                    </Badge>
                );
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
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
                        <p className="text-muted-foreground">
                            Comparação entre JumpCloud e Warp
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importar CSV
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Importar Dados de Usuários</DialogTitle>
                                    <DialogDescription>
                                        Selecione os arquivos CSV para comparar os inventários.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-6 py-4">
                                    {/* JumpCloud Upload */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium leading-none">JumpCloud (Users)</label>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Colunas: Email, Nome</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                id="jc-upload"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, 'jumpcloud_users')}
                                                disabled={isProcessing}
                                            />
                                            <Button
                                                variant="secondary"
                                                className="w-full justify-start border-2 border-dashed h-16 hover:border-primary/50 transition-all"
                                                onClick={() => document.getElementById('jc-upload')?.click()}
                                                disabled={isProcessing}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold uppercase">Clique para selecionar</p>
                                                        <p className="text-[10px] text-muted-foreground">CSV exportado do JumpCloud Users</p>
                                                    </div>
                                                </div>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Warp Upload */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium leading-none">Warp (Usuários)</label>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Colunas: Email, Dispositivos</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                id="warp-upload"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, 'warp')}
                                                disabled={isProcessing}
                                            />
                                            <Button
                                                variant="secondary"
                                                className="w-full justify-start border-2 border-dashed h-16 hover:border-primary/50 transition-all"
                                                onClick={() => document.getElementById('warp-upload')?.click()}
                                                disabled={isProcessing}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold uppercase truncate">Warp CSV</p>
                                                    </div>
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Fechar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button onClick={handleExport} disabled={filteredUsers.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3 px-4">
                            <CardDescription>Total Usuários</CardDescription>
                            <CardTitle className="text-2xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3 px-4">
                            <CardDescription className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-success" />
                                Compliant
                            </CardDescription>
                            <CardTitle className="text-2xl text-success">{stats.compliant}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3 px-4">
                            <CardDescription className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-warning" />
                                Faltando Warp
                            </CardDescription>
                            <CardTitle className="text-2xl text-warning">{stats.missingWarp}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3 px-4">
                            <CardDescription className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-3 w-3" />
                                Deslig. Ativo
                            </CardDescription>
                            <CardTitle className="text-2xl text-destructive">{stats.terminatedActive}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="missing_warp">Faltando Warp</SelectItem>
                            <SelectItem value="missing_jumpcloud">Faltando JumpCloud</SelectItem>
                            <SelectItem value="terminated_active">Desligados Ativos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <UsersIcon className="mb-4 h-12 w-12 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium text-foreground">
                                {search || statusFilter !== 'all' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {search || statusFilter !== 'all'
                                    ? 'Tente ajustar os filtros de busca'
                                    : 'Faça upload dos CSVs do JumpCloud e Warp'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Nome</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">JumpCloud</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Warp</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.map((user, index) => (
                                        <tr
                                            key={user.email}
                                            className={cn(
                                                "transition-colors hover:bg-muted/30",
                                                index % 2 === 0 ? "bg-background" : "bg-muted/10"
                                            )}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-foreground">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                {user.inJumpCloud ? (
                                                    <CheckCircle2 className="inline h-5 w-5 text-success" />
                                                ) : (
                                                    <XCircle className="inline h-5 w-5 text-muted-foreground/30" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {user.inWarp ? (
                                                    <CheckCircle2 className="inline h-5 w-5 text-success" />
                                                ) : (
                                                    <XCircle className="inline h-5 w-5 text-muted-foreground/30" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(user.complianceStatus)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {filteredUsers.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                        Mostrando {filteredUsers.length} de {users.length} usuário(s)
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
