import { fallbackAvatarUrl } from "@/lib/avatar";

interface Props {
  seed: string | null | undefined;
  avatarUrl?: string | null;
  className?: string;
}

// LYD-36: unico punto que decide "foto real vs paisaje generico" para un
// contacto -- antes era un circulo de color + inicial repetido en cada
// pantalla, con pequenas diferencias entre copias.
export function ContactAvatar({ seed, avatarUrl, className = "h-9 w-9" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- foto real de perfil (dominio externo) o paisaje generico estatico como fallback
    <img
      src={avatarUrl || fallbackAvatarUrl(seed)}
      alt=""
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  );
}
