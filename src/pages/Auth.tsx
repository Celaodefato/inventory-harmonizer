import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const { error } = isRegistering
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 bg-card shadow-2xl shadow-primary/10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Shield className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold tracking-tight">Endpoint Compass</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Inventory Harmonizer SOC v2.0
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg bg-muted/30 p-4 border border-border flex gap-3">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isRegistering
                                ? "Crie uma nova conta administrativa para gerenciar os ativos."
                                : "Acesso Restrito. Entre com suas credenciais corporativas."}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="password">Senha</label>
                            <input
                                id="password"
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {errorMsg && (
                            <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20 text-center">
                                {errorMsg}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
                        </Button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setErrorMsg(null);
                                }}
                                className="text-sm text-primary hover:underline"
                            >
                                {isRegistering ? 'Já possui conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                            </button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border mt-2 pt-6">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                        Secure Access Gateway
                    </span>
                </CardFooter>
            </Card>
        </div>
    );
}
