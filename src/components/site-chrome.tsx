import type { ReactNode } from "react";
import { MessyThoughtsMark } from "@/components/brand/messythoughts-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const AUTHOR_NAME = "Balaguru Ravi";
const PORTFOLIO_URL = "https://www.balagururavi.com";

type SiteChromeProps = {
  children: ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:m-0 focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-xl focus:bg-violet focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-[var(--mt-nav)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-violet/10 text-violet ring-1 ring-violet/20">
              <MessyThoughtsMark className="size-7" />
            </span>
            <p className="truncate font-display text-base font-semibold tracking-tight text-ink">
              MessyThoughts
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div id="main-content">{children}</div>

      <footer className="mt-auto border-t border-border bg-surface/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <p className="max-w-3xl leading-6">
            Built with Gemini AI — Turns unstructured thoughts into structured task
            suggestions, validated and reviewed by the user before saving.
          </p>
          <p>
            Built by{" "}
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-focus-ring font-semibold text-violet-deep underline decoration-violet/30 underline-offset-4 transition hover:decoration-violet"
            >
              {AUTHOR_NAME}
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
