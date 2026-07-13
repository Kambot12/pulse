import { redirect } from "next/navigation";
import { Building2, Stethoscope } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { Organization } from "@/lib/db/models/Organization";
import { User } from "@/lib/db/models/User";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { LogoutButton } from "@/components/student/LogoutButton";
import { OrgManager, type OrgRow } from "@/components/platform/OrgManager";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CLINIC_ROLES = ["doctor", "reception", "admin"];

export default async function PlatformPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "superadmin") redirect("/login");

  await dbConnect();
  const [orgDocs, studentAgg, staffAgg] = await Promise.all([
    Organization.find({}).sort({ createdAt: -1 }).lean(),
    StudentProfile.aggregate<{ _id: unknown; c: number }>([{ $group: { _id: "$orgId", c: { $sum: 1 } } }]),
    User.aggregate<{ _id: unknown; c: number }>([
      { $match: { role: { $in: CLINIC_ROLES } } },
      { $group: { _id: "$orgId", c: { $sum: 1 } } },
    ]),
  ]);

  const studentBy = new Map(studentAgg.map((s) => [String(s._id), s.c]));
  const staffBy = new Map(staffAgg.map((s) => [String(s._id), s.c]));

  const orgs: OrgRow[] = toPlain(orgDocs).map((o) => ({
    id: String(o._id),
    name: o.name as string,
    slug: o.slug as string,
    joinCode: o.joinCode as string,
    emailDomain: (o.emailDomain as string) ?? "",
    isDefault: Boolean(o.isDefault),
    active: Boolean(o.active),
    theme: {
      brand: (o.theme as { brand?: string })?.brand ?? "#0ea5a4",
      accent: (o.theme as { accent?: string })?.accent ?? "#6366f1",
      fontKey: (o.theme as { fontKey?: string })?.fontKey ?? "geist",
    },
    logoDataUri: (o.logoDataUri as string) ?? "",
    students: studentBy.get(String(o._id)) ?? 0,
    staff: staffBy.get(String(o._id)) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="brand-gradient grid size-10 place-items-center rounded-xl text-white"><Building2 size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform</h1>
            <p className="text-sm text-muted">Provision institutions and manage their branding.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/doctor" className="btn btn-ghost"><Stethoscope size={15} /> Open clinic</a>
          <div className="w-32"><LogoutButton /></div>
        </div>
      </header>

      <OrgManager orgs={orgs} />
    </div>
  );
}
