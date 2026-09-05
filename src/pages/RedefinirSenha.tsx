import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui';

function irParaLogin() {
  window.location.hash = '#/login';
  window.location.reload();
}

/**
 * Destino do link enviado por "Resetar senha". O e-mail do Supabase volta
 * pra cá com o token de recuperação no hash da URL; aqui a gente abre a
 * sessão temporária, deixa a pessoa definir a nova senha e desloga.
 * Renderiza fora do roteador (não usa useNavigate) — o token vem no hash.
 */
export function RedefinirSenha() {
  const [ready, setReady] = useState(false);
  const [erroToken, setErroToken] = useState<string | null>(null);
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(raw);
    const errDesc = params.get('error_description');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (errDesc) {
      setErroToken(errDesc);
      setReady(true);
      return;
    }
    if (!accessToken || !refreshToken) {
      setErroToken('Link inválido ou expirado. Peça um novo link de redefinição de senha.');
      setReady(true);
      return;
    }
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) setErroToken(error.message);
      window.history.replaceState(null, '', window.location.pathname);
      setReady(true);
    });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      setMsg('Senha definida! Redirecionando para o login…');
      setTimeout(irParaLogin, 1500);
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  }

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-3 w-fit rounded-md bg-white px-3 py-2">
            <img src="/logo-netcell.png" alt="NetCell Informática" className="h-10 w-auto" />
          </div>
          <CardTitle>Definir nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          {erroToken ? (
            <div className="space-y-3">
              <p className="text-sm text-accent">{erroToken}</p>
              <Button variant="outline" onClick={irParaLogin}>
                Ir para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Nova senha (mínimo 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
              {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              <Button type="submit" className="w-full" loading={busy}>
                Salvar nova senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
