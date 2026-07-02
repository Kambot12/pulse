import Image from "next/image";
import QRCode from "qrcode";
import { Pill, History, TrendingUp, Utensils, QrCode } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog } from "@/lib/db/models/MedicationLog";
import { MedicationSchedule, type Dose } from "@/components/student/MedicationSchedule";
import { AddMedicationForm } from "@/components/student/AddMedicationForm";
import { StopMedicationButton } from "@/components/student/StopMedicationButton";
import { ReminderOptIn } from "@/components/student/ReminderOptIn";
import { courseProgress, frequencyLabel, todayISO } from "@/lib/meds/schedule";
import { issueRxToken } from "@/lib/rx/token";
import { getBaseUrl } from "@/lib/base-url";
import { toPlain } from "@/lib/utils";

const fmt = (d: string | Date) => new Date(d).toTimeString().slice(0, 5);
const WITH_FOOD_LABEL: Record<string, string> = {
  before: "Before food", after: "After food", with: "With food", any: "Any time",
};

export default async function MedicationsPage() {
  const profile = (await getCurrentStudentProfile())!;
  const studentId = profile._id as unknown as string;
  await dbConnect();

  const today = todayISO();
  // Auto-finish courses whose end date has passed.
  await Medication.updateMany(
    { studentId, active: true, endDate: { $ne: null, $lt: today } },
    { active: false }
  );

  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const [activeMeds, allMeds, todayLogs, recentLogs, monthLogs] = await Promise.all([
    Medication.find({ studentId, active: true }).sort({ createdAt: -1 }).lean(),
    Medication.find({ studentId }).lean(),
    MedicationLog.find({ studentId, scheduledFor: { $gte: start, $lt: end } }).lean(),
    MedicationLog.find({ studentId }).sort({ scheduledFor: -1 }).limit(12).lean(),
    MedicationLog.find({ studentId, scheduledFor: { $gte: monthAgo } }).lean(),
  ]);

  const meds = toPlain(activeMeds);
  const logs = toPlain(todayLogs);
  const history = toPlain(recentLogs);
  const nameById = new Map(toPlain(allMeds).map((m) => [String(m._id), m.name]));

  // Verifiable pharmacy QR for clinic-issued prescriptions.
  const base = await getBaseUrl();
  const rxQrById: Record<string, string> = {};
  for (const med of meds) {
    if (med.source === "clinic") {
      const token = issueRxToken(String(med._id));
      rxQrById[String(med._id)] = await QRCode.toDataURL(`${base}/rx/${encodeURIComponent(token)}`, { width: 320, margin: 1 });
    }
  }

  const doses: Dose[] = [];
  for (const med of meds) {
    const times = (med.schedule && med.schedule.length ? med.schedule : ["as-needed"]) as string[];
    for (const time of times) {
      const log = logs.find(
        (l) => String(l.medicationId) === String(med._id) &&
          (time === "as-needed" ? false : fmt(l.scheduledFor as string) === time)
      );
      doses.push({
        medicationId: String(med._id), medName: med.name, dosage: med.dosage ?? "",
        time, status: (log?.status as Dose["status"]) ?? "pending",
      });
    }
  }

  const scheduled = monthLogs.length;
  const taken = monthLogs.filter((l) => l.status === "taken").length;
  const adherence = scheduled > 0 ? Math.round((taken / scheduled) * 100) : null;

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
        <p className="text-sm text-muted">Smart courses that schedule and remind you automatically.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted"><Pill size={16} /> Active courses</div>
          <p className="mt-1 text-2xl font-extrabold">{meds.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted"><TrendingUp size={16} /> 30-day adherence</div>
          <p className="mt-1 text-2xl font-extrabold brand-text">{adherence === null ? "—" : `${adherence}%`}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted"><History size={16} /> Doses today</div>
          <p className="mt-1 text-2xl font-extrabold">{doses.length}</p>
        </div>
      </div>

      <ReminderOptIn />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Today&apos;s schedule</h2>
        <MedicationSchedule doses={doses} />
      </section>

      {meds.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Active courses</h2>
          <div className="space-y-2">
            {meds.map((med) => {
              const course = courseProgress(String(med.startDate ?? today), (med.endDate as string) ?? null);
              return (
                <div key={String(med._id)} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{med.name} {med.dosage ? <span className="font-normal text-muted">· {med.dosage}</span> : null}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
                        <span>{frequencyLabel(med.frequencyKey as string)}</span>
                        {med.schedule?.length ? <span>· {med.schedule.join(", ")}</span> : null}
                        <span className="inline-flex items-center gap-1"><Utensils size={12} /> {WITH_FOOD_LABEL[(med.withFood as string) ?? "any"]}</span>
                      </p>
                    </div>
                    <StopMedicationButton id={String(med._id)} />
                  </div>

                  {course.totalDays ? (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs font-medium text-muted">
                        <span>Day {course.dayNumber} of {course.totalDays}</span>
                        <span>{course.percentElapsed}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div className="brand-gradient h-full rounded-full" style={{ width: `${course.percentElapsed}%` }} />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Ongoing — no end date set.</p>
                  )}

                  {med.source === "clinic" && (
                    <p className="mt-2 text-xs text-muted">Prescribed by {med.prescribedByName || "the clinic"}</p>
                  )}
                  {rxQrById[String(med._id)] && (
                    <details className="mt-3 rounded-xl bg-slate-50 p-3">
                      <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-ink">
                        <QrCode size={14} /> Show pharmacy code
                      </summary>
                      <div className="mt-3 grid place-items-center">
                        <Image src={rxQrById[String(med._id)]} alt="Verifiable prescription QR" width={180} height={180} className="rounded-lg" unoptimized />
                        <p className="mt-2 text-center text-xs text-muted">Let the pharmacy scan this to verify your prescription.</p>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <AddMedicationForm
        allergies={profile.allergies ?? []}
        conditions={profile.medicalConditions ?? []}
        currentMedNames={meds.map((m) => m.name)}
        genotype={profile.genotype ?? undefined}
        age={profile.age ?? undefined}
      />

      <section className="card p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted"><History size={16} /> Reminder history</p>
        {history.length ? (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={String(h._id)} className="flex items-center justify-between text-sm">
                <span className="font-medium">{nameById.get(String(h.medicationId)) ?? "Medication"}</span>
                <span className="flex items-center gap-3 text-muted">
                  <span>{new Date(h.scheduledFor as string).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`pill ${h.status === "taken" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>{h.status}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No doses logged yet.</p>
        )}
      </section>
    </div>
  );
}
