import "server-only";
import type {
  ChatwootConversation,
  ChatwootConversationsResponse,
  ChatwootContact,
  ChatwootMessage,
  ChatwootMessagesResponse,
} from "./types";

/**
 * Cliente de la Application API de Chatwoot (api_access_token de agente).
 * Server-only: el import "server-only" hace fallar el build si esto se
 * importa por accidente desde un componente cliente — el token nunca debe
 * llegar al browser.
 */

class ChatwootConfigError extends Error {
  constructor(missing: string) {
    super(
      `Falta configurar ${missing}. Copiá .env.example a .env.local y completá CHATWOOT_BASE_URL, CHATWOOT_API_TOKEN y CHATWOOT_ACCOUNT_ID.`,
    );
    this.name = "ChatwootConfigError";
  }
}

function getConfig() {
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const token = process.env.CHATWOOT_API_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;

  if (!baseUrl) throw new ChatwootConfigError("CHATWOOT_BASE_URL");
  if (!token) throw new ChatwootConfigError("CHATWOOT_API_TOKEN");
  if (!accountId) throw new ChatwootConfigError("CHATWOOT_ACCOUNT_ID");

  return { baseUrl: baseUrl.replace(/\/$/, ""), token, accountId };
}

async function chatwootFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, token } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      api_access_token: token,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Chatwoot API ${res.status} en ${path}: ${body.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export interface ListConversationsParams {
  status?: "open" | "resolved" | "pending" | "snoozed" | "all";
  page?: number;
  inboxId?: number;
}

export async function listConversations(
  params: ListConversationsParams = {},
): Promise<ChatwootConversationsResponse["data"]> {
  const { accountId } = getConfig();
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.inboxId) query.set("inbox_id", String(params.inboxId));

  const res = await chatwootFetch<ChatwootConversationsResponse>(
    `/api/v1/accounts/${accountId}/conversations?${query.toString()}`,
  );
  return res.data;
}

export async function getConversation(conversationId: number): Promise<ChatwootConversation> {
  const { accountId } = getConfig();
  return chatwootFetch<ChatwootConversation>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}`,
  );
}

export async function listMessages(conversationId: number): Promise<ChatwootMessagesResponse> {
  const { accountId } = getConfig();
  return chatwootFetch<ChatwootMessagesResponse>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
  );
}

export async function createMessage(conversationId: number, content: string): Promise<ChatwootMessage> {
  const { accountId } = getConfig();
  return chatwootFetch<ChatwootMessage>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content, message_type: "outgoing" }),
    },
  );
}

export async function getContact(contactId: number): Promise<{ payload: ChatwootContact }> {
  const { accountId } = getConfig();
  return chatwootFetch<{ payload: ChatwootContact }>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`,
  );
}
