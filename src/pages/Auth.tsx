import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) console.error('Error logging in with Google:', error.message);
        setLoading(false);
    };

    const handleJumpCloudLogin = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithSSO({
            domain: 'jumpcloud.com', // O domínio configurado no JumpCloud/Supabase
            options: {
                redirectTo: window.location.origin,
            }
        });

        if (error) {
            console.error('Error logging in with JumpCloud:', error.message);
            setLoading(false);
        } else if (data?.url) {
            window.location.href = data.url;
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
                            Bem-vindo ao portal de conformidade. Utilize sua conta corporativa para acessar o dashboard.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <Button
                            className="w-full h-12 text-lg font-bold bg-[#4285F4] hover:bg-[#4285F4]/90 text-white transition-all flex gap-3"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {loading ? 'Conectando...' : 'Google Workspace'}
                        </Button>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground font-mono">OU</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-bold border-primary/30 hover:bg-primary/5 text-foreground transition-all flex gap-3"
                            onClick={handleJumpCloudLogin}
                            disabled={loading}
                        >
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Shield className="h-3 w-3 text-primary-foreground" />
                            </div>
                            {loading ? 'Conectando...' : 'Entrar com JumpCloud'}
                        </Button>
                    </div>
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
