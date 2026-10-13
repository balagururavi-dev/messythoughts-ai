import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  persistTheme,
  readDomTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme helpers", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.theme;
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it("resolves stored theme over system preference", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("applies and persists theme mode from the document", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(readDomTheme()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    persistTheme("dark");
    expect(readStoredTheme()).toBe("dark");

    applyTheme("light");
    expect(readDomTheme()).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
