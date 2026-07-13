import Link from "next/link";
import { QrCode, CalendarClock, Pill, Stethoscope, ChevronRight, Bot } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { Appointment } from "@/lib/db/models/Appointment";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog } from "@/lib/db/models/MedicationLog";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { computeHealthScore } from "@/lib/intelligence/healthScore";
import { buildWellnessSignals, greetingForHour, tipOfTheDay } from "@/lib/intelligence/rules";
import { dailyTip } from "@/lib/intelligence/tips";
import { HealthScoreCard } from "@/components/student/HealthScoreCard";
import { OfflineCache } from "@/components/student/OfflineCache";
import { EmergencyCacheWriter } from "@/components/student/EmergencyCacheWriter";
import { EmergencySOS } from "@/components/student/EmergencySOS";
import { toPlain } from "@/lib/utils";

async function getData(profileId: string) {
  await dbConnect();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const [nextAppt, activeMeds, recentVisits, doseLogs] = await Promise.all([
    Appointment.findOne({
      studentId: profileId,
      status: { $in: ["pending", "approved"] },
    }).sort({ date: 1 }).lean(),
    Medication.find({ studentId: profileId, active: true }).lean(),
    MedicalRecord.find({ studentId: profileId }).sort({ createdAt: -1 }).limit(3).lean(),
    MedicationLog.find({ studentId: profileId, scheduledFor: { $gte: monthAgo } }).lean(),
  ]);

  const scheduled = doseLogs.length;
  const taken = doseLogs.filter((d) => d.status === "taken").length;
  const adherenceRate = scheduled > 0 ? taken / scheduled : undefined;

  const lastVisit = recentVisits[0]?.createdAt as Date | undefined;
  const daysSinceLastVisit = lastVisit
    ? Math.floor((now.getTime() - new Date(lastVisit).getTime()) / 86_400_000)
    : null;

  return {
    nextAppt: nextAppt ? toPlain(nextAppt) : null,
    activeMeds: toPlain(activeMeds),
    recentVisits: toPlain(recentVisits),
    adherenceRate,
    daysSinceLastVisit,
  };
}

