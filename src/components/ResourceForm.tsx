import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Textarea } from './ui';
import { cn } from '@/lib/utils';
import { clean, insertRow, updateRow } from '@/lib/db';
import { applyMask, isDigitMask, maskError, type Mask } from '@/lib/masks';

export type FieldDef = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'tel' | 'textarea' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
  step?: string;
  mask?: Mask;
  maxLength?: number;
};

export function ResourceForm({
  table,
  fields,
  initial,
  mode,
  redirectTo,
  transform,
  submitLabel = 'Salvar',
  onSaved,
  extraSection,
}: {
  table: string;
  fields: FieldDef[];
  initial?: Record<string, unknown>;
  mode: 'create' | 'edit';
  redirectTo: string;
  transform?: (v: Record<string, unknown>) => Record<string, unknown>;
  submitLabel?: string;
  onSaved?: (savedId: string) => Promise<void> | void;
  extraSection?: ReactNode;
}) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    // validação de tamanho de CPF/CNPJ/CEP/telefone
    for (const f of fields) {
      if (!f.mask) continue;
      const msg = maskError(f.mask, String(fd.get(f.name) ?? ''));
      if (msg) {
        setError(`${f.label}: ${msg}`);
        setLoading(false);
        return;
      }
    }

    const body: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === 'checkbox') {
        body[f.name] = fd.get(f.name) === 'on';
      } else {
        const raw = fd.get(f.name);
        if (raw === null || raw === '') {
          if (mode === 'edit') body[f.name] = null;
          continue;
        }
        body[f.name] = f.type === 'number' ? Number(raw) : String(raw);
      }
    }
    const payload = clean(transform ? transform(body) : body);

    try {
      const saved =
        mode === 'create'
          ? await insertRow<{ id: string }>(table, payload)
          : await updateRow<{ id: string }>(table, String(initial?.id), payload);
      if (onSaved) await onSaved(saved.id);
      nav(redirectTo);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const dvRaw = initial?.[f.name];
        const dv = f.mask ? applyMask(f.mask, String(dvRaw ?? '')) : (dvRaw as string) ?? '';
        const wrap = cn('flex flex-col gap-1.5', f.colSpan === 2 || f.type === 'textarea' ? 'sm:col-span-2' : '');
        return (
          <div key={f.name} className={wrap}>
            {f.type !== 'checkbox' && (
              <label htmlFor={f.name} className="text-sm font-medium">
                {f.label}
                {f.required && <span className="text-accent"> *</span>}
              </label>
            )}
            {f.type === 'textarea' ? (
              <Textarea id={f.name} name={f.name} required={f.required} defaultValue={dv} />
            ) : f.type === 'select' ? (
              <Select id={f.name} name={f.name} required={f.required} defaultValue={dv}>
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : f.type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name={f.name}
                  defaultChecked={dvRaw === undefined ? true : Boolean(dvRaw)}
                  className="size-4"
                />
                {f.label}
              </label>
            ) : (
              <Input
                id={f.name}
                name={f.name}
                type={f.type ?? 'text'}
                step={f.step}
                required={f.required}
                placeholder={f.placeholder}
                maxLength={f.maxLength}
                inputMode={isDigitMask(f.mask) ? 'numeric' : undefined}
                onInput={
                  f.mask
                    ? (e) => {
                        const el = e.currentTarget;
                        el.value = applyMask(f.mask as Mask, el.value);
                      }
                    : undefined
                }
                defaultValue={
                  f.type === 'date' && dvRaw ? new Date(dvRaw as string).toISOString().slice(0, 10) : dv
                }
              />
            )}
          </div>
        );
      })}

      {extraSection}

      {error && <p className="text-sm text-accent sm:col-span-2">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => nav(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
