/**
 * Formas crudas del backend de Lydia: los endpoints nativos de Evolution
 * API (WhatsApp/Baileys, no reimplementados aca) mas los endpoints propios
 * de CRM-12 (/crm/*) que agregan la capa de agentes/asignacion/notas que
 * antes daba Chatwoot.
 */

export type ChatStatus = "open" | "pending" | "resolved";

export interface EvoAgent {
  id: string;
  name: string;
  email: string | null;
  color: string | null;
  active: boolean;
}

export interface EvoContact {
  id: string;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
}

// GET /crm/conversations -- Chat + Agent + contact cruzado a mano en el back
export interface EvoConversation {
  id: string;
  remoteJid: string;
  name: string | null;
  status: ChatStatus;
  unreadMessages: number;
  updatedAt: string;
  Agent: EvoAgent | null;
  contact: EvoContact | null;
}

// POST /chat/findMessages/:instance -- payload nativo de Evolution API
export interface EvoMessage {
  id: string;
  key: { id: string; remoteJid: string; fromMe: boolean; participant?: string };
  pushName: string | null;
  messageType: string;
  message: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    [key: string]: unknown;
  };
  messageTimestamp: number; // epoch seconds
  MessageUpdate?: { status: string }[];
}

export interface EvoMessagesResponse {
  messages: {
    total: number;
    pages: number;
    currentPage: number;
    records: EvoMessage[];
  };
}
