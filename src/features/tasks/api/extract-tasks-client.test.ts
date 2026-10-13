import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExtractTasksClientError,
  requestTaskExtraction,
} from "./extract-tasks-client";

describe("requestTaskExtraction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts validated payload and parses suggestions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            title: "Buy milk",
            description: "",
            priority: null,
            dueDate: null,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestTaskExtraction({
      text: "buy milk",
      referenceDate: "2026-10-12",
      timeZone: "UTC",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "buy milk",
        referenceDate: "2026-10-12",
        timeZone: "UTC",
      }),
    });
    expect(result.suggestions).toHaveLength(1);
  });

  it("rejects empty text before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestTaskExtraction({
        text: "   ",
        referenceDate: "2026-10-12",
        timeZone: "UTC",
      }),
    ).rejects.toBeInstanceOf(ExtractTasksClientError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces API error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: "Upstream provider error" }),
      }),
    );

    await expect(
      requestTaskExtraction({
        text: "buy milk",
        referenceDate: "2026-10-12",
        timeZone: "UTC",
      }),
    ).rejects.toMatchObject({
      message: "Upstream provider error",
      status: 502,
    });
  });

  it("maps network failures to a client error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      requestTaskExtraction({
        text: "buy milk",
        referenceDate: "2026-10-12",
        timeZone: "UTC",
      }),
    ).rejects.toMatchObject({
      message: "Network error. Check your connection and try again.",
    });
  });
});
