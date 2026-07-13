import { runDueReminders } from "@/lib/reminders/run";

export const runtime = "nodejs";

/**
 * Fires due medication reminders. Runs every ~15 min, triggered externally by the
 * GitHub Actions workflow at .github/workflows/cron-reminders.yml (moved off Vercel
 * Cron, which only fires once/day on the Hobby plan).
 * Protected by CRON_SECRET (Authorization: Bearer <secret> or ?secret=). The scheduler
 * sends the Authorization header. Core logic lives in lib/reminders/run.ts (shared
 * with the developer console).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const authorized =
      req.headers.get("authorization") === `Bearer ${secret}` ||
      url.searchParams.get("secret") === secret;
    if (!authorized) return new Response("Unauthorized", { status: 401 });
  }

  const result = await runDueReminders();
  return Response.json(result);
}

// GitHub Actions calls this endpoint with POST. Reuse the exact same handler and
// auth check — no business logic changes, just an additional allowed method.
export const POST = GET;
