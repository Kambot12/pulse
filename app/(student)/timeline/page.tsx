import { Stethoscope, FlaskConical, Pill, Syringe, FileText } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { toPlain } from "@/lib/utils";

const ICON: Record<string, React.ReactNode> = {
  visit: <Stethoscope size={16} />,
  labResult: <FlaskConical size={16} />,
  prescription: <Pill size={16} />,
  vaccination: <Syringe size={16} />,
  note: <FileText size={16} />,
};

export default async function TimelinePage() {
  const profile = (await getCurrentStudentProfile())!;
  await dbConnect();
  const records = toPlain(
    await MedicalRecord.find({ studentId: profile._id }).sort({ createdAt: -1 }).lean()
  );

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medical timeline</h1>
        <p className="text-sm text-muted">Every visit, test and prescription in one place.</p>
      </div>

      {records.length ? (
        <ol className="relative ml-3 space-y-6 border-l-2 border-line pl-6">
          {records.map((r) => (
            <li key={r._id as string} className="relative">
              <span className="absolute -left-[35px] grid size-6 place-items-center rounded-full bg-[#ecfeff] text-brand-ink">
                {ICON[r.type as string] ?? <FileText size={16} />}
              </span>
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.title}</p>
                  <span className="pill bg-slate-100 capitalize text-muted">{r.type}</span>
                </div>
                {r.details ? <p className="mt-1 text-sm text-muted">{r.details}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  {new Date(r.createdAt as string).toLocaleDateString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                  {r.doctorName ? ` · ${r.doctorName}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="card grid place-items-center p-10 text-center">
          <FileText className="mb-3 text-muted" />
          <p className="font-medium">No records yet</p>
          <p className="text-sm text-muted">Your visits will appear here after your first clinic check-in.</p>
        </div>
      )}
    </div>
  );
}
