import "server-only";

/**
 * Email sender — SMTP only (Resend is disabled for now).
 *   1. SMTP (e.g. Gmail app password) — SMTP_HOST/SMTP_USER/SMTP_PASS set.
 *      Works to ANY recipient without a verified domain.
 *   2. If SMTP isn't configured — logs the message server-side and reports
 *      `skipped` so callers still succeed (mirrors the SMS stub).
 *
 * The Resend HTTP path is intentionally removed; to re-enable it later, restore
 * the branch from git history (it keyed off RESEND_API_KEY).
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
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, EMAIL_FROM } = process.env;

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

  // 2) SMTP not configured — log and skip (Resend is disabled).
  console.log(`[email stub] → ${to}: ${subject}\n${text}`);
  return { ok: false, provider: "none", skipped: true };
}
