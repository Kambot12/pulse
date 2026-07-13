import "server-only";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Organization } from "@/lib/db/models/Organization";
import { User } from "@/lib/db/models/User";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { Appointment } from "@/lib/db/models/Appointment";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog } from "@/lib/db/models/MedicationLog";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { EmergencyAlert } from "@/lib/db/models/EmergencyAlert";
import { StaffInvite } from "@/lib/db/models/StaffInvite";
import { DoseReminder } from "@/lib/db/models/DoseReminder";
import { PushSubscription } from "@/lib/db/models/PushSubscription";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { PasswordResetToken } from "@/lib/db/models/PasswordResetToken";

export type Status = "ok" | "missing" | "error" | "stub";

export interface Integration { key: string; label: string; status: Status; detail: string }
export interface EnvVar { name: string; set: boolean; required: boolean; group: string }
export interface Count { label: string; value: number }
export interface OrgSummary { name: string; slug: string; active: boolean; students: number; staff: number }
export interface Activity { action: string; actor: string; target: string; at: string }

export interface Diagnostics {
  system: { dbOk: boolean; dbPingMs: number | null; dbName: string; nodeEnv: string; nodeVersion: string; serverTime: string };
  integrations: Integration[];
  env: EnvVar[];
  counts: Count[];
  usersByRole: { role: string; count: number }[];
  orgs: OrgSummary[];
  activity: Activity[];
  totalDocs: number;
}

const has = (v?: string) => !!v && v.trim().length > 0;
const CLINIC_ROLES = ["doctor", "reception", "admin"];

