import { NextResponse } from "next/server";
import { createTemplateGroup, listTemplateGroups } from "@/lib/lydia-api/client";
import { adaptTemplateGroup } from "@/lib/lydia-api/adapters";

export async function GET() {
  try {
    const groups = await listTemplateGroups();
    return NextResponse.json({ groups: groups.map(adaptTemplateGroup) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title es requerido" }, { status: 400 });
  }

  try {
    const group = await createTemplateGroup(body.title);
    return NextResponse.json({ group: adaptTemplateGroup(group) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
