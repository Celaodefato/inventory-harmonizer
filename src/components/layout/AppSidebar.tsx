import { LayoutDashboard, Settings, FileText, AlertTriangle, Server, UserX } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Configurar APIs', href: '/api-config', icon: Settings },
  { name: 'Desligados', href: '/terminated', icon: UserX },
  { name: 'Logs / Erros', href: '/logs', icon: FileText },
  { name: 'Alertas', href: '/alerts', icon: AlertTriangle },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Server className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">Inventory</h1>
            <p className="text-xs text-muted-foreground">Comparator</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-md shadow-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex-1 rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs text-muted-foreground">
                5 fontes configuradas
              </p>
              <p className="mt-1 text-xs text-primary">
                Vicarius • Cortex • Warp • PAM • JumpCloud
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
