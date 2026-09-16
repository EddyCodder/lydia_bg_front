"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

type NavLeaf = { type: "leaf"; label: string; href: string; icon: IconName };
type NavSection = {
  type: "section";
  id: string;
  label: string;
  icon: IconName;
  items: { label: string; href: string; icon: IconName }[];
};
type NavEntry = NavLeaf | NavSection;

const topEntries: NavEntry[] = [
  { type: "leaf", label: "Inicio", href: "/inicio", icon: "inicio" },
  {
    type: "section",
    id: "comunicaciones",
    label: "Comunicaciones",
    icon: "chat",
    items: [
      { label: "Inbox de chat", href: "/comunicaciones/inbox-chat", icon: "chat" },
      { label: "Inbox de correo", href: "/comunicaciones/inbox-correo", icon: "correo" },
      { label: "Chats de equipo", href: "/comunicaciones/chats-equipo", icon: "equipo" },
    ],
  },
  {
    type: "section",
    id: "pipelines",
    label: "Pipelines",
    icon: "embudo",
    items: [
      { label: "Embudo de chats", href: "/pipelines/embudo-chats", icon: "embudo" },
      { label: "Todos los leads", href: "/pipelines/todos-los-leads", icon: "tabla" },
    ],
  },
];

const bottomEntries: NavEntry[] = [
  { type: "leaf", label: "Calendario", href: "/calendario", icon: "calendario" },
  {
    type: "section",
    id: "automatizaciones",
    label: "Automatizaciones",
    icon: "rayo",
    items: [{ label: "Plantillas", href: "/automatizaciones/plantillas", icon: "tabla" }],
  },
  {
    type: "section",
    id: "insights",
    label: "Insights",
    icon: "grafico",
    items: [
      { label: "Panel de control personal", href: "/insights/panel-personal", icon: "grafico" },
      { label: "Reporte de consolidados", href: "/insights/reporte-consolidados", icon: "tabla" },
      { label: "Registro de actividades", href: "/insights/registro-actividades", icon: "bandeja" },
    ],
  },
];

function CollapsedItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  onClick?: () => void;
}) {
  const className = `mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-md ${
    active ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-bg-subtle"
  }`;

  if (onClick) {
    return (
      <button type="button" title={label} onClick={onClick} className={className}>
        <Icon name={icon} />
      </button>
    );
  }
  return (
    <Link href={href} title={label} className={className}>
      <Icon name={icon} />
    </Link>
  );
}

export function NavRail() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [manualToggle, setManualToggle] = useState<Record<string, boolean>>({});

  const isSectionOpen = (section: NavSection) => {
    if (section.id in manualToggle) return manualToggle[section.id];
    return section.items.some((item) => pathname.startsWith(item.href));
  };

  const toggleSection = (section: NavSection) => {
    setManualToggle((prev) => ({ ...prev, [section.id]: !isSectionOpen(section) }));
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.type === "leaf") {
      if (collapsed) {
        return <CollapsedItem key={entry.href} {...entry} active={pathname.startsWith(entry.href)} />;
      }
      return (
        <Link
          key={entry.href}
          href={entry.href}
          className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 font-semibold ${
            pathname.startsWith(entry.href) ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-bg-subtle"
          }`}
        >
          <Icon name={entry.icon} />
          {entry.label}
        </Link>
      );
    }

    const open = isSectionOpen(entry);

    if (collapsed) {
      return (
        <CollapsedItem
          key={entry.id}
          href="#"
          label={entry.label}
          icon={entry.icon}
          active={entry.items.some((item) => pathname.startsWith(item.href))}
          onClick={() => setCollapsed(false)}
        />
      );
    }

    return (
      <div key={entry.id} className="mt-2">
        <button
          type="button"
          onClick={() => toggleSection(entry)}
          className={
            open
              ? "flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink-soft"
              : "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-semibold text-ink-soft hover:bg-bg-subtle"
          }
        >
          <span className="flex items-center gap-3">
            {!open && <Icon name={entry.icon} />}
            {entry.label}
          </span>
          <Icon
            name="chevronDown"
            size={14}
            strokeWidth={2}
            className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </button>

        {open &&
          entry.items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 ${
                  active ? "bg-brand/10 font-semibold text-brand" : "text-ink-soft hover:bg-bg-subtle"
                }`}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </Link>
            );
          })}
      </div>
    );
  };

  return (
    <aside
      className={`flex h-full flex-col border-r border-line bg-surface ${
        collapsed ? "w-16" : "w-60"
      } shrink-0 transition-[width]`}
    >
      <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
        <div className={`flex items-center ${collapsed ? "hidden" : ""}`}>
          <Image src="/icons/lydia-logo-full.png" alt="Lydia" width={108} height={44} className="rounded-md" />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-ink"
          aria-label="Colapsar navegación"
        >
          {collapsed ? (
            <Image src="/icons/lydia-mark.png" alt="" width={22} height={22} className="rounded-md" />
          ) : (
            <Icon name="panel" size={17} />
          )}
        </button>
      </div>

      <nav className="scroll-slim flex-1 overflow-y-auto px-3 pb-4 text-sm">
        {topEntries.map(renderEntry)}
        <div className="mt-2 border-t border-line-soft pt-2">{bottomEntries.map(renderEntry)}</div>
      </nav>
    </aside>
  );
}
