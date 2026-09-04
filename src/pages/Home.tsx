import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, UserRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Home() {
  return (
    <main className="min-h-dvh">
      <header className="container flex h-16 items-center">
        <span className="font-display text-lg font-bold tracking-widest">
          NETCELL <span className="text-accent">·</span>{' '}
          <span className="text-sm text-muted-foreground">ERP</span>
        </span>
      </header>
      <section className="container flex flex-col items-start gap-6 py-24 animate-fade-in">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Plataforma NetCell Informática
        </span>
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          Gestão de <span className="text-brand">locação</span>, TI e Starlink
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Clientes, contratos, ordens de serviço, estoque e financeiro — integrados ao Supabase.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin" className={cn(buttonVariants())}>
            <LayoutDashboard className="size-4" /> Área administrativa
          </Link>
          <Link to="/portal" className={cn(buttonVariants({ variant: 'outline' }))}>
            <UserRound className="size-4" /> Portal do cliente
          </Link>
          <a href="https://netcellinformatica.com.br" className={cn(buttonVariants({ variant: 'link' }))}>
            Site institucional <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
