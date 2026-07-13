import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentContext } from "@/lib/auth/session";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { LiveQueue, type QueueData } from "@/components/student/LiveQueue";

export const dynamic = "force-dynamic";

const MINUTES_PER_PATIENT = 8;

export default async function QueuePage() {
  const ctx = await getCurrentStudentContext();
  const studentId = ctx?.studentId;
  const orgId = ctx?.orgId ?? null;
  await dbConnect();

  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const mine = await QueueEntry.findOne({
    studentId, status: { $in: ["waiting", "in_progress"] }, enqueuedAt: { $gte: start, $lt: end },
  }).lean<{ number: number; status: string }>();

  let data: QueueData;
  if (!mine) {
    data = { state: "none" };
  } else if (mine.status === "in_progress") {
    data = { state: "serving", number: mine.number };
  } else {
    const ahead = await QueueEntry.countDocuments({
      orgId,
      status: { $in: ["waiting", "in_progress"] },
      enqueuedAt: { $gte: start, $lt: end },
      number: { $lt: mine.number },
    });
    data = { state: "waiting", number: mine.number, ahead, etaMin: ahead * MINUTES_PER_PATIENT };
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live queue</h1>
        <p className="text-sm text-muted">See your place in today&apos;s clinic queue in real time.</p>
      </div>
      <LiveQueue data={data} />
    </div>
  );
}
