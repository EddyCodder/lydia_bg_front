"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (data: { name: string; category: string }) => void;
}

export function NewTemplateModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), category: category.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 cursor-default" />
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm rounded-xl bg-surface p-5 shadow-xl">
        <h2 className="text-base font-semibold text-ink">Nueva plantilla</h2>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Nombre *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              placeholder="Ej. Horarios sede Cayma"
              className="w-full rounded-md border border-line px-2.5 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Categoría</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              type="text"
              placeholder="Opcional"
              className="w-full rounded-md border border-line px-2.5 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Tipo de plantilla</label>
            <input
              disabled
              value="General"
              className="w-full rounded-md border border-line bg-bg-subtle px-2.5 py-2 text-sm text-muted"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-bg-subtle"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-2"
          >
            Crear plantilla
          </button>
        </div>
      </form>
    </div>
  );
}
