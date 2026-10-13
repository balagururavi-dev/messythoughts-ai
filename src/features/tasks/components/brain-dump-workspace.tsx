"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ExtractTasksClientError,
  requestTaskExtraction,
} from "../api/extract-tasks-client";
import { getBrowserReferenceDate, getBrowserTimeZone } from "../browser-context";
import { useTasks, type TaskStorageApi } from "../hooks/use-tasks";
import {
  buildBrainDumpFilename,
  buildTasksFilename,
  canUseBrainDumpText,
  copyTextToClipboard,
  downloadTextFile,
  formatTasksForExport,
} from "../lib/brain-dump-actions";
import { summarizeTasks } from "../lib/session-tasks";
import type { ExtractedTask } from "../types";
import {
  ActionFeedback,
  type ActionFeedbackState,
} from "./action-feedback";
import { SuggestionCard, type ReviewSuggestion } from "./suggestion-card";
import { TaskDashboard } from "./task-dashboard";
import { TaskSummaryStrip } from "./task-summary-strip";

type ExtractStatus = "idle" | "loading" | "ready" | "empty" | "error";

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `suggestion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toReviewSuggestions(tasks: ExtractedTask[]): ReviewSuggestion[] {
  return tasks.map((task) => ({
    ...task,
    clientId: createClientId(),
  }));
}

export type BrainDumpWorkspaceProps = {
  extractTasks?: typeof requestTaskExtraction;
  getReferenceDate?: () => string;
  getTimeZone?: () => string;
  storage?: TaskStorageApi;
};

export function BrainDumpWorkspace({
  extractTasks = requestTaskExtraction,
  getReferenceDate = getBrowserReferenceDate,
  getTimeZone = getBrowserTimeZone,
  storage,
}: BrainDumpWorkspaceProps = {}) {
  const textAreaId = useId();
  const requestInFlightRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ExtractStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [referenceDate, setReferenceDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedbackState>(null);

  const {
    tasks,
    hydrated,
    storageWarning,
    acceptSuggestion,
    updateTask,
    setCompleted,
    deleteTask,
  } = useTasks(storage ? { storage } : undefined);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7738/ingest/df421fff-4d13-49c4-87c9-1a281e8a9d23", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "2fe47e",
      },
      body: JSON.stringify({
        sessionId: "2fe47e",
        runId: "pre-fix",
        hypothesisId: "H1-H5",
        location: "brain-dump-workspace.tsx:mount",
        message: "BrainDumpWorkspace mounted; export handler names check",
        data: {
          hasHandleExportDump: typeof handleExportDump === "function",
          hasHandleExportTasks: typeof handleExportTasks === "function",
          jsxUsesHandleExportDump: true,
          jsxUsesBareHandleExport: false,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setReferenceDate(getReferenceDate());
    });
    return () => window.cancelAnimationFrame(frame);
  }, [getReferenceDate]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const summary = useMemo(
    () => summarizeTasks(tasks, referenceDate ?? "9999-12-31"),
    [tasks, referenceDate],
  );

  const hasDumpText = canUseBrainDumpText(text);

  function showFeedback(next: NonNullable<ActionFeedbackState>, autoClearMs = 5000) {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    setFeedback(next);

    if (autoClearMs > 0) {
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        feedbackTimerRef.current = null;
      }, autoClearMs);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (requestInFlightRef.current) {
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setStatus("error");
      setErrorMessage("Enter some thoughts before organizing them.");
      return;
    }

    if (trimmed.length > 10_000) {
      setStatus("error");
      setErrorMessage("Brain dumps must be 10,000 characters or fewer.");
      return;
    }

    requestInFlightRef.current = true;
    setStatus("loading");
    setErrorMessage(null);
    setSuggestions([]);
    // Keep the original brain dump text after submit so users can copy/export it.

    try {
      const result = await extractTasks({
        text: trimmed,
        referenceDate: getReferenceDate(),
        timeZone: getTimeZone(),
      });

      if (result.suggestions.length === 0) {
        setSuggestions([]);
        setStatus("empty");
        return;
      }

      setSuggestions(toReviewSuggestions(result.suggestions));
      setStatus("ready");
    } catch (error) {
      const message =
        error instanceof ExtractTasksClientError
          ? error.message
          : "Something went wrong while organizing your thoughts.";
      setStatus("error");
      setErrorMessage(message);
    } finally {
      requestInFlightRef.current = false;
    }
  }

  function handleSuggestionChange(clientId: string, next: ExtractedTask) {
    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.clientId === clientId
          ? { ...next, clientId: suggestion.clientId }
          : suggestion,
      ),
    );
  }

  function handleAccept(clientId: string) {
    const selected = suggestions.find((suggestion) => suggestion.clientId === clientId);
    if (!selected || selected.title.trim().length === 0) {
      return;
    }

    setSuggestions((current) =>
      current.filter((suggestion) => suggestion.clientId !== clientId),
    );

    acceptSuggestion(selected, clientId);
  }

  function handleDiscard(clientId: string) {
    setSuggestions((current) =>
      current.filter((suggestion) => suggestion.clientId !== clientId),
    );
  }

  function handleClear() {
    if (!hasDumpText) {
      return;
    }

    const previous = text;
    setText("");
    showFeedback(
      {
        tone: "info",
        message: "Brain dump cleared.",
        undoLabel: "Undo",
        onUndo: () => {
          setText(previous);
          setFeedback(null);
          if (feedbackTimerRef.current !== null) {
            window.clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = null;
          }
        },
      },
      6000,
    );
  }

  async function handleCopyDump() {
    if (!hasDumpText) {
      return;
    }

    try {
      await copyTextToClipboard(text);
      showFeedback({
        tone: "success",
        message: "Brain dump copied to clipboard.",
      });
    } catch {
      showFeedback({
        tone: "error",
        message: "Could not copy. Check clipboard permissions and try again.",
      });
    }
  }

  function handleExportDump() {
    if (!hasDumpText) {
      return;
    }

    const ok = downloadTextFile(text, buildBrainDumpFilename());
    if (ok) {
      showFeedback({
        tone: "success",
        message: "Brain dump exported as a text file.",
      });
      return;
    }

    showFeedback({
      tone: "error",
      message: "Could not export the brain dump in this browser.",
    });
  }

  async function handleCopyTasks() {
    if (tasks.length === 0) {
      return;
    }

    try {
      await copyTextToClipboard(formatTasksForExport(tasks));
      showFeedback({
        tone: "success",
        message: "Saved tasks copied to clipboard.",
      });
    } catch {
      showFeedback({
        tone: "error",
        message: "Could not copy. Check clipboard permissions and try again.",
      });
    }
  }

  function handleExportTasks() {
    if (tasks.length === 0) {
      return;
    }

    const ok = downloadTextFile(formatTasksForExport(tasks), buildTasksFilename());
    if (ok) {
      showFeedback({
        tone: "success",
        message: "Saved tasks exported as a text file.",
      });
      return;
    }

    showFeedback({
      tone: "error",
      message: "Could not export saved tasks in this browser.",
    });
  }

  const isLoading = status === "loading";
  const characterCount = text.length;
  const utilityButtonClass =
    "mt-focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface/90 px-3 py-2 text-sm font-semibold text-ink transition hover:border-violet/40 hover:bg-lavender-soft disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface/90";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8">
      <header className="mt-animate-in flex max-w-2xl flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Turn messy thoughts into tasks
        </h1>
        <p className="text-sm leading-6 text-muted sm:text-base">
          Dump the mess, review AI suggestions, and accept only what you want saved.
        </p>
      </header>

      <TaskSummaryStrip summary={summary} />

      <ActionFeedback feedback={feedback} />

      <section
        className="mt-animate-in mt-panel rounded-3xl p-5 sm:p-7"
        aria-labelledby="brain-dump-heading"
      >
        <div className="mb-5 flex flex-col gap-1">
          <h2
            id="brain-dump-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink"
          >
            Capture thoughts
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Paste unstructured notes. Suggestions stay separate until you accept them.
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit} aria-busy={isLoading}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="text-sm font-semibold text-ink" htmlFor={textAreaId}>
              Brain dump
            </label>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Brain dump utilities"
            >
              <p
                className={`text-sm tabular-nums ${
                  characterCount >= 10_000 ? "font-semibold text-coral" : "text-muted"
                }`}
                aria-live="polite"
              >
                {characterCount.toLocaleString()}/10,000
              </p>
              <button
                type="button"
                className={utilityButtonClass}
                onClick={handleClear}
                disabled={!hasDumpText || isLoading}
                aria-label="Clear brain dump text"
              >
                Clear
              </button>
              <button
                type="button"
                className={utilityButtonClass}
                onClick={() => {
                  void handleCopyDump();
                }}
                disabled={!hasDumpText}
                aria-label="Copy brain dump to clipboard"
              >
                Copy
              </button>
              <button
                type="button"
                className={utilityButtonClass}
                onClick={handleExportDump}
                disabled={!hasDumpText}
                aria-label="Export brain dump as text file"
              >
                Export
              </button>
            </div>
          </div>
          <textarea
            id={textAreaId}
            name="brainDump"
            className="mt-focus-ring min-h-40 w-full resize-y rounded-2xl border border-border bg-surface-soft/80 px-4 py-3 text-base text-ink transition hover:border-violet/35 focus:border-violet focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-48"
            placeholder="Call Mom this weekend, maybe finish the slides before Friday if I have time, groceries..."
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 10_000))}
            disabled={isLoading}
            maxLength={10_000}
            aria-describedby={`${textAreaId}-hint`}
          />
          <p id={`${textAreaId}-hint`} className="text-sm text-muted">
            Tentative wording is preserved. AI never auto-saves tasks.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="mt-focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(76,29,149,0.9)] transition hover:bg-violet-deep disabled:cursor-not-allowed disabled:bg-lavender disabled:text-muted"
              disabled={isLoading}
            >
              {isLoading ? "Organizing…" : "Organize my thoughts"}
            </button>
          </div>
        </form>

        {status === "loading" ? (
          <p className="mt-4 text-sm font-medium text-violet-deep" role="status" aria-live="polite">
            Organizing your thoughts into suggestions…
          </p>
        ) : null}

        {status === "error" && errorMessage ? (
          <p
            className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-ink"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {status === "empty" ? (
          <p
            className="mt-4 rounded-2xl border border-sky/30 bg-sky/10 px-4 py-3 text-sm text-ink"
            role="status"
          >
            No actionable suggestions found. Try adding clearer next steps.
          </p>
        ) : null}
      </section>

      {suggestions.length > 0 ? (
        <section
          className="mt-animate-in mt-panel flex flex-col gap-5 rounded-3xl p-5 sm:p-7"
          aria-labelledby="suggestions-heading"
        >
          <div className="flex flex-col gap-1">
            <h2
              id="suggestions-heading"
              className="font-display text-2xl font-semibold tracking-tight text-ink"
            >
              Review suggestions
            </h2>
            <p className="text-sm leading-6 text-muted">
              AI suggestions only — accept to save, or discard to dismiss.
            </p>
          </div>
          <ul className="flex list-none flex-col gap-3 p-0">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.clientId}>
                <SuggestionCard
                  suggestion={suggestion}
                  index={index}
                  onChange={handleSuggestionChange}
                  onAccept={handleAccept}
                  onDiscard={handleDiscard}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TaskDashboard
        tasks={tasks}
        hydrated={hydrated}
        referenceDate={referenceDate}
        storageWarning={storageWarning}
        onUpdate={updateTask}
        onSetCompleted={setCompleted}
        onDelete={deleteTask}
        onCopyTasks={() => {
          void handleCopyTasks();
        }}
        onExportTasks={handleExportTasks}
      />
    </div>
  );
}
