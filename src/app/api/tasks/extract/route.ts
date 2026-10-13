import { NextResponse } from "next/server";
import { extractTasksRequestSchema } from "@/features/tasks/schemas";
import {
  extractTasks,
  GeminiInvalidOutputError,
  GeminiProviderError,
} from "@/features/tasks/services/extract-tasks";
import { GeminiConfigError } from "@/lib/ai/gemini";
import {
  extractRateLimiter,
  getClientRateLimitKey,
} from "@/lib/rate-limit";

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rateKey = getClientRateLimitKey(request);
  const rate = extractRateLimiter.check(rateKey);
  if (!rate.allowed) {
    return jsonError("Too many requests. Try again shortly.", 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = extractTasksRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  if (!isValidIanaTimeZone(parsed.data.timeZone)) {
    return jsonError("Invalid time zone", 400);
  }

  try {
    const result = await extractTasks(parsed.data);
    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": String(rate.remaining),
      },
    });
  } catch (error) {
    // Do not log brain-dump text, API keys, or raw provider payloads.
    if (error instanceof GeminiConfigError) {
      return jsonError("Server configuration error", 500);
    }

    if (
      error instanceof GeminiProviderError ||
      error instanceof GeminiInvalidOutputError
    ) {
      return jsonError("Upstream provider error", 502);
    }

    return jsonError("Internal server error", 500);
  }
}
