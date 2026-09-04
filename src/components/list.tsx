import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { buttonVariants, Button, Input } from './ui';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Link to={action.to} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="size-4" /> {action.label}
        </Link>
      )}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mb-4 max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  count,
  onPage,
}: {
  page: number;
  totalPages: number;
  count: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>{count} registro(s)</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
