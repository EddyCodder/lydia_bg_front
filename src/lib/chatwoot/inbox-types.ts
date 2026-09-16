/**
 * Tipos "adaptados" para el inbox real (a diferencia de los tipos mock en
 * @/lib/types, que siguen alimentando Pipelines/Calendario/Automatizaciones/
 * Insights). No tienen stage/budget porque Chatwoot no los modela — eso
 * sigue pendiente (ver CRM-9).
 */

export interface InboxAgent {
  id: number;
  name: string;
  avatarUrl: string;
}

export interface InboxContact {
  chatwootContactId: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string;
}

export type InboxMessageDirection = "inbound" | "outbound" | "system";

export interface InboxMessage {
  id: number;
  direction: InboxMessageDirection;
  text: string;
  sentAt: string; // ISO
  read: boolean;
  senderName?: string;
}

export type InboxConversationStatus = "abierto" | "sin_respuesta" | "cerrado";

export interface InboxConversation {
  id: number; // display_id de Chatwoot
  contact: InboxContact;
  assignee?: InboxAgent;
  status: InboxConversationStatus;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO
  unreadCount: number;
  inboxChannel: string;
}
