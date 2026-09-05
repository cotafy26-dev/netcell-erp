import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Button } from './ui';

/**
 * Mostra um documento (contrato/proposta) já renderizado (tags substituídas)
 * com um botão "Imprimir / Baixar PDF" que usa o diálogo de impressão do
 * navegador — o usuário escolhe "Salvar como PDF" no destino. Zero
 * dependências extras, funciona em qualquer navegador.
 */
export function DocumentView({ title, html }: { title: string; html: string }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pré-visualização
        </h2>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir / Baixar PDF
        </Button>
      </div>

      <div id="doc-print-area" className="doc-paper">
        <header className="doc-header">
          <img src="/logo-netcell.png" alt="NetCell Informática" />
        </header>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <footer className="doc-footer">
          <span>NETCELL INFORMÁTICA · {title}</span>
          <span>Página 1</span>
        </footer>
      </div>

      <style>{`
        .doc-paper{
          max-width: 800px; margin: 0 auto; background: #fff; color: #111;
          padding: 40px 48px; border-radius: 8px; border: 1px solid hsl(var(--border));
          font-size: 14px; line-height: 1.6;
        }
        .doc-header{ text-align:center; margin-bottom: 8px }
        .doc-header img{ height: 64px; width:auto }
        .doc-footer{
          display:flex; justify-content:space-between; align-items:center;
          border-top: 1px solid #ddd; margin-top: 32px; padding-top: 10px;
          font-size: 10px; color:#999;
        }
        .doc-paper h1{ font-size: 18px; text-align:center; margin: 0 0 4px; color:#111 }
        .doc-paper .subtitle{ text-align:center; color:#666; font-size:12px; margin:0 0 20px }
        .doc-paper h2.annex{ font-size:16px; margin-top:32px; border-top:2px solid #111; padding-top:16px }
        .doc-paper h3{ font-size:13px; margin:18px 0 6px; text-transform:uppercase; letter-spacing:.03em; color:#1a4d8f }
        .doc-paper p{ margin: 0 0 10px; white-space: pre-line }
        .doc-paper table.parties{ width:100%; border-collapse:collapse; margin-bottom:16px }
        .doc-paper table.parties th{ text-align:left; font-size:11px; text-transform:uppercase; color:#666; padding:6px 10px; border-bottom:1px solid #ccc }
        .doc-paper table.parties td{ vertical-align:top; padding:8px 10px; border:1px solid #ddd; font-size:13px }
        .doc-paper table.items{ width:100%; border-collapse:collapse; margin:10px 0 16px }
        .doc-paper table.items th{ text-align:left; font-size:11px; text-transform:uppercase; color:#666; padding:6px 10px; background:#f3f5f8; border:1px solid #ddd }
        .doc-paper table.items td{ padding:6px 10px; border:1px solid #ddd; font-size:13px }
        .doc-paper table.items td.total{ font-weight:700; color:#1a4d8f }
        .doc-paper table.info{ width:100%; border-collapse:collapse; margin:10px 0 16px }
        .doc-paper table.info th{ width:30%; text-align:left; font-size:12px; color:#555; padding:7px 10px; background:#f3f5f8; border:1px solid #ddd }
        .doc-paper table.info td{ padding:7px 10px; border:1px solid #ddd; font-size:13px }
        .doc-paper .pix-box{ border:1px solid #ddd; border-radius:6px; padding:12px 16px; margin:8px 0 16px; background:#f8f9fb }
        .doc-paper .pix-box strong{ display:block; margin-bottom:4px; color:#1a4d8f }
        .doc-paper table.signatures{ width:100%; margin-top:36px; text-align:center }
        .doc-paper table.signatures td{ width:50%; padding-top:24px; font-size:13px }
        .doc-paper .sig-label{ display:block; margin-top:4px; font-size:11px; color:#666 }
        .doc-paper .local-data{ margin-top:24px }

        @media print{
          body *{ visibility:hidden }
          #doc-print-area, #doc-print-area *{ visibility:visible }
          #doc-print-area{ position:absolute; inset:0; border:0; border-radius:0; max-width:none; padding:24px 40px }
          .no-print{ display:none !important }
        }
      `}</style>
    </div>
  );
}
