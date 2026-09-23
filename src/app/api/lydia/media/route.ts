import { NextResponse } from "next/server";
import { getMediaBase64 } from "@/lib/lydia-api/client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.key || !body?.message || !body?.instanceName) {
    return NextResponse.json({ error: "key, message e instanceName son requeridos" }, { status: 400 });
  }

  try {
    const media = await getMediaBase64({ key: body.key, message: body.message }, body.instanceName);
    return NextResponse.json({ dataUrl: `data:${media.mimetype};base64,${media.base64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
