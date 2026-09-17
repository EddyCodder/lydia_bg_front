import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookie, type SessionPayload } from "./session";

// Para Server Components / Route Handlers (usa next/headers, no anda en
// middleware -- ahi se lee request.cookies directo, ver middleware.ts).
export async function getCurrentAgent(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionCookie(token);
}
