import { NextResponse } from "next/server";
import { getConversation, sendAudio } from "@/lib/lydia-api/client";

// LYD-53: nota de voz grabada en el navegador (base64 inline, mismo patron
// que media/route.ts). El `quoted` opcional viene del reply activo en el
// composer, igual que en messages/media.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const audio = typeof body?.audio === "string" ? body.audio : "";

  if (!audio) {
    return NextResponse.json({ error: "audio es requerido" }, { status: 400 });
  }

  try {
    const conversation = await getConversation(id);
    await sendAudio(conversation.remoteJid, conversation.instanceName, audio, body.quoted ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
