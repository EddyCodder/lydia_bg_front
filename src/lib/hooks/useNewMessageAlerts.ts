"use client";

import { useEffect, useRef } from "react";
import type { InboxConversation } from "@/lib/lydia-api/inbox-types";
import { playPopSound, showNewMessageNotification } from "@/lib/notifications";

/**
 * LYD-57: dispara sonido + notificacion cuando el `unreadCount` de CUALQUIER
 * conversacion sube entre polls (cada 15s, ver useConversations) -- eso solo
 * pasa con un mensaje nuevo del contacto (inbound), nunca con uno que manda
 * el propio agente, y cubre conversaciones que no son la que esta abierta
 * (que es el caso que mas importa: aviso de algo que no estas mirando).
 *
 * La primera vez que corre (carga inicial del inbox, o cuando `enabled` pasa
 * a true) solo guarda el estado de partida -- no alerta por mensajes sin
 * leer que ya estaban ahi antes de abrir Lydia.
 */
export function useNewMessageAlerts(conversations: InboxConversation[], enabled: boolean) {
  const previousUnreadRef = useRef<Map<string, number>>(new Map());
  const hasBaselineRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const previous = previousUnreadRef.current;

    if (!hasBaselineRef.current) {
      for (const c of conversations) previous.set(c.id, c.unreadCount);
      hasBaselineRef.current = true;
      return;
    }

    let hasNew = false;
    let latest: InboxConversation | null = null;
    for (const c of conversations) {
      const before = previous.get(c.id) ?? 0;
      if (c.unreadCount > before) {
        hasNew = true;
        latest = c;
      }
      previous.set(c.id, c.unreadCount);
    }

    if (hasNew) {
      playPopSound();
      if (latest) {
        showNewMessageNotification(latest.contact.name, latest.lastMessagePreview || "Nuevo mensaje");
      }
    }
  }, [conversations, enabled]);
}
