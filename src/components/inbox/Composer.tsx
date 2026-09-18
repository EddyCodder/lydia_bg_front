"use client";

import { useMemo, useRef, useState } from "react";
import { templateGroups as mockTemplateGroups } from "@/lib/mock-data";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import { useTemplateGroups } from "@/lib/queries/template-groups";

export interface ComposerMediaInput {
  mediatype: "image" | "document" | "video" | "audio";
  media: string;
  mimetype?: string;
  fileName?: string;
}

interface Props {
  onSend: (text: string) => Promise<void>;
  onSendMedia: (input: ComposerMediaInput) => Promise<void>;
  disabled?: boolean;
}

function mediatypeFromMime(mimetype: string): ComposerMediaInput["mediatype"] {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function Composer({ onSend, onSendMedia, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: realGroups = [], error: groupsError } = useTemplateGroups();
  const isMockMode = !LYDIA_API_ENABLED || groupsError !== null;
  const templateGroups = isMockMode ? mockTemplateGroups : realGroups;
  const allTemplates = useMemo(() => templateGroups.flatMap((group) => group.templates), [templateGroups]);

  const isSlashMode = value.startsWith("/");
  const query = isSlashMode ? value.slice(1).toLowerCase() : "";
  const filtered = useMemo(
    () =>
      isSlashMode
        ? allTemplates.filter(
            (t) => t.label.toLowerCase().includes(query) || t.command.toLowerCase().includes(query),
          )
        : [],
    [isSlashMode, query, allTemplates],
  );

  const handleSend = async () => {
    const text = value.trim();
    if (!text || disabled || isSending) return;
    setError(null);
    setIsSending(true);
    try {
      await onSend(text);
      setValue("");
    } catch (e) {
      // LYD-14: antes esto borraba el texto igual y el mensaje se perdia en
      // silencio si el POST fallaba -- ahora se mantiene en el composer y
      // se puede reintentar con el mismo texto.
      setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite elegir el mismo archivo dos veces seguidas
    if (!file || disabled || isSending) return;

    setError(null);
    setIsSending(true);
    try {
      const media = await readFileAsBase64(file);
      await onSendMedia({
        mediatype: mediatypeFromMime(file.type),
        media,
        mimetype: file.type || "application/octet-stream",
        fileName: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el archivo");
    } finally {
      setIsSending(false);
    }
  };

  const selectTemplate = (template: (typeof allTemplates)[number]) => {
    setValue(template.body);
    setHighlighted(0);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-line-soft p-3">
      {error && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          <span>No se pudo enviar: {error}</span>
          {value.trim() && (
            <button type="button" onClick={handleSend} className="shrink-0 font-semibold underline hover:no-underline">
              Reintentar
            </button>
          )}
        </div>
      )}
      <div className="relative rounded-2xl border border-line bg-surface">
        {isSlashMode && (
          <div className="scroll-slim absolute bottom-full left-0 z-10 mb-2 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-muted">Sin plantillas para &quot;{query}&quot;</p>}
            {filtered.map((template, i) => (
              <button
                key={template.command}
                type="button"
                onClick={() => selectTemplate(template)}
                onMouseEnter={() => setHighlighted(i)}
                className={`block w-full px-3 py-2 text-left ${i === highlighted ? "bg-brand/10" : "hover:bg-bg-subtle"}`}
              >
                <p className="text-sm font-semibold text-brand">{template.command}</p>
                <p className="truncate text-xs text-ink-soft">{template.body}</p>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlighted(0);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (isSlashMode && filtered.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                selectTemplate(filtered[highlighted]);
                return;
              }
            }
            if (e.key === "Escape" && isSlashMode) {
              e.preventDefault();
              setValue("");
              return;
            }
            if (e.key === "Enter" && !e.shiftKey && !isSlashMode) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          placeholder="Escribe un mensaje o */* para mensajes predeterminados"
          className="w-full resize-none rounded-t-2xl px-4 pt-3 text-sm text-ink-soft placeholder:text-muted focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-3 text-muted">
            <button type="button" aria-label="Emoji" className="hover:text-ink-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Adjuntar archivo"
              disabled={disabled || isSending}
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              className="hidden"
            />
            <button type="button" aria-label="Nota de voz" className="hover:text-ink-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled || isSending}
            className="rounded-lg bg-muted-2 px-4 py-1.5 text-sm font-medium text-white transition-colors enabled:bg-brand enabled:hover:bg-brand-dark disabled:cursor-not-allowed"
          >
            {disabled || isSending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
