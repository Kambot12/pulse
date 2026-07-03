export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-52 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-slate-100" />
    </div>
  );
}
