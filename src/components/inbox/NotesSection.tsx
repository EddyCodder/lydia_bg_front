"use client";

import { useState } from "react";
import { useAddNote, useNotes } from "@/lib/queries/notes";
import { formatRelativeTime } from "@/lib/format";

interface Props {
  conversationId: string;
  canUseNotes: boolean;
}

// LYD-21: el backend (crm.service.ts listNotes/addNote) existia sin ningun
// componente que lo consumiera -- esta es la primera UI de notas internas.
export function NotesSection({ conversationId, canUseNotes }: Props) {
  const [content, setContent] = useState("");
  const { data: notes = [], isLoading } = useNotes(canUseNotes ? conversationId : null);
  const addNote = useAddNote(conversationId);

  const handleAdd = () => {
    const trimmed = content.trim();
    if (!trimmed || addNote.isPending) return;
    addNote.mutate(trimmed, { onSuccess: () => setContent("") });
  };

  return (
    <div className="mt-4 border-t border-line-soft pt-4">
      <label className="mb-1 block text-xs font-medium text-muted">Notas internas</label>

      {!canUseNotes ? (
        <p className="text-[11px] text-muted">Solo disponibles con el backend conectado.</p>
      ) : (
        <>
          <div className="scroll-slim flex max-h-40 flex-col gap-2 overflow-y-auto">
            {isLoading && <p className="text-xs text-muted">Cargando…</p>}
            {!isLoading && notes.length === 0 && <p className="text-xs text-muted">Sin notas todavía.</p>}
            {notes.map((note) => (
              <div key={note.id} className="rounded-md bg-bg-subtle px-2.5 py-2 text-xs text-ink-soft">
                <p className="whitespace-pre-line">{note.content}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {note.authorName ?? "Sin autor"} · {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-1.5">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              type="text"
              placeholder="Agregar nota interna…"
              className="w-full rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!content.trim() || addNote.isPending}
              className="shrink-0 rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-2"
            >
              {addNote.isPending ? "…" : "Agregar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
