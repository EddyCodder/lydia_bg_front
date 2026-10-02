"use client";

import { useState } from "react";
import type { InboxMessage, InboxMessageMedia } from "@/lib/lydia-api/inbox-types";
import { formatMessageTime } from "@/lib/format";
import { useFetchMediaDataUrl } from "@/lib/queries/conversations";
import { MessageMedia } from "./MessageMedia";
import { MessageContextMenu } from "./MessageContextMenu";
import { ForwardMessageDialog } from "./ForwardMessageDialog";

interface Props {
  message: InboxMessage;
  instanceName: string;
  conversationId: string;
  onReply: (message: InboxMessage) => void;
  onReact: (message: InboxMessage, emoji: string) => void;
  onForward: (message: InboxMessage, targetConversationId: string) => void;
}

// LYD-52: cuanto se aleja el menu del borde de la ventana para no salirse
// (se abre en las coordenadas del click, y ese click puede caer cerca del
// borde derecho/inferior del panel de chat).
const MENU_WIDTH = 220;
const MENU_HEIGHT = 300;

function copyableText(message: InboxMessage): string {
  if (message.text) return message.text;
  if (message.media) return `[archivo adjunto${message.media.fileName ? `: ${message.media.fileName}` : ""}]`;
  return "";
}

// LYD-64: extension para el nombre del archivo descargado cuando WhatsApp no
// manda fileName (fotos, videos, audios y stickers casi nunca lo traen).
const EXTENSION_BY_SUBTYPE: Record<string, string> = { jpeg: "jpg", quicktime: "mov", mpeg: "mp3", "svg+xml": "svg" };
const FALLBACK_NAME: Record<InboxMessageMedia["kind"], string> = {
  image: "imagen",
  sticker: "sticker",
  video: "video",
  audio: "audio",
  document: "documento",
};

function downloadFileName(media: InboxMessageMedia, sentAt: string): string {
  if (media.fileName) return media.fileName;
  const subtype = media.mimetype?.split(";")[0].trim().split("/")[1];
  const ext = subtype ? `.${EXTENSION_BY_SUBTYPE[subtype] ?? subtype}` : "";
  const stamp = sentAt.replace(/[^0-9]/g, "").slice(0, 14);
  return `${FALLBACK_NAME[media.kind]}-${stamp}${ext}`;
}

// Se pasa el data: URI a Blob antes de descargar: un <a download> con un
// data: URI de varios MB (videos, PDFs) falla en algunos navegadores.
async function triggerDownload(dataUrl: string, fileName: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MessageBubble({ message, instanceName, conversationId, onReply, onReact, onForward }: Props) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showForward, setShowForward] = useState(false);
  const fetchMediaDataUrl = useFetchMediaDataUrl();

  if (message.direction === "system") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs text-ink-soft">{message.text}</span>
      </div>
    );
  }

  const isOutbound = message.direction === "outbound";
  const myReaction = message.reactions.find((r) => r.fromMe)?.emoji ?? null;

  const media = message.media;
  const handleDownload = media
    ? async () => {
        const dataUrl = await fetchMediaDataUrl(message.id, media.raw, instanceName);
        await triggerDownload(dataUrl, downloadFileName(media, message.sentAt));
      }
    : undefined;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8);
    const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - 8);
    setMenuPos({ x, y });
  };

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-md flex-col gap-1">
        {isOutbound && message.senderName && <span className="self-end text-xs text-muted">{message.senderName}</span>}
        <div className="relative pb-2" onContextMenu={handleContextMenu}>
          <div
            className={`rounded-2xl text-sm leading-relaxed ${
              message.media ? "overflow-hidden p-1.5" : "whitespace-pre-line px-4 py-3"
            } ${isOutbound ? "rounded-tr-sm bg-brand text-white" : "rounded-tl-sm bg-surface text-ink shadow-sm"}`}
          >
            {message.quotedPreview && (
              <p
                className={`mb-1.5 truncate rounded-md border-l-2 px-2 py-1 text-xs italic ${
                  isOutbound ? "border-white/60 bg-white/10 text-white/80" : "border-brand/60 bg-black/5 text-ink-soft"
                } ${message.media ? "mx-1.5 mt-1.5" : "-mx-1"}`}
              >
                {message.quotedPreview}
              </p>
            )}
            {message.media && <MessageMedia messageId={message.id} media={message.media} instanceName={instanceName} />}
            {message.media?.caption && <p className="whitespace-pre-line px-2.5 pb-1 pt-2">{message.media.caption}</p>}
            {!message.media && message.text}
          </div>

          {message.reactions.length > 0 && (
            <div className={`absolute -bottom-1 flex gap-0.5 ${isOutbound ? "right-2" : "left-2"}`}>
              {message.reactions.map((r) => (
                <span
                  key={`${r.emoji}-${r.fromMe}`}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full border border-line-soft bg-surface px-1 text-xs shadow-sm"
                >
                  {r.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs text-muted ${isOutbound ? "justify-end" : ""}`}>
          {/* LYD-61: la hora va en el pie de todos los mensajes, tambien los
              salientes sin senderName (enviados desde el telefono, etc.) */}
          <span>{formatMessageTime(message.sentAt)}</span>
          {isOutbound && message.read && (
            <span className="flex items-center gap-0.5 text-brand">
              Leído
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 12 6 17 11 10" />
                <polyline points="9 15 17 6" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {menuPos && (
        <MessageContextMenu
          x={menuPos.x}
          y={menuPos.y}
          copyText={copyableText(message)}
          activeEmoji={myReaction}
          onReply={() => onReply(message)}
          onReact={(emoji) => onReact(message, emoji)}
          onForward={() => setShowForward(true)}
          onDownload={handleDownload}
          onClose={() => setMenuPos(null)}
        />
      )}

      {showForward && (
        <ForwardMessageDialog
          excludeConversationId={conversationId}
          onPick={(targetId) => {
            onForward(message, targetId);
            setShowForward(false);
          }}
          onClose={() => setShowForward(false)}
        />
      )}
    </div>
  );
}
