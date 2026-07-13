import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { gatherDiagnostics } from "@/lib/dev/checks";
import { DevConsole } from "@/components/dev/DevConsole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = { title: "Developer Console — Pulse", robots: { index: false } };

export default async function DevPage() {
  const user = await getCurrentUser();
  if (user?.role !== "developer") redirect("/login");
  const data = await gatherDiagnostics();
  return <DevConsole data={data} />;
}
