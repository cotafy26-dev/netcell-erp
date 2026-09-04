import { NavLink, useNavigate, Navigate, Outlet } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { ERP_MODULES, hasPermission } from '@/shared';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Button, Spinner } from './ui';
import { cn } from '@/lib/utils';

const GROUPS = ['Gestão', 'Comercial', 'Operação', 'Financeiro', 'Atendimento'] as const;

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" aria-label="Tema" onClick={toggle}>
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function Sidebar() {
  const { profile } = useAuth();
  if (!profile) return null;
  const visible = ERP_MODULES.filter((m) => hasPermission(profile.role, `${m.resource}:read`));

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-16 items-center gap-2 border-b px-5 font-display font-bold tracking-widest">
        NETCELL <span className="text-accent">·</span>
        <span className="text-sm text-muted-foreground">ERP</span>
      </div>
      <nav className="space-y-6 p-4">
        {GROUPS.map((g) => {
          const items = visible.filter((m) => m.group === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
              <ul className="space-y-1">
                {items.map((m) => {
                  const Icon = (Icons[m.icon as keyof typeof Icons] ?? Icons.Circle) as Icons.LucideIcon;
                  return (
                    <li key={m.key}>
                      <NavLink
                        to={m.path}
                        end={m.path === '/admin'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-brand/15 font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        <Icon className="size-4" />
                        {m.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="text-sm text-muted-foreground">
        Olá, <span className="font-medium text-foreground">{profile?.name}</span>
        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs uppercase">{profile?.role}</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sair"
          onClick={async () => {
            await signOut();
            nav('/login');
          }}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

/** Exige sessão. `staffOnly` bloqueia o papel CLIENTE (que vai pro /portal). */
export function RequireAuth({ staffOnly }: { staffOnly?: boolean }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (staffOnly && profile?.role === 'CLIENTE') return <Navigate to="/portal" replace />;
  return <Outlet />;
}

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PortalLayout() {
  return (
    <div className="min-h-dvh">
      <Topbar />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
