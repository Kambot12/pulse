# Pulse

An AI-powered, **offline-first** digital healthcare platform for universities. Pulse replaces
paper medical cards with one secure digital **Health Passport** per student and connects students
to their university clinic.

> Built with Next.js (App Router) · TypeScript · Tailwind · MongoDB · Auth.js · Serwist (PWA).
> See [`../Pulse-Plan.pdf`](../Pulse-Plan.pdf) for the full product & technical plan.

## What works today (Phase 1 — MVP vertical slice)

- **Auth** — sign up, log in, forgot-password UI (Auth.js credentials, role-based).
- **Onboarding** — multi-step profile (identity, vitals, medical history, emergency contact).
- **Student dashboard** — greeting, health score (computed), wellness signals (rules engine),
  upcoming appointment, medication + recent visits, health tip.
- **Digital Health Passport** — a signed, time-limited QR. A clinic scans it (`/scan`) → the secure
  `/verify` view shows the student's records and **writes an audit log**. Works offline (cached).
- **Clinic** — doctor dashboard + QR scanner, role-gated by middleware.
- **PWA / offline** — installable; dashboard + passport cached in IndexedDB and served offline.

## Getting started

```bash
cp .env.local.example .env.local      # then fill the values
npm install
npm run dev                           # http://localhost:3000
```

### Environment (`.env.local`)

| Key | What |
|---|---|
| `MONGODB_URI` | MongoDB Atlas string, or local `mongodb://127.0.0.1:27017/pulse` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `PASSPORT_SECRET` | `openssl rand -base64 32` — signs the QR tokens |
| `NEXT_PUBLIC_APP_URL` | Base URL used to build the QR verify link |

### Try the full flow

1. **Sign up** → complete **onboarding** → land on the **dashboard**.
2. Open **Passport** → a QR renders.
3. To act as clinic staff, promote your user in Mongo:
   `db.users.updateOne({ email: "you@x.edu" }, { $set: { role: "doctor" } })`, then visit `/scan`
   and scan the QR (or paste the token) → the `/verify` record view opens and logs the access.
4. **Offline test:** build for production, install the PWA, go offline → dashboard + passport still
   render from cache.

## Architecture

```
app/(auth)      login / signup / forgot-password
app/onboarding  multi-step profile setup
app/(student)   dashboard · passport · timeline · profile   (bottom-nav shell)
app/(clinic)    doctor dashboard · scan                       (role-gated)
app/verify      public, token-verified record viewer (audit-logged)
lib/db          Mongoose connection + models
lib/auth        Auth.js config (edge-safe split) + session helpers
lib/intelligence  health score + wellness rules ("thinks rationally")
lib/passport    HMAC-signed QR tokens (offline-verifiable)
lib/offline     Dexie/IndexedDB cache + sync queue
app/sw.ts       Serwist service worker
```

## Roadmap

Phase 2 medication reminders + appointments · Phase 3 full clinic (prescriptions, queue,
analytics) · Phase 4 AI assistant + symptom journal + outbreak radar · Phase 5 hardening + deploy.
