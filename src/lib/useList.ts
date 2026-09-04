import { useCallback, useEffect, useState } from 'react';
import { listPaged, type ListParams, type Paged } from './db';

export function usePagedList<T = Record<string, unknown>>(params: Omit<ListParams, 'page' | 'search'>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<Paged<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const key = JSON.stringify(params);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    listPaged<T>({ ...JSON.parse(key), page, search })
      .then((r) => alive && setResult(r))
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key, page, search, reloadKey]);

  return { page, setPage, search, setSearch: (v: string) => { setPage(1); setSearch(v); }, result, loading, error, reload };
}
