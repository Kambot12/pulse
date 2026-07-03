import Link from "next/link";
import { Logo } from "@/components/Logo";
import { QrCode, Bell, Bot, CalendarClock, ShieldCheck, WifiOff } from "lucide-react";

const features = [
  { icon: QrCode, title: "Digital Health Passport", body: "One QR code holds your records. No more paper cards to lose." },
  { icon: Bell, title: "Medication reminders", body: "Never miss a dose. Take, skip and track your schedule." },
  { icon: CalendarClock, title: "Book & skip the queue", body: "Book appointments and watch your live queue position." },
  { icon: Bot, title: "AI health assistant", body: "Ask health questions and get clear, educational answers." },
  { icon: WifiOff, title: "Works offline", body: "Your passport and records keep working with no signal." },
  { icon: ShieldCheck, title: "Private & secure", body: "Encrypted records, signed QR tokens, full audit trail." },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/clinic" className="btn btn-ghost hidden sm:inline-flex">For clinics</Link>
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/signup" className="btn btn-primary">Get started</Link>
        </nav>
      </header>

      <section className="animate-fade-up py-14 text-center sm:py-20">
        <span className="pill mx-auto mb-5 w-fit text-brand-ink" style={{ background: "#ecfeff" }}>
          🩺 Built for universities across Africa
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Your whole health, <span className="brand-text">in your pocket.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Pulse replaces paper medical cards with one secure digital health passport —
          records, reminders, appointments and an AI assistant that work even offline.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn btn-primary px-6 py-3 text-base">Create your passport</Link>
          <Link href="/login" className="btn btn-ghost px-6 py-3 text-base">I have an account</Link>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink">
              <f.icon size={20} />
            </div>
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Pulse — student healthcare, reimagined.
      </footer>
    </div>
  );
}
