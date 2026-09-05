import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createDisposableAuthClient, supabase } from '@/lib/supabase';
import { getOne, updateRow } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { useAuth } from '@/lib/auth';
import { ROLES, hasPermission, type Role } from '@/shared';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';

type Row = { id: string; name: string; email: string | null; role: Role; is_active: boolean; created_at: string };

export function Usuarios() {
  const { profile } = useAuth();
  const canCreate = !!profile && hasPermission(profile.role, 'users:create');
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'profiles',
    searchColumns: ['name', 'email'],
    orderBy: 'created_at',
    ascending: true,
  });

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Contas de acesso ao sistema"
        action={canCreate ? { to: '/admin/usuarios/novo', label: 'Novo usuário' } : undefined}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Nome ou e-mail…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="divide-y rounded-md border bg-card">
            {(result?.data ?? []).map((u) => (
              <Link
                key={u.id}
                to={`/admin/usuarios/${u.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name || '(sem nome)'}</p>
                  <p className="truncate text-muted-foreground">{u.email ?? '—'}</p>
                </div>
                <Badge className="bg-muted text-muted-foreground">{u.role}</Badge>
                <Badge className={u.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-accent/15 text-accent'}>
                  {u.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <span className="text-muted-foreground">{formatDate(u.created_at)}</span>
              </Link>
            ))}
            {result?.data.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum usuário ainda.</p>
            )}
          </div>
          <Pagination page={page} totalPages={result?.totalPages ?? 1} count={result?.count ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export function UsuarioForm() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TECNICO');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function gerarSenha() {
    const s = Math.random().toString(36).slice(-6) + Math.ceil(Math.random() * 9);
    setPassword(s);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const client = createDisposableAuthClient();
      const { error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name, role } },
      });
      if (error) throw new Error(error.message);
      nav('/admin/usuarios');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Novo usuário" subtitle="Cria um login de acesso ao sistema" />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nome *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">E-mail *</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Senha provisória *</label>
          <div className="flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            <Button type="button" variant="outline" onClick={gerarSenha}>
              Gerar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Repasse essa senha ao usuário — ele pode trocá-la depois de entrar.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Papel *</label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} required>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {err && <p className="text-sm text-accent">{err}</p>}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            Criar usuário
          </Button>
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function UsuarioEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile: me } = useAuth();
  const canWrite = !!me && hasPermission(me.role, 'users:update');
  const [row, setRow] = useState<Row | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('TECNICO');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    getOne<Row>('profiles', id!).then((r) => {
      if (!r) return nav('/admin/usuarios');
      setRow(r);
      setName(r.name);
      setRole(r.role);
    });
  }, [id, nav]);

  if (!row) return <Spinner />;

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const updated = await updateRow<Row>('profiles', row!.id, { name, role });
      setRow(updated);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function alternarAtivo() {
    setBusy(true);
    try {
      const updated = await updateRow<Row>('profiles', row!.id, { is_active: !row!.is_active });
      setRow(updated);
    } finally {
      setBusy(false);
    }
  }

  async function alterarMinhaSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw new Error(error.message);
      setNovaSenha('');
      setPwMsg('Senha alterada.');
    } catch (e) {
      setPwMsg((e as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  async function enviarResetSenha() {
    if (!row!.email) return setPwMsg('Este usuário não tem e-mail cadastrado.');
    setPwBusy(true);
    setPwMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(row!.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw new Error(error.message);
      setPwMsg(`E-mail de redefinição enviado para ${row!.email}.`);
    } catch (e) {
      setPwMsg((e as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  const isSelf = me?.id === row.id;

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title={row.name || row.email || 'Usuário'} subtitle={row.email ?? undefined} />

      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-medium">Status da conta</p>
            <p className="text-sm text-muted-foreground">Desativar bloqueia o acesso sem apagar a conta.</p>
          </div>
          <Badge className={row.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-accent/15 text-accent'}>
            {row.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
          {canWrite && (
            <Button type="button" variant="outline" disabled={busy} onClick={alternarAtivo}>
              {row.is_active ? 'Desativar' : 'Ativar'}
            </Button>
          )}
        </CardContent>
      </Card>

      <form onSubmit={salvar} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Papel</label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={!canWrite} required>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {err && <p className="text-sm text-accent">{err}</p>}
        {canWrite && (
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => nav('/admin/usuarios')}>
              Voltar
            </Button>
          </div>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSelf ? (
            <form onSubmit={alterarMinhaSenha} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nova senha</label>
                <Input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" loading={pwBusy}>
                Alterar senha
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Envia um e-mail para {row.email ?? 'o usuário'} com um link para ele definir uma nova senha.
              </p>
              <Button type="button" variant="outline" loading={pwBusy} disabled={!canWrite} onClick={enviarResetSenha}>
                Resetar senha (enviar link)
              </Button>
            </div>
          )}
          {pwMsg && <p className="text-sm text-muted-foreground">{pwMsg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
