import { NextResponse } from "next/server";
import { listConversations } from "@/lib/chatwoot/client";
import { adaptConversation } from "@/lib/chatwoot/adapters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "open" | "resolved" | "pending" | "snoozed" | "all" | null;
  const page = searchParams.get("page");

  try {
    const { payload, meta } = await listConversations({
      status: status ?? "all",
      page: page ? Number(page) : undefined,
    });
    return NextResponse.json({ meta, conversations: payload.map(adaptConversation) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "ChatwootConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
