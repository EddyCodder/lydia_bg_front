import { NextResponse } from "next/server";
import { assignConversation, markConversationRead } from "@/lib/lydia-api/client";
import { adaptConversation } from "@/lib/lydia-api/adapters";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const hasAssignedAgentId = "assignedAgentId" in (body ?? {});
  const hasUnreadMessages = "unreadMessages" in (body ?? {});

  if (!hasAssignedAgentId && !hasUnreadMessages) {
    return NextResponse.json({ error: "assignedAgentId o unreadMessages es requerido" }, { status: 400 });
  }

  try {
    const conversation = hasUnreadMessages
      ? await markConversationRead(id)
      : await assignConversation(id, body.assignedAgentId);
    return NextResponse.json({ conversation: adaptConversation(conversation) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
