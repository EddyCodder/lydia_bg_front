"use client";

import { useEffect, useMemo, useState } from "react";
import { useConversations, useMarkConversationRead, useMessages, useSendMessage } from "@/lib/queries/conversations";
import { getMockMessages, mockInboxConversations } from "@/lib/lydia-api/mock-fallback";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import type { InboxMessage } from "@/lib/lydia-api/inbox-types";
import { ConversationList } from "./ConversationList";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { ChatThread } from "./ChatThread";
import { Icon } from "@/components/icons";

function MockModeBanner({ detail }: { detail?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-accent/30 bg-accent/10 px-4 py-2 text-xs text-accent-dark">
      <Icon name="ajustes" size={14} className="shrink-0" />
      <span>
        Viendo datos de ejemplo — la conexión al backend de Lydia está apagada{detail ? ` (${detail})` : ""}. Poné{" "}
        <code className="rounded bg-white/50 px-1">NEXT_PUBLIC_LYDIA_API_ENABLED=true</code> en{" "}
        <code className="rounded bg-white/50 px-1">.env.local</code> junto con las credenciales para conectar
        el inbox real.
      </span>
    </div>
  );
}

export function InboxView() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mockDrafts, setMockDrafts] = useState<Record<string, InboxMessage[]>>({});

  const { data: realConversations = [], isLoading, error } = useConversations("all");
  const isMockMode = !LYDIA_API_ENABLED || error !== null;
  const conversations = isMockMode ? mockInboxConversations : realConversations;

  const effectiveSelectedId = selectedConversationId ?? conversations[0]?.id ?? null;
  const selectedConversation = conversations.find((c) => c.id === effectiveSelectedId) ?? null;

  const {
    data: realMessages = [],
    isLoading: realMessagesLoading,
    error: realMessagesError,
  } = useMessages(isMockMode ? null : effectiveSelectedId);
  const sendMessage = useSendMessage(effectiveSelectedId);
  const markConversationRead = useMarkConversationRead();

  // LYD-13: abrir un chat con mensajes sin leer lo marca como leido. Antes
  // de esto Chat.unreadMessages (Evolution API) nunca se reseteaba, asi que
  // el badge de "N sin leer" quedaba pegado para siempre, hasta despues de
  // responder.
  useEffect(() => {
    if (isMockMode || effectiveSelectedId === null) return;
    const conversation = conversations.find((c) => c.id === effectiveSelectedId);
    if (conversation && conversation.unreadCount > 0) {
      markConversationRead.mutate(effectiveSelectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe disparar al cambiar de conversacion, no en cada refetch de `conversations`
  }, [effectiveSelectedId, isMockMode]);

  const mockMessages = useMemo(
    () =>
      effectiveSelectedId === null
        ? []
        : [...getMockMessages(effectiveSelectedId), ...(mockDrafts[effectiveSelectedId] ?? [])],
    [effectiveSelectedId, mockDrafts],
  );

  const handleSend = (text: string) => {
    if (!isMockMode) {
      sendMessage.mutate(text);
      return;
    }
    if (effectiveSelectedId === null) return;
    const draft: InboxMessage = {
      id: `draft-${Date.now()}`,
      direction: "outbound",
      text,
      sentAt: new Date().toISOString(),
      read: false,
      senderName: "Mafer",
    };
    setMockDrafts((prev) => ({
      ...prev,
      [effectiveSelectedId]: [...(prev[effectiveSelectedId] ?? []), draft],
    }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg text-ink">
      {isMockMode && <MockModeBanner detail={error?.message} />}
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          isLoading={isMockMode ? false : isLoading}
          error={null}
          selectedConversationId={effectiveSelectedId}
          onSelect={setSelectedConversationId}
        />

        {selectedConversation ? (
          <>
            <LeadDetailPanel key={selectedConversation.id} conversation={selectedConversation} />
            <ChatThread
              conversation={selectedConversation}
              thread={isMockMode ? mockMessages : realMessages}
              isLoading={isMockMode ? false : realMessagesLoading}
              error={isMockMode ? null : realMessagesError}
              sending={!isMockMode && sendMessage.isPending}
              onSend={handleSend}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            {isLoading && !isMockMode ? "Cargando conversaciones…" : "No hay conversaciones para mostrar."}
          </div>
        )}
      </div>
    </div>
  );
}
