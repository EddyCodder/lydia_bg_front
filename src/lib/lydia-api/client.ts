import "server-only";
import type {
  ChatStatus,
  EvoAgent,
  EvoCalendarEvent,
  EvoCalendarEventType,
  EvoConversation,
  EvoInstance,
  EvoLead,
  EvoMediaResult,
  EvoMessage,
  EvoMessagesResponse,
  EvoNote,
  EvoPersonalInsights,
  EvoQuickReplyTemplate,
  EvoSendMediaInput,
  EvoTemplateGroup,
  EvoWelcomeMessageConfig,
  LeadStage,
} from "./types";

/**
 * Cliente del backend de Lydia: Evolution API (lydia_bg_back) para
 * WhatsApp crudo (mensajes, envio) + los endpoints propios /crm/* para
 * agentes/asignacion/notas (CRM-12). Server-only: el import "server-only"
 * hace fallar el build si esto se importa por accidente desde un
 * componente cliente -- la apikey nunca debe llegar al browser.
 */

class LydiaApiConfigError extends Error {
  constructor(missing: string) {
    super(`Falta configurar ${missing}. Copiá .env.example a .env.local y completá EVOLUTION_API_URL y EVOLUTION_API_KEY.`);
    this.name = "LydiaApiConfigError";
  }
}

// LYD-31: EVOLUTION_INSTANCE_NAME (una sola instancia fija) se elimino -- el
// inbox ahora lista y opera sobre todos los canales/instancias a la vez.
// Cada llamada instance-scoped (mensajes, envio) recibe el instanceName de
// la conversacion puntual, no uno global.
function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apikey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl) throw new LydiaApiConfigError("EVOLUTION_API_URL");
  if (!apikey) throw new LydiaApiConfigError("EVOLUTION_API_KEY");

  return { baseUrl: baseUrl.replace(/\/$/, ""), apikey };
}

async function evoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apikey } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Lydia API ${res.status} en ${path}: ${body.slice(0, 300)}`);
  }

  // LYD-40: los DELETE (deleteLead/deleteTemplate/deleteCalendarEvent y
  // ahora deleteConversation) devuelven 204 sin body -- res.json() tira
  // SyntaxError sobre un body vacio, asi que sin este chequeo todo caller
  // tipado como Promise<void> quedaba roto en runtime.
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// LYD-31: sin instanceName lista las conversaciones de todos los canales
// juntas (el back las mezcla y ordena). Se mantiene el parametro para el
// filtro por canal (front) que sigue pidiendo el conjunto completo.
export async function listConversations(status?: ChatStatus): Promise<EvoConversation[]> {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  const qs = query.toString();
  return evoFetch<EvoConversation[]>(`/crm/conversations${qs ? `?${qs}` : ""}`);
}

// LYD-31: instancias/canales conectados (WhatsApp, Messenger, Instagram...),
// via el endpoint nativo de Evolution API -- no hizo falta escribir uno propio.
export async function listInstances(): Promise<EvoInstance[]> {
  return evoFetch<EvoInstance[]>(`/instance/fetchInstances`);
}

export async function getConversation(chatId: string): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`);
}

