import { NextResponse } from "next/server";
import { listAgents } from "@/lib/lydia-api/client";
import { adaptAgent } from "@/lib/lydia-api/adapters";

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents: agents.map(adaptAgent) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
