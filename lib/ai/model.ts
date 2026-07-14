import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Gemini via Google's Generative AI API (direct provider — NOT the Vercel AI
 * Gateway). One place to configure the model so the assistant, journal summaries
 * and wellness tips stay in sync. When no key is set, callers fall back to the
 * safe rules-based engine.
 */
export const DEFAULT_AI_MODEL = "gemini-flash-latest";

export function aiEnabled(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
}

export function aiModelName(): string {
  return process.env.AI_MODEL || DEFAULT_AI_MODEL;
}

export function aiModel() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
  return google(aiModelName());
}
