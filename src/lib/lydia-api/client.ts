import "server-only";
import type { ChatStatus, EvoConversation, EvoMessage, EvoMessagesResponse } from "./types";

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
