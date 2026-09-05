import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useInstalarApp } from '@/hooks/useInstalarApp';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { Download, Moon, Sun } from 'lucide-react';

export function Login() {
  const { session, profile, signIn, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) {
    return <Navigate to={profile?.role === 'CLIENTE' ? '/portal' : '/admin'} replace />;
  }

  const { podeInstalar, mostrarDicaIOS, instalado, instalar } = useInstalarApp();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      await signIn(String(fd.get('email')), String(fd.get('password')));
      nav('/admin');
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center p-4">
      <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Tema">
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader>
          <div className="mb-3 w-fit rounded-md bg-white px-3 py-2">
            <img src="/logo-netcell.png" alt="NetCell Informática" className="h-10 w-auto" />
          </div>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input name="email" type="email" placeholder="E-mail" required autoComplete="username" />
            <Input
              name="password"
              type="password"
              placeholder="Senha"
              required
              autoComplete="current-password"
            />
            {err && <p className="text-sm text-accent">{err}</p>}
            <Button type="submit" className="w-full" loading={busy}>
              Entrar
            </Button>
          </form>

          {!instalado && (podeInstalar || mostrarDicaIOS) && (
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() =>
                podeInstalar
                  ? instalar()
                  : alert('Para instalar: toque no botão Compartilhar do Safari e escolha "Adicionar à Tela de Início".')
              }
            >
              <Download className="size-4" /> Instalar app no aparelho
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
