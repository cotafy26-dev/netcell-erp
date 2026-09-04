import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { STOCK_MOVEMENT_TYPES } from '@/shared';
import { getOne, insertRow } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { usePagedList } from '@/lib/useList';
import { PageHeader, Pagination, SearchBar } from '@/components/list';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Spinner,
  Table, TBody, TD, TH, THead, TR,
} from '@/components/ui';
import { ResourceForm, type FieldDef } from '@/components/ResourceForm';
import { brl, formatDate } from '@/lib/utils';

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Item', required: true, colSpan: 2 },
  { name: 'sku', label: 'SKU / código' },
  { name: 'unit', label: 'Unidade', placeholder: 'un, m, cx…' },
  { name: 'minQuantity', label: 'Estoque mínimo', type: 'number', step: '0.001' },
  { name: 'cost', label: 'Custo (R$)', type: 'number', step: '0.01' },
  { name: 'price', label: 'Preço de venda (R$)', type: 'number', step: '0.01' },
  { name: 'warrantyDays', label: 'Garantia (dias)', type: 'number' },
  { name: 'location', label: 'Localização' },
];

type Row = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  price: string | null;
  location: string | null;
};

export function Estoque() {
  const { result, loading, error, page, setPage, search, setSearch } = usePagedList<Row>({
    table: 'StockItem',
    searchColumns: ['name', 'sku'],
    orderBy: 'name',
    ascending: true,
  });

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Peças e consumíveis" action={{ to: '/admin/estoque/novo', label: 'Novo item' }} />
      <SearchBar value={search} onChange={setSearch} placeholder="Nome ou SKU…" />
      {error && <p className="text-sm text-accent">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Item</TH>
                <TH>SKU</TH>
                <TH className="text-right">Saldo</TH>
                <TH className="text-right">Mínimo</TH>
                <TH className="text-right">Preço</TH>
                <TH>Local</TH>
              </TR>
            </THead>
            <TBody>
              {(result?.data ?? []).map((s) => {
                const low = Number(s.quantity) <= Number(s.minQuantity);
                return (
                  <TR key={s.id}>
                    <TD>
                      <Link to={`/admin/estoque/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                    </TD>
                    <TD className="text-muted-foreground">{s.sku || '—'}</TD>
                    <TD className={`text-right tabular-nums ${low ? 'font-semibold text-accent' : ''}`}>
                      {Number(s.quantity)} {s.unit}
                    </TD>
                    <TD className="text-right tabular-nums text-muted-foreground">{Number(s.minQuantity)}</TD>
                    <TD className="text-right">{s.price ? brl(s.price) : '—'}</TD>
                    <TD>{s.location || '—'}</TD>
                  </TR>
                );
              })}
              {result?.data.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                    Estoque vazio.
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

type Movement = { id: string; type: string; quantity: number; reference: string | null; note: string | null; createdAt: string };

export function EstoqueItem() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === 'novo';
  const [item, setItem] = useState<Record<string, unknown> | null>(isNew ? {} : null);
  const [movs, setMovs] = useState<Movement[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (isNew) return;
    getOne('StockItem', id!).then((r) => (r ? setItem(r) : nav('/admin/estoque')));
    supabase
      .from('StockMovement')
      .select('id, type, quantity, reference, note, createdAt')
      .eq('stockItemId', id!)
      .order('createdAt', { ascending: false })
      .limit(50)
      .then(({ data }) => setMovs((data as Movement[]) ?? []));
  }, [id, isNew, nav]);

  useEffect(load, [load]);

  if (isNew) {
    return (
      <div>
        <PageHeader title="Novo item de estoque" />
        <ResourceForm table="StockItem" fields={FIELDS} mode="create" redirectTo="/admin/estoque" submitLabel="Cadastrar" />
      </div>
    );
  }
  if (!item) return <Spinner />;

  async function addMovement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await insertRow('StockMovement', {
        stockItemId: id,
        type: fd.get('type'),
        quantity: Number(fd.get('quantity')),
        reference: fd.get('reference') || null,
        note: fd.get('note') || null,
      });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={String(item.name)} subtitle={`Saldo atual: ${Number(item.quantity)} ${item.unit}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cadastro</h2>
          <ResourceForm table="StockItem" fields={FIELDS} mode="edit" initial={item} redirectTo="/admin/estoque" />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Movimentar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addMovement} className="grid gap-3 sm:grid-cols-2">
                <Select name="type" required defaultValue="ENTRADA">
                  {STOCK_MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Input name="quantity" type="number" step="0.001" placeholder="Quantidade" required />
                <Input name="reference" placeholder="Referência (OS, compra…)" />
                <Input name="note" placeholder="Observação" />
                <div className="sm:col-span-2">
                  <Button type="submit" size="sm" loading={busy}>
                    Registrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Movimentações</h3>
            <Table>
              <THead>
                <TR>
                  <TH>Data</TH>
                  <TH>Tipo</TH>
                  <TH className="text-right">Qtd</TH>
                  <TH>Ref.</TH>
                </TR>
              </THead>
              <TBody>
                {movs.map((m) => (
                  <TR key={m.id}>
                    <TD>{formatDate(m.createdAt)}</TD>
                    <TD>{m.type}</TD>
                    <TD className="text-right tabular-nums">{Number(m.quantity)}</TD>
                    <TD className="text-muted-foreground">{m.reference || m.note || '—'}</TD>
                  </TR>
                ))}
                {movs.length === 0 && (
                  <TR>
                    <TD colSpan={4} className="py-6 text-center text-muted-foreground">
                      Sem movimentações.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
