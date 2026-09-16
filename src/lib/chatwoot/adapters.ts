import type { ChatwootConversation, ChatwootMessage } from "./types";
import type { InboxAgent, InboxContact, InboxConversation, InboxMessage } from "./inbox-types";

function toIso(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

export function adaptContact(contact: ChatwootConversation["meta"]["sender"]): InboxContact {
  return {
    chatwootContactId: contact.id,
    name: contact.name || "Sin nombre",
    email: contact.email,
    phone: contact.phone_number,
    avatarUrl: contact.thumbnail || "",
  };
}

export function adaptAgent(agent: NonNullable<ChatwootConversation["meta"]["assignee"]>): InboxAgent {
  return {
    id: agent.id,
    name: agent.name,
    avatarUrl: agent.thumbnail || "",
  };
}

export function adaptMessage(message: ChatwootMessage): InboxMessage {
  const direction = message.message_type === "activity" ? "system" : message.message_type === "incoming" ? "inbound" : "outbound";
  return {
    id: message.id,
    direction,
    text: message.content ?? "",
    sentAt: toIso(message.created_at),
    read: message.status === "read" || message.status === "delivered",
    senderName: message.sender?.name,
  };
}

/**
 * "sin_respuesta" no es un status nativo de Chatwoot -- es una lectura de
 * negocio: conversacion abierta cuya ultima palabra la tuvo el contacto.
 * "cerrado" cubre resolved; pending/snoozed caen en "abierto" por ahora
 * (no hay un concepto de Lydia para esos dos todavia).
 */
function deriveStatus(conversation: ChatwootConversation): "abierto" | "sin_respuesta" | "cerrado" {
  if (conversation.status === "resolved") return "cerrado";
  const lastReal = conversation.last_non_activity_message;
  if (conversation.status === "open" && lastReal?.message_type === "incoming") return "sin_respuesta";
  return "abierto";
}

export function adaptConversation(conversation: ChatwootConversation): InboxConversation {
  const last = conversation.last_non_activity_message ?? conversation.messages[0] ?? null;

  return {
    id: conversation.id,
    contact: adaptContact(conversation.meta.sender),
    assignee: conversation.meta.assignee ? adaptAgent(conversation.meta.assignee) : undefined,
    status: deriveStatus(conversation),
    lastMessagePreview: last?.content ?? "",
    lastMessageAt: toIso(conversation.last_activity_at || conversation.updated_at),
    unreadCount: conversation.unread_count,
    inboxChannel: conversation.meta.channel,
  };
}
