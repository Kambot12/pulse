import "server-only";

/**
 * SMS provider stub. Wire Termii / Africa's Talking here when credentials exist.
 * Until then it logs the message and reports `skipped` so callers can proceed.
 */
export interface SmsResult {
  ok: boolean;
  provider: string;
  skipped?: boolean;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const apiKey = process.env.TERMII_API_KEY || process.env.AT_API_KEY;
  if (!apiKey) {
    console.log(`[SMS stub] → ${to}: ${body}`);
    return { ok: false, provider: "none", skipped: true };
  }
  // TODO: POST to Termii / Africa's Talking with `to`, `body`, sender id.
  console.log(`[SMS] provider configured but not yet wired → ${to}: ${body}`);
  return { ok: false, provider: "termii", skipped: true };
}
