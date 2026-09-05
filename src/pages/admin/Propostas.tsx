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
import { brl } from '@/lib/utils';

const PROPOSAL_STATUS = ['rascunho', 'enviada', 'aceita', 'recusada'];
const STATUS_STYLE: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviada: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  aceita: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  recusada: 'bg-accent/15 text-accent',
};

type Row = { id: string; number: string; title: string; status: string; total: string; Customer: { name: string } | null };

export function Propostas() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'Proposal',
    select: '*, Customer(name)',
    searchColumns: ['number', 'title'],
  });

  return (
    <div>
      <PageHeader title="Proposta Comercial" subtitle="Numeração automática" action={{ to: '/admin/propostas/novo', label: 'Nova proposta' }} />
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
              {(result?.data ?? []).map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link to={`/admin/propostas/${p.id}`} className="font-mono font-medium hover:underline">
                      {p.number}
                    </Link>
                  </TD>
                  <TD>{p.Customer?.name ?? '—'}</TD>
                  <TD>{p.title}</TD>
                  <TD className="text-right">{brl(p.total)}</TD>
                  <TD>
                    <Badge className={STATUS_STYLE[p.status]}>{p.status}</Badge>
                  </TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhuma proposta ainda.
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

export function PropostaForm() {
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
    supabase.from('ProposalTemplate').select('id, name, bodyHtml').then(({ data }) => {
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
      const created = await insertRow<{ id: string; number: string }>('Proposal', {
        templateId: template.id,
        customerId: customer.id,
        title: `Proposta — ${customer.name}`,
        status: 'rascunho',
        total: Number(valorTotal || 0),
        bodyHtml: firstPass,
      });
      const finalHtml = renderTemplate(template.bodyHtml, { ...values, numero: created.number });
      await updateRow('Proposal', created.id, { bodyHtml: finalHtml });
      nav(`/admin/propostas/${created.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const preview = template ? renderTemplate(template.bodyHtml, { ...values, numero: '(gerado ao salvar)' }) : '';

  return (
    <div>
      <PageHeader title="Nova proposta" subtitle="Preencha os dados — o número é gerado automaticamente" />
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
              {tag === 'descricao_servico' || tag === 'observacoes' || tag === 'itens' ? (
                <Textarea value={values[tag] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [tag]: e.target.value }))} />
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
            <label className="text-sm font-medium">Valor total da proposta (R$)</label>
            <Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
          </div>

          {err && <p className="text-sm text-accent">{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!template || !customer}>
              Gerar e salvar proposta
            </Button>
            <Button type="button" variant="outline" onClick={() => nav(-1)}>
              Cancelar
            </Button>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Prévia</h2>
          {template ? <DocumentView title="Prévia da proposta" html={preview} /> : <Spinner />}
        </div>
      </form>
    </div>
  );
}

type ProposalDoc = {
  id: string;
  number: string;
  title: string;
  status: string;
  bodyHtml: string | null;
  total: string;
  customerId: string | null;
  Customer: { name: string } | null;
};

export function PropostaView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState<ProposalDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOne<ProposalDoc>('Proposal', id!, '*, Customer(name)').then((r) => (r ? setDoc(r) : nav('/admin/propostas')));
  }, [id, nav]);
  useEffect(load, [load]);

  if (!doc) return <Spinner />;

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await updateRow('Proposal', doc!.id, { status });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Excluir esta proposta?')) return;
    await deleteRow('Proposal', doc!.id);
    nav('/admin/propostas');
  }

  async function converterEmContrato() {
    if (!doc?.customerId) return alert('Esta proposta não tem cliente vinculado.');
    setBusy(true);
    try {
      const tpl = await supabase.from('ContractTemplate').select('id').eq('isDefault', true).maybeSingle();
      const templateId = tpl.data?.id ?? null;
      const created = await insertRow<{ id: string; number: string }>('Contract', {
        templateId,
        customerId: doc.customerId,
        title: `Locação — ${doc.Customer?.name ?? ''}`,
        status: 'RASCUNHO',
        value: Number(doc.total || 0),
        bodyHtml: `<p>Gerado a partir da proposta ${doc.number}. Edite o contrato para completar os dados.</p>`,
      });
      await updateRow('Proposal', doc.id, { status: 'aceita' });
      nav(`/admin/contratos/${created.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Proposta ${doc.number}`} subtitle={`${doc.Customer?.name ?? ''} · ${brl(doc.total)}`} />

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {PROPOSAL_STATUS.map((s) => (
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
          <Button size="sm" variant="outline" disabled={busy} onClick={converterEmContrato}>
            Converter em contrato
          </Button>
          <Button size="sm" variant="outline" className="ml-auto text-accent" onClick={remove}>
            Excluir
          </Button>
        </CardContent>
      </Card>

      <DocumentView title={`Proposta ${doc.number}`} html={doc.bodyHtml ?? '<p>Sem conteúdo.</p>'} />
    </div>
  );
}
