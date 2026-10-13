"use client";

import type { ExtractedTask, TaskPriority } from "../types";

export type ReviewSuggestion = ExtractedTask & {
  clientId: string;
};

const PRIORITY_OPTIONS: Array<{ value: "" | TaskPriority; label: string }> = [
  { value: "", label: "Unset" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type SuggestionCardProps = {
  suggestion: ReviewSuggestion;
  index: number;
  onChange: (clientId: string, next: ExtractedTask) => void;
  onAccept: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
};

const fieldClassName =
  "mt-focus-ring w-full rounded-xl border border-border bg-surface/90 px-3 py-2 text-sm text-ink transition hover:border-violet/40 focus:border-violet";

export function SuggestionCard({
  suggestion,
  index,
  onChange,
  onAccept,
  onDiscard,
}: SuggestionCardProps) {
  const { clientId, title, description, priority, dueDate } = suggestion;
  const headingId = `suggestion-heading-${clientId}`;

  function update(partial: Partial<ExtractedTask>) {
    onChange(clientId, {
      title,
      description,
      priority,
      dueDate,
      ...partial,
    });
  }

  return (
    <article
      className="mt-animate-in relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-violet/20 bg-gradient-to-br from-lavender-soft/90 via-surface to-surface p-4 ring-1 ring-violet/10 sm:p-5"
      aria-labelledby={headingId}
      data-testid={`suggestion-${clientId}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet via-sky to-mint" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="font-display text-lg font-semibold tracking-tight text-ink">
          Suggestion {index + 1}
        </h3>
        <span className="rounded-full bg-violet/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-deep ring-1 ring-violet/15">
          AI suggestion
        </span>
      </div>

      <p className="text-sm text-muted">
        Review before saving. Tentative wording stays until you change it.
      </p>

      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-muted"
          htmlFor={`title-${clientId}`}
        >
          Title
        </label>
        <input
          id={`title-${clientId}`}
          className={fieldClassName}
          value={title}
          onChange={(event) => update({ title: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-muted"
          htmlFor={`description-${clientId}`}
        >
          Description
        </label>
        <textarea
          id={`description-${clientId}`}
          className={`min-h-20 resize-y ${fieldClassName}`}
          value={description}
          onChange={(event) => update({ description: event.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-muted"
            htmlFor={`priority-${clientId}`}
          >
            Priority
          </label>
          <select
            id={`priority-${clientId}`}
            className={fieldClassName}
            value={priority ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              update({
                priority: value === "" ? null : (value as TaskPriority),
              });
            }}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-muted"
            htmlFor={`due-date-${clientId}`}
          >
            Due date
          </label>
          <input
            id={`due-date-${clientId}`}
            type="date"
            className={fieldClassName}
            value={dueDate ?? ""}
            onChange={(event) =>
              update({ dueDate: event.target.value === "" ? null : event.target.value })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(91,33,182,0.9)] transition hover:bg-violet-deep disabled:cursor-not-allowed disabled:bg-lavender disabled:text-muted"
          onClick={() => onAccept(clientId)}
          disabled={title.trim().length === 0}
        >
          Accept & save
        </button>
        <button
          type="button"
          className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-coral/50 hover:bg-coral/5"
          onClick={() => onDiscard(clientId)}
        >
          Discard
        </button>
      </div>
    </article>
  );
}
