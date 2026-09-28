"use client";

import { useEffect, useState } from "react";

// LYD-60: la busqueda de mensajes pega contra el back (Postgres) -- sin esto
// se dispararia una consulta por cada tecla.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
