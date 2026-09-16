import { Icon, type IconName } from "@/components/icons";

interface Props {
  title: string;
  description: string;
  icon?: IconName;
}

export function EmptyState({ title, description, icon = "correo" }: Props) {
  return (
    <section className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-bg px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon name={icon} size={22} strokeWidth={1.75} />
      </div>
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <p className="max-w-sm text-sm text-ink-soft">{description}</p>
    </section>
  );
}
