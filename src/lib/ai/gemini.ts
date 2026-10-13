import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export class GeminiConfigError extends Error {
  readonly code = "GEMINI_CONFIG" as const;

  constructor(message = "Gemini is not configured") {
    super(message);
    this.name = "GeminiConfigError";
  }
}

let client: GoogleGenAI | null = null;

export function getGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured || DEFAULT_MODEL;
}

/**
 * Lazily initializes the server-side Gemini client.
 * Never import this module from client components.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

/** Test helper to clear the cached client between runs. */
export function resetGeminiClientForTests(): void {
  client = null;
}
