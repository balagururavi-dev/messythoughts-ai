import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserReferenceDate, getBrowserTimeZone } from "./browser-context";

describe("browser-context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats the local calendar date as YYYY-MM-DD", () => {
    const date = new Date(2026, 9, 12, 15, 30, 0);
    expect(getBrowserReferenceDate(date)).toBe("2026-10-12");
  });

  it("reads the resolved IANA timezone", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      locale: "en-US",
      calendar: "gregory",
      numberingSystem: "latn",
      timeZone: "Asia/Kolkata",
    });

    expect(getBrowserTimeZone()).toBe("Asia/Kolkata");
  });
});
