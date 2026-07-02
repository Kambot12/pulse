import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, withText = true, className }: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="brand-gradient grid place-items-center rounded-2xl text-white shadow-md"
        style={{ width: size, height: size }}
      >
        <Heart size={size * 0.5} fill="currentColor" strokeWidth={0} />
      </div>
      {withText && (
        <span className="text-xl font-bold tracking-tight text-foreground">Pulse</span>
      )}
    </div>
  );
}
