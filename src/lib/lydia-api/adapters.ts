import type {
  EvoAgent,
  EvoCalendarEvent,
  EvoConversation,
  EvoLead,
  EvoMessage,
  EvoPersonalInsights,
  EvoTemplateGroup,
} from "./types";
import type { InboxAgent, InboxContact, InboxConversation, InboxMediaKind, InboxMessage, InboxMessageMedia } from "./inbox-types";
import type { CalendarEvent, Lead, TemplateGroup } from "@/lib/types";

function jidToPhone(remoteJid: string): string {
  return remoteJid.split("@")[0] ?? remoteJid;
}

export function adaptContact(conversation: EvoConversation): InboxContact {
  const contact = conversation.contact;
  return {
    lydiaContactId: contact?.id ?? conversation.remoteJid,
    // LYD-14: el override manual (Chat.contactNameOverride) gana siempre que
    // este seteado -- WhatsApp puede estar mandando un nickname/tag en vez
    // del nombre real, o directamente nada.
    name:
      conversation.contactNameOverride || contact?.pushName || conversation.name || jidToPhone(conversation.remoteJid),
    email: null, // WhatsApp no expone email de contacto
    phone: conversation.contactPhoneOverride || jidToPhone(conversation.remoteJid),
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

// LYD-15: mapa de los campos de media crudos de WhatsApp/Baileys a los tipos
// que puede renderizar MessageBubble. El base64 no se resuelve aca -- se
// pide bajo demanda (ver client.ts getMediaBase64) para no cargar cada poll
// de listMessages con blobs pesados.
const MEDIA_KIND_BY_KEY: Record<string, InboxMediaKind> = {
  imageMessage: "image",
  videoMessage: "video",
  audioMessage: "audio",
  documentMessage: "document",
  stickerMessage: "sticker",
};

function detectMedia(raw: EvoMessage): InboxMessageMedia | undefined {
  for (const [key, kind] of Object.entries(MEDIA_KIND_BY_KEY)) {
    const payload = raw.message?.[key] as
      | { caption?: string; fileName?: string; mimetype?: string }
      | undefined;
    if (payload) {
      return {
        kind,
        caption: payload.caption,
        fileName: payload.fileName,
        mimetype: payload.mimetype,
        raw: { key: raw.key, message: raw.message },
      };
    }
  }
  return undefined;
}

export function adaptMessage(message: EvoMessage): InboxMessage {
  const direction: InboxMessage["direction"] = message.key.fromMe ? "outbound" : "inbound";
  const lastStatus = message.MessageUpdate?.[message.MessageUpdate.length - 1]?.status;
  const media = detectMedia(message);

  return {
    id: message.id,
    direction,
    text: media ? (media.caption ?? "") : messageText(message.message),
    sentAt: new Date(message.messageTimestamp * 1000).toISOString(),
    read: lastStatus === "READ" || lastStatus === "read",
    senderName: message.pushName ?? undefined,
    media,
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

// LYD-8: el back linkea Lead -> Chat (lead.chatId), al reves de como el mock
// del frontend linkea Conversation -> Lead (conversation.leadId). Este
// adapter expone el shape del frontend (Lead sin conversationId propio, la
// UI de pipeline no necesita el link inverso).
export function adaptLead(lead: EvoLead): Lead {
  return {
    id: lead.id,
    code: lead.leadNumber,
    leadNumber: lead.leadNumber,
    contactName: lead.contactName,
    company: lead.company ?? undefined,
    phone: lead.phone ?? undefined,
    email: lead.email ?? undefined,
    position: lead.position ?? undefined,
    source: lead.source,
    budget: lead.budget ?? undefined,
    budgetAmount: Number(lead.budgetAmount),
    stage: lead.stage,
    assignedAgentId: lead.assignedAgentId,
    createdAt: lead.createdAt,
    hasPendingTasks: lead.hasPendingTasks,
  };
}

export function adaptCalendarEvent(event: EvoCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    type: event.type,
    leadId: event.leadId ?? undefined,
    agentId: event.agentId,
    startAt: event.startAt,
    endAt: event.endAt,
    note: event.note,
    completed: event.completed,
  };
}

export function adaptTemplateGroup(group: EvoTemplateGroup): TemplateGroup {
  return {
    id: group.id,
    title: group.title,
    templates: group.Templates.map((t) => ({ command: t.command, label: t.label, body: t.body })),
  };
}

// Pass-through casi directo -- el shape de EvoPersonalInsights ya se disenio
// igual al que espera PersonalDashboard.tsx (ver LYD-11).
export function adaptPersonalInsights(insights: EvoPersonalInsights): EvoPersonalInsights {
  return insights;
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
