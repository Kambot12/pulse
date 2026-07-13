// DANGER: deletes every document in every collection of the target database.
//
//   node scripts/wipe.mjs                 # wipes MONGODB_URI from .env.local (local)
//   MONGODB_URI="mongodb+srv://…" node scripts/wipe.mjs   # wipes a specific DB (e.g. prod)
//
// After wiping, recreate the platform super-admin at /setup. The /dev console
// login is env-based, so it keeps working against the empty database.
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* rely on real env */ }
}
loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "pulse";
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

const host = uri.includes("@") ? uri.split("@")[1].split("/")[0] : uri;
console.log(`About to WIPE ALL DATA in db "${dbName}" @ ${host}`);

// Require an interactive "yes" unless --yes is passed.
if (!process.argv.includes("--yes")) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question('Type "wipe" to confirm: ', res));
  rl.close();
  if (String(answer).trim() !== "wipe") { console.log("Aborted."); process.exit(0); }
}

await mongoose.connect(uri, { dbName });
const db = mongoose.connection.db;
const cols = await db.collections();
let cleared = 0;
for (const c of cols) {
  const res = await c.deleteMany({});
  cleared += res.deletedCount ?? 0;
  console.log(`  ${c.collectionName}: removed ${res.deletedCount ?? 0}`);
}
await mongoose.disconnect();
console.log(`Done. Wiped ${cleared} document(s) across ${cols.length} collection(s) in "${dbName}".`);
