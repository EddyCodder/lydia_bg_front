"use client";

import { useMemo, useRef, useState } from "react";
import { templateGroups } from "@/lib/mock-data";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const allTemplates = templateGroups.flatMap((group) => group.templates);

export function Composer({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSlashMode = value.startsWith("/");
  const query = isSlashMode ? value.slice(1).toLowerCase() : "";
  const filtered = useMemo(
    () =>
      isSlashMode
        ? allTemplates.filter(
            (t) => t.label.toLowerCase().includes(query) || t.command.toLowerCase().includes(query),
          )
        : [],
    [isSlashMode, query],
  );

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const selectTemplate = (template: (typeof allTemplates)[number]) => {
    setValue(template.body);
    setHighlighted(0);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-line-soft p-3">
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
            <button type="button" aria-label="Adjuntar archivo" className="hover:text-ink-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
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
            disabled={!value.trim() || disabled}
            className="rounded-lg bg-muted-2 px-4 py-1.5 text-sm font-medium text-white transition-colors enabled:bg-brand enabled:hover:bg-brand-dark disabled:cursor-not-allowed"
          >
            {disabled ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
