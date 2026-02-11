import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { User, Lock, Mail, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: "Senhas não conferem",
                description: "A nova senha e a confirmação devem ser iguais.",
                variant: "destructive"
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: "Senha muito curta",
                description: "A senha deve ter pelo menos 6 caracteres.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            toast({
                title: "Erro ao atualizar senha",
                description: error.message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Senha atualizada!",
                description: "Sua senha foi alterada com sucesso.",
            });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    if (!user) return null;

    return (
        <MainLayout>
            <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Gerencie suas informações e credenciais de acesso
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Informações da Conta
                            </CardTitle>
                            <CardDescription>Detalhes do seu usuário atual</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">E-mail</p>
                                    <p className="text-sm font-bold">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Criado em</p>
                                    <p className="text-sm font-bold">
                                        {user.created_at ? format(new Date(user.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Função</p>
                                    <p className="text-sm font-bold">{user.role === 'authenticated' ? 'Administrador' : user.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription>Defina uma nova senha para sua conta</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="new-password">Nova Senha</label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="confirm-password">Confirmar Nova Senha</label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirme a nova senha"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full font-bold"
                                    disabled={loading || !newPassword || !confirmPassword}
                                >
                                    {loading ? 'Atualizando...' : 'Atualizar Senha'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
