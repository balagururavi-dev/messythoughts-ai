"use client";

import { useId, useMemo, useState } from "react";
import { filterTasks, type TaskFilter } from "../lib/session-tasks";
import type { ExtractedTask, Task } from "../types";
import { TaskCard } from "./task-card";

const FILTERS: Array<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

type TaskDashboardProps = {
  tasks: Task[];
  hydrated: boolean;
  referenceDate: string | null;
  storageWarning?: string | null;
  onUpdate: (id: string, patch: Partial<ExtractedTask>) => void;
  onSetCompleted: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onCopyTasks?: () => void;
  onExportTasks?: () => void;
};

export function TaskDashboard({
  tasks,
  hydrated,
  referenceDate,
  storageWarning = null,
  onUpdate,
  onSetCompleted,
  onDelete,
  onCopyTasks,
  onExportTasks,
}: TaskDashboardProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");

  const visibleTasks = useMemo(() => {
    if (!referenceDate) {
      return tasks;
    }
    return filterTasks(tasks, { query, filter, referenceDate });
  }, [tasks, query, filter, referenceDate]);

  const hasTasks = tasks.length > 0;
  const utilityButtonClass =
    "mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface/90 px-3 py-2 text-sm font-semibold text-ink transition hover:border-violet/40 hover:bg-lavender-soft disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface/90";

  return (
    <section
      className="mt-panel flex flex-col gap-5 rounded-3xl p-5 sm:p-7"
      aria-labelledby="tasks-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="tasks-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink"
          >
            Saved tasks
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Only accepted suggestions are saved here. Edit, complete, or delete anytime.
          </p>
        </div>
        {onCopyTasks || onExportTasks ? (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Saved task utilities"
          >
            {onCopyTasks ? (
              <button
                type="button"
                className={utilityButtonClass}
                onClick={onCopyTasks}
                disabled={!hydrated || !hasTasks}
                aria-label="Copy saved tasks to clipboard"
              >
                Copy
              </button>
            ) : null}
            {onExportTasks ? (
              <button
                type="button"
                className={utilityButtonClass}
                onClick={onExportTasks}
                disabled={!hydrated || !hasTasks}
                aria-label="Export saved tasks as text file"
              >
                Export
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {storageWarning ? (
        <p
          className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-ink"
          role="status"
        >
          {storageWarning}
        </p>
      ) : null}

      {!hydrated ? (
        <p className="text-sm text-muted" role="status">
          Loading saved tasks…
        </p>
      ) : null}

      {hydrated && tasks.length === 0 ? (
        <div
          className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-br from-lavender-soft/80 via-surface to-surface-soft px-5 py-10 text-center"
          role="status"
        >
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet/10 font-display text-lg font-semibold text-violet-deep ring-1 ring-violet/15">
            MT
          </div>
          <p className="font-display text-xl font-semibold tracking-tight text-ink">
            No saved tasks yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Dump the tabs open in your head above, then accept the suggestions worth keeping.
            Nothing is saved until you say so.
          </p>
        </div>
      ) : null}

      {hydrated && tasks.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-soft/70 p-3 sm:flex-row sm:items-end sm:p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="text-sm font-semibold text-ink" htmlFor={searchId}>
                Search tasks
              </label>
              <input
                id={searchId}
                type="search"
                className="mt-focus-ring w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink transition hover:border-violet/40 focus:border-violet"
                placeholder="Search by title or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter tasks"
            >
              {FILTERS.map((option) => {
                const selected = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    className={`mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                      selected
                        ? "bg-violet text-white shadow-[0_10px_20px_-12px_rgba(76,29,149,0.85)]"
                        : "border border-border bg-surface text-ink hover:border-violet/35 hover:bg-lavender-soft"
                    }`}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleTasks.length === 0 ? (
            <p
              className="rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm text-muted"
              role="status"
            >
              No tasks match this search or filter.
            </p>
          ) : (
            <ul className="flex list-none flex-col gap-3 p-0">
              {visibleTasks.map((task) => (
                <li key={task.id} className="mt-animate-in">
                  <TaskCard
                    task={task}
                    onUpdate={onUpdate}
                    onSetCompleted={onSetCompleted}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
