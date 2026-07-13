import { Siren } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { EmergencyAlert } from "@/lib/db/models/EmergencyAlert";
import { EmergencyList } from "@/components/clinic/EmergencyList";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmergenciesPage() {
  const orgId = (await getCurrentUser())?.orgId ?? null;
  await dbConnect();
  const alerts = toPlain(
    await EmergencyAlert.find({ orgId, status: { $in: ["active", "acknowledged"] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
  );

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600"><Siren size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergencies</h1>
          <p className="text-sm text-muted">Live SOS alerts from students. Not a replacement for national emergency services.</p>
        </div>
      </div>

      <EmergencyList alerts={alerts as never} />
    </div>
  );
}
