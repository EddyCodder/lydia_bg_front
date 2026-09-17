import type { EvoAgent, EvoConversation, EvoMessage } from "./types";
import type { InboxAgent, InboxContact, InboxConversation, InboxMessage } from "./inbox-types";

function jidToPhone(remoteJid: string): string {
  return remoteJid.split("@")[0] ?? remoteJid;
}

export function adaptContact(conversation: EvoConversation): InboxContact {
  const contact = conversation.contact;
  return {
    lydiaContactId: contact?.id ?? conversation.remoteJid,
    name: contact?.pushName || conversation.name || jidToPhone(conversation.remoteJid),
    email: null, // WhatsApp no expone email de contacto
    phone: jidToPhone(conversation.remoteJid),
    avatarUrl: contact?.profilePicUrl || "",
  };
}

export function adaptAgent(agent: EvoAgent): InboxAgent {
  return {
    id: agent.id,
    name: agent.name,
    avatarUrl: "",
    role: agent.role,
  };
}

function messageText(message: EvoMessage["message"]): string {
  return message?.conversation ?? message?.extendedTextMessage?.text ?? "";
}

export function adaptMessage(message: EvoMessage): InboxMessage {
  const direction: InboxMessage["direction"] = message.key.fromMe ? "outbound" : "inbound";
  const lastStatus = message.MessageUpdate?.[message.MessageUpdate.length - 1]?.status;

  return {
    id: message.id,
    direction,
    text: messageText(message.message),
    sentAt: new Date(message.messageTimestamp * 1000).toISOString(),
    read: lastStatus === "READ" || lastStatus === "read",
    senderName: message.pushName ?? undefined,
  };
}

/**
 * "sin_respuesta" no es un status nativo de Evolution -- es una lectura de
 * negocio: conversacion abierta con mensajes del contacto sin leer.
 * "cerrado" cubre resolved; pending cae en "abierto" por ahora (no hay un
 * concepto de Lydia para eso todavia).
 */
function deriveStatus(conversation: EvoConversation): InboxConversation["status"] {
  if (conversation.status === "resolved") return "cerrado";
  if (conversation.status === "open" && conversation.unreadMessages > 0) return "sin_respuesta";
  return "abierto";
}

export function adaptConversation(conversation: EvoConversation): InboxConversation {
  return {
    id: conversation.id,
    remoteJid: conversation.remoteJid,
    contact: adaptContact(conversation),
    assignee: conversation.Agent ? adaptAgent(conversation.Agent) : undefined,
    status: deriveStatus(conversation),
    lastMessagePreview: conversation.lastMessage?.content ?? "",
    lastMessageAt: conversation.lastMessage
      ? new Date(conversation.lastMessage.timestamp * 1000).toISOString()
      : conversation.updatedAt,
    unreadCount: conversation.unreadMessages,
    inboxChannel: "whatsapp",
  };
}
