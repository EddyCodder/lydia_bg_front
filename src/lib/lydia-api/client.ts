import "server-only";
import type {
  ChatStatus,
  EvoAgent,
  EvoCalendarEvent,
  EvoCalendarEventType,
  EvoConversation,
  EvoLead,
  EvoMessage,
  EvoMessagesResponse,
  EvoPersonalInsights,
  EvoQuickReplyTemplate,
  EvoTemplateGroup,
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
    super(
      `Falta configurar ${missing}. Copiá .env.example a .env.local y completá EVOLUTION_API_URL, EVOLUTION_API_KEY y EVOLUTION_INSTANCE_NAME.`,
    );
    this.name = "LydiaApiConfigError";
  }
}

function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apikey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  if (!baseUrl) throw new LydiaApiConfigError("EVOLUTION_API_URL");
  if (!apikey) throw new LydiaApiConfigError("EVOLUTION_API_KEY");
  if (!instanceName) throw new LydiaApiConfigError("EVOLUTION_INSTANCE_NAME");

  return { baseUrl: baseUrl.replace(/\/$/, ""), apikey, instanceName };
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

  return res.json() as Promise<T>;
}

export async function listConversations(status?: ChatStatus): Promise<EvoConversation[]> {
  const { instanceName } = getConfig();
  const query = new URLSearchParams({ instanceName });
  if (status) query.set("status", status);
  return evoFetch<EvoConversation[]>(`/crm/conversations?${query.toString()}`);
}

export async function getConversation(chatId: string): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`);
}

export async function listMessages(remoteJid: string): Promise<EvoMessage[]> {
  const { instanceName } = getConfig();
  const res = await evoFetch<EvoMessagesResponse>(`/chat/findMessages/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ where: { key: { remoteJid } }, offset: 100, page: 1 }),
  });
  // orden ascendente para el hilo de chat (Evolution devuelve mas nuevo primero)
  return [...res.messages.records].reverse();
}

export async function sendMessage(remoteJid: string, text: string): Promise<void> {
  const { instanceName } = getConfig();
  await evoFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number: remoteJid, text }),
  });
}

export async function listAgents(): Promise<EvoAgent[]> {
  return evoFetch<EvoAgent[]>(`/crm/agents`);
}

export async function assignConversation(chatId: string, assignedAgentId: string | null): Promise<EvoConversation> {
  return evoFetch<EvoConversation>(`/crm/conversations/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ assignedAgentId }),
  });
}

// LYD-8: pipeline de leads

export async function listLeads(params: { stage?: LeadStage; assignedAgentId?: string; source?: string } = {}): Promise<EvoLead[]> {
  const query = new URLSearchParams();
  if (params.stage) query.set("stage", params.stage);
  if (params.assignedAgentId) query.set("assignedAgentId", params.assignedAgentId);
  if (params.source) query.set("source", params.source);
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
