import { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Download, Search, CheckCircle2, AlertCircle, XCircle, User } from 'lucide-react';
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
import { getCsvData } from '@/lib/storage';
import { getTerminatedEmployees } from '@/lib/storage';
import { compareUsers, calculateUserStats, exportUsersToCSV } from '@/lib/users';
import { UserComparison, UserComplianceStatus, JumpCloudUser, WarpUser } from '@/types/inventory';
import { cn } from '@/lib/utils';

export default function UsersPage() {
    const [users, setUsers] = useState<UserComparison[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<UserComplianceStatus | 'all'>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const csvData = await getCsvData();
            const terminatedEmployees = await getTerminatedEmployees();

            // Parse JumpCloud users from CSV
            const jumpCloudUsers: JumpCloudUser[] = csvData.jumpcloud_users || [];

            // Parse Warp users from CSV
            const warpUsers: WarpUser[] = (csvData.warp || []).map((row: any) => ({
                email: row.Email || row.email || '',
                activeDeviceCount: parseInt(row['Active Device Count'] || row.activeDeviceCount || '0', 10)
            })).filter((u: WarpUser) => u.email);

            const comparedUsers = compareUsers(jumpCloudUsers, warpUsers, terminatedEmployees);
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
        const csv = exportUsersToCSV(filteredUsers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
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
            case 'terminated_active':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Desligado Ativo
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
                    <Button onClick={handleExport} disabled={filteredUsers.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total de Usuários</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                Compliant
                            </CardDescription>
                            <CardTitle className="text-3xl text-success">{stats.compliant}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-warning" />
                                Faltando Warp
                            </CardDescription>
                            <CardTitle className="text-3xl text-warning">{stats.missingWarp}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-destructive" />
                                Desligados Ativos
                            </CardDescription>
                            <CardTitle className="text-3xl text-destructive">{stats.terminatedActive}</CardTitle>
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
                                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Dispositivos</th>
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
                                            <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                                {user.warpDeviceCount || 0}
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
