/**
 * Formas crudas de la API de Chatwoot (Application API v1), sacadas del
 * codigo fuente real de lydia_bg_front (no de la doc publica, que a veces
 * queda desactualizada):
 *   - app/views/api/v1/conversations/partials/_conversation.json.jbuilder
 *   - app/views/api/v1/models/_message.json.jbuilder
 *   - app/views/api/v1/models/_contact.json.jbuilder
 *   - app/views/api/v1/models/_agent.json.jbuilder
 *   - app/models/message.rb (enum message_type/status)
 *   - app/models/conversation.rb (enum status)
 */

export type ChatwootConversationStatus = "open" | "resolved" | "pending" | "snoozed";
export type ChatwootMessageType = "incoming" | "outgoing" | "activity" | "template";
export type ChatwootMessageStatus = "sent" | "delivered" | "read" | "failed";

export interface ChatwootContact {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  identifier: string | null;
  blocked: boolean;
  thumbnail: string; // avatar_url
  additional_attributes: Record<string, unknown>;
  custom_attributes: Record<string, unknown>;
  last_activity_at?: number;
  created_at?: number;
}

export interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability_status: string;
  thumbnail: string;
}

export interface ChatwootMessage {
  id: number;
  content: string | null;
  inbox_id: number;
  conversation_id: number;
  message_type: ChatwootMessageType;
  content_type: string;
  status: ChatwootMessageStatus;
  content_attributes: Record<string, unknown>;
  created_at: number; // epoch seconds
  private: boolean;
  sender?: {
    id: number;
    name: string;
    type?: string; // "contact" | "user" | "agent_bot"
    thumbnail?: string;
  };
  attachments?: { id: number; file_type: string; data_url: string }[];
}

export interface ChatwootConversation {
  id: number; // display_id
  uuid: string;
  account_id: number;
  inbox_id: number;
  status: ChatwootConversationStatus;
  unread_count: number;
  created_at: number;
  updated_at: number;
  timestamp: number;
  last_activity_at: number;
  labels: string[];
  muted: boolean;
  can_reply: boolean;
  meta: {
    sender: ChatwootContact;
    channel: string;
    assignee?: ChatwootAgent;
    assignee_type?: "User" | "AgentBot";
  };
  messages: ChatwootMessage[]; // solo el ultimo mensaje en list/show
  last_non_activity_message?: ChatwootMessage | null;
}

export interface ChatwootConversationsResponse {
  data: {
    meta: {
      mine_count: number;
      assigned_count: number;
      unassigned_count: number;
      all_count: number;
    };
    payload: ChatwootConversation[];
  };
}

export interface ChatwootMessagesResponse {
  meta: {
    labels: string[];
    contact: ChatwootContact;
    assignee?: ChatwootAgent;
  };
  payload: ChatwootMessage[];
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
}
