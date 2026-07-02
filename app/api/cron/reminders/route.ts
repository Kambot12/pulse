import { dbConnect } from "@/lib/db/connect";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog } from "@/lib/db/models/MedicationLog";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { DoseReminder } from "@/lib/db/models/DoseReminder";
import { doseSlots } from "@/lib/meds/schedule";
import { pushToUserIds } from "@/lib/push";

export const runtime = "nodejs";

/**
 * Fires due medication reminders. Intended to run every ~10–15 min via Vercel Cron.
 * Protected by CRON_SECRET (Authorization: Bearer <secret> or ?secret=). Vercel Cron
 * automatically sends the Authorization header.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const authorized =
      req.headers.get("authorization") === `Bearer ${secret}` ||
      url.searchParams.get("secret") === secret;
    if (!authorized) return new Response("Unauthorized", { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 60_000); // last 15 minutes

  const meds = await Medication.find({
    active: true,
    remindersEnabled: true,
    schedule: { $exists: true, $ne: [] },
  }).lean();

  let sent = 0;
  for (const med of meds) {
    const slots = doseSlots(
      { schedule: med.schedule, startDate: med.startDate, endDate: med.endDate },
      windowStart,
      now
    );
    for (const slot of slots) {
      if (slot.at > now || slot.at < windowStart) continue;
      const slotKey = slot.at.toISOString();

      // dedupe: never remind the same slot twice
      try {
        await DoseReminder.create({ medicationId: med._id, slotKey });
      } catch {
        continue; // unique index → already reminded
      }

      // don't nag if already taken/skipped
      const log = await MedicationLog.findOne({ medicationId: med._id, scheduledFor: slot.at });
      if (log) continue;

      const profile = await StudentProfile.findById(med.studentId).select("userId").lean<{ userId: unknown }>();
      if (!profile?.userId) continue;

      sent += await pushToUserIds([profile.userId], {
        title: "💊 Medication reminder",
        body: `Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ""}.`,
        url: "/medications",
        tag: `med-${med._id}-${slot.time}`,
      });
    }
  }

  return Response.json({ ok: true, sent, checkedMeds: meds.length });
}
