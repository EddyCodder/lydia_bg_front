"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useUpdateConversationContact,
} from "@/lib/queries/conversations";
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
  // LYD-14: en modo mock (o mientras el backend no responde) el override de
  // nombre/telefono se guarda solo en memoria -- no hay Chat real donde
  // persistirlo.
  const [mockContactOverrides, setMockContactOverrides] = useState<Record<string, { name: string; phone: string }>>(
    {},
  );

  const { data: realConversations = [], isLoading, error } = useConversations("all");
  const isMockMode = !LYDIA_API_ENABLED || error !== null;
  const conversations = useMemo(() => {
    const base = isMockMode ? mockInboxConversations : realConversations;
    if (!isMockMode) return base;
    return base.map((c) => {
      const override = mockContactOverrides[c.id];
      if (!override) return c;
      return { ...c, contact: { ...c.contact, name: override.name || c.contact.name, phone: override.phone || c.contact.phone } };
    });
  }, [isMockMode, realConversations, mockContactOverrides]);

  const effectiveSelectedId = selectedConversationId ?? conversations[0]?.id ?? null;
  const selectedConversation = conversations.find((c) => c.id === effectiveSelectedId) ?? null;

  const {
    data: realMessages = [],
    isLoading: realMessagesLoading,
    error: realMessagesError,
  } = useMessages(isMockMode ? null : effectiveSelectedId);
  const sendMessage = useSendMessage(effectiveSelectedId);
  const markConversationRead = useMarkConversationRead();
  const updateContact = useUpdateConversationContact();

  const handleEditContact = (name: string, phone: string) => {
    if (effectiveSelectedId === null) return;
    if (isMockMode) {
      setMockContactOverrides((prev) => ({ ...prev, [effectiveSelectedId]: { name, phone } }));
      return;
    }
    updateContact.mutate({ conversationId: effectiveSelectedId, contactNameOverride: name, contactPhoneOverride: phone });
  };

  // LYD-13: abrir un chat con mensajes sin leer lo marca como leido. Ademas
  // de al cambiar de conversacion, esto tiene que reaccionar a que el
  // contador suba mientras el chat ya esta abierto (llega un mensaje nuevo
  // en medio del polling de useConversations) -- si no, el badge quedaba
  // pegado hasta que el agente cerraba y volvia a abrir el chat.
  const selectedUnreadCount = selectedConversation?.unreadCount ?? 0;
  useEffect(() => {
    if (isMockMode || effectiveSelectedId === null) return;
    if (selectedUnreadCount > 0) {
      markConversationRead.mutate(effectiveSelectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markConversationRead cambia de identidad en cada render, no debe disparar el efecto por si sola
  }, [effectiveSelectedId, isMockMode, selectedUnreadCount]);

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
              onEditContact={handleEditContact}
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
