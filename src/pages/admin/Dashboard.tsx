import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileSignature, HardDrive, TriangleAlert, Users, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { brl } from '@/lib/utils';

const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#64748b'];
const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};
const axisTick = { fill: '#8a8f98', fontSize: 12 };

/* eslint-disable @typescript-eslint/no-explicit-any */
async function count(table: string, apply?: (q: any) => any) {
  let q: any = supabase.from(table).select('*', { count: 'exact', head: true });
  if (apply) q = apply(q);
  const { count: c } = await q;
  return c ?? 0;
}

async function sum(table: string, col: string, apply: (q: any) => any) {
  const { data } = (await apply(supabase.from(table).select(col))) as { data: Record<string, number>[] | null };
  return (data ?? []).reduce((s, r) => s + Number(r[col] ?? 0), 0);
}

async function groupCount(table: string, col: string, apply?: (q: any) => any) {
  let q: any = supabase.from(table).select(col);
  if (apply) q = apply(q);
  const { data } = (await q) as { data: Record<string, string>[] | null };
  const acc: Record<string, number> = {};
  for (const r of data ?? []) {
    const k = r[col] ?? '—';
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return Object.entries(acc).map(([name, value]) => ({ name, value }));
}

interface Data {
  revenueMonth: number;
  expensesMonth: number;
  receivablePending: number;
  receivableOverdue: number;
  activeContracts: number;
  newCustomers: number;
  equipmentRented: number;
  contractsByStatus: { name: string; value: number }[];
  equipmentByStatus: { name: string; value: number }[];
  receivablesSplit: { name: string; value: number }[];
  topCustomers: { name: string; value: number }[];
}

export function Dashboard() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const nowIso = now.toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    (async () => {
      try {
        const [
          revenueMonth,
          expensesMonth,
          activeContracts,
          newCustomers,
          equipmentRented,
          contractsByStatus,
          equipmentByStatus,
          receivables,
        ] = await Promise.all([
          sum('FinancialEntry', 'paidAmount', (q) =>
            q.eq('type', 'RECEBER').eq('status', 'PAGO').gte('paidAt', monthStart),
          ),
          sum('FinancialEntry', 'paidAmount', (q) =>
            q.eq('type', 'PAGAR').eq('status', 'PAGO').gte('paidAt', monthStart),
          ),
          count('Contract', (q) => q.eq('status', 'ATIVO')),
          count('Customer', (q) => q.gte('createdAt', monthStart)),
          count('Equipment', (q) => q.eq('status', 'LOCADO')),
          groupCount('Contract', 'status', (q) => q.is('deletedAt', null)),
          groupCount('Equipment', 'status', (q) => q.is('deletedAt', null)),
          supabase
            .from('FinancialEntry')
            .select('amount, paidAmount, dueDate, Customer(name)')
            .eq('type', 'RECEBER')
            .in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']),
        ]);

        const rows =
          (receivables.data as { amount: number; paidAmount: number; dueDate: string; Customer: { name: string } | null }[] | null) ??
          [];
        let aVencer = 0;
        let vencido = 0;
        const byCustomer: Record<string, number> = {};
        for (const r of rows) {
          const open = Number(r.amount ?? 0) - Number(r.paidAmount ?? 0);
          if (open <= 0) continue;
          if (r.dueDate && r.dueDate < nowIso) vencido += open;
          else aVencer += open;
          const cn = r.Customer?.name ?? '—';
          byCustomer[cn] = (byCustomer[cn] ?? 0) + open;
        }
        const topCustomers = Object.entries(byCustomer)
          .map(([name, value]) => ({ name, value: Math.round(value) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setD({
          revenueMonth,
          expensesMonth,
          receivablePending: aVencer + vencido,
          receivableOverdue: vencido,
          activeContracts,
          newCustomers,
          equipmentRented,
          contractsByStatus,
          equipmentByStatus,
          receivablesSplit: [
            { name: 'A vencer', value: Math.round(aVencer) },
            { name: 'Vencido', value: Math.round(vencido) },
          ],
          topCustomers,
        });
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  if (err) return <p className="text-sm text-accent">Erro ao carregar o dashboard: {err}</p>;
  if (!d) return <Spinner />;

  const kpis: [string, string, React.ElementType][] = [
    ['A receber (em aberto)', brl(d.receivablePending), Wallet],
    ['Atrasado', brl(d.receivableOverdue), TriangleAlert],
    ['Recebido no mês', brl(d.revenueMonth), Wallet],
    ['Lucro do mês', brl(d.revenueMonth - d.expensesMonth), Wallet],
    ['Contratos ativos', String(d.activeContracts), FileSignature],
    ['Equipamentos locados', String(d.equipmentRented), HardDrive],
    ['Clientes novos (mês)', String(d.newCustomers), Users],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do negócio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, Icon]) => (
          <Card key={label} className="animate-fade-in">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recebíveis em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={d.receivablesSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top clientes a receber</CardTitle>
          </CardHeader>
          <CardContent>
            {d.topCustomers.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Nada a receber no momento.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d.topCustomers} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={axisTick} tickFormatter={(v) => brl(v)} />
                  <YAxis type="category" dataKey="name" width={110} tick={axisTick} />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contratos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.contractsByStatus} margin={{ left: -12, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Equipamentos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={d.equipmentByStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                  {d.equipmentByStatus.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
