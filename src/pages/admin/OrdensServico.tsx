import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Plus, Trash2 } from 'lucide-react';
import { SERVICE_ORDER_STATUS } from '@/shared';
import { supabase } from '@/lib/supabase';
import { deleteRow, getOne, insertRow, updateRow } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Spinner,
  Table, TBody, TD, TH, THead, TR, Textarea,
} from '@/components/ui';
import { brl, cn, formatDate } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  ABERTA: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  EM_EXECUCAO: 'bg-brand/20 text-foreground',
  PAUSADA: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  AGUARDANDO_CLIENTE: 'bg-muted text-muted-foreground',
  FINALIZADA: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  CANCELADA: 'bg-accent/15 text-accent',
};

type Row = { id: string; number: string; title: string; status: string; totalValue: string | null; Customer: { name: string } | null };

export function OrdensServico() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'ServiceOrder',
    select: '*, Customer(name)',
    searchColumns: ['number', 'title'],
  });

  return (
    <div>
      <PageHeader title="Ordens de Serviço" subtitle="Atendimentos técnicos" action={{ to: '/admin/os/novo', label: 'Nova OS' }} />
      <SearchBar value={search} onChange={setSearch} placeholder="Número ou título…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>OS</TH>
                <TH>Cliente</TH>
                <TH>Título</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link to={`/admin/os/${o.id}`} className="font-mono font-medium hover:underline">
                      {o.number}
                    </Link>
                  </TD>
                  <TD>{o.Customer?.name ?? '—'}</TD>
                  <TD>{o.title}</TD>
                  <TD className="text-right">{o.totalValue ? brl(o.totalValue) : '—'}</TD>
                  <TD>
                    <Badge className={STATUS_STYLE[o.status]}>{o.status}</Badge>
                  </TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhuma OS.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
          <Pagination page={page} totalPages={result?.totalPages ?? 1} count={result?.count ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export function OSForm() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('Customer')
      .select('id, name')
      .is('deletedAt', null)
      .order('name')
      .limit(500)
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const so = await insertRow<{ id: string }>('ServiceOrder', {
        customerId: fd.get('customerId'),
        title: fd.get('title'),
        description: fd.get('description') || null,
        scheduledAt: fd.get('scheduledAt') || null,
        laborValue: fd.get('laborValue') ? Number(fd.get('laborValue')) : null,
      });
      nav(`/admin/os/${so.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Nova OS" subtitle="O número é gerado automaticamente" />
      <form onSubmit={onSubmit} className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Cliente *</label>
          <Select name="customerId" required>
            <option value="">—</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Título *</label>
          <Input name="title" required />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Descrição</label>
          <Textarea name="description" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Agendada para</label>
          <Input name="scheduledAt" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Mão de obra (R$)</label>
          <Input name="laborValue" type="number" step="0.01" />
        </div>
        {err && <p className="text-sm text-accent sm:col-span-2">{err}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={busy}>
            Abrir OS
          </Button>
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

type OS = {
  id: string;
  number: string;
  title: string;
  status: string;
  laborValue: string | null;
  totalValue: string | null;
  Customer: { name: string } | null;
};
type Item = { id: string; description: string; quantity: number; unitValue: number };
type Chk = { id: string; label: string; done: boolean; order: number };

export function OSDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [os, setOs] = useState<OS | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [chk, setChk] = useState<Chk[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOne<OS>('ServiceOrder', id!, '*, Customer(name)').then((r) => (r ? setOs(r) : nav('/admin/os')));
    supabase.from('ServiceOrderItem').select('*').eq('serviceOrderId', id!).then(({ data }) => setItems((data as Item[]) ?? []));
    supabase
      .from('ChecklistItem')
      .select('*')
      .eq('serviceOrderId', id!)
      .order('order')
      .then(({ data }) => setChk((data as Chk[]) ?? []));
  }, [id, nav]);

  useEffect(load, [load]);
  if (!os) return <Spinner />;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${os.number} — ${os.title}`}
        subtitle={`Cliente: ${os.Customer?.name ?? '—'} · Total ${brl(os.totalValue ?? 0)}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SERVICE_ORDER_STATUS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === os.status ? 'default' : 'outline'}
              disabled={busy || s === os.status}
              onClick={() => run(() => updateRow('ServiceOrder', os.id, { status: s }))}
            >
              {s}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Materiais e serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y rounded-md border">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {Number(it.quantity)}× {it.description}
                    <span className="ml-2 text-muted-foreground">{brl(Number(it.unitValue) * Number(it.quantity))}</span>
                  </span>
                  <button
                    className="text-muted-foreground hover:text-accent"
                    disabled={busy}
                    onClick={() => run(() => deleteRow('ServiceOrderItem', it.id))}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {items.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum item.</li>}
            </ul>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(() =>
                  insertRow('ServiceOrderItem', {
                    serviceOrderId: os.id,
                    description: fd.get('description'),
                    quantity: Number(fd.get('quantity') || 1),
                    unitValue: Number(fd.get('unitValue') || 0),
                    isMaterial: true,
                  }),
                ).then(() => (e.target as HTMLFormElement).reset());
              }}
            >
              <Input name="description" placeholder="Descrição" required className="min-w-40 flex-1" />
              <Input name="quantity" type="number" step="0.01" defaultValue={1} className="w-20" />
              <Input name="unitValue" type="number" step="0.01" placeholder="Valor un." className="w-28" />
              <Button size="sm" type="submit" disabled={busy}>
                <Plus className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1">
              {chk.map((c) => (
                <li key={c.id}>
                  <button
                    className="flex items-center gap-2 text-sm"
                    disabled={busy}
                    onClick={() => run(() => updateRow('ChecklistItem', c.id, { done: !c.done }))}
                  >
                    <span
                      className={cn(
                        'grid size-4 place-items-center rounded border',
                        c.done && 'border-brand bg-brand text-brand-fg',
                      )}
                    >
                      {c.done && <Check className="size-3" />}
                    </span>
                    <span className={cn(c.done && 'text-muted-foreground line-through')}>{c.label}</span>
                  </button>
                </li>
              ))}
              {chk.length === 0 && <li className="text-sm text-muted-foreground">Sem itens.</li>}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(() =>
                  insertRow('ChecklistItem', { serviceOrderId: os.id, label: fd.get('label'), done: false, order: chk.length }),
                ).then(() => (e.target as HTMLFormElement).reset());
              }}
            >
              <Input name="label" placeholder="Novo item" required className="flex-1" />
              <Button size="sm" type="submit" disabled={busy}>
                <Plus className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Fotos, assinatura e PDF entram na próxima etapa.</p>
      <p className="text-xs text-muted-foreground">Aberta em {formatDate((os as unknown as { createdAt: string }).createdAt)}.</p>
    </div>
  );
}
