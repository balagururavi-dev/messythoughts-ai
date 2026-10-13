"use client";

import { useState } from "react";
import type { ExtractedTask, Task, TaskPriority } from "../types";

const PRIORITY_OPTIONS: Array<{ value: "" | TaskPriority; label: string }> = [
  { value: "", label: "Unset" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const fieldClassName =
  "mt-focus-ring w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink transition hover:border-violet/40 focus:border-violet";

const PRIORITY_STYLES: Record<
  TaskPriority | "unset",
  { bar: string; chip: string; label: string }
> = {
  high: {
    bar: "bg-coral",
    chip: "bg-coral/20 text-coral ring-1 ring-coral/35",
    label: "High",
  },
  medium: {
    bar: "bg-sky",
    chip: "bg-sky/20 text-sky ring-1 ring-sky/35",
    label: "Medium",
  },
  low: {
    bar: "bg-mint",
    chip: "bg-mint/20 text-mint ring-1 ring-mint/35",
    label: "Low",
  },
  unset: {
    bar: "bg-lavender",
    chip: "bg-lavender-soft text-violet-deep ring-1 ring-violet/25",
    label: "Unset",
  },
};

type TaskCardProps = {
  task: Task;
  onUpdate: (id: string, patch: Partial<ExtractedTask>) => void;
  onSetCompleted: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
};

export function TaskCard({
  task,
  onUpdate,
  onSetCompleted,
  onDelete,
}: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [draft, setDraft] = useState<ExtractedTask>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
  });

  const priorityKey = task.priority ?? "unset";
  const priorityStyle = PRIORITY_STYLES[priorityKey];

  function startEditing() {
    setDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    setConfirmingDelete(false);
    setEditing(true);
  }

  function saveEdits() {
    if (draft.title.trim().length === 0) {
      return;
    }
    onUpdate(task.id, draft);
    setEditing(false);
  }

  function handleCompleteChange(checked: boolean) {
    onSetCompleted(task.id, checked);
    if (checked) {
      setJustCompleted(true);
      window.setTimeout(() => setJustCompleted(false), 400);
    }
  }

  return (
    <article
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[0_12px_28px_-24px_var(--mt-panel-shadow)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(76,29,149,0.28)] sm:p-5 ${
        task.completed ? "opacity-80" : ""
      } ${justCompleted ? "mt-complete-pop" : ""}`}
      aria-labelledby={`task-title-${task.id}`}
      data-testid={`task-${task.id}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${priorityStyle.bar}`} aria-hidden />

      <div className="flex items-start gap-3 pl-2">
        <input
          id={`complete-${task.id}`}
          type="checkbox"
          className="mt-1 size-5 rounded-md border-border text-violet accent-violet focus:ring-violet"
          checked={task.completed}
          onChange={(event) => handleCompleteChange(event.target.checked)}
          aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold uppercase tracking-wide text-muted"
                  htmlFor={`edit-title-${task.id}`}
                >
                  Title
                </label>
                <input
                  id={`edit-title-${task.id}`}
                  className={fieldClassName}
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold uppercase tracking-wide text-muted"
                  htmlFor={`edit-description-${task.id}`}
                >
                  Description
                </label>
                <textarea
                  id={`edit-description-${task.id}`}
                  className={`min-h-20 resize-y ${fieldClassName}`}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-muted"
                    htmlFor={`edit-priority-${task.id}`}
                  >
                    Priority
                  </label>
                  <select
                    id={`edit-priority-${task.id}`}
                    className={fieldClassName}
                    value={draft.priority ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft((current) => ({
                        ...current,
                        priority: value === "" ? null : (value as TaskPriority),
                      }));
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
                    htmlFor={`edit-due-${task.id}`}
                  >
                    Due date
                  </label>
                  <input
                    id={`edit-due-${task.id}`}
                    type="date"
                    className={fieldClassName}
                    value={draft.dueDate ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        dueDate: event.target.value === "" ? null : event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id={`task-title-${task.id}`}
                  className={`font-display text-xl font-semibold text-ink ${
                    task.completed ? "line-through decoration-muted/70" : ""
                  }`}
                >
                  {task.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityStyle.chip}`}
                >
                  {priorityStyle.label}
                </span>
              </div>
              {task.description ? (
                <p className="mt-1 text-sm leading-6 text-muted">{task.description}</p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-muted">
                Due: {task.dueDate ?? "none"}
                {" · "}
                {task.completed ? "Completed" : "Active"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-9">
        {editing ? (
          <>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-deep disabled:cursor-not-allowed disabled:bg-lavender disabled:text-muted"
              onClick={saveEdits}
              disabled={draft.title.trim().length === 0}
            >
              Save
            </button>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-lavender-soft"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : confirmingDelete ? (
          <>
            <p className="w-full text-sm font-medium text-coral" role="status">
              Delete this task permanently?
            </p>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              onClick={() => onDelete(task.id)}
            >
              Confirm delete
            </button>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-lavender-soft"
              onClick={() => setConfirmingDelete(false)}
            >
              Keep task
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:border-violet/40 hover:bg-lavender-soft"
              onClick={startEditing}
            >
              Edit
            </button>
            <button
              type="button"
              className="mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:border-coral/40 hover:bg-coral/5"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
