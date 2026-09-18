"use client";

import { useEffect, useRef } from "react";
import type { InboxConversation, InboxMessage } from "@/lib/lydia-api/inbox-types";
import { formatMessageDay } from "@/lib/format";
import { MessageBubble } from "./MessageBubble";
import { Composer, type ComposerMediaInput } from "./Composer";
import { EditContactMenu } from "./EditContactMenu";

interface Props {
  conversation: InboxConversation;
  thread: InboxMessage[];
  isLoading: boolean;
  error: Error | null;
  onSend: (text: string) => Promise<void>;
  onSendMedia: (input: ComposerMediaInput) => Promise<void>;
  sending: boolean;
  onEditContact: (name: string, phone: string) => void;
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
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const groups = groupByDay(thread);

  return (
    <section
      className="flex h-full flex-1 flex-col bg-bg-subtle"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center justify-between border-b border-line-soft bg-surface px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{conversation.contact.name}</p>
          <p className="text-xs text-muted">{conversation.inboxChannel}</p>
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
        {!isLoading &&
          !error &&
          groups.map((group) => (
            <div key={group.day}>
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-muted shadow-sm">{group.day}</span>
              </div>
              <div className="flex flex-col gap-3">
                {group.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
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
