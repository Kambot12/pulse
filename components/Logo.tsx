import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, withText = true, className, logoDataUri, label = "Pulse" }: {
  size?: number;
  withText?: boolean;
  className?: string;
  logoDataUri?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {logoDataUri ? (
        // Institution logo (data URI — offline/CSP-safe).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoDataUri} alt={label} className="rounded-2xl object-contain shadow-md" style={{ width: size, height: size }} />
      ) : (
        <div
          className="brand-gradient grid place-items-center rounded-2xl text-white shadow-md"
          style={{ width: size, height: size }}
        >
          <Heart size={size * 0.5} fill="currentColor" strokeWidth={0} />
        </div>
      )}
      {withText && (
        <span className="text-xl font-bold tracking-tight text-foreground">{label}</span>
      )}
    </div>
  );
}
