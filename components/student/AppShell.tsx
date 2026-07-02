"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, Activity, User, Pill, CalendarClock, Stethoscope, ListOrdered, Bot, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";
import { cn, initials } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon; primary?: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, primary: true },
  { href: "/medications", label: "Meds", icon: Pill, primary: true },
  { href: "/appointments", label: "Appts", icon: CalendarClock, primary: true },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/symptoms", label: "Symptoms", icon: Stethoscope },
  { href: "/passport", label: "Passport", icon: QrCode, primary: true },
  { href: "/timeline", label: "Timeline", icon: Activity },
  { href: "/profile", label: "Profile", icon: User, primary: true },
];

export function AppShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-line px-4 py-6 md:flex">
        <div className="px-2 pb-4"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive(item.href)
                  ? "bg-[#ecfeff] text-brand-ink"
                  : "text-muted hover:bg-slate-50 hover:text-foreground"
              )}
            >
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="brand-gradient grid size-9 place-items-center rounded-full text-sm font-bold text-white">
              {initials(name)}
            </div>
            <span className="truncate text-sm font-medium">{name}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Logo size={32} />
          <div className="brand-gradient grid size-9 place-items-center rounded-full text-sm font-bold text-white">
            {initials(name)}
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface/95 px-2 py-2 backdrop-blur md:hidden">
          {NAV.filter((i) => i.primary).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition",
                isActive(item.href) ? "text-brand-ink" : "text-muted"
              )}
            >
              <item.icon size={20} /> {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
