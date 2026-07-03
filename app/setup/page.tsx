import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Logo } from "@/components/Logo";
import { FirstAdminForm } from "@/components/FirstAdminForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  await dbConnect();
  const admins = await User.countDocuments({ role: "admin" });
  if (admins > 0) redirect("/login"); // setup is a one-time bootstrap

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mx-auto mb-8"><Logo size={44} /></div>
      <div className="card animate-fade-up p-7 sm:p-8">
        <FirstAdminForm />
      </div>
      <p className="mt-6 text-center text-xs text-muted">
        This page only works once — after the first admin is created it closes for good.
      </p>
    </div>
  );
}
