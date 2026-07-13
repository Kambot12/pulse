import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";

export const runtime = "nodejs";

/** Public lightweight health probe for uptime monitors. No sensitive data. */
export async function GET() {
  let db = false;
  const t = Date.now();
  try {
    await dbConnect();
    await mongoose.connection.db?.admin().ping();
    db = true;
  } catch { /* db down */ }
  return Response.json(
    { ok: db, db, pingMs: db ? Date.now() - t : null, time: new Date().toISOString() },
    { status: db ? 200 : 503 }
  );
}
