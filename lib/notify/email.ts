import "server-only";

/**
 * Email provider with graceful fallback, in priority order:
 *   1. SMTP (e.g. Gmail app password) — SMTP_HOST/SMTP_USER/SMTP_PASS set.
 *      Works to ANY recipient without a verified domain.
 *   2. Resend HTTP API — RESEND_API_KEY set. Needs a verified domain to send to
 *      arbitrary recipients (otherwise test-mode only reaches the account owner).
 *   3. Neither set — logs the message server-side and reports `skipped` so callers
 *      still succeed (mirrors the SMS stub).
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
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, RESEND_API_KEY, EMAIL_FROM } = process.env;

  // 1) SMTP (Gmail, etc.) — no verified domain required.
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      const port = Number(SMTP_PORT || 465);
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465, // 465 = implicit SSL, 587 = STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      // Gmail requires the From to match the authenticated account (a display
      // name is fine); default to it if EMAIL_FROM isn't set.
      const from = EMAIL_FROM || `Pulse <${SMTP_USER}>`;
      await transport.sendMail({ from, to, subject, text, html });
      return { ok: true, provider: "smtp" };
    } catch (err) {
      console.error("[email] SMTP send failed:", err);
      return { ok: false, provider: "smtp" };
    }
  }

  // 2) Resend HTTP API.
  if (RESEND_API_KEY) {
    const from = EMAIL_FROM || "Pulse <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html, text }),
      });
      if (!res.ok) {
        console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
        return { ok: false, provider: "resend" };
      }
      return { ok: true, provider: "resend" };
    } catch (err) {
      console.error("[email] Resend send failed:", err);
      return { ok: false, provider: "resend" };
    }
  }

  // 3) No provider configured.
  console.log(`[email stub] → ${to}: ${subject}\n${text}`);
  return { ok: false, provider: "none", skipped: true };
}
