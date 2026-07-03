import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/lib/db/models/User";
import { StaffManager } from "@/components/clinic/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/doctor");

  await dbConnect();
  const rows = await User.find({ role: { $in: ["doctor", "reception", "admin"] } })
    .select("name email role")
    .sort({ role: 1, createdAt: 1 })
    .lean<{ _id: unknown; name: string; email: string; role: string }[]>();

  const staff = rows.map((r) => ({ id: String(r._id), name: r.name ?? "", email: r.email, role: r.role }));

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><Users size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff accounts</h1>
          <p className="text-sm text-muted">Create and manage doctor, reception, and admin accounts.</p>
        </div>
      </div>

      <StaffManager staff={staff} selfId={user.id} />
    </div>
  );
}