// LYD-17: page fijo en 1 perdia todo el historial mas alla de los ultimos
// 100 mensajes, sin forma de pedir el resto.
// LYD-31: instanceName ahora es de la conversacion puntual, no un global fijo.
export async function listMessages(
  remoteJid: string,
  instanceName: string,
  page = 1,
): Promise<{ messages: EvoMessage[]; hasMore: boolean }> {
  const res = await evoFetch<EvoMessagesResponse>(`/chat/findMessages/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ where: { key: { remoteJid } }, offset: 100, page }),
  });
  return {
    // orden ascendente para el hilo de chat (Evolution devuelve mas nuevo primero)
    messages: [...res.messages.records].reverse(),
    hasMore: res.messages.currentPage < res.messages.pages,
  };
}

export async function sendMessage(remoteJid: string, instanceName: string, text: string): Promise<void> {
  await evoFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number: remoteJid, text }),
  });
}

// LYD-15: envio de adjuntos (imagen/documento/video/audio). Evolution API
// acepta la media como base64 inline en el body, sin necesidad de multipart.
export async function sendMedia(remoteJid: string, instanceName: string, input: EvoSendMediaInput): Promise<void> {
  await evoFetch(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number: remoteJid, ...input }),
  });
}

// LYD-15: baja bajo demanda el base64 de un mensaje de media recibido --
// Evolution API descifra la media de WhatsApp (mediaKey + directPath) al
// vuelo, no queda guardada en ningun lado (no hay S3/MinIO configurado en
// este deploy). "message" es el {key, message} crudo tal cual vino de
// listMessages.
export async function getMediaBase64(
  message: { key: unknown; message: unknown },
  instanceName: string,
): Promise<EvoMediaResult> {
  return evoFetch<EvoMediaResult>(`/chat/getBase64FromMediaMessage/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function listAgents(): Promise<EvoAgent[]> {
  return evoFetch<EvoAgent[]>(`/crm/agents`);
}

// LYD-21: notas internas de la conversacion (listNotes/addNote del backend,
// existian sin ninguna UI que las consumiera).
export async function listNotes(chatId: string): Promise<EvoNote[]> {
  return evoFetch<EvoNote[]>(`/crm/conversations/${chatId}/notes`);
}

export async function addNote(chatId: string, content: string, agentId: string | null): Promise<EvoNote> {
  return evoFetch<EvoNote>(`/crm/conversations/${chatId}/notes`, {
    method: "POST",
    body: JSON.stringify({ content, agentId: agentId ?? undefined }),
  });
}

export async function assignConversation(chatId: string, assignedAgentId: string | null): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ assignedAgentId }),
  });
}

// LYD-13: abrir una conversacion la marca como leida (Chat.unreadMessages de
// Evolution API, nunca reseteado hasta ahora). El backend solo permite
// setearlo a 0 (ver crm.service.ts), no es un PATCH generico.
export async function markConversationRead(chatId: string): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ unreadMessages: 0 }),
  });
}

// LYD-14: renombrar/editar el numero mostrado de un contacto (override propio
// de Lydia, no toca Contact.pushName -- WhatsApp lo pisaria de nuevo).
export async function updateConversationContact(
  chatId: string,
  data: { contactNameOverride?: string | null; contactPhoneOverride?: string | null },
): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// LYD-40: "cerrar" = archivar (reversible, se oculta de la lista principal).
export async function archiveConversation(chatId: string, archived: boolean): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });
}

// LYD-40: borrado real (Chat + mensajes), irreversible -- el gateo por rol
// (solo administrador) vive en el route handler que llama a esto, no aca.
export async function deleteConversation(chatId: string): Promise<void> {
  await evoFetch<void>(`/crm/conversations/${chatId}`, { method: "DELETE" });
}

// LYD-8: pipeline de leads

export async function listLeads(
  params: { stage?: LeadStage; assignedAgentId?: string; source?: string; chatId?: string } = {},
): Promise<EvoLead[]> {
  const query = new URLSearchParams();
  if (params.stage) query.set("stage", params.stage);
  if (params.assignedAgentId) query.set("assignedAgentId", params.assignedAgentId);
  if (params.source) query.set("source", params.source);
  if (params.chatId) query.set("chatId", params.chatId);
  const qs = query.toString();
  return evoFetch<EvoLead[]>(`/crm/leads${qs ? `?${qs}` : ""}`);
}

