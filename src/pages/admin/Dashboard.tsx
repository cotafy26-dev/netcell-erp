import { useEffect, useState } from 'react';
import { FileSignature, HardDrive, ReceiptText, TriangleAlert, Users, Wallet, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { brl } from '@/lib/utils';

interface Summary {
  revenueMonth: number;
  expensesMonth: number;
  receivablePending: number;
  receivableOverdue: number;
  activeContracts: number;
  expiringContracts: number;
  openServiceOrders: number;
  equipmentRented: number;
  equipmentAvailable: number;
  newCustomers: number;
  overdueEntries: number;
  openInvoices: number;
}

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

/** Soma o que ainda falta receber/pagar (amount - paidAmount) das linhas filtradas. */
async function sumOutstanding(apply: (q: any) => any) {
  const { data } = (await apply(supabase.from('FinancialEntry').select('amount, paidAmount'))) as {
    data: { amount: number; paidAmount: number }[] | null;
  };
  return (data ?? []).reduce((s, r) => s + (Number(r.amount ?? 0) - Number(r.paidAmount ?? 0)), 0);
}

export function Dashboard() {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString();

    (async () => {
      try {
        const [
          revenueMonth,
          expensesMonth,
          receivablePending,
          receivableOverdue,
          activeContracts,
          expiringContracts,
          openServiceOrders,
          equipmentRented,
          equipmentAvailable,
          newCustomers,
          overdueEntries,
          openInvoices,
        ] = await Promise.all([
          sum('FinancialEntry', 'paidAmount', (q) =>
            q.eq('type', 'RECEBER').eq('status', 'PAGO').gte('paidAt', monthStart),
          ),
          sum('FinancialEntry', 'paidAmount', (q) =>
            q.eq('type', 'PAGAR').eq('status', 'PAGO').gte('paidAt', monthStart),
          ),
          sumOutstanding((q) => q.eq('type', 'RECEBER').in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO'])),
          sumOutstanding((q) =>
            q.eq('type', 'RECEBER').in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']).lt('dueDate', now.toISOString()),
          ),
          count('Contract', (q) => q.eq('status', 'ATIVO')),
          count('Contract', (q) => q.eq('status', 'ATIVO').lte('endDate', in30).gte('endDate', now.toISOString())),
          count('ServiceOrder', (q) => q.in('status', ['ABERTA', 'EM_EXECUCAO', 'PAUSADA'])),
          count('Equipment', (q) => q.eq('status', 'LOCADO')),
          count('Equipment', (q) => q.eq('status', 'DISPONIVEL')),
          count('Customer', (q) => q.gte('createdAt', monthStart)),
          count('FinancialEntry', (q) =>
            q.eq('type', 'RECEBER').in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']).lt('dueDate', now.toISOString()),
          ),
          count('Invoice', (q) => q.eq('status', 'aberta')),
        ]);
        setS({
          revenueMonth,
          expensesMonth,
          receivablePending,
          receivableOverdue,
          activeContracts,
          expiringContracts,
          openServiceOrders,
          equipmentRented,
          equipmentAvailable,
          newCustomers,
          overdueEntries,
          openInvoices,
        });
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  if (err) return <p className="text-sm text-accent">Erro ao carregar o dashboard: {err}</p>;
  if (!s) return <Spinner />;

  const kpis: [string, string, React.ElementType][] = [
    ['A receber (em aberto)', brl(s.receivablePending), Wallet],
    ['Atrasado', brl(s.receivableOverdue), TriangleAlert],
    ['Recebido no mês', brl(s.revenueMonth), Wallet],
    ['Despesas do mês', brl(s.expensesMonth), Wallet],
    ['Lucro do mês', brl(s.revenueMonth - s.expensesMonth), Wallet],
    ['Contas a receber vencidas', String(s.overdueEntries), TriangleAlert],
    ['Contratos ativos', String(s.activeContracts), FileSignature],
    ['Contratos vencendo (30d)', String(s.expiringContracts), FileSignature],
    ['OS abertas', String(s.openServiceOrders), Wrench],
    ['Faturas abertas', String(s.openInvoices), ReceiptText],
    ['Equipamentos locados', String(s.equipmentRented), HardDrive],
    ['Equipamentos disponíveis', String(s.equipmentAvailable), HardDrive],
    ['Clientes novos (mês)', String(s.newCustomers), Users],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do mês corrente.</p>
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
    </div>
  );
}
