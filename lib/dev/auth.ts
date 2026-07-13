import crypto from "crypto";

/**
 * Developer credentials. Env-based (NOT in the database) so the developer can
 * always log in — even against a freshly wiped DB. The Auth.js Credentials
 * provider (lib/auth/auth.ts) recognizes these and issues a `developer` session;
 * there is never a developer row in the DB.
 */
export function devEmail(): string {
  return (process.env.DEV_EMAIL || "developer12@gmail.com").toLowerCase().trim();
}
function devPassword(): string {
  return process.env.DEV_PASSWORD || "12345678";
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** True if the submitted email + password match the developer env credentials. */
export function checkDevCredentials(email: string, password: string): boolean {
  return timingSafeEqual(email.toLowerCase().trim(), devEmail()) && timingSafeEqual(password, devPassword());
}
