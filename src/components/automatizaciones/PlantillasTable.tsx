"use client";

import { useState } from "react";
import { chatTemplates as initialTemplates } from "@/lib/mock-data";
import type { ChatTemplate } from "@/lib/types";
import { NewTemplateModal } from "./NewTemplateModal";

export function PlantillasTable() {
  const [templates, setTemplates] = useState<ChatTemplate[]>(initialTemplates);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const allSelected = selected.size > 0 && selected.size === templates.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(templates.map((t) => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = (data: { name: string; category: string }) => {
    setTemplates((prev) => [
      { id: `tpl-local-${Date.now()}`, name: data.name, type: "General", status: "No requerido", category: data.category },
      ...prev,
    ]);
    setModalOpen(false);
  };

  return (
    <section className="scroll-slim flex h-full flex-1 flex-col overflow-y-auto bg-bg px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Plantillas de chat</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Nueva plantilla
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="w-10 border-b border-line py-2.5 pl-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand" />
              </th>
              <th className="border-b border-line py-2.5 pr-4">Nombre</th>
              <th className="border-b border-line py-2.5 pr-4">Tipo de plantilla</th>
              <th className="border-b border-line py-2.5 pr-4">Estatus</th>
              <th className="border-b border-line py-2.5 pr-4">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-bg-subtle">
                <td className="border-b border-line-soft py-2.5 pl-4">
                  <input
                    type="checkbox"
                    checked={selected.has(template.id)}
                    onChange={() => toggleOne(template.id)}
                    className="accent-brand"
                  />
                </td>
                <td className="border-b border-line-soft py-2.5 pr-4 font-medium text-accent-dark">{template.name}</td>
                <td className="border-b border-line-soft py-2.5 pr-4 text-ink-soft">{template.type}</td>
                <td className="border-b border-line-soft py-2.5 pr-4">
                  <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-muted">
                    {template.status}
                  </span>
                </td>
                <td className="border-b border-line-soft py-2.5 pr-4 text-muted">{template.category || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}
    </section>
  );
}
