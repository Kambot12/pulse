import { Activity } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/auth/session";
import { SymptomJournal } from "@/lib/db/models/SymptomJournal";
import { SYMPTOM_LABEL } from "@/lib/intelligence/symptoms";
import { JournalForm } from "@/components/student/JournalForm";
import { JournalPatterns } from "@/components/student/JournalPatterns";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEV_TONE: Record<string, string> = {
  mild: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-700",
  severe: "bg-red-50 text-red-600",
};

export default async function JournalPage() {
  const studentId = await getCurrentStudentId();
  await dbConnect();
  const entries = toPlain(
    await SymptomJournal.find({ studentId }).sort({ entryDate: -1 }).limit(30).lean()
  );
  const latestSummary = (entries.find((e) => e.aiSummary)?.aiSummary as string) || "";

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Symptom journal</h1>
        <p className="text-sm text-muted">Track how you feel over time — private to you, and it helps you spot patterns.</p>
      </div>

      <JournalForm />
      <JournalPatterns summary={latestSummary} hasEntries={entries.length > 0} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Recent entries</h2>
        {entries.length ? (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={String(e._id)} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted">{new Date(e.entryDate as string).toLocaleDateString()}</span>
                  <span className={`pill ${SEV_TONE[e.severity as string] ?? ""}`}>{e.severity as string}</span>
                </div>
                <p className="text-sm font-medium">
                  {((e.symptoms as string[]) ?? []).map((s) => SYMPTOM_LABEL[s] ?? s).join(", ") || "—"}
                </p>
                {e.notes ? <p className="mt-0.5 text-sm text-muted">{e.notes as string}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
            <Activity size={22} className="text-muted" />
            No entries yet. Log how you&apos;re feeling above.
          </div>
        )}
      </section>
    </div>
  );
}
