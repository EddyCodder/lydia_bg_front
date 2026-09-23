const LANDSCAPE_AVATAR_COUNT = 16;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// LYD-36: WhatsApp no expone foto de perfil real del contacto (ni Cloud API
// ni Baileys en lydia_bg_back) -- mismo criterio que Kommo: un avatar
// generico que se repite entre contactos distintos, pero de paisaje en vez
// de iniciales+color. Pool fijo de 16 PNG bundleados en public/avatars/ --
// nunca se pide nada a internet en runtime. Deterministico por contacto
// (mismo seed = siempre la misma imagen, sin estado ni fetch extra).
// seed puede llegar undefined en la practica (ej. lydiaContactId resuelto a
// partir de un remoteJid opcional en datos mock/de ejemplo) aunque el tipo
// del caller diga string -- sin este fallback, hashString revienta con
// TypeError en vez de mostrar el paisaje por defecto.
export function fallbackAvatarUrl(seed: string | null | undefined): string {
  const index = hashString(seed ?? "") % LANDSCAPE_AVATAR_COUNT;
  return `/avatars/landscapes/landscape-${index + 1}.png`;
}
