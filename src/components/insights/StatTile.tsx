import { Icon, type IconName } from "@/components/icons";

interface Props {
  label: string;
  value: string;
  subValue?: string;
  delta?: number;
  /** true cuando bajar es la buena noticia para esta métrica (ej. diálogos sin réplica) */
  invert?: boolean;
  deltaSuffix?: string;
  icon?: IconName;
  children?: React.ReactNode;
}

export function StatTile({
  label,
  value,
  subValue,
  delta,
  invert = false,
  deltaSuffix = "por semana",
  icon,
  children,
}: Props) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const isUp = hasDelta && delta > 0;
  const isDown = hasDelta && delta < 0;
  const positive = hasDelta && (invert ? isDown : isUp);
  const negative = hasDelta && (invert ? isUp : isDown);

  return (
    <div className="flex flex-col rounded-lg border border-white/10 bg-[#132845] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c3c2b7]">{label}</p>
        {icon && <Icon name={icon} size={16} className="text-[#c3c2b7]" />}
      </div>

      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {subValue && <p className="text-sm text-[#c3c2b7]">{subValue}</p>}

      <div className="mt-auto pt-3">
        <div className="h-px bg-white/10" />
        {hasDelta && (
          <p
            className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
              positive ? "text-[#0ca30c]" : negative ? "text-[#d03b3b]" : "text-[#c3c2b7]"
            }`}
          >
            <Icon
              name="flecha"
              size={12}
              strokeWidth={2.5}
              className={isUp ? "-rotate-90" : isDown ? "rotate-90" : "rotate-0"}
            />
            {isUp ? "+" : ""}
            {delta} {deltaSuffix}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
