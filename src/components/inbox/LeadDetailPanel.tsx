"use client";

import { useState } from "react";
import { pipelineStages } from "@/lib/mock-data";
import type { InboxConversation } from "@/lib/lydia-api/inbox-types";
import type { PipelineStageId } from "@/lib/types";
import { Icon } from "@/components/icons";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import { useAgents, useAssignAgent } from "@/lib/queries/conversations";

interface Props {
  conversation: InboxConversation;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="truncate text-ink-soft">{value?.trim() ? value : "..."}</span>
    </div>
  );
}

export function LeadDetailPanel({ conversation }: Props) {
  const { contact, assignee } = conversation;
  const [stage, setStage] = useState<PipelineStageId>("contacto_inicial");
  const [collapsed, setCollapsed] = useState(false);
  const stageIndex = pipelineStages.findIndex((s) => s.id === stage);

  const { data: agents = [] } = useAgents();
  const assignAgent = useAssignAgent(conversation.id);
  const canReassign = LYDIA_API_ENABLED && conversation.remoteJid !== undefined;

  if (collapsed) {
    return (
      <section className="flex h-full w-12 shrink-0 flex-col items-center border-r border-line bg-surface py-4">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Mostrar detalle del lead"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-ink"
        >
          <Icon name="panel" size={16} />
        </button>
        <div className="mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-line text-sm font-semibold text-ink-soft">
          {contact.name.slice(0, 1).toUpperCase()}
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">LEAD #{conversation.id}</h2>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Colapsar detalle del lead"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-bg-subtle hover:text-ink"
        >
          <Icon name="panel" size={14} />
        </button>
      </div>

      <p className="mt-2 text-sm font-medium text-brand">{conversation.inboxChannel}</p>
      <p className="text-xs text-muted">Canal por donde llegó la conversación</p>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-muted">Estado lead</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as PipelineStageId)}
          className="w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink-soft focus:border-brand focus:outline-none"
        >
          {pipelineStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
          {pipelineStages.map((s, i) => (
            <div
              key={s.id}
              className={`h-full flex-1 ${i <= stageIndex ? s.color : "bg-bg-subtle"} ${
                i > 0 ? "ml-0.5" : ""
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Todavía no se guarda — el backend no tiene un campo de etapa de pipeline (CRM-9, CRM-12).
        </p>
      </div>

      <div className="mt-4 border-t border-line-soft pt-3">
        <label className="mb-1 block text-xs font-medium text-muted">Presupuesto</label>
        <input
          type="text"
          placeholder="S/"
          className="w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink-soft focus:border-brand focus:outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line-soft pt-4">
        {contact.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar de perfil de WhatsApp, dominio externo
          <img src={contact.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-line text-sm font-semibold text-ink-soft">
            {contact.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{contact.name}</p>
          <p className="flex items-center gap-1 text-xs text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Brittany Group
          </p>
        </div>
      </div>

      <div className="mt-2 divide-y divide-line-soft">
        <Field label="Teléfono" value={contact.phone} />
        <Field label="Correo" value={contact.email} />
      </div>

      <div className="mt-4 border-t border-line-soft pt-4">
        <label className="mb-1 block text-xs font-medium text-muted">Usuario responsable</label>
        {canReassign ? (
          <select
            value={assignee?.id ?? ""}
            disabled={assignAgent.isPending}
            onChange={(e) => assignAgent.mutate(e.target.value || null)}
            className="w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink-soft focus:border-brand focus:outline-none"
          >
            <option value="">Sin asignar</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
                {agent.role === "administrador" ? " (admin)" : ""}
              </option>
            ))}
          </select>
        ) : assignee ? (
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-brand" />
            {assignee.name}
          </p>
        ) : (
          <p className="text-sm text-muted">Sin asignar</p>
        )}
        {!canReassign && (
          <p className="mt-1 text-[11px] text-muted">Reasignar desde acá: solo disponible con el backend conectado.</p>
        )}
      </div>
    </section>
  );
}
