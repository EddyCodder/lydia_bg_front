"use client";

import { useEffect } from "react";

// LYD-19: los popovers/modales del inbox y pipelines no se cerraban con
// Escape -- solo con click afuera o en un boton explicito.
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}
