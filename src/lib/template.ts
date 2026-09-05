/** Extrai os nomes únicos de tags {{assim}} de um HTML de modelo. */
export function extractTags(html: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) if (m[1]) found.add(m[1]);
  return [...found];
}

/** Substitui {{tag}} pelos valores informados (vazio se não houver valor). */
export function renderTemplate(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, tag) => values[tag] ?? '');
}

/** Rótulo amigável para um nome de tag (numero_contrato -> "Numero contrato"). */
export function tagLabel(tag: string): string {
  const s = tag.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
