import { NextResponse } from "next/server";
import { assignConversation, markConversationRead, updateConversationContact } from "@/lib/lydia-api/client";
import { adaptConversation } from "@/lib/lydia-api/adapters";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const hasAssignedAgentId = "assignedAgentId" in (body ?? {});
  const hasUnreadMessages = "unreadMessages" in (body ?? {});
  const hasContactOverride = "contactNameOverride" in (body ?? {}) || "contactPhoneOverride" in (body ?? {});

  if (!hasAssignedAgentId && !hasUnreadMessages && !hasContactOverride) {
    return NextResponse.json(
      { error: "assignedAgentId, unreadMessages o contactNameOverride/contactPhoneOverride es requerido" },
      { status: 400 },
    );
  }

  try {
    let conversation;
    if (hasContactOverride) {
      conversation = await updateConversationContact(id, {
        contactNameOverride: body.contactNameOverride,
        contactPhoneOverride: body.contactPhoneOverride,
      });
    } else if (hasUnreadMessages) {
      conversation = await markConversationRead(id);
    } else {
      conversation = await assignConversation(id, body.assignedAgentId);
    }
    return NextResponse.json({ conversation: adaptConversation(conversation) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
