import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/lib/db/models/User";
import { StaffInvite } from "@/lib/db/models/StaffInvite";
import { StaffManager } from "@/components/clinic/StaffManager";
import { InviteManager } from "@/components/clinic/InviteManager";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "superadmin"].includes(user.role)) redirect("/doctor");
  if (!user.orgId) redirect("/login");
  const orgId = user.orgId;

  await dbConnect();
  const rows = await User.find({ orgId, role: { $in: ["doctor", "reception", "admin"] } })
    .select("name email role")
    .sort({ role: 1, createdAt: 1 })
    .lean<{ _id: unknown; name: string; email: string; role: string }[]>();

  const staff = rows.map((r) => ({ id: String(r._id), name: r.name ?? "", email: r.email, role: r.role }));

  const inviteDocs = toPlain(await StaffInvite.find({ orgId, active: true }).sort({ createdAt: -1 }).limit(20).lean());
  const invites = inviteDocs.map((i) => ({
    id: String(i._id), code: i.code as string, role: i.role as string,
    expiresAt: new Date(i.expiresAt as string).toISOString(), uses: (i.uses as number) ?? 0,
  }));

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><Users size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff accounts</h1>
          <p className="text-sm text-muted">Create and manage doctor, reception, and admin accounts.</p>
        </div>
      </div>

      <InviteManager invites={invites} />
      <StaffManager staff={staff} selfId={user.id} />
    </div>
  );
}
