import { NextResponse } from "next/server";
import { assignConversation } from "@/lib/lydia-api/client";
import { adaptConversation } from "@/lib/lydia-api/adapters";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!("assignedAgentId" in (body ?? {}))) {
    return NextResponse.json({ error: "assignedAgentId es requerido" }, { status: 400 });
  }

  try {
    const conversation = await assignConversation(id, body.assignedAgentId);
    return NextResponse.json({ conversation: adaptConversation(conversation) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
