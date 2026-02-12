import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error("Login error:", error.message);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">Compliance Harmonizer</CardTitle>
                    <CardDescription>
                        Acesse o portal de conformidade de endpoints
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button
                        onClick={handleGoogleLogin}
                        className="h-12 w-full gap-2 text-lg font-medium transition-all hover:scale-[1.02]"
                        variant="default"
                    >
                        <LogIn className="h-5 w-5" />
                        Entrar com Google
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Acesso restrito para administradores autorizados.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
