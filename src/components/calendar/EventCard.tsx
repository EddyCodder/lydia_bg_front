import { getAgentById, getLeadById } from "@/lib/mock-data";
import type { CalendarEvent } from "@/lib/types";
import { formatMessageTime } from "@/lib/format";

const noteLabelByType: Record<CalendarEvent["type"], string> = {
  chat: "Mensaje",
  nota: "Nota",
  tarea: "Seguimiento",
  reserva: "Detalle",
};

interface Props {
  event: CalendarEvent;
}

export function EventCard({ event }: Props) {
  const lead = event.leadId ? getLeadById(event.leadId) : undefined;
  const agent = getAgentById(event.agentId);

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="font-semibold text-ink">{lead?.contactName ?? "Recordatorio general"}</p>
      {lead && <p className="text-sm text-brand">Lead {lead.leadNumber}</p>}
      <p className="mt-1 text-xs text-success">
        {formatMessageTime(event.startAt)} - {formatMessageTime(event.endAt)}
        {agent && `, para ${agent.name}`}
      </p>
      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-soft">
        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted" />
        <span>
          <span className="font-semibold text-ink">{noteLabelByType[event.type]}: </span>
          {event.note}
        </span>
      </p>
    </div>
  );
}
