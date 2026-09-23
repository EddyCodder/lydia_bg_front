"use client";

import { useEffect, useRef } from "react";
import type { InboxConversation, InboxMessage } from "@/lib/lydia-api/inbox-types";
import { CHANNEL_META } from "@/lib/lydia-api/channel";
import { formatMessageDay } from "@/lib/format";
import { MessageBubble } from "./MessageBubble";
import { Composer, type ComposerMediaInput } from "./Composer";
import { EditContactMenu } from "./EditContactMenu";
import { Icon } from "@/components/icons";

interface Props {
  conversation: InboxConversation;
  thread: InboxMessage[];
  isLoading: boolean;
  error: Error | null;
  onSend: (text: string) => Promise<void>;
  onSendMedia: (input: ComposerMediaInput) => Promise<void>;
  sending: boolean;
  onEditContact: (name: string, phone: string) => void;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  hasMoreOlder?: boolean;
  onBack?: () => void;
}

export function ChatThread({
  conversation,
  thread,
  isLoading,
  error,
  onSend,
  onSendMedia,
  sending,
  onEditContact,
  onLoadOlder,
  loadingOlder = false,
  hasMoreOlder = false,
  onBack,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // LYD-17: solo baja el scroll cuando cambia el ULTIMO mensaje (llego uno
  // nuevo) -- si el efecto disparara con cualquier cambio de `thread`,
  // cargar mensajes anteriores (que se insertan arriba) tiraria el scroll
  // hacia abajo de nuevo en vez de mantener la posicion.
  useEffect(() => {
    const lastId = thread.at(-1)?.id ?? null;
    if (lastId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      lastMessageIdRef.current = lastId;
    }
  }, [thread]);

  const groups = groupByDay(thread);

  return (
    <section
      className="flex h-full flex-1 flex-col bg-bg-subtle"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center justify-between border-b border-line-soft bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver al listado de conversaciones"
              className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-ink-soft md:hidden"
            >
              <Icon name="flecha" size={16} className="rotate-180" />
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{conversation.contact.name}</p>
            <p className="text-xs text-muted">{CHANNEL_META[conversation.inboxChannel].label}</p>
          </div>
        </div>
        <EditContactMenu
          name={conversation.contact.name}
          phone={conversation.contact.phone ?? ""}
          onSave={onEditContact}
        />
      </header>

      <div className="scroll-slim flex-1 overflow-y-auto px-6 py-4">
        {isLoading && <p className="text-center text-sm text-muted">Cargando mensajes…</p>}
        {error && <p className="text-center text-sm text-danger">No se pudieron cargar los mensajes: {error.message}</p>}
        {!isLoading && !error && hasMoreOlder && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadingOlder}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-brand hover:bg-bg-subtle disabled:cursor-wait disabled:opacity-60"
            >
              {loadingOlder ? "Cargando…" : "Cargar mensajes anteriores"}
            </button>
          </div>
        )}
        {!isLoading &&
          !error &&
          groups.map((group) => (
            <div key={group.day}>
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-muted shadow-sm">{group.day}</span>
              </div>
              <div className="flex flex-col gap-3">
                {group.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} instanceName={conversation.instanceName ?? ""} />
                ))}
              </div>
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={onSend} onSendMedia={onSendMedia} disabled={sending || !conversation.id} />
    </section>
  );
}

function groupByDay(thread: InboxMessage[]) {
  const groups: { day: string; messages: InboxMessage[] }[] = [];
  for (const message of thread) {
    const day = formatMessageDay(message.sentAt);
    const last = groups.at(-1);
    if (last && last.day === day) {
      last.messages.push(message);
    } else {
      groups.push({ day, messages: [message] });
    }
  }
  return groups;
}
