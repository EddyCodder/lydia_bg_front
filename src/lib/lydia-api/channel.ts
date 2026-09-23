import type { InboxChannel } from "./inbox-types";

// LYD-31: metadata de presentacion por canal -- nombre para mostrar y color
// del punto/badge que lo identifica en la lista y el detalle. Colores de
// marca de cada plataforma, usados solo como acento (no hay logos propios
// en el set de iconos del proyecto, ver components/icons.tsx).
export const CHANNEL_META: Record<InboxChannel, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  messenger: { label: "Messenger", color: "#0084FF" },
  instagram: { label: "Instagram", color: "#E1306C" },
};

export const CHANNEL_FILTERS: { id: InboxChannel | "todos"; label: string }[] = [
  { id: "todos", label: "Todos los canales" },
  { id: "whatsapp", label: CHANNEL_META.whatsapp.label },
  { id: "messenger", label: CHANNEL_META.messenger.label },
  { id: "instagram", label: CHANNEL_META.instagram.label },
];
