"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useArchiveConversation, useDeleteConversation } from "@/lib/queries/conversations";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";

interface Props {
  conversationId: string;
}

// LYD-40: menu de 3 puntos por fila del inbox -- Cerrar (archiva, reversible,
// cualquier agente) y Eliminar (borra el Chat y sus mensajes de verdad,
// irreversible). Eliminar solo se muestra a un administrador, pero el
// gateo real esta en el route handler server-side (DELETE
// /api/lydia/conversations/[id]) -- esconderlo aca es solo UX, no seguridad.
export function ConversationRowMenu({ conversationId }: Props) {
  const { agent } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const archive = useArchiveConversation();
  const deleteConversation = useDeleteConversation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setConfirmingDelete(false);
  };
  useEscapeKey(open, close);

  // Esta fila entera es clickeable (abre la conversacion) -- sin esto,
  // clickear la fila con el menu abierto seleccionaba la conversacion Y
  // dejaba el dropdown flotando encima, sin cerrarse.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleArchive = () => {
    archive.mutate(conversationId);
    close();
  };

  const handleDelete = () => {
    deleteConversation.mutate(conversationId);
    close();
  };

  return (
    <div ref={wrapperRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Opciones de la conversación"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-ink-soft"
      >
        <Icon name="kebab" size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={handleArchive}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-ink-soft hover:bg-bg-subtle"
              >
                <Icon name="archivo" size={15} />
                Cerrar conversación
              </button>
              {agent?.role === "administrador" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-danger hover:bg-danger/10"
                >
                  <Icon name="basura" size={15} />
                  Eliminar conversación
                </button>
              )}
            </>
          ) : (
            <div className="p-1.5">
              <p className="px-1 text-xs text-ink-soft">
                Esto borra la conversación y sus mensajes. No se puede deshacer.
              </p>
              <div className="mt-2 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-ink-soft hover:bg-bg-subtle"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteConversation.isPending}
                  className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
