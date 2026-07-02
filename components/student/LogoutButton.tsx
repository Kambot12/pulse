"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={18} />
        {!compact && "Log out"}
      </button>
    </form>
  );
}
