/**
 * Tipos "adaptados" para el inbox real (a diferencia de los tipos mock en
 * @/lib/types, que siguen alimentando Pipelines/Calendario/Automatizaciones/
 * Insights). No tienen stage/budget porque el backend no los modela todavia
 * -- sigue pendiente (ver CRM-9, CRM-12).
 */

export interface InboxAgent {
  id: string;
  name: string;
  avatarUrl: string;
  role?: "asesor" | "administrador";
}

export interface InboxContact {
  lydiaContactId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string;
}

export type InboxMessageDirection = "inbound" | "outbound" | "system";

export type InboxMediaKind = "image" | "video" | "audio" | "document" | "sticker";

export interface InboxMessageMedia {
  kind: InboxMediaKind;
  caption?: string;
  fileName?: string;
  mimetype?: string;
  // Datos crudos (key + message) necesarios para pedirle a Evolution API el
  // base64 bajo demanda (LYD-15) -- no se resuelve al listar mensajes para
  // no cargar cada poll con blobs pesados, solo cuando el bubble lo pide.
  raw: { key: unknown; message: unknown };
}

export interface InboxNote {
  id: string;
  content: string;
  createdAt: string;
  authorName: string | null;
}

export interface InboxMessage {
  id: string;
  direction: InboxMessageDirection;
  text: string;
  sentAt: string; // ISO
  read: boolean;
  senderName?: string;
  media?: InboxMessageMedia;
}

export type InboxConversationStatus = "abierto" | "sin_respuesta" | "cerrado";

// LYD-31: los tres canales que hoy conecta lydia_bg_back (ver Integration en
// wa.types.ts del back). "whatsapp" cubre tanto Baileys como Cloud API.
export type InboxChannel = "whatsapp" | "messenger" | "instagram";

export interface InboxConversation {
  id: string; // Chat.id (cuid) en lydia_bg_back
  remoteJid?: string; // ausente en datos de ejemplo (mock-fallback)
  // LYD-31: instancia/canal de esta conversacion puntual -- ausente en mock.
  // Necesaria para pedir mensajes y enviar contra el canal correcto.
  instanceName?: string;
  contact: InboxContact;
  assignee?: InboxAgent;
  status: InboxConversationStatus;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO
  unreadCount: number;
  inboxChannel: InboxChannel;
}
