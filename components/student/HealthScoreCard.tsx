const BAND_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  attention: "Needs attention",
};

export function HealthScoreCard({
  score,
  band,
  factors,
}: {
  score: number;
  band: string;
  factors: string[];
}) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card flex items-center gap-5 p-5">
      <div className="relative shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle cx="56" cy="56" r={radius} fill="none" stroke="#eef2f7" strokeWidth="10" />
          <circle
            cx="56" cy="56" r={radius} fill="none" stroke="url(#pulseGrad)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5a4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-extrabold leading-none">{score}</div>
            <div className="text-[10px] font-medium text-muted">/ 100</div>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">Health score</p>
        <p className="text-lg font-bold brand-text">{BAND_LABEL[band] ?? band}</p>
        <ul className="mt-1 space-y-0.5">
          {factors.slice(0, 2).map((f) => (
            <li key={f} className="truncate text-xs text-muted">• {f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
