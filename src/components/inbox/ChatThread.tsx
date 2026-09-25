"use client";

import { useEffect, useRef, useState } from "react";
import type { InboxConversation, InboxMessage } from "@/lib/lydia-api/inbox-types";
import { CHANNEL_META } from "@/lib/lydia-api/channel";
import { formatLeadCardDate, formatMessageDay } from "@/lib/format";
import { MessageBubble } from "./MessageBubble";
import { Composer, type ComposerAudioInput, type ComposerMediaInput, type ComposerQuoted } from "./Composer";
import { EditContactMenu } from "./EditContactMenu";
import { Icon } from "@/components/icons";

interface Props {
  conversation: InboxConversation;
  thread: InboxMessage[];
  isLoading: boolean;
  error: Error | null;
  onSend: (text: string, quoted?: ComposerQuoted) => Promise<void>;
  onSendMedia: (input: ComposerMediaInput) => Promise<void>;
  onSendAudio: (input: ComposerAudioInput) => Promise<void>;
  onReact: (message: InboxMessage, emoji: string) => void;
  onForward: (message: InboxMessage, targetConversationId: string) => void;
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
  onSendAudio,
  onReact,
  onForward,
  sending,
  onEditContact,
  onLoadOlder,
  loadingOlder = false,
  hasMoreOlder = false,
  onBack,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  // LYD-52: mensaje elegido con "Responder" del menu contextual -- vive aca
  // (no en InboxView) porque es puramente UI del hilo. Se resetea al cambiar
  // de conversacion con el mismo patron "ajustar estado durante el render"
  // que ya usa InboxView.tsx para olderMessagesKey, no un efecto.
  const [replyingTo, setReplyingTo] = useState<InboxMessage | null>(null);
  const [replyingToKey, setReplyingToKey] = useState(conversation.id);
  if (replyingToKey !== conversation.id) {
    setReplyingToKey(conversation.id);
    setReplyingTo(null);
  }

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

  // LYD-54: Meta rechaza texto libre si pasaron mas de 24h desde el ultimo
  // mensaje del contacto (solo deja plantillas pre-aprobadas fuera de esa
  // ventana) -- antes el agente lo descubria recien cuando el envio fallaba
  // en silencio del lado de Meta (el error solo quedaba en los logs de
  // evolution-api). Se calcula 100% aca, del thread ya cargado -- alcanza:
  // los ultimos mensajes siempre estan en la pagina ya traida por polling.
  // "now" en estado (no Date.now() directo en el render, que es impuro) y
  // refrescado cada minuto, asi el aviso aparece solo con el chat abierto
  // sin esperar a que llegue un mensaje nuevo.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const lastInboundAt = findLastInboundAt(thread);
  const outsideSessionWindow =
    thread.length > 0 && (lastInboundAt === null || now - new Date(lastInboundAt).getTime() > SESSION_WINDOW_MS);

  const groups = groupByDay(thread);

  return (
    <section className="flex h-full flex-1 flex-col bg-bg-subtle">
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
                  <MessageBubble
                    key={message.id}
                    message={message}
                    instanceName={conversation.instanceName ?? ""}
                    conversationId={conversation.id}
                    onReply={setReplyingTo}
                    onReact={onReact}
                    onForward={onForward}
                  />
                ))}
              </div>
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      {outsideSessionWindow && (
        <div className="flex items-start gap-2 border-t border-line-soft bg-accent/10 px-4 py-2.5 text-xs text-accent-dark">
          <Icon name="ajustes" size={14} className="mt-0.5 shrink-0" />
          <p>
            Pasaron más de 24 h desde el último mensaje del contacto
            {lastInboundAt && ` (${formatLeadCardDate(lastInboundAt)})`}. Meta bloquea el envío de texto libre fuera de
            esa ventana — esperá a que te escriba de nuevo o usá una plantilla aprobada.
          </p>
        </div>
      )}
      <Composer
        onSend={onSend}
        onSendMedia={onSendMedia}
        onSendAudio={onSendAudio}
        disabled={sending || !conversation.id || outsideSessionWindow}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </section>
  );
}

// LYD-54: "standard messaging window" de Meta -- misma regla en WhatsApp,
// Messenger e Instagram (LYD-26).
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

function findLastInboundAt(thread: InboxMessage[]): string | null {
  for (let i = thread.length - 1; i >= 0; i--) {
    if (thread[i].direction === "inbound") return thread[i].sentAt;
  }
  return null;
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
