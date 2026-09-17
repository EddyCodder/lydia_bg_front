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
}

export interface InboxContact {
  lydiaContactId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string;
}

export type InboxMessageDirection = "inbound" | "outbound" | "system";

export interface InboxMessage {
  id: string;
  direction: InboxMessageDirection;
  text: string;
  sentAt: string; // ISO
  read: boolean;
  senderName?: string;
}

export type InboxConversationStatus = "abierto" | "sin_respuesta" | "cerrado";

export interface InboxConversation {
  id: string; // Chat.id (cuid) en lydia_bg_back
  remoteJid?: string; // ausente en datos de ejemplo (mock-fallback)
  contact: InboxContact;
  assignee?: InboxAgent;
  status: InboxConversationStatus;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO
  unreadCount: number;
  inboxChannel: string;
}
