import QRCode from "qrcode";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { issuePassportToken } from "@/lib/passport/token";
import { getBaseUrl } from "@/lib/base-url";
import { PassportView } from "@/components/student/PassportView";

export default async function PassportPage() {
  const profile = (await getCurrentStudentProfile())!;
  const token = issuePassportToken(profile._id as unknown as string);
  const base = await getBaseUrl();
  const verifyUrl = `${base}/verify?token=${encodeURIComponent(token)}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 520,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
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
  );
}
