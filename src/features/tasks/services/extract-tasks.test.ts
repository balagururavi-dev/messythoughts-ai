import { describe, expect, it, vi } from "vitest";
import { GeminiConfigError } from "@/lib/ai/gemini";
import {
  extractTasks,
  extractionResponseJsonSchema,
  GeminiInvalidOutputError,
  GeminiProviderError,
  parseModelOutput,
  unwrapJsonPayload,
} from "./extract-tasks";

describe("extractTasks", () => {
  const request = {
    text: "Call Mom this weekend",
    referenceDate: "2026-10-12",
    timeZone: "UTC",
  };

  it("requests schema-constrained JSON and parses valid structured output", async () => {
    const create = vi.fn().mockResolvedValue({
      status: "completed",
      output_text: JSON.stringify({
        suggestions: [
          {
            title: "Call Mom",
            description: "Maybe this weekend",
            priority: null,
            dueDate: null,
          },
        ],
      }),
    });

    const result = await extractTasks(request, {
      client: { interactions: { create } },
      model: "mock-model",
    });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]).toMatchObject({
      title: "Call Mom",
      priority: null,
      dueDate: null,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: extractionResponseJsonSchema,
        },
      }),
    );
  });

  it("accepts an empty suggestions array", async () => {
    const result = await extractTasks(request, {
      client: {
        interactions: {
          create: vi.fn().mockResolvedValue({
            status: "completed",
            output_text: JSON.stringify({ suggestions: [] }),
          }),
        },
      },
      model: "mock-model",
    });

    expect(result.suggestions).toEqual([]);
  });

  it("rejects malformed provider JSON", async () => {
    await expect(
      extractTasks(request, {
        client: {
          interactions: {
            create: vi.fn().mockResolvedValue({
              status: "completed",
              output_text: "{not-json",
            }),
          },
        },
        model: "mock-model",
      }),
    ).rejects.toBeInstanceOf(GeminiInvalidOutputError);
  });

  it("rejects empty provider output", async () => {
    await expect(
      extractTasks(request, {
        client: {
          interactions: {
            create: vi.fn().mockResolvedValue({
              status: "completed",
              output_text: "   ",
            }),
          },
        },
        model: "mock-model",
      }),
    ).rejects.toBeInstanceOf(GeminiInvalidOutputError);
  });

  it("rejects incomplete provider interactions", async () => {
    await expect(
      extractTasks(request, {
        client: {
          interactions: {
            create: vi.fn().mockResolvedValue({
              status: "failed",
              output_text: JSON.stringify({ suggestions: [] }),
            }),
          },
        },
        model: "mock-model",
      }),
    ).rejects.toBeInstanceOf(GeminiProviderError);
  });

  it("maps provider transport failures", async () => {
    await expect(
      extractTasks(request, {
        client: {
          interactions: {
            create: vi.fn().mockRejectedValue(new Error("network down")),
          },
        },
        model: "mock-model",
      }),
    ).rejects.toBeInstanceOf(GeminiProviderError);
  });

  it("rethrows Gemini configuration errors", async () => {
    await expect(
      extractTasks(request, {
        client: {
          interactions: {
            create: vi.fn().mockRejectedValue(new GeminiConfigError()),
          },
        },
        model: "mock-model",
      }),
    ).rejects.toBeInstanceOf(GeminiConfigError);
  });
});

describe("parseModelOutput", () => {
  it("unwraps fenced JSON payloads", () => {
    expect(unwrapJsonPayload('```json\n{"suggestions":[]}\n```')).toBe(
      '{"suggestions":[]}',
    );
  });

  it("accepts unambiguous ISO due dates and null for ambiguity", () => {
    expect(
      parseModelOutput(
        JSON.stringify({
          suggestions: [
            {
              title: "Finish slides",
              description: "Before Friday if possible",
              priority: "medium",
              dueDate: "2026-10-16",
            },
            {
              title: "Maybe tidy desk",
              description: "Sometime soon",
              priority: null,
              dueDate: null,
            },
          ],
        }),
      ).suggestions,
    ).toHaveLength(2);
  });

  it("rejects invented priorities and malformed due dates", () => {
    expect(() =>
      parseModelOutput(
        JSON.stringify({
          suggestions: [
            {
              title: "Call Mom",
              description: "",
              priority: "urgent",
              dueDate: null,
            },
          ],
        }),
      ),
    ).toThrow(GeminiInvalidOutputError);

    expect(() =>
      parseModelOutput(
        JSON.stringify({
          suggestions: [
            {
              title: "Call Mom",
              description: "",
              priority: null,
              dueDate: "this weekend",
            },
          ],
        }),
      ),
    ).toThrow(GeminiInvalidOutputError);
  });

  it("rejects oversized suggestion lists and empty titles", () => {
    expect(() =>
      parseModelOutput(
        JSON.stringify({
          suggestions: Array.from({ length: 31 }, (_, index) => ({
            title: `Task ${index + 1}`,
            description: "",
            priority: null,
            dueDate: null,
          })),
        }),
      ),
    ).toThrow(GeminiInvalidOutputError);

    expect(() =>
      parseModelOutput(
        JSON.stringify({
          suggestions: [
            {
              title: "   ",
              description: "",
              priority: null,
              dueDate: null,
            },
          ],
        }),
      ),
    ).toThrow(GeminiInvalidOutputError);
  });

  it("strips unknown fields such as invented ids during Zod parsing", () => {
    const parsed = parseModelOutput(
      JSON.stringify({
        suggestions: [
          {
            title: "Call Mom",
            description: "Maybe this weekend",
            priority: null,
            dueDate: null,
            id: "model-invented-id",
            completed: true,
            createdAt: "2026-10-12T00:00:00.000Z",
          },
        ],
      }),
    );

    expect(parsed.suggestions[0]).toEqual({
      title: "Call Mom",
      description: "Maybe this weekend",
      priority: null,
      dueDate: null,
    });
  });
});
