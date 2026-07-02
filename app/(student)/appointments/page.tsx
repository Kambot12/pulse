import { CalendarClock, CalendarX } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/auth/session";
import { Appointment } from "@/lib/db/models/Appointment";
import { BookAppointmentForm } from "@/components/student/BookAppointmentForm";
import { CancelAppointmentButton } from "@/components/student/CancelAppointmentButton";
import { toPlain } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-muted",
  cancelled: "bg-slate-100 text-muted",
};

export default async function AppointmentsPage() {
  const studentId = (await getCurrentStudentId())!;
  await dbConnect();
  const appts = toPlain(
    await Appointment.find({ studentId }).sort({ date: -1, time: -1 }).lean()
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appts.filter(
    (a) => (a.date as string) >= today && ["pending", "approved"].includes(a.status as string)
  );
  const past = appts.filter((a) => !upcoming.includes(a));

  const Card = ({ a, cancellable }: { a: (typeof appts)[number]; cancellable?: boolean }) => (
    <div className="card flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{a.reason}</p>
        <p className="text-sm text-muted">
          {new Date(`${a.date}T${a.time}`).toLocaleString([], {
            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`pill capitalize ${STATUS_STYLE[a.status as string] ?? "bg-slate-100 text-muted"}`}>
          {a.status as string}
        </span>
        {cancellable && <CancelAppointmentButton id={String(a._id)} />}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted">Book a clinic visit and track its status.</p>
      </div>

      <BookAppointmentForm />

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
          <CalendarClock size={16} /> Upcoming
        </h2>
        {upcoming.length ? (
          <div className="space-y-2">
            {upcoming.map((a) => <Card key={String(a._id)} a={a} cancellable />)}
          </div>
        ) : (
          <div className="card grid place-items-center p-8 text-center">
            <CalendarX className="mb-2 text-muted" />
            <p className="text-sm text-muted">No upcoming appointments. Book one above.</p>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Past &amp; cancelled</h2>
          <div className="space-y-2">
            {past.map((a) => <Card key={String(a._id)} a={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
