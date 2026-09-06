import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteRow, insertRow, updateRow } from '@/lib/db';
import { PageHeader } from '@/components/list';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner, Textarea } from '@/components/ui';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaMsg: string;
  order: number;
  active: boolean;
};

const BUCKET = 'site';

function BannerCard({ data, onChanged }: { data: Banner; onChanged: () => void }) {
  const [b, setB] = useState<Banner>(data);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Banner>(k: K, v: Banner[K]) => setB((s) => ({ ...s, [k]: v }));

  async function salvar() {
    setBusy(true);
    setMsg(null);
    try {
      await updateRow('SiteBanner', b.id, {
        title: b.title,
        subtitle: b.subtitle,
        body: b.body,
        imageUrl: b.imageUrl,
        ctaLabel: b.ctaLabel,
        ctaMsg: b.ctaMsg,
        order: Number(b.order) || 0,
        active: b.active,
      });
      setMsg('Salvo.');
      onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function excluir() {
    if (!confirm('Excluir este banner?')) return;
    setBusy(true);
    try {
      await deleteRow('SiteBanner', b.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function enviarImagem(file: File) {
    setUp(true);
    setMsg(null);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `banner-${b.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) throw new Error(error.message);
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      set('imageUrl', url);
      await updateRow('SiteBanner', b.id, { imageUrl: url });
      setMsg('Imagem enviada.');
      onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setUp(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">Banner {b.order}</CardTitle>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={b.active} onChange={(e) => set('active', e.target.checked)} />
          Ativo
        </label>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <div className="grid aspect-[16/9] place-items-center overflow-hidden rounded-md border bg-muted text-xs text-muted-foreground">
            {b.imageUrl ? (
              <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>sem imagem</span>
            )}
          </div>
          <label className="block">
            <span className="sr-only">Enviar imagem</span>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-brand-fg"
              disabled={up}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) enviarImagem(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
          {up && <p className="text-xs text-muted-foreground">Enviando…</p>}
          <p className="text-xs text-muted-foreground">Imagem larga (ex.: 1600×600). O texto aparece por cima, à esquerda.</p>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Título</label>
              <Input value={b.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Rótulo pequeno (linha de cima)</label>
              <Input value={b.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Texto</label>
            <Textarea value={b.body} onChange={(e) => set('body', e.target.value)} rows={2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Texto do botão</label>
              <Input value={b.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Mensagem do WhatsApp</label>
              <Input value={b.ctaMsg} onChange={(e) => set('ctaMsg', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ordem</label>
              <Input
                type="number"
                value={b.order}
                onChange={(e) => set('order', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={salvar} loading={busy}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" className="text-accent" onClick={excluir} disabled={busy}>
              Excluir
            </Button>
            {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Section = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  lead: string;
  visible: boolean;
  order: number;
};

function SectionCard({ data, onChanged }: { data: Section; onChanged: () => void }) {
  const [s, setS] = useState<Section>(data);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = <K extends keyof Section>(k: K, v: Section[K]) => setS((x) => ({ ...x, [k]: v }));

  async function salvar() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('SiteSection')
        .update({ eyebrow: s.eyebrow, title: s.title, lead: s.lead, visible: s.visible })
        .eq('key', s.key);
      if (error) throw new Error(error.message);
      setMsg('Salvo.');
      onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={s.visible ? '' : 'opacity-60'}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">{s.label}</CardTitle>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={s.visible} onChange={(e) => set('visible', e.target.checked)} />
          Mostrar no site
        </label>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Rótulo pequeno (linha de cima)</label>
            <Input value={s.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Título</label>
            <Input value={s.title} onChange={(e) => set('title', e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Texto</label>
          <Textarea value={s.lead} onChange={(e) => set('lead', e.target.value)} rows={2} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={salvar} loading={busy}>
            Salvar
          </Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function SiteVendas() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      supabase.from('SiteBanner').select('*').order('order', { ascending: true }),
      supabase.from('SiteSection').select('*').order('order', { ascending: true }),
    ]).then(([b, s]) => {
      if (b.error) setErr(b.error.message);
      if (s.error) setErr(s.error.message);
      setBanners((b.data as Banner[]) ?? []);
      setSections((s.data as Section[]) ?? []);
      setLoading(false);
    });
  }, []);
  useEffect(load, [load]);

  async function novoBanner() {
    const max = banners.reduce((m, b) => Math.max(m, b.order), 0);
    await insertRow('SiteBanner', { title: 'Novo banner', subtitle: '', body: '', order: max + 1 });
    load();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <PageHeader
          title="Página de Vendas"
          subtitle="Edite o que aparece no site netcellinformatica.com.br"
        />
        <p className="text-sm text-muted-foreground">
          Altere aqui e clique em <b>Salvar</b>. As mudanças aparecem no site em poucos minutos (às vezes é preciso
          atualizar a página com o cache limpo).
        </p>
        {err && <p className="text-sm text-accent">{err}</p>}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Banners do topo (girando)</h2>
            {banners.map((b) => (
              <BannerCard key={b.id} data={b} onChanged={load} />
            ))}
            {banners.length === 0 && <p className="text-sm text-muted-foreground">Nenhum banner cadastrado.</p>}
            <Button variant="outline" onClick={novoBanner}>
              + Adicionar banner
            </Button>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Blocos do site — textos e o que mostrar</h2>
            <p className="text-sm text-muted-foreground">
              Cada bloco é uma parte da página. Desmarque <b>“Mostrar no site”</b> para esconder o bloco (e o item dele no menu).
            </p>
            {sections.map((s) => (
              <SectionCard key={s.key} data={s} onChanged={load} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