export async function createLead(data: Partial<EvoLead> & { contactName: string; source: string }): Promise<EvoLead> {
  return evoFetch<EvoLead>(`/crm/leads`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateLead(id: string, data: Partial<EvoLead>): Promise<EvoLead> {
  return evoFetch<EvoLead>(`/crm/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteLead(id: string): Promise<void> {
  await evoFetch<void>(`/crm/leads/${id}`, { method: "DELETE" });
}

// LYD-9: calendario por agente

export async function listCalendarEvents(
  params: { agentId?: string; leadId?: string; from?: string; to?: string } = {},
): Promise<EvoCalendarEvent[]> {
  const query = new URLSearchParams();
  if (params.agentId) query.set("agentId", params.agentId);
  if (params.leadId) query.set("leadId", params.leadId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return evoFetch<EvoCalendarEvent[]>(`/crm/calendar-events${qs ? `?${qs}` : ""}`);
}

export async function createCalendarEvent(data: {
  type: EvoCalendarEventType;
  leadId?: string;
  agentId?: string;
  startAt: string;
  endAt: string;
  note: string;
}): Promise<EvoCalendarEvent> {
  return evoFetch<EvoCalendarEvent>(`/crm/calendar-events`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateCalendarEvent(id: string, data: Partial<EvoCalendarEvent>): Promise<EvoCalendarEvent> {
  return evoFetch<EvoCalendarEvent>(`/crm/calendar-events/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await evoFetch<void>(`/crm/calendar-events/${id}`, { method: "DELETE" });
}

// LYD-10: plantillas de respuesta rapida

export async function listTemplateGroups(): Promise<EvoTemplateGroup[]> {
  return evoFetch<EvoTemplateGroup[]>(`/crm/template-groups`);
}

export async function createTemplateGroup(title: string): Promise<EvoTemplateGroup> {
  return evoFetch<EvoTemplateGroup>(`/crm/template-groups`, { method: "POST", body: JSON.stringify({ title }) });
}

export async function createTemplate(
  groupId: string,
  data: { command: string; label: string; body: string },
): Promise<EvoQuickReplyTemplate> {
  return evoFetch<EvoQuickReplyTemplate>(`/crm/template-groups/${groupId}/templates`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<EvoQuickReplyTemplate, "command" | "label" | "body">>,
): Promise<EvoQuickReplyTemplate> {
  return evoFetch<EvoQuickReplyTemplate>(`/crm/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteTemplate(id: string): Promise<void> {
  await evoFetch<void>(`/crm/templates/${id}`, { method: "DELETE" });
}

// LYD-11: insights agregados (solo lectura)

export async function getPersonalInsights(
  params: { agentId?: string; from?: string; to?: string } = {},
): Promise<EvoPersonalInsights> {
  const query = new URLSearchParams();
  if (params.agentId) query.set("agentId", params.agentId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return evoFetch<EvoPersonalInsights>(`/crm/insights/personal${qs ? `?${qs}` : ""}`);
}

// LYD-35: mensaje de bienvenida automatico. Config global de Lydia -- se
// resuelve server-side contra la instancia de WhatsApp conectada (Baileys/QR
// o Cloud API -- Brittany Group usa WHATSAPP-BUSINESS, no Baileys; el back
// implementa el envio en ambos canales, ver whatsapp.business.service.ts y
// whatsapp.baileys.service.ts), asi el toggle/textarea del front no
// necesita saber nada de instancias/canales.
export async function resolveWhatsappInstanceName(): Promise<string | null> {
  const instances = await listInstances();
  const whatsapp = instances.find(
    (i) =>
      (i.integration === "WHATSAPP-BAILEYS" || i.integration === "WHATSAPP-BUSINESS") &&
      i.connectionStatus === "open",
  );
  return whatsapp?.name ?? null;
}

export async function getWelcomeMessageConfig(instanceName: string): Promise<EvoWelcomeMessageConfig> {
  return evoFetch<EvoWelcomeMessageConfig>(`/crm/welcome-message?instanceName=${encodeURIComponent(instanceName)}`);
}

export async function updateWelcomeMessageConfig(
  instanceName: string,
  data: { enabled?: boolean; message?: string },
): Promise<EvoWelcomeMessageConfig> {
  return evoFetch<EvoWelcomeMessageConfig>(`/crm/welcome-message`, {
    method: "PATCH",
    body: JSON.stringify({ instanceName, ...data }),
  });
}
