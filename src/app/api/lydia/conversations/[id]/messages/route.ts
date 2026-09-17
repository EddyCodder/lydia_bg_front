import { NextResponse } from "next/server";
import { getConversation, listMessages, sendMessage } from "@/lib/lydia-api/client";
import { adaptMessage } from "@/lib/lydia-api/adapters";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
  return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const conversation = await getConversation(id);
    const messages = await listMessages(conversation.remoteJid);
    return NextResponse.json({ messages: messages.map(adaptMessage) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "content es requerido" }, { status: 400 });
  }

  try {
    const conversation = await getConversation(id);
    await sendMessage(conversation.remoteJid, content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
