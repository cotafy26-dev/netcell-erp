import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EQUIPMENT_STATUS } from '@/shared';
import { supabase } from '@/lib/supabase';
import { getOne } from '@/lib/db';
import { usePagedList } from '@/lib/useList';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import { Badge, Spinner, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { ResourceForm, type FieldDef } from '@/components/ResourceForm';
import { brl } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  DISPONIVEL: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  LOCADO: 'bg-brand/20 text-foreground',
  MANUTENCAO: 'bg-accent/15 text-accent',
  RESERVADO: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  BAIXADO: 'bg-muted text-muted-foreground',
};

function fields(cats: { id: string; name: string }[]): FieldDef[] {
  return [
    { name: 'model', label: 'Modelo', required: true, colSpan: 2 },
    { name: 'brand', label: 'Marca' },
    { name: 'categoryId', label: 'Categoria', type: 'select', options: cats.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'serialNumber', label: 'Nº de série' },
    { name: 'assetTag', label: 'Patrimônio' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: EQUIPMENT_STATUS.map((s) => ({ value: s, label: s })) },
    { name: 'location', label: 'Localização' },
    { name: 'purchaseDate', label: 'Data da compra', type: 'date' },
    { name: 'warrantyUntil', label: 'Garantia até', type: 'date' },
    { name: 'purchaseValue', label: 'Valor de compra (R$)', type: 'number', step: '0.01' },
    { name: 'dailyRate', label: 'Locação/dia (R$)', type: 'number', step: '0.01' },
    { name: 'weeklyRate', label: 'Locação/semana (R$)', type: 'number', step: '0.01' },
    { name: 'monthlyRate', label: 'Locação/mês (R$)', type: 'number', step: '0.01' },
    { name: 'yearlyRate', label: 'Locação/ano (R$)', type: 'number', step: '0.01' },
    { name: 'barcode', label: 'Código de barras' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ];
}

type Row = {
  id: string;
  model: string;
  brand: string | null;
  serialNumber: string | null;
  assetTag: string | null;
  status: string;
  qrCode: string | null;
  dailyRate: string | null;
};

export function Equipamentos() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'Equipment',
    searchColumns: ['model', 'brand', 'serialNumber', 'assetTag'],
    filters: [['deletedAt', null]],
  });

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        subtitle="Ativos para locação e uso interno"
        action={{ to: '/admin/equipamentos/novo', label: 'Novo equipamento' }}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Modelo, marca, série ou patrimônio…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Equipamento</TH>
                <TH>Série / Patrimônio</TH>
                <TH>QR</TH>
                <TH>Locação/dia</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Link to={`/admin/equipamentos/${e.id}`} className="font-medium hover:underline">
                      {e.model}
                    </Link>
                    {e.brand && <span className="text-muted-foreground"> · {e.brand}</span>}
                  </TD>
                  <TD className="tabular-nums text-muted-foreground">
                    {e.serialNumber || '—'} / {e.assetTag || '—'}
                  </TD>
                  <TD className="font-mono text-xs">{e.qrCode}</TD>
                  <TD>{e.dailyRate ? brl(e.dailyRate) : '—'}</TD>
                  <TD>
                    <Badge className={STATUS_STYLE[e.status]}>{e.status}</Badge>
                  </TD>
                </TR>
              ))}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum equipamento.
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

export function EquipamentoForm() {
  const { id } = useParams();
  const editing = id && id !== 'novo';
  const nav = useNavigate();
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [initial, setInitial] = useState<Record<string, unknown> | null>(editing ? null : { status: 'DISPONIVEL' });

  useEffect(() => {
    supabase.from('EquipmentCategory').select('id, name').order('name').then(({ data }) => setCats(data ?? []));
    if (editing) getOne('Equipment', id!).then((r) => (r ? setInitial(r) : nav('/admin/equipamentos')));
  }, [editing, id, nav]);

  if (!initial) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={editing ? String(initial.model) : 'Novo equipamento'}
        subtitle={editing ? `QR ${initial.qrCode}` : 'O QR Code é gerado automaticamente'}
      />
      <ResourceForm
        table="Equipment"
        fields={fields(cats)}
        mode={editing ? 'edit' : 'create'}
        initial={initial}
        redirectTo="/admin/equipamentos"
        submitLabel={editing ? 'Salvar' : 'Cadastrar'}
      />
    </div>
  );
}
