import type { InboxConversation } from "@/lib/lydia-api/inbox-types";
import { formatRelativeTime } from "@/lib/format";

interface Props {
  conversation: InboxConversation;
  active: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, active, onClick }: Props) {
  const { contact } = conversation;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors ${
        active ? "bg-brand/10" : "hover:bg-bg-subtle"
      }`}
    >
      <div className="relative shrink-0">
        {contact.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar de perfil de WhatsApp, dominio externo sin allowlist configurado todavía
          <img src={contact.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-2 text-sm font-semibold text-white">
            {contact.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          {/* LYD-30: sin el id interno de la conversacion (UUID de la base): no lo entienden las asesoras y truncaba el nombre. */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold text-ink">{contact.name}</span>
          </div>
          <span className="shrink-0 text-xs text-muted">{formatRelativeTime(conversation.lastMessageAt)}</span>
        </div>
        <p
          className={`mt-1 truncate text-sm ${
            conversation.unreadCount > 0 ? "font-semibold text-ink" : "text-ink-soft"
          }`}
        >
          {conversation.lastMessagePreview || "Sin mensajes todavía"}
        </p>
      </div>

      {conversation.unreadCount > 0 && (
        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
}
