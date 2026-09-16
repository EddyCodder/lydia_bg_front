import type { Lead } from "@/lib/types";
import { formatLeadCardDate } from "@/lib/format";

interface Props {
  lead: Lead;
}

export function LeadCard({ lead }: Props) {
  return (
    <div className="border-b border-line-soft px-3 py-2.5 hover:bg-bg-subtle">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-ink">{lead.contactName}</span>
        <span className="shrink-0 text-xs text-muted">{formatLeadCardDate(lead.createdAt)}</span>
      </div>
      <p className="mt-0.5 text-sm text-brand">Lead {lead.leadNumber}</p>
      {lead.source && <p className="mt-0.5 truncate text-xs text-muted">{lead.source}</p>}
      <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
        <span className="h-1 w-1 rounded-full bg-amber-400" />
        {lead.hasPendingTasks ? "Tiene tareas pendientes" : "No hay tareas"}
      </p>
    </div>
  );
}
