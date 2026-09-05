import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { deleteRow, getOne, insertRow, updateRow } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { extractTags, renderTemplate, tagLabel } from '@/lib/template';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import { DocumentView } from '@/components/DocumentView';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Spinner, Textarea,
  Table, TBody, TD, TH, THead, TR,
} from '@/components/ui';
import { brl, formatDate, parseBRDate } from '@/lib/utils';

const CONTRACT_STATUS = ['RASCUNHO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO'];
const STATUS_STYLE: Record<string, string> = {
  RASCUNHO: 'bg-muted text-muted-foreground',
  AGUARDANDO_ASSINATURA: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  ATIVO: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  SUSPENSO: 'bg-accent/15 text-accent',
  ENCERRADO: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  CANCELADO: 'bg-accent/15 text-accent',
};

type Row = { id: string; number: string; title: string; status: string; value: string; Customer: { name: string } | null };

export function Contratos() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'Contract',
    select: '*, Customer(name)',
    searchColumns: ['number', 'title'],
    filters: [['deletedAt', null]],
  });

  return (
    <div>
      <PageHeader title="Contratos" subtitle="Numeração automática" action={{ to: '/admin/contratos/novo', label: 'Novo contrato' }} />
      <SearchBar value={search} onChange={setSearch} placeholder="Número ou título…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Nº</TH>
                <TH>Cliente</TH>
                <TH>Título</TH>
                <TH className="text-right">Valor</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link to={`/admin/contratos/${c.id}`} className="font-mono font-medium hover:underline">
                      {c.number}
                    </Link>
                  </TD>
                  <TD>{c.Customer?.name ?? '—'}</TD>
                  <TD>{c.title}</TD>
                  <TD className="text-right">{brl(c.value)}</TD>
                  <TD>
                    <Badge className={STATUS_STYLE[c.status]}>{c.status}</Badge>
                  </TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum contrato ainda.
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

type Template = { id: string; name: string; bodyHtml: string };
type Customer = { id: string; name: string; cpf: string | null; cnpj: string | null; whatsapp: string | null; phone: string | null };

export function ContratoForm() {
  const nav = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [valorTotal, setValorTotal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('ContractTemplate').select('id, name, bodyHtml').then(({ data }) => {
      setTemplates((data as Template[]) ?? []);
      const def = data?.[0];
      if (def) setTemplateId(def.id);
    });
    supabase
      .from('Customer')
      .select('id, name, cpf, cnpj, whatsapp, phone')
      .is('deletedAt', null)
      .order('name')
      .limit(500)
      .then(({ data }) => setCustomers((data as Customer[]) ?? []));
  }, []);

  const template = templates.find((t) => t.id === templateId);
  const customer = customers.find((c) => c.id === customerId);
  const tags = template ? extractTags(template.bodyHtml).filter((t) => t !== 'numero') : [];

  function onPickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setValues((v) => ({
      ...v,
      cliente_nome: c.name,
      cliente_documento: c.cnpj ? `CNPJ: ${c.cnpj}` : c.cpf ? `CPF: ${c.cpf}` : '',
      cliente_telefone: c.whatsapp || c.phone || '',
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!template || !customer) return;
    setBusy(true);
    setErr(null);
    try {
      const firstPass = renderTemplate(template.bodyHtml, { ...values, numero: '(gerado ao salvar)' });
      const created = await insertRow<{ id: string; number: string }>('Contract', {
        templateId: template.id,
        customerId: customer.id,
        title: `Locação — ${customer.name}`,
        status: 'AGUARDANDO_ASSINATURA',
        value: Number(valorTotal || 0),
        bodyHtml: firstPass,
      });
      const finalHtml = renderTemplate(template.bodyHtml, { ...values, numero: created.number });
      await updateRow('Contract', created.id, { bodyHtml: finalHtml });

      const valor = Number(valorTotal || 0);
      if (valor > 0) {
        await insertRow('FinancialEntry', {
          type: 'RECEBER',
          status: 'PENDENTE',
          description: `Contrato ${created.number} — ${customer.name}`,
          amount: valor,
          dueDate: (parseBRDate(values.data_inicio) ?? new Date()).toISOString(),
          customerId: customer.id,
          contractId: created.id,
        });
      }

      nav(`/admin/contratos/${created.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const preview = template
    ? renderTemplate(template.bodyHtml, { ...values, numero: '(gerado ao salvar)' })
    : '';

  return (
    <div>
      <PageHeader title="Novo contrato" subtitle="Preencha os dados — o número é gerado automaticamente" />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Modelo</label>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Cliente *</label>
              <Select value={customerId} onChange={(e) => onPickCustomer(e.target.value)} required>
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {tags.map((tag) => (
            <div key={tag} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{tagLabel(tag)}</label>
              {tag === 'equipamentos' ? (
                <Textarea
                  value={values[tag] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [tag]: e.target.value }))}
                  placeholder="Antena Starlink Mini kit, roteador integrado, fonte, cabos, base"
                />
              ) : (
                <Input
                  type={tag.includes('data') ? 'date' : 'text'}
                  value={values[tag] ?? ''}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [tag]:
                        tag.includes('data') && e.target.value
                          ? new Date(e.target.value + 'T00:00:00').toLocaleDateString('pt-BR')
                          : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Valor total do contrato (R$) — pro dashboard/relatórios</label>
            <Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
          </div>

          {err && <p className="text-sm text-accent">{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!template || !customer}>
              Gerar e salvar contrato
            </Button>
            <Button type="button" variant="outline" onClick={() => nav(-1)}>
              Cancelar
            </Button>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Prévia</h2>
          {template ? <DocumentView title="Prévia do contrato" html={preview} /> : <Spinner />}
        </div>
      </form>
    </div>
  );
}

type ContractDoc = {
  id: string;
  number: string;
  title: string;
  status: string;
  bodyHtml: string | null;
  value: string;
  Customer: { name: string } | null;
};

export function ContratoView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState<ContractDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    getOne<ContractDoc>('Contract', id!, '*, Customer(name)').then((r) => (r ? setDoc(r) : nav('/admin/contratos')));
  }, [id, nav]);
  useEffect(load, [load]);

  if (!doc) return <Spinner />;

  async function setStatus(status: string) {
    setBusy(true);
    setErr(null);
    try {
      await updateRow('Contract', doc!.id, { status });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Excluir este contrato?')) return;
    setBusy(true);
    setErr(null);
    try {
      await deleteRow('Contract', doc!.id);
      nav('/admin/contratos');
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Contrato ${doc.number}`} subtitle={`${doc.Customer?.name ?? ''} · ${brl(doc.value)}`} />

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {CONTRACT_STATUS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === doc.status ? 'default' : 'outline'}
              disabled={busy || s === doc.status}
              onClick={() => setStatus(s)}
            >
              {s}
            </Button>
          ))}
          <Button size="sm" variant="outline" disabled={busy} onClick={() => nav(`/admin/contratos/${doc.id}/editar`)}>
            Editar
          </Button>
          <Button size="sm" variant="outline" className="ml-auto text-accent" disabled={busy} onClick={remove}>
            Excluir
          </Button>
        </CardContent>
        {err && <CardContent className="pt-0 text-sm text-accent">{err}</CardContent>}
      </Card>

      <DocumentView title={`Contrato ${doc.number}`} html={doc.bodyHtml ?? '<p>Sem conteúdo.</p>'} />
    </div>
  );
}

