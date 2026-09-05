import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { deleteRow, getOne, insertRow, updateRow } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Spinner,
  Table, TBody, TD, TH, THead, TR,
} from '@/components/ui';
import { brl, cn, formatDate } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  PARCIAL: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  PAGO: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  ATRASADO: 'bg-accent/15 text-accent',
  CANCELADO: 'bg-muted text-muted-foreground line-through',
};
const PAYMENT_METHODS = ['PIX', 'BOLETO', 'CARTAO', 'DINHEIRO', 'CHEQUE', 'TRANSFERENCIA'];

type Row = {
  id: string;
  type: 'RECEBER' | 'PAGAR';
  status: string;
  description: string;
  amount: string;
  paidAmount: string;
  dueDate: string;
  Customer: { name: string } | null;
};

function isOverdue(r: Row) {
  return (r.status === 'PENDENTE' || r.status === 'PARCIAL') && new Date(r.dueDate) < new Date(new Date().toDateString());
}

export function Financeiro() {
  const [tab, setTab] = useState<'RECEBER' | 'PAGAR'>('RECEBER');
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'FinancialEntry',
    select: '*, Customer(name)',
    searchColumns: ['description'],
    filters: [['type', tab]],
    orderBy: 'dueDate',
    ascending: true,
  });

  function trocarAba(t: 'RECEBER' | 'PAGAR') {
    setTab(t);
    setPage(1);
  }

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Contas a pagar e a receber" action={{ to: '/admin/financeiro/novo', label: 'Novo lançamento' }} />

      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={tab === 'RECEBER' ? 'default' : 'outline'} onClick={() => trocarAba('RECEBER')}>
          A Receber
        </Button>
        <Button size="sm" variant={tab === 'PAGAR' ? 'default' : 'outline'} onClick={() => trocarAba('PAGAR')}>
          A Pagar
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Descrição…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Vencimento</TH>
                <TH>Descrição</TH>
                <TH>Cliente</TH>
                <TH className="text-right">Valor</TH>
                <TH className="text-right">Pago</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((e) => (
                <TR key={e.id}>
                  <TD className={cn(isOverdue(e) && 'font-medium text-accent')}>{formatDate(e.dueDate)}</TD>
                  <TD>
                    <Link to={`/admin/financeiro/${e.id}`} className="font-medium hover:underline">
                      {e.description}
                    </Link>
                  </TD>
                  <TD>{e.Customer?.name ?? '—'}</TD>
                  <TD className="text-right">{brl(e.amount)}</TD>
                  <TD className="text-right">{brl(e.paidAmount)}</TD>
                  <TD>
                    <Badge className={STATUS_STYLE[e.status]}>{isOverdue(e) ? 'ATRASADO' : e.status}</Badge>
                  </TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum lançamento nesta aba.
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

type Lookup = { id: string; name: string };

export function FinanceiroForm() {
  const nav = useNavigate();
  const [type, setType] = useState<'RECEBER' | 'PAGAR'>('RECEBER');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [customers, setCustomers] = useState<Lookup[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Lookup[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('Customer').select('id, name').is('deletedAt', null).order('name').limit(500).then(({ data }) => setCustomers((data as Lookup[]) ?? []));
    supabase.from('BankAccount').select('id, name').eq('isActive', true).order('name').then(({ data }) => setBankAccounts((data as Lookup[]) ?? []));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const created = await insertRow<{ id: string }>('FinancialEntry', {
        type,
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate + 'T00:00:00').toISOString(),
        customerId: customerId || null,
        bankAccountId: bankAccountId || null,
      });
      nav(`/admin/financeiro/${created.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Novo lançamento" subtitle="Conta a pagar ou a receber" />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={type === 'RECEBER' ? 'default' : 'outline'} onClick={() => setType('RECEBER')}>
            A Receber
          </Button>
          <Button type="button" size="sm" variant={type === 'PAGAR' ? 'default' : 'outline'} onClick={() => setType('PAGAR')}>
            A Pagar
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Descrição *</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Valor (R$) *</label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Vencimento *</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Cliente</label>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">—</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Conta bancária</label>
          <Select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
            <option value="">—</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        {err && <p className="text-sm text-accent">{err}</p>}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

type EntryDoc = Row & { method: string | null; bankAccountId: string | null; customerId: string | null };
type PaymentRow = { id: string; amount: string; method: string; paidAt: string; note: string | null };

export function FinanceiroView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState<EntryDoc | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState('PIX');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    getOne<EntryDoc>('FinancialEntry', id!, '*, Customer(name)').then((r) => {
      if (!r) return nav('/admin/financeiro');
      setDoc(r);
      setValor((Number(r.amount) - Number(r.paidAmount)).toFixed(2));
    });
    supabase
      .from('Payment')
      .select('id, amount, method, paidAt, note')
      .eq('entryId', id)
      .order('paidAt', { ascending: false })
      .then(({ data }) => setPayments((data as PaymentRow[]) ?? []));
  }, [id, nav]);
  useEffect(load, [load]);

  if (!doc) return <Spinner />;

  const restante = Number(doc.amount) - Number(doc.paidAmount);

  async function registrarPagamento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const v = Number(valor);
      if (v <= 0) throw new Error('Informe um valor maior que zero.');
      await insertRow('Payment', { entryId: doc!.id, amount: v, method: metodo });
      const novoPago = Number(doc!.paidAmount) + v;
      const status = novoPago >= Number(doc!.amount) ? 'PAGO' : 'PARCIAL';
      await updateRow('FinancialEntry', doc!.id, {
        paidAmount: novoPago,
        status,
        method: metodo,
        paidAt: status === 'PAGO' ? new Date().toISOString() : null,
      });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelar() {
    if (!confirm('Cancelar este lançamento?')) return;
    setBusy(true);
    try {
      await updateRow('FinancialEntry', doc!.id, { status: 'CANCELADO' });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Excluir este lançamento? Só é possível se não houver pagamento registrado.')) return;
    setBusy(true);
    try {
      await deleteRow('FinancialEntry', doc!.id);
      nav('/admin/financeiro');
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const quitado = doc.status === 'PAGO' || doc.status === 'CANCELADO';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={doc.description}
        subtitle={`${doc.type === 'RECEBER' ? 'A receber' : 'A pagar'} · vence em ${formatDate(doc.dueDate)}${doc.Customer ? ` · ${doc.Customer.name}` : ''}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Valor total</p>
            <p className="text-lg font-semibold">{brl(doc.amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pago</p>
            <p className="text-lg font-semibold">{brl(doc.paidAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge className={STATUS_STYLE[doc.status]}>{doc.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {!quitado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Registrar pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={registrarPagamento} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input type="number" step="0.01" max={restante} value={valor} onChange={(e) => setValor(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Forma</label>
                <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" loading={busy}>
                Confirmar
              </Button>
              <Button type="button" variant="outline" className="ml-auto text-accent" onClick={cancelar} disabled={busy}>
                Cancelar lançamento
              </Button>
            </form>
            {err && <p className="mt-2 text-sm text-accent">{err}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pagamentos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Data</TH>
                  <TH>Forma</TH>
                  <TH className="text-right">Valor</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((p) => (
                  <TR key={p.id}>
                    <TD>{formatDate(p.paidAt)}</TD>
                    <TD>{p.method}</TD>
                    <TD className="text-right">{brl(p.amount)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {Number(doc.paidAmount) === 0 && doc.status !== 'CANCELADO' && (
        <Button variant="outline" className="text-accent" onClick={remove} disabled={busy}>
          Excluir lançamento
        </Button>
      )}
    </div>
  );
}
