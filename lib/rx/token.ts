import crypto from "crypto";

/**
 * Signed, verifiable prescription token — lets a pharmacy scan a student's Rx QR
 * and confirm it's a genuine, unaltered clinic prescription (anti-forgery),
 * without any login. Same HMAC scheme as the health passport.
 */
const SECRET = process.env.PASSPORT_SECRET || "dev-passport-secret-change-me";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

interface RxPayload { mid: string; iat: number; exp: number }

const b64url = (input: string) => Buffer.from(input).toString("base64url");
const sign = (data: string) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

export function issueRxToken(medicationId: string, ttlMs = DEFAULT_TTL_MS): string {
  const now = Date.now();
  const encoded = b64url(JSON.stringify({ mid: medicationId, iat: now, exp: now + ttlMs }));
  return `${encoded}.${sign(encoded)}`;
}

export type RxVerify =
  | { ok: true; medicationId: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyRxToken(token: string): RxVerify {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [encoded, sig] = parts;

  const expected = sign(encoded);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: RxPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (Date.now() > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, medicationId: payload.mid };
}
