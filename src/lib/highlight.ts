// LYD-60: parte un texto en tramos resaltados / no resaltados segun las
// apariciones (case-insensitive) de `query`, para pintar en negrita la
// coincidencia dentro del snippet de un mensaje o del nombre de un contacto.
// Sin imports ni alias a proposito: tests/highlight.test.mjs lo importa
// directo con node --test.
export interface HighlightPart {
  text: string;
  match: boolean;
}

export function splitHighlight(text: string, query: string): HighlightPart[] {
  const q = query.trim().toLowerCase();
  if (!q || !text) return text ? [{ text, match: false }] : [];

  const lower = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;
  let idx = lower.indexOf(q, cursor);
  while (idx !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    cursor = idx + q.length;
    idx = lower.indexOf(q, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}

// Match "de contacto": nombre o telefono. El telefono se compara solo por
// digitos, asi "+51 987 654" encuentra 51987654... como hace WhatsApp.
export function contactMatches(query: string, name: string, phone: string | null | undefined): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  const qDigits = q.replace(/\D/g, "");
  if (qDigits.length >= 3 && phone) {
    return phone.replace(/\D/g, "").includes(qDigits);
  }
  return false;
}
