import { LayoutDashboard, Settings, FileText, AlertTriangle, Server, UserX, LogOut } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Configurar APIs', href: '/api-config', icon: Settings },
  { name: 'Desligados', href: '/terminated', icon: UserX },
  { name: 'Logs / Erros', href: '/logs', icon: FileText },
  { name: 'Alertas', href: '/alerts', icon: AlertTriangle },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-primary/10">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground uppercase">Inventory</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-medium">Harmonizer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-sidebar-border p-4 bg-sidebar-background/50">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-background p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monitorando</span>
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              </div>
              <p className="text-xs font-medium text-sidebar-foreground">
                5 Fontes Ativas
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-1">Tema</span>
              <ThemeToggle />
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors group"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
