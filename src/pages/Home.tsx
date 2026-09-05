import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Home() {
  const { session, profile, loading } = useAuth();

  // já logado? pula a página de vendas e vai direto pro destino de sempre.
  if (!loading && session) {
    return <Navigate to={profile?.role === 'CLIENTE' ? '/portal' : '/admin'} replace />;
  }

  return (
    <main className="min-h-dvh">
      <header className="container flex h-16 items-center justify-between">
        <span className="font-display text-lg font-bold tracking-widest">
          NETCELL <span className="text-accent">·</span>{' '}
          <span className="text-sm text-muted-foreground">INFORMÁTICA</span>
        </span>
        <Link to="/login" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <LogIn className="size-4" /> Entrar
        </Link>
      </header>

      <section className="container flex flex-col items-start gap-6 py-24 animate-fade-in">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Locação de equipamentos · Suporte de TI · Internet Starlink
        </span>
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          Tecnologia que mantém o seu negócio <span className="text-brand">conectado</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Aluguel de Starlink, suporte técnico, manutenção de equipamentos e muito mais.
          Já é cliente ou faz parte da equipe? Entre para acompanhar contratos, chamados e ordens de serviço.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/login" className={cn(buttonVariants({ size: 'lg' }))}>
            <LogIn className="size-4" /> Entrar
          </Link>
          <a
            href="https://netcellinformatica.com.br"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Conhecer os serviços <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
