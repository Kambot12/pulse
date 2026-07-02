"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2, WifiOff, Sparkles } from "lucide-react";
import { STARTER_QUESTIONS } from "@/lib/ai/prompts";

interface Msg { role: "user" | "assistant"; content: string }

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (offline) {
      setMessages((m) => [...m, { role: "user", content }, { role: "assistant", content: "You're offline right now. The assistant needs internet — but your passport, meds and records still work offline." }]);
      setInput("");
      return;
    }

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("bad response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { role: "assistant", content: acc }; return copy; });
      }
    } catch {
      setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { role: "assistant", content: "Sorry — I couldn't reach the assistant just now. Please try again, or book an appointment if it's urgent." }; return copy; });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col md:h-[calc(100dvh-8rem)]">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md py-8 text-center">
            <div className="brand-gradient mx-auto mb-3 grid size-14 place-items-center rounded-2xl text-white"><Sparkles size={26} /></div>
            <h2 className="text-lg font-bold">Ask Pulse anything about your health</h2>
            <p className="mt-1 text-sm text-muted">Educational answers only — I never diagnose or prescribe. For anything personal, I&apos;ll point you to the clinic.</p>
            <div className="mt-5 grid gap-2 text-left">
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} className="card p-3 text-sm transition hover:border-brand/40">{q}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`grid size-8 shrink-0 place-items-center rounded-full ${m.role === "user" ? "bg-slate-200 text-slate-600" : "brand-gradient text-white"}`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-brand text-white" : "card"}`}>
                {m.content || <Loader2 className="animate-spin text-muted" size={16} />}
              </div>
            </div>
          ))
        )}
      </div>

      {offline && (
        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-amber-600"><WifiOff size={13} /> Offline — the assistant needs internet</p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-line pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a health question…"
          className="input"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary px-4">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted">Pulse gives general info, not medical diagnosis. Always confirm with a clinician.</p>
    </div>
  );
}
