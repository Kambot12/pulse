"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingText = "Please wait…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-primary w-full", className)}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={16} /> {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
