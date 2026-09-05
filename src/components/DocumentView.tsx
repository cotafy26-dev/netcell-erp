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
          <strong>NETCELL INFORMÁTICA</strong>
          <span>CNPJ 61.932.181/0001-89 · (98) 98595-4491</span>
        </header>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <style>{`
        .doc-paper{
          max-width: 800px; margin: 0 auto; background: #fff; color: #111;
          padding: 40px 48px; border-radius: 8px; border: 1px solid hsl(var(--border));
          font-size: 14px; line-height: 1.6;
        }
        .doc-header{
          display:flex; justify-content:space-between; align-items:baseline;
          border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 20px;
          font-size: 12px; color:#555;
        }
        .doc-header strong{ font-size: 15px; color:#111; letter-spacing:.04em }
        .doc-paper h1{ font-size: 18px; text-align:center; margin: 0 0 4px; color:#111 }
        .doc-paper .subtitle{ text-align:center; color:#666; font-size:12px; margin:0 0 20px }
        .doc-paper h2.annex{ font-size:16px; margin-top:32px; border-top:2px solid #111; padding-top:16px }
        .doc-paper h3{ font-size:13px; margin:18px 0 6px; text-transform:uppercase; letter-spacing:.03em }
        .doc-paper p{ margin: 0 0 10px }
        .doc-paper table.parties{ width:100%; border-collapse:collapse; margin-bottom:16px }
        .doc-paper table.parties th{ text-align:left; font-size:11px; text-transform:uppercase; color:#666; padding:6px 10px; border-bottom:1px solid #ccc }
        .doc-paper table.parties td{ vertical-align:top; padding:8px 10px; border:1px solid #ddd; font-size:13px }
        .doc-paper table.signatures{ width:100%; margin-top:36px }
        .doc-paper table.signatures td{ width:50%; padding-top:24px; font-size:13px }
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
