import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetupRequired() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl border-yellow-500/20 bg-card shadow-2xl shadow-yellow-500/5">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">Configuração Necessária</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium text-lg">
                            As variáveis de ambiente do Supabase não foram detectadas.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                            Para que o sistema funcione corretamente na <strong>Vercel</strong>, você precisa adicionar as seguintes variáveis nas configurações do projeto:
                        </p>

                        <div className="bg-muted p-4 rounded-lg border border-border space-y-3 font-mono text-sm overflow-x-auto">
                            <div className="flex items-center gap-2 text-primary">
                                <Terminal className="h-4 w-4" />
                                <span className="font-bold">Environment Variables</span>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground">VITE_SUPABASE_URL</span>
                                    <code className="bg-background px-2 py-1 rounded border border-border select-all">
                                        https://iabxpzqmhylmozzcwck.supabase.co
                                    </code>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground">VITE_SUPABASE_ANON_KEY</span>
                                    <code className="bg-background px-2 py-1 rounded border border-border select-all">
                                        (Sua Anon Key do Supabase Project Settings API)
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-yellow-600/80 bg-yellow-500/5 px-4 py-3 rounded-md border border-yellow-500/10">
                            <strong>Dica:</strong> Vá em <em>Settings &gt; Environment Variables</em> no painel da Vercel e adicione essas chaves tanto para <strong>Production</strong> quanto para <strong>Preview</strong>.
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="min-w-[200px]"
                        >
                            Já configurei, recarregar página
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
