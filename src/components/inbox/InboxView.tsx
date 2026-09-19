"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useConversations,
  useLoadOlderMessages,
  useMarkConversationRead,
  useMessages,
  useSendMedia,
  useSendMessage,
  useUpdateConversationContact,
} from "@/lib/queries/conversations";
import { getMockMessages, mockInboxConversations } from "@/lib/lydia-api/mock-fallback";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import type { InboxMessage } from "@/lib/lydia-api/inbox-types";
import { ConversationList } from "./ConversationList";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { ChatThread } from "./ChatThread";
import type { ComposerMediaInput } from "./Composer";
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
  // LYD-18: en mobile el inbox alterna entre lista y chat en vez de apilar
  // las tres columnas (lista + detalle + hilo) -- a partir de `md` siempre
  // se ven ambas y este estado no importa (las clases responsive lo tapan).
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
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

  // LYD-29: solo se abre el chat que el agente elige. Antes caia a conversations[0], y como abrir un chat con
  // mensajes sin leer lo marca como leido (LYD-13), entrar al inbox marcaba la primera conversacion como leida
  // sin que nadie la viera.
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;

  const {
    data: realMessages = [],
    isLoading: realMessagesLoading,
    error: realMessagesError,
  } = useMessages(isMockMode ? null : selectedConversationId);
  const sendMessage = useSendMessage(selectedConversationId);
  const sendMedia = useSendMedia(selectedConversationId);
  const markConversationRead = useMarkConversationRead();
  const updateContact = useUpdateConversationContact();
  const loadOlderMessages = useLoadOlderMessages(selectedConversationId);

  // LYD-17: historial cargado a mano, acumulado por conversacion. Se resetea
  // al cambiar de chat -- cada conversacion arranca sin nada mas viejo cargado.
  // hasMoreOlder arranca en true (optimista): recien se sabe si hay mas de
  // 100 mensajes cuando se intenta cargar la pagina siguiente. El reset pasa
  // durante el render (patron "adjusting state when a prop changes" de React),
  // no en un efecto, para no encadenar un render extra.
  const [olderMessages, setOlderMessages] = useState<InboxMessage[]>([]);
  const [nextOlderPage, setNextOlderPage] = useState(2); // la pagina 1 ya la trae useMessages
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [olderMessagesKey, setOlderMessagesKey] = useState(selectedConversationId);
  if (olderMessagesKey !== selectedConversationId) {
    setOlderMessagesKey(selectedConversationId);
    setOlderMessages([]);
    setNextOlderPage(2);
    setHasMoreOlder(true);
  }

  const handleLoadOlder = async () => {
    if (isMockMode || selectedConversationId === null) return;
    const { messages, hasMore } = await loadOlderMessages.mutateAsync(nextOlderPage);
    setOlderMessages((prev) => [...messages, ...prev]);
    setNextOlderPage((p) => p + 1);
    setHasMoreOlder(hasMore);
  };

  const handleEditContact = (name: string, phone: string) => {
    if (selectedConversationId === null) return;
    if (isMockMode) {
      setMockContactOverrides((prev) => ({ ...prev, [selectedConversationId]: { name, phone } }));
      return;
    }
    updateContact.mutate({ conversationId: selectedConversationId, contactNameOverride: name, contactPhoneOverride: phone });
  };

  // LYD-13: abrir un chat con mensajes sin leer lo marca como leido. Ademas
  // de al cambiar de conversacion, esto tiene que reaccionar a que el
  // contador suba mientras el chat ya esta abierto (llega un mensaje nuevo
  // en medio del polling de useConversations) -- si no, el badge quedaba
  // pegado hasta que el agente cerraba y volvia a abrir el chat.
  const selectedUnreadCount = selectedConversation?.unreadCount ?? 0;
  useEffect(() => {
    if (isMockMode || selectedConversationId === null) return;
    if (selectedUnreadCount > 0) {
      markConversationRead.mutate(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markConversationRead cambia de identidad en cada render, no debe disparar el efecto por si sola
  }, [selectedConversationId, isMockMode, selectedUnreadCount]);

  const mockMessages = useMemo(
    () =>
      selectedConversationId === null
        ? []
        : [...getMockMessages(selectedConversationId), ...(mockDrafts[selectedConversationId] ?? [])],
    [selectedConversationId, mockDrafts],
  );

  // LYD-14: Composer espera una promesa que se rechaza si el envio falla,
  // para no borrar el texto ni perder el error en silencio.
  const handleSend = async (text: string) => {
    if (!isMockMode) {
      await sendMessage.mutateAsync(text);
      return;
    }
    if (selectedConversationId === null) return;
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
      [selectedConversationId]: [...(prev[selectedConversationId] ?? []), draft],
    }));
  };

  // LYD-15: en modo mock no hay a quien mandarle el archivo real -- se deja
  // un draft de texto describiendolo, igual que el resto del mock del inbox.
  const handleSendMedia = async (input: ComposerMediaInput) => {
    if (!isMockMode) {
      await sendMedia.mutateAsync(input);
      return;
    }
    if (selectedConversationId === null) return;
    const draft: InboxMessage = {
      id: `draft-${Date.now()}`,
      direction: "outbound",
      text: `[archivo adjunto: ${input.fileName ?? input.mediatype}]`,
      sentAt: new Date().toISOString(),
      read: false,
      senderName: "Mafer",
    };
    setMockDrafts((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] ?? []), draft],
    }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg text-ink">
      {isMockMode && <MockModeBanner detail={error?.message} />}
      <div className="flex flex-1 overflow-hidden">
        <div className={`${mobileView === "list" ? "flex" : "hidden"} w-full shrink-0 md:flex md:w-auto`}>
          <ConversationList
            conversations={conversations}
            isLoading={isMockMode ? false : isLoading}
            error={null}
            selectedConversationId={selectedConversationId}
            onSelect={(id) => {
              setSelectedConversationId(id);
              setMobileView("thread");
            }}
          />
        </div>

        {selectedConversation ? (
          <>
            <div className="hidden lg:flex">
              <LeadDetailPanel key={selectedConversation.id} conversation={selectedConversation} />
            </div>
            <div className={`${mobileView === "thread" ? "flex" : "hidden"} w-full flex-1 md:flex`}>
              <ChatThread
                conversation={selectedConversation}
                thread={isMockMode ? mockMessages : [...olderMessages, ...realMessages]}
                isLoading={isMockMode ? false : realMessagesLoading}
                error={isMockMode ? null : realMessagesError}
                sending={!isMockMode && (sendMessage.isPending || sendMedia.isPending)}
                onSend={handleSend}
                onSendMedia={handleSendMedia}
                onEditContact={handleEditContact}
                onLoadOlder={handleLoadOlder}
                loadingOlder={loadOlderMessages.isPending}
                hasMoreOlder={!isMockMode && hasMoreOlder && olderMessages.length + realMessages.length >= 100}
                onBack={() => setMobileView("list")}
              />
            </div>
          </>
        ) : (
          <div
            className={`${
              mobileView === "list" ? "hidden md:flex" : "flex"
            } flex-1 items-center justify-center text-sm text-muted`}
          >
            {isLoading && !isMockMode
              ? "Cargando conversaciones…"
              : conversations.length > 0
                ? "Selecciona una conversación para empezar."
                : "No hay conversaciones para mostrar."}
          </div>
        )}
      </div>
    </div>
  );
}
