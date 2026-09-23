"use client";

import { useState } from "react";
import type { WelcomeMessageConfig } from "@/lib/types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import { useUpdateWelcomeMessageConfig, useWelcomeMessageConfig } from "@/lib/queries/welcome-message";

const DEFAULT_CONFIG: WelcomeMessageConfig = { enabled: false, message: "" };

export function WelcomeMessageForm() {
  const { data: realConfig, error: configError, isLoading } = useWelcomeMessageConfig();
  const isMockMode = !LYDIA_API_ENABLED || configError !== null;
  const update = useUpdateWelcomeMessageConfig();

  // Modo mock: mismo criterio que PlantillasTable -- estado local editable
  // sobre un default en memoria, sin persistencia real.
  const [mockConfig, setMockConfig] = useState<WelcomeMessageConfig>(DEFAULT_CONFIG);
  const saved = isMockMode ? mockConfig : realConfig ?? DEFAULT_CONFIG;

  // Draft solo existe una vez que el usuario toca algo -- mientras es null,
  // "current" sigue lo que llega de la query/mock sin necesidad de un efecto
  // que copie ese valor a state (evita el cascading-render que marca eslint).
  const [draft, setDraft] = useState<WelcomeMessageConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const current = draft ?? saved;

  const updateDraft = (patch: Partial<WelcomeMessageConfig>) => {
    setDraft({ ...current, ...patch });
    setDirty(true);
  };

  // Mismo invariante que valida el back: no tiene sentido activar sin texto.
  const canSave = !current.enabled || current.message.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    if (isMockMode) {
      setMockConfig(current);
    } else {
      await update.mutateAsync(current);
    }
    setDirty(false);
  };

  return (
    <section className="scroll-slim flex h-full flex-1 flex-col overflow-y-auto bg-bg px-8 py-6">
      <h1 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Mensaje de bienvenida</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Se manda una sola vez, automáticamente, al primer mensaje de un número de WhatsApp sin conversación previa.
        Si el número ya tiene historial, nunca se manda nada automático.
      </p>

      <div className="mt-6 max-w-xl rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Automatización activa</span>
          <button
            type="button"
            role="switch"
            aria-checked={current.enabled}
            onClick={() => updateDraft({ enabled: !current.enabled })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${current.enabled ? "bg-brand" : "bg-muted-2"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                current.enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="welcome-message-text">
          Texto del mensaje
        </label>
        <textarea
          id="welcome-message-text"
          value={current.message}
          onChange={(e) => updateDraft({ message: e.target.value })}
          rows={5}
          placeholder="Hola, gracias por escribirnos. En breve te responde una asesora."
          className="mt-2 w-full resize-none rounded-md border border-line px-2.5 py-2 text-sm focus:border-brand focus:outline-none"
        />
        {current.enabled && !canSave && (
          <p className="mt-1 text-xs text-red-600">El mensaje es obligatorio para activar la automatización.</p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          {isLoading && !isMockMode && <span className="text-xs text-muted">Cargando…</span>}
          <button
            type="button"
            disabled={!dirty || !canSave || update.isPending}
            onClick={handleSave}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-2"
          >
            Guardar
          </button>
        </div>
      </div>
    </section>
  );
}
