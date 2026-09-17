import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/lydia-api/client";
import { adaptLead } from "@/lib/lydia-api/adapters";
import type { LeadStage } from "@/lib/lydia-api/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stage = (searchParams.get("stage") as LeadStage | null) ?? undefined;
  const assignedAgentId = searchParams.get("assignedAgentId") ?? undefined;
  const source = searchParams.get("source") ?? undefined;

  try {
    const leads = await listLeads({ stage, assignedAgentId, source });
    return NextResponse.json({ leads: leads.map(adaptLead) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.contactName || !body?.source) {
    return NextResponse.json({ error: "contactName y source son requeridos" }, { status: 400 });
  }

  try {
    const lead = await createLead(body);
    return NextResponse.json({ lead: adaptLead(lead) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
