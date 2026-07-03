import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { ClinicLoginForm } from "@/components/auth/ClinicLoginForm";

export const dynamic = "force-dynamic";

export default async function ClinicLoginPage() {
  await dbConnect();
  const setupNeeded = (await User.countDocuments({ role: "admin" })) === 0;

  return (
    <div className="space-y-4">
      {setupNeeded && (
        <Link
          href="/setup"
          className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-[#ecfeff] p-4 transition hover:border-brand/50"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-white text-brand-ink"><Building2 size={20} /></div>
            <div>
              <p className="font-semibold text-brand-ink">New here? Set up your clinic</p>
              <p className="text-sm text-muted">No accounts yet — create the first admin to get started.</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-brand-ink" />
        </Link>
      )}
      <ClinicLoginForm />
    </div>
  );
}
