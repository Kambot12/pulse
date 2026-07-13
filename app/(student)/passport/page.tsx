import QRCode from "qrcode";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { issuePassportToken } from "@/lib/passport/token";
import { getBaseUrl } from "@/lib/base-url";
import { ensureEmergencyCode } from "@/lib/emergency/code";
import { PassportView } from "@/components/student/PassportView";
import { LockScreenSetup } from "@/components/student/LockScreenSetup";

export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const profile = (await getCurrentStudentProfile())!;
  const profileId = profile._id as unknown as string;
  const token = issuePassportToken(profileId);
  const base = await getBaseUrl();
  const verifyUrl = `${base}/verify?token=${encodeURIComponent(token)}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 520,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  // Stable break-glass link for the lock screen (doesn't expire; regenerable).
  const code = await ensureEmergencyCode(profileId);
  const emergencyUrl = `${base}/e/${code}`;
  const emergencyQr = code
    ? await QRCode.toDataURL(emergencyUrl, { width: 520, margin: 1, color: { dark: "#b91c1c", light: "#ffffff" }, errorCorrectionLevel: "M" })
    : "";

  return (
    <div className="space-y-5">
      <PassportView
        qrDataUrl={qrDataUrl}
        critical={{
          name: profile.name,
          matricNumber: profile.matricNumber,
          bloodGroup: profile.bloodGroup ?? "—",
          genotype: profile.genotype ?? "—",
          allergies: profile.allergies ?? [],
          emergencyContact: profile.emergencyContact ?? null,
        }}
      />
      {code ? <LockScreenSetup emergencyUrl={emergencyUrl} emergencyQr={emergencyQr} /> : null}
    </div>
  );
}
