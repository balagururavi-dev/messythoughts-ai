function buildDatedFilename(prefix: string, now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${year}${month}${day}.txt`;
}

/** Builds a safe download filename for a brain-dump export. */
export function buildBrainDumpFilename(now: Date = new Date()): string {
  return buildDatedFilename("messythoughts-brain-dump", now);
}

/** Builds a safe download filename for a saved-tasks export. */
export function buildTasksFilename(now: Date = new Date()): string {
  return buildDatedFilename("messythoughts-tasks", now);
}

type ExportableTask = {
  title: string;
  description: string;
  priority: string | null;
  dueDate: string | null;
  completed: boolean;
};

/** Formats saved tasks as plain text for copy/export. */
export function formatTasksForExport(tasks: ExportableTask[]): string {
  if (tasks.length === 0) {
    return "";
  }

  return tasks
    .map((task, index) => {
      const lines = [
        `${index + 1}. ${task.title}${task.completed ? " (done)" : ""}`,
      ];
      if (task.description.trim()) {
        lines.push(`   ${task.description.trim()}`);
      }
      if (task.priority) {
        lines.push(`   Priority: ${task.priority}`);
      }
      if (task.dueDate) {
        lines.push(`   Due: ${task.dueDate}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function canUseBrainDumpText(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Copies text to the clipboard. Throws on failure so callers can show feedback.
 */
export async function copyTextToClipboard(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | null = typeof navigator !== "undefined"
    ? navigator.clipboard
    : null,
): Promise<void> {
  if (!clipboard || typeof clipboard.writeText !== "function") {
    throw new Error("Clipboard is unavailable in this browser.");
  }
  await clipboard.writeText(text);
}

/**
 * Triggers a plain-text file download in the browser.
 * Returns false when DOM APIs are unavailable (e.g. SSR).
 */
export function downloadTextFile(
  text: string,
  filename: string,
  doc: Document | null = typeof document !== "undefined" ? document : null,
): boolean {
  if (!doc || typeof URL === "undefined" || typeof Blob === "undefined") {
    return false;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = doc.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  doc.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}
