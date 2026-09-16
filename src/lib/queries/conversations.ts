"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InboxContact, InboxConversation, InboxMessage } from "@/lib/chatwoot/inbox-types";
import { CHATWOOT_ENABLED } from "@/lib/chatwoot/config";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return body as T;
}

export function useConversations(status: "open" | "resolved" | "all" = "all") {
  return useQuery({
    queryKey: ["conversations", status],
    queryFn: () =>
      fetchJson<{ conversations: InboxConversation[] }>(`/api/chatwoot/conversations?status=${status}`),
    select: (data) => data.conversations,
    enabled: CHATWOOT_ENABLED,
    retry: false,
    refetchInterval: 15_000,
  });
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      fetchJson<{ messages: InboxMessage[] }>(`/api/chatwoot/conversations/${conversationId}/messages`),
    select: (data) => data.messages,
    enabled: CHATWOOT_ENABLED && conversationId !== null,
    retry: false,
    refetchInterval: 10_000,
  });
}

export function useSendMessage(conversationId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      fetchJson<{ message: InboxMessage }>(`/api/chatwoot/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useContact(contactId: number | null) {
  return useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => fetchJson<{ contact: InboxContact }>(`/api/chatwoot/contacts/${contactId}`),
    select: (data) => data.contact,
    enabled: CHATWOOT_ENABLED && contactId !== null,
    retry: false,
  });
}
