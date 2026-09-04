import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOne } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import { Spinner, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
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
  { name: 'name', label: 'Nome / Razão social', required: true, colSpan: 2 },
  { name: 'tradeName', label: 'Nome fantasia' },
  { name: 'cpf', label: 'CPF' },
  { name: 'cnpj', label: 'CNPJ' },
  { name: 'rg', label: 'RG' },
  { name: 'stateReg', label: 'Inscrição estadual' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'phone', label: 'Telefone', type: 'tel' },
  { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
  { name: 'site', label: 'Site' },
  { name: 'notes', label: 'Observações', type: 'textarea' },
  { name: 'isActive', label: 'Cliente ativo', type: 'checkbox' },
];

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
  const nav = useNavigate();

  useEffect(() => {
    if (editing) getOne('Customer', id!).then((r) => (r ? setInitial(r) : nav('/admin/clientes')));
  }, [editing, id, nav]);

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
      />
    </div>
  );
}
