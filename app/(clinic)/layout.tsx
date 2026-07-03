import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanLine, LayoutDashboard, Siren, CalendarCheck, ListOrdered, ClipboardList, BarChart3, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/student/LogoutButton";
import { MustChangePasswordBanner } from "@/components/MustChangePasswordBanner";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "reception", "admin"].includes(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              <Link href="/doctor" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link href="/reception" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <ClipboardList size={16} /> Front desk
              </Link>
              <Link href="/scan" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <ScanLine size={16} /> Scan
              </Link>
              <Link href="/approvals" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <CalendarCheck size={16} /> Appointments
              </Link>
              <Link href="/queue-board" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <ListOrdered size={16} /> Queue
              </Link>
              <Link href="/emergencies" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                <Siren size={16} /> Emergencies
              </Link>
              {user.role === "admin" && (
                <>
                  <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                    <BarChart3 size={16} /> Analytics
                  </Link>
                  <Link href="/admin/staff" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50">
                    <Users size={16} /> Staff
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="pill bg-[#ecfeff] text-brand-ink capitalize">{user.role}</span>
            <LogoutButton compact />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <MustChangePasswordBanner show={user.mustChangePassword} />
        {children}
      </main>
    </div>
  );
}
