/**
 * Datos de ejemplo para el inbox cuando Chatwoot todavía no está
 * configurado (CHATWOOT_BASE_URL/TOKEN/ACCOUNT_ID ausentes) — así se puede
 * seguir viendo el diseño sin depender de una instancia real. Se arman a
 * partir de los mismos leads/conversaciones/mensajes de mock-data.ts que
 * usan Pipelines/Calendario, adaptados a la forma InboxConversation/
 * InboxMessage para que ConversationList/ChatThread/LeadDetailPanel no
 * necesiten saber si el dato es real o de muestra.
 */
import { conversations, getAgentById, getLeadByConversationId, getMessagesByConversationId } from "@/lib/mock-data";
import type { InboxConversation, InboxMessage } from "./inbox-types";

const idByMockConversationId = new Map(conversations.map((c, i) => [c.id, i + 1]));

export const mockInboxConversations: InboxConversation[] = conversations
  .map((conversation) => {
    const lead = getLeadByConversationId(conversation.id);
    if (!lead) return null;
    const agent = getAgentById(conversation.assignedAgentId);
    const id = idByMockConversationId.get(conversation.id)!;

    const entry: InboxConversation = {
      id,
      contact: {
        chatwootContactId: id,
        name: lead.contactName,
        email: lead.email || null,
        phone: lead.phone || null,
        avatarUrl: "",
      },
      assignee: agent ? { id: 0, name: agent.name, avatarUrl: "" } : undefined,
      status: conversation.status,
      lastMessagePreview: conversation.lastMessagePreview,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unread ? 1 : 0,
      inboxChannel: "whatsapp (ejemplo)",
    };
    return entry;
  })
  .filter((c): c is InboxConversation => c !== null);

export function getMockMessages(conversationId: number): InboxMessage[] {
  const mockConversationId = [...idByMockConversationId.entries()].find(([, v]) => v === conversationId)?.[0];
  if (!mockConversationId) return [];

  return getMessagesByConversationId(mockConversationId).map((message, i) => ({
    id: i + 1,
    direction: message.direction,
    text: message.text,
    sentAt: message.sentAt,
    read: message.read ?? false,
    senderName: message.senderName,
  }));
}
