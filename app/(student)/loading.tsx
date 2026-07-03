export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-44 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-100" />
    </div>
  );
}
