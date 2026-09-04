import { supabase } from './supabase';

/** Paginação padrão sobre uma tabela do Supabase. */
export interface ListParams {
  table: string;
  select?: string;
  search?: string;
  searchColumns?: string[];
  page?: number;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Array<[string, unknown]>;
}

export interface Paged<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listPaged<T = Record<string, unknown>>(p: ListParams): Promise<Paged<T>> {
  const page = p.page ?? 1;
  const pageSize = p.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from(p.table)
    .select(p.select ?? '*', { count: 'exact' })
    .order(p.orderBy ?? 'createdAt', { ascending: p.ascending ?? false })
    .range(from, to);

  for (const [col, val] of p.filters ?? []) q = q.eq(col, val as never);

  if (p.search && p.searchColumns?.length) {
    const term = p.search.replace(/[%,()]/g, ' ').trim();
    q = q.or(p.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(','));
  }

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return {
    data: (data ?? []) as T[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getOne<T = Record<string, unknown>>(table: string, id: string, select = '*') {
  const { data, error } = await supabase.from(table).select(select).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as T | null;
}

export async function insertRow<T = Record<string, unknown>>(table: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function updateRow<T = Record<string, unknown>>(
  table: string,
  id: string,
  values: Record<string, unknown>,
) {
  const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** Remove strings vazias e undefined (para não gravar '' onde o esperado é null). */
export function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = v === '' ? null : v;
  }
  return out;
}
