"use client";

import { useMemo, useState } from "react";
import type { InboxChannel, InboxConversation } from "@/lib/lydia-api/inbox-types";
import { CHANNEL_FILTERS } from "@/lib/lydia-api/channel";
import { ConversationListItem } from "./ConversationListItem";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";

type StatusFilter = "todos" | "abierto" | "sin_respuesta" | "cerrado";
type ChannelFilter = InboxChannel | "todos";

const filters: { id: StatusFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "abierto", label: "Abiertos" },
  { id: "sin_respuesta", label: "Sin respuesta" },
  { id: "cerrado", label: "Resueltos" },
];

interface Props {
  conversations: InboxConversation[];
  isLoading: boolean;
  error: Error | null;
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
}

export function ConversationList({ conversations, isLoading, error, selectedConversationId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  // LYD-31: filtro por canal, mismo patron que el de estado.
  const [activeChannel, setActiveChannel] = useState<ChannelFilter>("todos");
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  useEscapeKey(filterMenuOpen, () => setFilterMenuOpen(false));
  useEscapeKey(channelMenuOpen, () => setChannelMenuOpen(false));

  const filtered = useMemo(() => {
    return conversations.filter((conversation) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matches =
          conversation.contact.name.toLowerCase().includes(query) ||
          String(conversation.id).includes(query);
        if (!matches) return false;
      }
      if (activeChannel !== "todos" && conversation.inboxChannel !== activeChannel) return false;
      if (activeFilter === "todos") return true;
      return conversation.status === activeFilter;
    });
  }, [conversations, search, activeFilter, activeChannel]);

  return (
    <section className="flex h-full w-full shrink-0 flex-col border-r border-line bg-surface md:w-96">
      <div className="border-b border-line-soft p-3">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            aria-label="Buscar conversaciones"
            placeholder="Buscar"
            className="w-full rounded-lg border border-line bg-bg-subtle py-2 pl-9 pr-3 text-sm text-ink-soft placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-line-soft px-3 py-2">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={filterMenuOpen}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-bg-subtle"
            >
              {filters.find((f) => f.id === activeFilter)?.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {filterMenuOpen && (
              <div role="menu" className="absolute left-0 z-10 mt-1 w-40 rounded-md border border-line bg-surface py-1 text-sm shadow-lg">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setFilterMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left hover:bg-bg-subtle ${
                      filter.id === activeFilter ? "font-semibold text-brand" : "text-ink-soft"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LYD-31: filtro por canal (WhatsApp/Messenger/Instagram), mismo patron que el de estado. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setChannelMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={channelMenuOpen}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-bg-subtle"
            >
              {CHANNEL_FILTERS.find((f) => f.id === activeChannel)?.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {channelMenuOpen && (
              <div role="menu" className="absolute left-0 z-10 mt-1 w-44 rounded-md border border-line bg-surface py-1 text-sm shadow-lg">
                {CHANNEL_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveChannel(filter.id);
                      setChannelMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left hover:bg-bg-subtle ${
                      filter.id === activeChannel ? "font-semibold text-brand" : "text-ink-soft"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted">
          Total: {filtered.length}
          <span className="h-1 w-1 rounded-full bg-muted-2" />
        </div>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto">
        {isLoading && <p className="px-4 py-6 text-center text-sm text-muted">Cargando conversaciones…</p>}
        {error && (
          <p className="px-4 py-6 text-center text-sm text-danger">No se pudo cargar el inbox: {error.message}</p>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted">Sin conversaciones para este filtro.</p>
        )}
        {filtered.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === selectedConversationId}
            onClick={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </section>
  );
}
