import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { PushSubscription } from "@/lib/db/models/PushSubscription";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { subscription } = await req.json().catch(() => ({}));
  if (!subscription?.endpoint || !subscription?.keys) {
    return new Response("Bad request", { status: 400 });
  }

  await dbConnect();
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      orgId: session.user.orgId ?? undefined,
      userId: session.user.id,
      role: session.user.role,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: req.headers.get("user-agent") ?? "",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json().catch(() => ({}));
  if (!endpoint) return new Response("Bad request", { status: 400 });
  await dbConnect();
  await PushSubscription.deleteOne({ endpoint });
  return Response.json({ ok: true });
}
