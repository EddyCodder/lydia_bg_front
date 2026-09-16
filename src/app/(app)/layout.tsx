import { NavRail } from "@/components/NavRail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-ink">
      <NavRail />
      {children}
    </div>
  );
}
