import { NextResponse } from "next/server";
import { addNote, listNotes } from "@/lib/lydia-api/client";
import { adaptNote } from "@/lib/lydia-api/adapters";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
  return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const notes = await listNotes(id);
    return NextResponse.json({ notes: notes.map(adaptNote) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "content es requerido" }, { status: 400 });
  }

  try {
    const note = await addNote(id, content, typeof body?.agentId === "string" ? body.agentId : null);
    return NextResponse.json({ note: adaptNote(note) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
