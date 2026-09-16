import type { InboxMessage } from "@/lib/chatwoot/inbox-types";
import { formatMessageTime } from "@/lib/format";

interface Props {
  message: InboxMessage;
}

export function MessageBubble({ message }: Props) {
  if (message.direction === "system") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs text-ink-soft">{message.text}</span>
      </div>
    );
  }

  const isOutbound = message.direction === "outbound";

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-md flex-col gap-1">
        {isOutbound && message.senderName && (
          <span className="self-end text-xs text-muted">
            {formatMessageTime(message.sentAt)} · {message.senderName}
          </span>
        )}
        <div
          className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isOutbound
              ? "rounded-tr-sm bg-brand text-white"
              : "rounded-tl-sm bg-bg-subtle text-ink"
          }`}
        >
          {message.text}
        </div>
        <div className={`flex items-center gap-1 text-xs text-muted ${isOutbound ? "justify-end" : ""}`}>
          {!isOutbound && <span>{formatMessageTime(message.sentAt)}</span>}
          {isOutbound && message.read && (
            <span className="flex items-center gap-0.5 text-brand">
              Leído
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 12 6 17 11 10" />
                <polyline points="9 15 17 6" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
