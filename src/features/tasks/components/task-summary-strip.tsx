"use client";

import type { TaskSummary } from "../lib/session-tasks";

const STATS: Array<{
  key: keyof TaskSummary;
  label: string;
  valueClass: string;
}> = [
  {
    key: "total",
    label: "Total",
    valueClass: "text-violet-deep",
  },
  {
    key: "active",
    label: "Active",
    valueClass: "text-ink",
  },
  {
    key: "completed",
    label: "Done",
    valueClass: "text-ink",
  },
  {
    key: "overdue",
    label: "Overdue",
    valueClass: "text-ink",
  },
];

type TaskSummaryStripProps = {
  summary: TaskSummary;
};

export function TaskSummaryStrip({ summary }: TaskSummaryStripProps) {
  const progress =
    summary.total === 0
      ? 0
      : Math.round((summary.completed / summary.total) * 100);

  return (
    <section className="mt-panel rounded-3xl p-4 sm:p-5" aria-label="Task summary">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Progress
          </h2>
        </div>
        <p
          className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted ring-1 ring-border"
          aria-live="polite"
        >
          {summary.total === 0
            ? "Accept suggestions to build your list"
            : `${progress}% complete · ${summary.active} active`}
        </p>
      </div>

      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Task completion progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet via-sky to-mint transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.key} className="mt-kpi rounded-2xl px-4 py-3">
            <p className="text-xs font-medium text-muted">{stat.label}</p>
            <p
              className={`mt-1 font-display text-2xl font-semibold tracking-tight ${stat.valueClass}`}
            >
              {summary[stat.key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
