"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InboxConversation, InboxMessage } from "@/lib/lydia-api/inbox-types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";

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
      fetchJson<{ conversations: InboxConversation[] }>(`/api/lydia/conversations?status=${status}`),
    select: (data) => data.conversations,
    enabled: LYDIA_API_ENABLED,
    retry: false,
    refetchInterval: 15_000,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      fetchJson<{ messages: InboxMessage[] }>(`/api/lydia/conversations/${conversationId}/messages`),
    select: (data) => data.messages,
    enabled: LYDIA_API_ENABLED && conversationId !== null,
    retry: false,
    refetchInterval: 10_000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      fetchJson<{ ok: true }>(`/api/lydia/conversations/${conversationId}/messages`, {
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
