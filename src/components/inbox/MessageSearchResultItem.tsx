import type { InboxContact, InboxMessageSearchHit } from "@/lib/lydia-api/inbox-types";
import { CHANNEL_META } from "@/lib/lydia-api/channel";
import { formatRelativeTime } from "@/lib/format";
import { ContactAvatar } from "@/components/ContactAvatar";
import { HighlightedText } from "./HighlightedText";

interface Props {
  hit: InboxMessageSearchHit;
  // Contacto de la conversacion ya cargada en la lista, si esta -- asi el
  // nombre/avatar salen iguales que en "Contactos" (mismo seed del avatar).
  contact?: InboxContact;
  query: string;
  active: boolean;
  onClick: () => void;
}

// LYD-60: fila de la seccion "Mensajes" del buscador del inbox.
export function MessageSearchResultItem({ hit, contact, query, active, onClick }: Props) {
  const channel = CHANNEL_META[hit.inboxChannel];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors ${
        active ? "bg-brand/10" : "hover:bg-bg-subtle"
      }`}
    >
      <div className="relative shrink-0">
        <ContactAvatar
          seed={contact?.lydiaContactId ?? hit.conversationId}
          avatarUrl={contact?.avatarUrl ?? hit.avatarUrl}
          className="h-10 w-10"
        />
        <span
          title={channel.label}
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: channel.color }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-ink">{contact?.name ?? hit.contactName}</span>
          <span className="shrink-0 text-xs text-muted">{formatRelativeTime(hit.sentAt)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
          {hit.fromMe && <span className="text-muted">Tú: </span>}
          <HighlightedText text={hit.snippet} query={query} />
        </p>
      </div>
    </button>
  );
}
