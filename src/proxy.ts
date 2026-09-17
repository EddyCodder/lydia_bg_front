import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

// LYD-2: protege todas las rutas de la app salvo /login y /api/auth/*.
// Convencion "proxy" (Next.js 16, reemplaza a "middleware" -- runtime
// Node, no edge). Usa request.cookies (no next/headers cookies(), pensado
// para Server Components/Route Handlers) y session.ts, que no depende de
// ninguna API especifica de runtime.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionCookie(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const next = request.nextUrl.pathname + request.nextUrl.search;
    if (next !== "/") loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Todo salvo: /login, /api/auth/*, assets de Next, icons estaticos y
  // favicon.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|icons|favicon.ico).*)"],
};