export default async function DashboardPage() {
  const profile = (await getCurrentStudentProfile())!;
  const data = await getData(profile._id as unknown as string);
  const hour = new Date().getHours();

  const health = computeHealthScore({
    adherenceRate: data.adherenceRate,
    activeConditions: profile.medicalConditions?.length ?? 0,
    upcomingAppointment: !!data.nextAppt,
    daysSinceLastVisit: data.daysSinceLastVisit,
  });

  const signals = buildWellnessSignals({
    medicalConditions: profile.medicalConditions,
    genotype: profile.genotype ?? undefined,
    hour,
  });

  const firstName = profile.name.split(" ")[0];
  const nextMed = data.activeMeds[0];
  const tip = dailyTip({
    conditions: profile.medicalConditions,
    genotype: profile.genotype ?? undefined,
    adherencePct: data.adherenceRate != null ? Math.round(data.adherenceRate * 100) : undefined,
  });

  const toneClass: Record<string, string> = {
    info: "border-sky-100 bg-sky-50 text-sky-700",
    warn: "border-amber-100 bg-amber-50 text-amber-700",
    ok: "border-emerald-100 bg-emerald-50 text-emerald-700",
    danger: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* persist the emergency card for offline Emergency Mode */}
      <EmergencyCacheWriter
        data={{
          name: profile.name,
          matricNumber: profile.matricNumber,
          bloodGroup: profile.bloodGroup ?? undefined,
          genotype: profile.genotype ?? undefined,
          age: profile.age ?? undefined,
          allergies: profile.allergies ?? [],
          medicalConditions: profile.medicalConditions ?? [],
          currentMedication: profile.currentMedication ?? [],
          emergencyContact: profile.emergencyContact
            ? {
                name: profile.emergencyContact.name,
                phone: profile.emergencyContact.phone,
                relationship: profile.emergencyContact.relationship,
              }
            : undefined,
        }}
      />

      {/* persist a snapshot for offline use */}
      <OfflineCache
        snapshot={{
          name: profile.name,
          healthScore: health.score,
          band: health.band,
          nextAppt: data.nextAppt,
          signals,
          tip: tipOfTheDay(),
          updatedAt: Date.now(),
        }}
      />

      <div>
        <p className="text-sm text-muted">{greetingForHour(hour)},</p>
        <h1 className="text-2xl font-bold tracking-tight">{firstName} 👋</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HealthScoreCard score={health.score} band={health.band} factors={health.factors} />

        {/* Today's status / next appointment */}
        <Link href="/appointments" className="card flex flex-col justify-between p-5 transition hover:border-brand/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <CalendarClock size={16} /> Upcoming appointment
          </div>
          {data.nextAppt ? (
            <div className="mt-3">
              <p className="text-lg font-bold">{data.nextAppt.reason}</p>
              <p className="text-sm text-muted">
                {data.nextAppt.date} · {data.nextAppt.time} · <span className="capitalize">{data.nextAppt.status}</span>
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-muted">No upcoming appointments.</p>
              <span className="mt-2 inline-block text-sm font-medium text-brand-ink">Book one soon →</span>
            </div>
          )}
        </Link>
      </div>

      {/* Passport quick action */}
      <Link href="/passport" className="card brand-gradient flex items-center justify-between p-5 text-white transition hover:brightness-105">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/20"><QrCode size={22} /></div>
          <div>
            <p className="font-semibold">Digital Health Passport</p>
            <p className="text-sm text-white/80">Show your QR at the clinic — no paper card needed</p>
          </div>
        </div>
        <ChevronRight />
      </Link>

      {/* Feeling unwell + Emergency SOS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/assistant" className="card flex items-center gap-3 p-5 transition hover:border-brand/40">
          <div className="grid size-11 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><Bot size={22} /></div>
          <div>
            <p className="font-semibold">Ask the health assistant</p>
            <p className="text-sm text-muted">Educational answers, anytime</p>
          </div>
        </Link>
        <Link href="/symptoms" className="card flex items-center gap-3 p-5 transition hover:border-brand/40">
          <div className="grid size-11 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><Stethoscope size={22} /></div>
          <div>
            <p className="font-semibold">Not feeling well?</p>
            <p className="text-sm text-muted">Check your symptoms and get guidance</p>
          </div>
        </Link>
        <EmergencySOS
          emergencyContact={
            profile.emergencyContact?.phone
              ? { name: profile.emergencyContact.name, phone: profile.emergencyContact.phone }
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Medication reminder */}
        <Link href="/medications" className="card block p-5 transition hover:border-brand/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Pill size={16} /> Medication
          </div>
          {nextMed ? (
            <div className="mt-3">
              <p className="font-bold">{nextMed.name}</p>
              <p className="text-sm text-muted">{nextMed.dosage} · {nextMed.schedule?.join(", ") || "as scheduled"}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No active medication. Tap to add one 💊</p>
          )}
        </Link>

        {/* Recent visits */}
        <Link href="/timeline" className="card block p-5 transition hover:border-brand/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Stethoscope size={16} /> Recent visits
          </div>
          {data.recentVisits.length ? (
            <ul className="mt-3 space-y-2">
              {data.recentVisits.map((v) => (
                <li key={v._id as string} className="flex justify-between text-sm">
                  <span className="font-medium">{v.title}</span>
                  <span className="text-muted">{new Date(v.createdAt as string).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No visits recorded yet.</p>
          )}
        </Link>
      </div>

      {/* Wellness signals (rules engine) */}
      <div className="grid gap-3 sm:grid-cols-2">
        {signals.map((s) => (
          <div key={s.id} className={`rounded-2xl border p-4 ${toneClass[s.tone]}`}>
            <p className="font-semibold">{s.icon} {s.title}</p>
            <p className="mt-1 text-sm opacity-90">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Personalized wellness tip */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-muted">💡 {tip.title}</p>
        <p className="mt-1">{tip.body}</p>
      </div>
    </div>
  );
}
