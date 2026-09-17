import { NextResponse } from "next/server";
import { getPersonalInsights } from "@/lib/lydia-api/client";
import { adaptPersonalInsights } from "@/lib/lydia-api/adapters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    const insights = await getPersonalInsights({ agentId, from, to });
    return NextResponse.json({ insights: adaptPersonalInsights(insights) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
