import { NextResponse } from "next/server";
import { listConversations } from "@/lib/lydia-api/client";
import { adaptConversation } from "@/lib/lydia-api/adapters";
import type { ChatStatus } from "@/lib/lydia-api/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ChatStatus | "all" | null;

  try {
    const conversations = await listConversations(status && status !== "all" ? status : undefined);
    return NextResponse.json({ conversations: conversations.map(adaptConversation) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
