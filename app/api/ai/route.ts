import { streamText } from "ai";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { buildSystemPrompt, fallbackReply } from "@/lib/ai/prompts";
import { assessSymptoms } from "@/lib/intelligence/triage";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatMessage { role: "user" | "assistant" | "system"; content: string }

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { messages } = (await req.json().catch(() => ({}))) as { messages?: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad request", { status: 400 });
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  await dbConnect();
  const profile = await StudentProfile.findOne({ userId: session.user.id })
    .select("name age genotype medicalConditions allergies")
    .lean<{ name: string; age?: number; genotype?: string; medicalConditions?: string[]; allergies?: string[] }>();

  // No AI key → rules-based guidance (still safe + useful).
  if (!process.env.AI_GATEWAY_API_KEY) {
    const triage = assessSymptoms({ text: String(lastUser) });
    return new Response(fallbackReply(String(lastUser), triage), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const system = buildSystemPrompt({
    name: profile?.name,
    age: profile?.age,
    genotype: profile?.genotype,
    conditions: profile?.medicalConditions,
    allergies: profile?.allergies,
  });

  try {
    const result = streamText({
      model: process.env.AI_MODEL || "google/gemini-2.5-flash",
      system,
      messages: messages.filter((m) => m.role === "user" || m.role === "assistant"),
      temperature: 0.4,
    });
    return result.toTextStreamResponse();
  } catch {
    const triage = assessSymptoms({ text: String(lastUser) });
    return new Response(fallbackReply(String(lastUser), triage), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
