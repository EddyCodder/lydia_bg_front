import { EmptyState } from "@/components/shared/EmptyState";

export default function InboxCorreoPage() {
  return (
    <EmptyState
      title="Inbox de correo"
      description="Todavía no está conectado ningún canal de correo. Esta bandeja va a funcionar igual que el inbox de chat, pero para conversaciones por email."
    />
  );
}
