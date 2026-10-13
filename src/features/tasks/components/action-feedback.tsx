"use client";

export type ActionFeedbackTone = "success" | "error" | "info";

export type ActionFeedbackState = {
  tone: ActionFeedbackTone;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
} | null;

type ActionFeedbackProps = {
  feedback: ActionFeedbackState;
};

const TONE_STYLES: Record<ActionFeedbackTone, string> = {
  success: "border-mint/40 bg-mint/15 text-[#065f46]",
  error: "border-coral/35 bg-coral/10 text-[#9f1239]",
  info: "border-violet/25 bg-lavender-soft text-violet-deep",
};

export function ActionFeedback({ feedback }: ActionFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${TONE_STYLES[feedback.tone]}`}
      role={feedback.tone === "error" ? "alert" : "status"}
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
    >
      <p className="flex-1 font-medium">{feedback.message}</p>
      {feedback.onUndo && feedback.undoLabel ? (
        <button
          type="button"
          className="mt-focus-ring inline-flex min-h-9 items-center justify-center rounded-xl border border-current/20 bg-surface/80 px-3 py-1.5 text-sm font-semibold transition hover:bg-surface"
          onClick={feedback.onUndo}
        >
          {feedback.undoLabel}
        </button>
      ) : null}
    </div>
  );
}
