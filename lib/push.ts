import "server-only";
import webpush from "web-push";
import { dbConnect } from "@/lib/db/connect";
import { PushSubscription } from "@/lib/db/models/PushSubscription";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@pulse.dev";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  urgent?: boolean;
}

interface SubLike {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function deliver(sub: SubLike, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // Subscription expired/removed — clean it up.
    if (status === 404 || status === 410) {
      await PushSubscription.deleteOne({ endpoint: sub.endpoint });
    }
    return false;
  }
}

async function sendToQuery(query: Record<string, unknown>, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  await dbConnect();
  const subs = await PushSubscription.find(query).lean<SubLike[]>();
  let sent = 0;
  for (const sub of subs) if (await deliver(sub, payload)) sent++;
  return sent;
}

export function pushToUserIds(userIds: (string | unknown)[], payload: PushPayload) {
  return sendToQuery({ userId: { $in: userIds } }, payload);
}

export function pushToRoles(roles: string[], payload: PushPayload) {
  return sendToQuery({ role: { $in: roles } }, payload);
}
