// One-off migration: assign every pre-tenancy document to a single "Default"
// institution so the new required `orgId` fields are satisfied.
//
//   node scripts/backfill-org.mjs
//
// Idempotent: re-running only touches docs that still lack an orgId. The platform
// super-admin (role "superadmin") is intentionally left with no orgId.
import mongoose from "mongoose";
import { readFileSync } from "node:fs";

// Load MONGODB_URI / MONGODB_DB from .env.local without extra deps.
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
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

const TENANT_COLLECTIONS = [
  "studentprofiles", "medicalrecords", "appointments", "medications", "medicationlogs",
  "queueentries", "emergencyalerts", "staffinvites", "dosereminders", "pushsubscriptions", "auditlogs",
];

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "pulse" });
const db = mongoose.connection.db;

// 1) Find or create the Default institution.
const orgs = db.collection("organizations");
let org = await orgs.findOne({ slug: "default" });
if (!org) {
  const doc = {
    name: "Default Institution", slug: "default", joinCode: "DEFAULT",
    theme: { brand: "#0ea5a4", brandInk: "#0b6b6a", accent: "#6366f1", fontKey: "geist" },
    logoDataUri: "", active: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const { insertedId } = await orgs.insertOne(doc);
  org = { _id: insertedId, ...doc };
  console.log("Created Default institution", String(insertedId));
} else {
  console.log("Using existing Default institution", String(org._id));
}
const orgId = org._id;

// 2) Users: everyone except the platform super-admin.
const usersRes = await db.collection("users").updateMany(
  { orgId: { $exists: false }, role: { $ne: "superadmin" } },
  { $set: { orgId } }
);
console.log(`users: assigned ${usersRes.modifiedCount}`);

// 3) All tenant collections.
for (const name of TENANT_COLLECTIONS) {
  const res = await db.collection(name).updateMany(
    { orgId: { $exists: false } },
    { $set: { orgId } }
  );
  console.log(`${name}: assigned ${res.modifiedCount}`);
}

await mongoose.disconnect();
console.log("Backfill complete.");
