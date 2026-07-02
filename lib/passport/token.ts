import crypto from "crypto";

/**
 * Digital Health Passport token.
 *
 * The QR encodes a signed, expiring token — never a raw student id. Format:
 *   base64url(payload).base64url(hmac_sha256(payload, PASSPORT_SECRET))
 *
 * The signature can be verified fully offline by any holder of the secret /
 * public verification key, so a clinic scanner works without a network round-trip.
 */
const SECRET = process.env.PASSPORT_SECRET || "dev-passport-secret-change-me";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface PassportPayload {
  sid: string; // StudentProfile id
  iat: number; // issued at (ms)
  exp: number; // expires at (ms)
  v: number;   // token version (for rotation)
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function issuePassportToken(studentProfileId: string, ttlMs = DEFAULT_TTL_MS): string {
  const now = Date.now();
  const payload: PassportPayload = { sid: studentProfileId, iat: now, exp: now + ttlMs, v: 1 };
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export type VerifyResult =
  | { ok: true; payload: PassportPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyPassportToken(token: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [encoded, sig] = parts;

  const expected = sign(encoded);
  // constant-time comparison
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: PassportPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (Date.now() > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}