export async function gatherDiagnostics(): Promise<Diagnostics> {
  // --- DB connect + ping latency ---
  let dbOk = false, dbPingMs: number | null = null;
  try {
    await dbConnect();
    const t = Date.now();
    await mongoose.connection.db?.admin().ping();
    dbPingMs = Date.now() - t;
    dbOk = true;
  } catch { dbOk = false; }

  // --- Counts (per collection) ---
  const models: [string, { countDocuments: () => Promise<number> }][] = [
    ["Organizations", Organization], ["Users", User], ["Student profiles", StudentProfile],
    ["Medical records", MedicalRecord], ["Appointments", Appointment], ["Medications", Medication],
    ["Medication logs", MedicationLog], ["Queue entries", QueueEntry], ["Emergencies", EmergencyAlert],
    ["Staff invites", StaffInvite], ["Dose reminders", DoseReminder], ["Push subscriptions", PushSubscription],
    ["Audit logs", AuditLog], ["Reset tokens", PasswordResetToken],
  ];
  const counts: Count[] = [];
  let totalDocs = 0;
  if (dbOk) {
    for (const [label, model] of models) {
      const value = await model.countDocuments().catch(() => 0);
      counts.push({ label, value });
      totalDocs += value;
    }
  }

  // --- Users by role, orgs, recent activity, push count, last cron ---
  let usersByRole: { role: string; count: number }[] = [];
  let orgs: OrgSummary[] = [];
  let activity: Activity[] = [];
  let pushCount = 0;
  let lastReminder = "";
  if (dbOk) {
    const [roleAgg, orgDocs, studentAgg, staffAgg, logs, pc, lastDose] = await Promise.all([
      User.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Organization.find({}).select("name slug active").sort({ createdAt: -1 }).lean<{ _id: unknown; name: string; slug: string; active: boolean }[]>(),
      StudentProfile.aggregate<{ _id: unknown; c: number }>([{ $group: { _id: "$orgId", c: { $sum: 1 } } }]),
      User.aggregate<{ _id: unknown; c: number }>([{ $match: { role: { $in: CLINIC_ROLES } } }, { $group: { _id: "$orgId", c: { $sum: 1 } } }]),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean<{ action: string; actorLabel?: string; targetType?: string; targetId?: string; createdAt: Date }[]>(),
      PushSubscription.countDocuments(),
      DoseReminder.findOne({}).sort({ sentAt: -1 }).select("sentAt").lean<{ sentAt?: Date }>(),
    ]);
    usersByRole = roleAgg.map((r) => ({ role: r._id ?? "unknown", count: r.count })).sort((a, b) => b.count - a.count);
    const studentBy = new Map(studentAgg.map((s) => [String(s._id), s.c]));
    const staffBy = new Map(staffAgg.map((s) => [String(s._id), s.c]));
    orgs = orgDocs.map((o) => ({
      name: o.name, slug: o.slug, active: !!o.active,
      students: studentBy.get(String(o._id)) ?? 0, staff: staffBy.get(String(o._id)) ?? 0,
    }));
    activity = logs.map((l) => ({
      action: l.action, actor: l.actorLabel || "system",
      target: [l.targetType, l.targetId].filter(Boolean).join(" "),
      at: new Date(l.createdAt).toISOString(),
    }));
    pushCount = pc;
    lastReminder = lastDose?.sentAt ? new Date(lastDose.sentAt).toLocaleString() : "never";
  }

  // --- Integrations ---
  const smtpOk = has(process.env.SMTP_HOST) && has(process.env.SMTP_USER) && has(process.env.SMTP_PASS);
  const vapidOk = has(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && has(process.env.VAPID_PRIVATE_KEY);
  const aiOk = has(process.env.AI_GATEWAY_API_KEY);
  const smsOk = has(process.env.TERMII_API_KEY) || has(process.env.AT_API_KEY);
  const secretsOk = has(process.env.AUTH_SECRET) && has(process.env.PASSPORT_SECRET);

  const integrations: Integration[] = [
    { key: "db", label: "MongoDB", status: dbOk ? "ok" : "error", detail: dbOk ? `connected · ping ${dbPingMs}ms` : "connection failed" },
    { key: "email", label: "Email (SMTP)", status: smtpOk ? "ok" : "missing", detail: smtpOk ? `SMTP via ${process.env.SMTP_USER}` : "SMTP_* not set — reset links are logged only" },
    { key: "push", label: "Web Push (VAPID)", status: vapidOk ? "ok" : "missing", detail: vapidOk ? `${pushCount} subscription(s)` : "VAPID keys not set" },
    { key: "ai", label: "AI Gateway", status: aiOk ? "ok" : "missing", detail: aiOk ? `model ${process.env.AI_MODEL || "google/gemini-2.5-flash"}` : "no key — rules-based fallback active" },
    { key: "cron", label: "Reminder cron", status: has(process.env.CRON_SECRET) ? "ok" : "missing", detail: has(process.env.CRON_SECRET) ? `secret set · last dose reminder: ${lastReminder}` : "CRON_SECRET not set" },
    { key: "sms", label: "SMS (Termii/AT)", status: smsOk ? "ok" : "stub", detail: smsOk ? "provider key set" : "stubbed (logs only)" },
    { key: "secrets", label: "Core secrets", status: secretsOk ? "ok" : "error", detail: secretsOk ? "AUTH + PASSPORT set" : "missing AUTH_SECRET/PASSPORT_SECRET" },
  ];

  // --- Env audit (names only, never values) ---
  const envGroups: [string, string, boolean][] = [
    ["Core", "MONGODB_URI", true], ["Core", "MONGODB_DB", true], ["Core", "AUTH_SECRET", true],
    ["Core", "PASSPORT_SECRET", true], ["Core", "NEXT_PUBLIC_APP_URL", true], ["Core", "CRON_SECRET", true],
    ["Push", "NEXT_PUBLIC_VAPID_PUBLIC_KEY", false], ["Push", "VAPID_PRIVATE_KEY", false], ["Push", "VAPID_SUBJECT", false],
    ["Email", "SMTP_HOST", false], ["Email", "SMTP_PORT", false], ["Email", "SMTP_USER", false],
    ["Email", "SMTP_PASS", false], ["Email", "EMAIL_FROM", false],
    ["Dev", "DEV_EMAIL", false], ["Dev", "DEV_PASSWORD", false],
    ["Optional", "AI_GATEWAY_API_KEY", false], ["Optional", "AI_MODEL", false], ["Optional", "SETUP_SECRET", false],
    ["Optional", "TERMII_API_KEY", false], ["Optional", "AT_API_KEY", false], ["Optional", "RESEND_API_KEY", false],
  ];
  const env: EnvVar[] = envGroups.map(([group, name, required]) => ({ group, name, required, set: has(process.env[name]) }));

  return {
    system: {
      dbOk, dbPingMs, dbName: process.env.MONGODB_DB || "pulse",
      nodeEnv: process.env.NODE_ENV || "unknown", nodeVersion: process.version,
      serverTime: new Date().toISOString(),
    },
    integrations, env, counts, usersByRole, orgs, activity, totalDocs,
  };
}
