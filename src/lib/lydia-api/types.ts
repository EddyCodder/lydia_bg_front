/**
 * Formas crudas del backend de Lydia: los endpoints nativos de Evolution
 * API (WhatsApp/Baileys, no reimplementados aca) mas los endpoints propios
 * de CRM-12 (/crm/*) que agregan la capa de agentes/asignacion/notas que
 * antes daba Chatwoot.
 */

export type ChatStatus = "open" | "pending" | "resolved";
export type AgentRole = "asesor" | "administrador";

export interface EvoAgent {
  id: string;
  name: string;
  email: string | null;
  color: string | null;
  role: AgentRole;
  active: boolean;
}

export interface EvoContact {
  id: string;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
}

// GET /crm/conversations -- Chat + Agent + contact cruzado a mano en el back
// GET/POST /crm/conversations/:chatId/notes (LYD-21)
export interface EvoNote {
  id: string;
  chatId: string;
  agentId: string | null;
  content: string;
  createdAt: string;
  Agent: EvoAgent | null;
}

export interface EvoConversation {
  id: string;
  remoteJid: string;
  name: string | null;
  status: ChatStatus;
  unreadMessages: number;
  updatedAt: string;
  Agent: EvoAgent | null;
  contact: EvoContact | null;
  lastMessage: { content: string; timestamp: number } | null;
  // LYD-14: override manual, propio de Lydia (ver adaptContact) -- null hasta
  // que un agente lo edite.
  contactNameOverride: string | null;
  contactPhoneOverride: string | null;
  // LYD-31: de que instancia/canal es esta conversacion -- necesario para
  // pedir mensajes/enviar contra el canal correcto, ya que el front ya no
  // tiene una unica instancia fija.
  instanceName: string;
  integration: string;
}

// GET /instance/fetchInstances -- endpoint nativo de Evolution API, sin
// tocar. Solo se usan estos campos; el resto (Chatwoot, Proxy, etc.) se
// ignora en el front.
export interface EvoInstance {
  id: string;
  name: string;
  integration: string;
  connectionStatus: string;
  number: string | null;
}

// GET/PATCH /crm/welcome-message?instanceName=... -- LYD-35.
// GET/PUT /crm/bot?instanceName=... -- LYD-47/48. Mismo shape que
// bot-flow.validation.ts del back (BotGraph/BotNode/BotEdge).
export type EvoBotNodeType = "message" | "question";

export interface EvoBotOption {
  id: string;
  title: string;
}

export interface EvoBotNode {
  id: string;
  type: EvoBotNodeType;
  text: string;
  x: number;
  y: number;
  options?: EvoBotOption[];
}

export interface EvoBotEdge {
  id: string;
  from: string;
  fromOption?: string | null;
  to: string;
}

export interface EvoBotGraph {
  startNodeId: string | null;
  nodes: EvoBotNode[];
  edges: EvoBotEdge[];
}

export interface EvoBotFlow {
  instanceName: string;
  enabled: boolean;
  graph: EvoBotGraph;
  warnings: string[];
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

// POST /message/sendMedia/:instance -- media como base64 o url (SendMediaDto)
export interface EvoSendMediaInput {
  mediatype: "image" | "document" | "video" | "audio";
  media: string;
  mimetype?: string;
  fileName?: string;
  caption?: string;
}

// POST /chat/getBase64FromMediaMessage/:instance
export interface EvoMediaResult {
  mediaType: string;
  fileName: string;
  caption?: string;
  mimetype: string;
  base64: string;
}

export interface EvoMessagesResponse {
  messages: {
    total: number;
    pages: number;
    currentPage: number;
    records: EvoMessage[];
  };
}

// LYD-8: pipeline de leads. GET/POST /crm/leads, GET/PATCH/DELETE /crm/leads/:id
export type LeadStage =
  | "contacto_inicial"
  | "negociacion"
  | "promesa_pago"
  | "discusion_contrato"
  | "matriculado"
  | "venta_perdida";

export interface EvoLead {
  id: string;
  leadNumber: string;
  contactName: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
  source: string;
  budget: string | null;
  budgetAmount: string; // Prisma Decimal serializa como string en JSON
  stage: LeadStage;
  hasPendingTasks: boolean;
  chatId: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
  Agent: EvoAgent | null;
  Chat: { id: string; remoteJid: string } | null;
}

// LYD-9: calendario por agente. GET/POST /crm/calendar-events, PATCH/DELETE /crm/calendar-events/:id
export type EvoCalendarEventType = "chat" | "nota" | "tarea" | "reserva";

export interface EvoCalendarEvent {
  id: string;
  type: EvoCalendarEventType;
  leadId: string | null;
  agentId: string | null;
  startAt: string;
  endAt: string;
  note: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  Agent: EvoAgent | null;
  Lead: EvoLead | null;
}

// LYD-10: plantillas de respuesta rapida. GET/POST /crm/template-groups,
// PATCH/DELETE /crm/template-groups/:id, POST /crm/template-groups/:groupId/templates,
// PATCH/DELETE /crm/templates/:id
export interface EvoQuickReplyTemplate {
  id: string;
  groupId: string;
  command: string;
  label: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvoTemplateGroup {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  Templates: EvoQuickReplyTemplate[];
}

// LYD-11: agregados de solo lectura. GET /crm/insights/personal
export interface EvoPersonalInsights {
  dialogosVigentes: number;
  dialogosSinReplica: number;
  leadsGanados: { count: number; sumBudget: number };
  leadsActivos: { count: number; sumBudget: number };
  leadsPerdidos: { count: number };
  leadsSinTareas: { count: number };
  fuentes: Record<string, number>;
  tareas: { count: number };
}
