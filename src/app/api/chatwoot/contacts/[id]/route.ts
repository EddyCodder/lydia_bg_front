import { NextResponse } from "next/server";
import { getContact } from "@/lib/chatwoot/client";
import { adaptContact } from "@/lib/chatwoot/adapters";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { payload } = await getContact(Number(id));
    return NextResponse.json({ contact: adaptContact(payload) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "ChatwootConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
