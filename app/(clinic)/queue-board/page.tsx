import { ListOrdered } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { QueueBoard } from "@/components/clinic/QueueBoard";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QueueBoardPage() {
  await dbConnect();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const entries = toPlain(
    await QueueEntry.find({ status: { $in: ["waiting", "in_progress"] }, enqueuedAt: { $gte: start, $lt: end } })
      .sort({ number: 1 })
      .lean()
  ).map((e) => ({
    _id: String(e._id),
    number: e.number as number,
    studentName: (e.studentName as string) || "Student",
    reason: (e.reason as string) || "",
    status: e.status as string,
  }));

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><ListOrdered size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue</h1>
          <p className="text-sm text-muted">Today&apos;s live queue. Updates automatically.</p>
        </div>
      </div>

      <QueueBoard entries={entries} />
    </div>
  );
}
