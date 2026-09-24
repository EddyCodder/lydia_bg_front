import { SignJWT, jwtVerify } from "jose";

/**
 * LYD-2: cookie de sesion propia de Lydia (no el ID token de Firebase, que
 * expira en 1h) -- firmada con HMAC via jose, sin next/headers, para poder
 * importarse tanto desde Route Handlers/Server Components como desde
 * middleware.ts (Edge runtime).
 */

export const SESSION_COOKIE_NAME = "lydia_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export interface SessionPayload {
  agentId: string;
  email: string;
  name: string;
  // LYD-40: hacia falta para gatear Eliminar conversacion (solo
  // administrador) del lado del servidor, no solo esconder el boton en el
  // cliente. Antes no viajaba en el JWT -- el GET de /api/auth/session (el
  // que corre en cada carga de pagina, a diferencia del POST de login) lo
  // devolvia undefined siempre.
  role: string;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta configurar SESSION_SECRET. Ver .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionCookie(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.agentId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      // Sesiones firmadas antes de LYD-40 no tienen role -- se invalidan y
      // el agente vuelve a loguearse una vez, no queda una sesion a medias
      // sin role para gatear Eliminar.
      return null;
    }
    return { agentId: payload.agentId, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}
