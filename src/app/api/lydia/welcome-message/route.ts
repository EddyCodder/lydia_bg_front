import { NextResponse } from "next/server";
import {
  getWelcomeMessageConfig,
  resolveWhatsappInstanceName,
  updateWelcomeMessageConfig,
} from "@/lib/lydia-api/client";

// LYD-35: sin adapter -- el shape que devuelve el back ({enabled, message})
// ya calza 1:1 con WelcomeMessageConfig del front (lib/types.ts). La
// resolucion de instanceName queda de este lado, no en el componente.

export async function GET() {
  try {
    const instanceName = await resolveWhatsappInstanceName();
    if (!instanceName) {
      return NextResponse.json({ config: { enabled: false, message: "" } });
    }
    const config = await getWelcomeMessageConfig(instanceName);
    return NextResponse.json({ config: { enabled: config.enabled, message: config.message } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.enabled === undefined && body?.message === undefined) {
    return NextResponse.json({ error: "enabled o message son requeridos" }, { status: 400 });
  }

  try {
    const instanceName = await resolveWhatsappInstanceName();
    if (!instanceName) {
      return NextResponse.json({ error: "No hay ninguna instancia de WhatsApp conectada" }, { status: 409 });
    }
    const config = await updateWelcomeMessageConfig(instanceName, {
      enabled: body?.enabled,
      message: body?.message,
    });
    return NextResponse.json({ config: { enabled: config.enabled, message: config.message } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const isConfigError = error instanceof Error && error.name === "LydiaApiConfigError";
    return NextResponse.json({ error: message }, { status: isConfigError ? 503 : 502 });
  }
}
