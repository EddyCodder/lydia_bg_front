import { NextResponse } from "next/server";
import { createMessage, listMessages } from "@/lib/chatwoot/client";
import { adaptMessage } from "@/lib/chatwoot/adapters";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  const isConfigError = error instanceof Error && error.name === "ChatwootConfigError";
  return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { payload } = await listMessages(Number(id));
    return NextResponse.json({ messages: payload.map(adaptMessage) });
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
    const message = await createMessage(Number(id), content);
    return NextResponse.json({ message: adaptMessage(message) });
  } catch (error) {
    return errorResponse(error);
  }
}
