"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InboxAgent, InboxConversation, InboxMessage } from "@/lib/lydia-api/inbox-types";
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

// LYD-17: los mas recientes (useMessages, arriba) se pollean solos -- el
// historial mas viejo se pide a mano con esto, pagina por pagina, y el
// llamador lo va acumulando (no encaja en el polling de react-query porque
// un refetch normal solo trae la pagina 1 de nuevo).
export function useLoadOlderMessages(conversationId: string | null) {
  return useMutation({
    mutationFn: (page: number) =>
      fetchJson<{ messages: InboxMessage[]; hasMore: boolean }>(
        `/api/lydia/conversations/${conversationId}/messages?page=${page}`,
      ),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => fetchJson<{ agents: InboxAgent[] }>(`/api/lydia/agents`),
    select: (data) => data.agents,
    enabled: LYDIA_API_ENABLED,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAssignAgent(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string | null) =>
      fetchJson<{ conversation: InboxConversation }>(`/api/lydia/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgentId: agentId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

type ConversationsCache = { conversations: InboxConversation[] };

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      fetchJson<{ conversation: InboxConversation }>(`/api/lydia/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unreadMessages: 0 }),
      }),
    // LYD-45: la burbuja de no leidos esperaba el PATCH (que hace un UPDATE
    // sobre Message en el back) y despues un refetch completo de la lista --
    // dos round trips lentos en serie. Se limpia al instante en el cache
    // (lista del inbox y globo del sidebar comparten la misma query) y el
    // refetch de onSettled solo confirma.
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });
      const previous = queryClient.getQueriesData<ConversationsCache>({ queryKey: ["conversations"] });
      queryClient.setQueriesData<ConversationsCache>({ queryKey: ["conversations"] }, (old) =>
        old
          ? {
              ...old,
              conversations: old.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _conversationId, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// LYD-40: "cerrar" = archivar (reversible, se oculta de la lista principal).
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      fetchJson<{ conversation: InboxConversation }>(`/api/lydia/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// LYD-40: borrado real, irreversible -- el route handler rechaza esto si
// el agente logueado no es administrador (no alcanza con esconder el boton).
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      fetchJson<void>(`/api/lydia/conversations/${conversationId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateConversationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      contactNameOverride,
      contactPhoneOverride,
    }: {
      conversationId: string;
      contactNameOverride: string;
      contactPhoneOverride: string;
    }) =>
      fetchJson<{ conversation: InboxConversation }>(`/api/lydia/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactNameOverride, contactPhoneOverride }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// LYD-52: `quoted` es el {key, message} crudo del mensaje al que se responde
// (InboxMessage.raw) -- ausente en un envio normal, sin citar nada.
export interface SendMessageInput {
  content: string;
  quoted?: { key: unknown; message: unknown };
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: string | SendMessageInput) => {
      const body = typeof input === "string" ? { content: input } : input;
      return fetchJson<{ ok: true }>(`/api/lydia/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export interface SendMediaInput {
  mediatype: "image" | "document" | "video" | "audio";
  media: string;
  mimetype?: string;
  fileName?: string;
  caption?: string;
  quoted?: { key: unknown; message: unknown };
}

export function useSendMedia(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMediaInput) =>
      fetchJson<{ ok: true }>(`/api/lydia/conversations/${conversationId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// LYD-52: reaccion rapida con emoji sobre un mensaje puntual (menu contextual).
export function useSendReaction(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { key: unknown; reaction: string }) =>
      fetchJson<{ ok: true }>(`/api/lydia/conversations/${conversationId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

// LYD-52: "Reenviar" no tiene ruta propia -- reusa messages/media de la
// conversacion DESTINO, elegida recien al ejecutar (por eso no toma
// conversationId como el resto de los hooks de arriba, sino por mutation).
export interface ForwardMessageInput {
  targetConversationId: string;
  text: string;
  media?: { mediatype: SendMediaInput["mediatype"]; media: string; mimetype?: string; fileName?: string; caption?: string };
}

export function useForwardMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetConversationId, text, media }: ForwardMessageInput) => {
      if (media) {
        return fetchJson<{ ok: true }>(`/api/lydia/conversations/${targetConversationId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(media),
        });
      }
      return fetchJson<{ ok: true }>(`/api/lydia/conversations/${targetConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    },
    onSuccess: (_data, { targetConversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", targetConversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// LYD-15: resuelve el base64 de un mensaje de media bajo demanda -- se
// cachea por messageId asi MessageBubble no vuelve a pedirlo en cada re-render.
export function useResolveMedia(
  messageId: string,
  raw: { key: unknown; message: unknown },
  instanceName: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["media", messageId],
    queryFn: () =>
      fetchJson<{ dataUrl: string }>(`/api/lydia/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, instanceName }),
      }),
    select: (data) => data.dataUrl,
    enabled,
    retry: false,
    staleTime: Infinity,
  });
}
