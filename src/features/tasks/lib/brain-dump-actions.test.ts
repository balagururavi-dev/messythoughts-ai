import { describe, expect, it, vi } from "vitest";
import {
  buildBrainDumpFilename,
  buildTasksFilename,
  canUseBrainDumpText,
  copyTextToClipboard,
  downloadTextFile,
  formatTasksForExport,
} from "./brain-dump-actions";

describe("brain-dump-actions", () => {
  it("builds a dated filename and detects usable text", () => {
    expect(buildBrainDumpFilename(new Date(2026, 9, 12))).toBe(
      "messythoughts-brain-dump-20261012.txt",
    );
    expect(buildTasksFilename(new Date(2026, 9, 12))).toBe(
      "messythoughts-tasks-20261012.txt",
    );
    expect(canUseBrainDumpText("  hello  ")).toBe(true);
    expect(canUseBrainDumpText("   ")).toBe(false);
  });

  it("formats saved tasks for copy and export", () => {
    expect(
      formatTasksForExport([
        {
          title: "Call Mom",
          description: "This weekend",
          priority: "high",
          dueDate: "2026-10-18",
          completed: false,
        },
        {
          title: "Finish slides",
          description: "",
          priority: null,
          dueDate: null,
          completed: true,
        },
      ]),
    ).toBe(
      [
        "1. Call Mom",
        "   This weekend",
        "   Priority: high",
        "   Due: 2026-10-18",
        "",
        "2. Finish slides (done)",
      ].join("\n"),
    );
  });

  it("copies text through the clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await copyTextToClipboard("hello", { writeText });
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("throws when clipboard is unavailable", async () => {
    await expect(copyTextToClipboard("hello", null)).rejects.toThrow(/clipboard/i);
  });

  it("downloads a text file through DOM APIs", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createElement = vi.fn(() => ({
      href: "",
      download: "",
      rel: "",
      click,
      remove,
    }));

    const ok = downloadTextFile("hello", "dump.txt", {
      createElement,
      body: { appendChild },
    } as unknown as Document);

    expect(ok).toBe(true);
    expect(createElement).toHaveBeenCalledWith("a");
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });
});
