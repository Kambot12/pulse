import "server-only";

/**
 * Email provider. Sends via Resend when RESEND_API_KEY is set; otherwise logs the
 * message server-side and reports `skipped` so callers still succeed (mirrors the
 * SMS stub). Set EMAIL_FROM to a verified sender once your domain is configured;
 * until then Resend's onboarding@resend.dev only delivers to your own account email.
 */
export interface EmailResult {
  ok: boolean;
  provider: string;
  skipped?: boolean;
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Pulse <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email stub] → ${to}: ${subject}\n${text}`);
    return { ok: false, provider: "none", skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
      return { ok: false, provider: "resend" };
    }
    return { ok: true, provider: "resend" };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, provider: "resend" };
  }
}
