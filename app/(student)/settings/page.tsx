import Link from "next/link";
import { UserCog, KeyRound, ChevronRight } from "lucide-react";
import { ReminderOptIn } from "@/components/student/ReminderOptIn";

export default function SettingsPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Manage your account, profile and notifications.</p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Notifications</h2>
        <ReminderOptIn />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Account</h2>
        <div className="space-y-2">
          <Link href="/profile/edit" className="card flex items-center justify-between p-4 transition hover:border-brand/40">
            <span className="flex items-center gap-3"><UserCog size={18} className="text-brand-ink" /> Edit health profile</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
          <Link href="/change-password" className="card flex items-center justify-between p-4 transition hover:border-brand/40">
            <span className="flex items-center gap-3"><KeyRound size={18} className="text-brand-ink" /> Change password</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        </div>
      </section>
    </div>
  );
}
