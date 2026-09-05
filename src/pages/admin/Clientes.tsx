import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOne, insertRow, updateRow } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { usePagedList } from '@/lib/useList';
import { applyMask } from '@/lib/masks';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import { Input, Spinner, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { ResourceForm, type FieldDef } from '@/components/ResourceForm';

const FIELDS: FieldDef[] = [
  {
    name: 'type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'PF', label: 'Pessoa Física' },
      { value: 'PJ', label: 'Pessoa Jurídica' },
    ],
  },
  { name: 'name', label: 'Nome / Razão social', required: true, colSpan: 2, mask: 'name', maxLength: 150 },
  { name: 'tradeName', label: 'Nome fantasia', mask: 'name', maxLength: 150 },
  { name: 'cpf', label: 'CPF (só números)', mask: 'cpf' },
  { name: 'cnpj', label: 'CNPJ (só números)', mask: 'cnpj' },
  { name: 'rg', label: 'RG' },
  { name: 'stateReg', label: 'Inscrição estadual' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'phone', label: 'Telefone (só números, com DDD)', type: 'tel', mask: 'phone' },
  { name: 'whatsapp', label: 'WhatsApp (só números, com DDD)', type: 'tel', mask: 'phone' },
  { name: 'site', label: 'Site' },
  { name: 'notes', label: 'Observações', type: 'textarea' },
  { name: 'isActive', label: 'Cliente ativo', type: 'checkbox' },
];

type Addr = {
  id: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};
const EMPTY_ADDR: Addr = { id: '', zip: '', street: '', number: '', complement: '', district: '', city: '', state: '' };

function AddressFields({ addr, setAddr }: { addr: Addr; setAddr: (a: Addr) => void }) {
  const set = (k: keyof Addr, v: string) => setAddr({ ...addr, [k]: v });
  return (
    <div className="sm:col-span-2">
      <h2 className="mb-3 mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Endereço</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">CEP (só números)</label>
          <Input inputMode="numeric" maxLength={8} value={addr.zip} onChange={(e) => set('zip', applyMask('cep', e.target.value))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Cidade</label>
          <Input value={addr.city} onChange={(e) => set('city', applyMask('name', e.target.value))} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Logradouro (rua/avenida)</label>
          <Input value={addr.street} onChange={(e) => set('street', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Número</label>
          <Input value={addr.number} onChange={(e) => set('number', e.target.value)} placeholder="123 ou s/n" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Complemento</label>
          <Input value={addr.complement} onChange={(e) => set('complement', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Bairro</label>
          <Input value={addr.district} onChange={(e) => set('district', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">UF</label>
          <Input maxLength={2} value={addr.state} onChange={(e) => set('state', applyMask('uf', e.target.value))} placeholder="MA" />
        </div>
      </div>
    </div>
  );
}

type Row = {
  id: string;
  type: string;
  name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export function Clientes() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'Customer',
    searchColumns: ['name', 'tradeName', 'email', 'cpf', 'cnpj'],
    filters: [['deletedAt', null]],
  });

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Pessoas físicas e jurídicas" action={{ to: '/admin/clientes/novo', label: 'Novo cliente' }} />
      <SearchBar value={search} onChange={setSearch} placeholder="Nome, CPF, CNPJ ou e-mail…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Nome</TH>
                <TH>Tipo</TH>
                <TH>Documento</TH>
                <TH>Contato</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link to={`/admin/clientes/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </TD>
                  <TD>{c.type}</TD>
                  <TD className="tabular-nums">{c.cpf || c.cnpj || '—'}</TD>
                  <TD>{c.whatsapp || c.phone || '—'}</TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhum cliente ainda.
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

export function ClienteForm() {
  const { id } = useParams();
  const editing = id && id !== 'novo';
  const [initial, setInitial] = useState<Record<string, unknown> | null>(editing ? null : {});
  const [addr, setAddr] = useState<Addr>(EMPTY_ADDR);
  const nav = useNavigate();

  useEffect(() => {
    if (!editing) return;
    getOne('Customer', id!).then((r) => (r ? setInitial(r) : nav('/admin/clientes')));
    supabase
      .from('Address')
      .select('id, zip, street, number, complement, district, city, state')
      .eq('customerId', id)
      .order('isDefault', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setAddr({
          id: data.id,
          zip: applyMask('cep', data.zip ?? ''),
          street: data.street ?? '',
          number: data.number ?? '',
          complement: data.complement ?? '',
          district: data.district ?? '',
          city: data.city ?? '',
          state: (data.state ?? '').toUpperCase().slice(0, 2),
        });
      });
  }, [editing, id, nav]);

  async function saveAddress(customerId: string) {
    const preenchido = addr.zip || addr.street || addr.city || addr.district || addr.number;
    if (!preenchido) return;
    const payload = {
      customerId,
      label: 'Principal',
      zip: addr.zip || null,
      street: addr.street || null,
      number: addr.number || null,
      complement: addr.complement || null,
      district: addr.district || null,
      city: addr.city || null,
      state: addr.state || null,
      isDefault: true,
    };
    if (addr.id) await updateRow('Address', addr.id, payload);
    else await insertRow('Address', payload);
  }

  if (!initial) return <Spinner />;

  return (
    <div>
      <PageHeader title={editing ? String(initial.name) : 'Novo cliente'} />
      <ResourceForm
        table="Customer"
        fields={FIELDS}
        mode={editing ? 'edit' : 'create'}
        initial={initial}
        redirectTo="/admin/clientes"
        submitLabel={editing ? 'Salvar' : 'Cadastrar'}
        onSaved={saveAddress}
        extraSection={<AddressFields addr={addr} setAddr={setAddr} />}
      />
    </div>
  );
}
