import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Download, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { ERP_MODULES, hasPermission } from '@/shared';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useInstalarApp } from '@/hooks/useInstalarApp';
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

function BotaoInstalar() {
  const { podeInstalar, mostrarDicaIOS, instalado, instalar } = useInstalarApp();
  if (instalado) return null;

  if (podeInstalar) {
    return (
      <Button variant="outline" size="sm" onClick={instalar}>
        <Download className="size-4" />
        <span className="hidden sm:inline">Instalar app</span>
      </Button>
    );
  }
  if (mostrarDicaIOS) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          alert('Para instalar: toque no botão Compartilhar do Safari e escolha "Adicionar à Tela de Início".')
        }
      >
        <Download className="size-4" />
        <span className="hidden sm:inline">Instalar app</span>
      </Button>
    );
  }
  return null;
}

function LogoHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center justify-between border-b px-5">
      <div className="rounded-md bg-white px-2.5 py-1.5">
        <img src="/logo-netcell.png" alt="NetCell Informática" className="h-8 w-auto" />
      </div>
      {onClose && (
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Fechar menu" onClick={onClose}>
          <X className="size-5" />
        </Button>
      )}
    </div>
  );
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth();
  if (!profile) return null;
  const visible = ERP_MODULES.filter((m) => hasPermission(profile.role, `${m.resource}:read`));

  return (
    <nav className="space-y-6 p-4" onClick={onNavigate}>
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
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <LogoHeader />
        <NavGroups />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Fechar menu" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[82%] flex-col overflow-y-auto border-r bg-card">
            <LogoHeader onClose={onClose} />
            <NavGroups onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b bg-card px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onMenu && (
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={onMenu}>
            <Menu className="size-5" />
          </Button>
        )}
        <div className="min-w-0 truncate text-sm text-muted-foreground">
          Olá, <span className="font-medium text-foreground">{profile?.name}</span>
          <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs uppercase">{profile?.role}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <BotaoInstalar />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} />
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
