"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  persistTheme,
  readDomTheme,
  readStoredTheme,
  resolveTheme,
  type ThemeMode,
} from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const next = resolveTheme(readStoredTheme());
      applyTheme(next);
      setTheme(next);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next: ThemeMode = readDomTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    persistTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="mt-focus-ring inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-ink transition hover:border-violet/40 hover:bg-lavender-soft"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
    >
      <span className="text-base leading-none" aria-hidden>
        {theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
