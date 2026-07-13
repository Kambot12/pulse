import "server-only";
import { dbConnect } from "@/lib/db/connect";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog } from "@/lib/db/models/MedicationLog";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { DoseReminder } from "@/lib/db/models/DoseReminder";
import { doseSlots } from "@/lib/meds/schedule";
import { pushToUserIds } from "@/lib/push";

export interface ReminderRunResult {
  ok: boolean;
  sent: number;
  checkedMeds: number;
}

/**
 * Finds medication dose slots due in the last 15 minutes that haven't been
 * reminded/taken/skipped and sends a web-push for each. Deduped via DoseReminder's
 * unique index. Shared by the cron route and the developer console.
 */
export async function runDueReminders(): Promise<ReminderRunResult> {
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
        await DoseReminder.create({ orgId: med.orgId, medicationId: med._id, slotKey });
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

  return { ok: true, sent, checkedMeds: meds.length };
}
