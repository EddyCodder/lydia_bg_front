"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";

interface Props {
  name: string;
  phone: string;
  onSave: (name: string, phone: string) => void;
}

// LYD-14: reemplaza el "Conversación N° <id>" del header del chat -- ese id
// no le sirve a nadie para identificar al cliente. WhatsApp a veces manda un
// nickname/tag raro en vez del nombre, o el numero no queda claro, asi que
// esto deja renombrarlos a mano (override propio de Lydia, ver adaptContact).
export function EditContactMenu({ name, phone, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
  useEscapeKey(open, () => setOpen(false));

  const handleOpen = () => {
    setDraftName(name);
    setDraftPhone(phone);
    setOpen(true);
  };

  const handleSave = () => {
    onSave(draftName.trim(), draftPhone.trim());
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Editar contacto"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-ink-soft"
      >
        <Icon name="kebab" size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar contacto"
          className="absolute right-0 top-9 z-20 w-64 rounded-lg border border-line bg-surface p-3 shadow-lg"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Editar contacto</p>

          <label className="mt-2 block text-xs font-medium text-ink-soft">
            Nombre
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              type="text"
              className="mt-1 w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>

          <label className="mt-2 block text-xs font-medium text-ink-soft">
            Número
            <input
              value={draftPhone}
              onChange={(e) => setDraftPhone(e.target.value)}
              type="text"
              className="mt-1 w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-bg-subtle"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draftName.trim()}
              className="rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-2"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
