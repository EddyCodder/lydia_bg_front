import { splitHighlight } from "@/lib/highlight";

// LYD-60: resalta las coincidencias de la busqueda (nombre de contacto o
// snippet de mensaje), estilo WhatsApp.
export function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlight(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-sm bg-accent/25 font-semibold text-ink">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
