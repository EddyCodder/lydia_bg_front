"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

function LoginForm() {
  const { signInWithGoogle, isLoading, error, agent } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  if (!isLoading && agent) {
    // middleware.ts ya te manda a /login solo sin sesion -- si llegaste
    // aca con sesion activa (ej. volviste atras en el browser), redirigi
    // sin mostrar el form.
    if (typeof window !== "undefined") window.location.replace(next ?? "/inicio");
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-bg-subtle px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <Image src="/icons/lydia-logo-full.png" alt="Lydia" width={140} height={57} priority />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Bandeja colaborativa de WhatsApp de Brittany Group. Iniciá sesión con tu cuenta @brittanygroup.edu.pe.
        </p>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => signInWithGoogle(next)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-line bg-bg px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.63H1.29A11.98 11.98 0 000 12c0 1.93.47 3.76 1.29 5.37z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z"
            />
          </svg>
          Continuar con Google
        </button>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
