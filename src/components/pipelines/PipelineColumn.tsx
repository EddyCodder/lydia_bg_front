import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  accentColor?: string;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  children: ReactNode;
  isEmpty?: boolean;
}

export function PipelineColumn({
  title,
  subtitle,
  accentColor,
  quickActionLabel,
  onQuickAction,
  children,
  isEmpty,
}: Props) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-line last:border-r-0">
      <div className="border-b border-line-soft px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {accentColor && <span className={`h-2 w-2 rounded-full ${accentColor}`} />}
          <h3 className="text-sm font-semibold tracking-wide text-ink-soft">{title}</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>

      {quickActionLabel && (
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={onQuickAction}
            className="w-full rounded-md bg-bg-subtle py-1.5 text-xs font-medium text-ink-soft hover:bg-line"
          >
            {quickActionLabel}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <p className="px-4 py-6 text-center text-xs text-muted">Sin resultados para este filtro.</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