export function ContratoEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [number, setNumber] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('Customer')
      .select('id, name, cpf, cnpj, whatsapp, phone')
      .is('deletedAt', null)
      .order('name')
      .limit(500)
      .then(({ data }) => setCustomers((data as Customer[]) ?? []));
    getOne<ContractDoc & { customerId: string | null }>('Contract', id!).then((r) => {
      if (!r) return nav('/admin/contratos');
      setCustomerId(r.customerId ?? '');
      setTitle(r.title);
      setValue(String(r.value));
      setBodyHtml(r.bodyHtml ?? '');
      setNumber(r.number);
      setLoaded(true);
    });
  }, [id, nav]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await updateRow('Contract', id!, {
        customerId: customerId || null,
        title,
        value: Number(value || 0),
        bodyHtml,
      });
      nav(`/admin/contratos/${id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  if (!loaded) return <Spinner />;

  return (
    <div>
      <PageHeader title={`Editar contrato ${number}`} subtitle="Ajuste os dados ou corrija o texto do contrato" />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
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
            <label className="text-sm font-medium">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Valor total (R$)</label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Texto do contrato</label>
            <Textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={16}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">HTML do documento — corrija diretamente o texto, valores ou dados que precisarem de ajuste.</p>
          </div>

          {err && <p className="text-sm text-accent">{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              Salvar alterações
            </Button>
            <Button type="button" variant="outline" onClick={() => nav(`/admin/contratos/${id}`)}>
              Cancelar
            </Button>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Prévia</h2>
          <DocumentView title="Prévia do contrato" html={bodyHtml} />
        </div>
      </form>
    </div>
  );
}
