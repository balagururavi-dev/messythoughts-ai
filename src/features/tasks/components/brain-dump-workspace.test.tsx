import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types";
import type { ExtractTasksResponse } from "../schemas";
import type { TaskStorageApi } from "../hooks/use-tasks";
import * as brainDumpActions from "../lib/brain-dump-actions";
import { BrainDumpWorkspace } from "./brain-dump-workspace";

const sampleResponse: ExtractTasksResponse = {
  suggestions: [
    {
      title: "Call Mom",
      description: "Maybe this weekend",
      priority: null,
      dueDate: null,
    },
    {
      title: "Finish slides",
      description: "Before Friday if possible",
      priority: "medium",
      dueDate: "2026-10-16",
    },
  ],
};

function createMemoryStorageApi(initialTasks: Task[] = []): TaskStorageApi & {
  saved: Task[][];
} {
  let tasks = [...initialTasks];
  const saved: Task[][] = [];

  return {
    saved,
    loadTasks: () =>
      tasks.length > 0
        ? { status: "ok" as const, tasks: [...tasks] }
        : { status: "empty" as const, tasks: [] },
    saveTasks: (next) => {
      tasks = [...next];
      saved.push([...next]);
      return { ok: true as const };
    },
  };
}

describe("BrainDumpWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a validation error when submitting empty input", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn();
    const storage = createMemoryStorageApi();

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /enter some thoughts before organizing them/i,
    );
    expect(extractTasks).not.toHaveBeenCalled();
  });

  it("enforces the 10,000-character limit", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn().mockResolvedValue(sampleResponse);
    const storage = createMemoryStorageApi();

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    const textarea = screen.getByRole("textbox", { name: /^brain dump$/i });
    await user.click(textarea);
    await user.paste("a".repeat(10_001));

    expect(textarea).toHaveValue("a".repeat(10_000));
    expect(screen.getByText("10,000/10,000")).toBeInTheDocument();
  });

  it("sends text, reference date, and timezone to the extract API", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn().mockResolvedValue(sampleResponse);
    const storage = createMemoryStorageApi();

    render(
      <BrainDumpWorkspace
        extractTasks={extractTasks}
        getReferenceDate={() => "2026-10-12"}
        getTimeZone={() => "America/New_York"}
        storage={storage}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /^brain dump$/i }),
      "Call Mom this weekend and finish slides",
    );
    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));

    await screen.findByRole("heading", { name: /review suggestions/i });

    expect(extractTasks).toHaveBeenCalledWith({
      text: "Call Mom this weekend and finish slides",
      referenceDate: "2026-10-12",
      timeZone: "America/New_York",
    });
  });

  it("shows loading and empty states and blocks duplicate submissions", async () => {
    const user = userEvent.setup();
    let resolveExtract: ((value: ExtractTasksResponse) => void) | undefined;
    const extractTasks = vi.fn(
      () =>
        new Promise<ExtractTasksResponse>((resolve) => {
          resolveExtract = resolve;
        }),
    );
    const storage = createMemoryStorageApi();

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    await user.type(screen.getByRole("textbox", { name: /^brain dump$/i }), "random musings");
    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));

    expect(screen.getByText(/organizing your thoughts into suggestions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /organizing/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /organizing/i }));
    expect(extractTasks).toHaveBeenCalledTimes(1);

    resolveExtract?.({ suggestions: [] });

    await waitFor(() => {
      expect(screen.getByText(/no actionable suggestions found/i)).toBeInTheDocument();
    });
  });

  it("shows API errors without calling Gemini from the client", async () => {
    const user = userEvent.setup();
    const extractTasks = vi
      .fn()
      .mockRejectedValue(new Error("Upstream provider error"));
    const storage = createMemoryStorageApi();

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    await user.type(screen.getByRole("textbox", { name: /^brain dump$/i }), "buy groceries");
    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong while organizing your thoughts/i,
    );
  });

  it("persists accepted suggestions as saved tasks and supports manage actions", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn().mockResolvedValue(sampleResponse);
    const storage = createMemoryStorageApi();

    render(
      <BrainDumpWorkspace
        extractTasks={extractTasks}
        getReferenceDate={() => "2026-10-12"}
        storage={storage}
      />,
    );

    await screen.findByText(/no saved tasks yet/i);

    await user.type(screen.getByRole("textbox", { name: /^brain dump$/i }), "weekend plans");
    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));
    await screen.findByRole("heading", { name: /review suggestions/i });

    const callMomTitle = screen.getByDisplayValue("Call Mom");
    await user.clear(callMomTitle);
    await user.type(callMomTitle, "Call Mom on Sunday");

    const initialSuggestionCards = screen.getAllByRole("article");
    await user.click(
      within(initialSuggestionCards[0]!).getByRole("button", { name: /accept/i }),
    );

    const remainingSuggestionCards = screen.getAllByRole("article");
    // Remaining review card plus the newly saved task card.
    const discardCard =
      remainingSuggestionCards.find((card) =>
        within(card).queryByRole("button", { name: /discard/i }),
      ) ?? remainingSuggestionCards[0]!;
    await user.click(within(discardCard).getByRole("button", { name: /discard/i }));

    expect(screen.queryByRole("heading", { name: /review suggestions/i })).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /saved tasks/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Call Mom on Sunday")).toBeInTheDocument();
    expect(screen.queryByText("Finish slides")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(storage.saved.at(-1)).toHaveLength(1);
    });
    expect(storage.saved.at(-1)?.[0]).toMatchObject({
      title: "Call Mom on Sunday",
      completed: false,
    });
    expect(storage.saved.at(-1)?.[0]?.id).toBeTruthy();
    expect(storage.saved.at(-1)?.[0]?.createdAt).toBeTruthy();

    const taskCard = screen.getByTestId(/task-/);
    await user.click(within(taskCard).getByRole("checkbox", { name: /complete/i }));
    expect(within(taskCard).getByText(/completed/i)).toBeInTheDocument();

    await user.click(within(taskCard).getByRole("button", { name: /edit/i }));
    const titleInput = within(taskCard).getByLabelText(/^title$/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Call Mom tonight");
    await user.click(within(taskCard).getByRole("button", { name: /^save$/i }));
    expect(screen.getByText("Call Mom tonight")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^active$/i }));
    expect(screen.getByText(/no tasks match this search or filter/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.getByText("Call Mom tonight")).toBeInTheDocument();

    const completedTaskCard = screen.getByTestId(/task-/);
    await user.click(within(completedTaskCard).getByRole("button", { name: /^delete$/i }));
    await user.click(
      within(completedTaskCard).getByRole("button", { name: /confirm delete/i }),
    );
    expect(screen.getByText(/no saved tasks yet/i)).toBeInTheDocument();
  });

  it("supports clear with undo, copy, and export for the brain dump", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn();
    const storage = createMemoryStorageApi();
    const copySpy = vi
      .spyOn(brainDumpActions, "copyTextToClipboard")
      .mockResolvedValue(undefined);
    const exportSpy = vi.spyOn(brainDumpActions, "downloadTextFile").mockReturnValue(true);

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    expect(screen.getByRole("button", { name: /clear brain dump text/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /copy brain dump to clipboard/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /export brain dump as text file/i }),
    ).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: /^brain dump$/i }), "keep this dump");

    await user.click(screen.getByRole("button", { name: /copy brain dump to clipboard/i }));
    expect(copySpy).toHaveBeenCalledWith("keep this dump");
    expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export brain dump as text file/i }));
    expect(exportSpy).toHaveBeenCalled();
    expect(screen.getByText(/exported as a text file/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear brain dump text/i }));
    expect(screen.getByRole("textbox", { name: /^brain dump$/i })).toHaveValue("");
    expect(screen.getByText(/brain dump cleared/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^undo$/i }));
    expect(screen.getByRole("textbox", { name: /^brain dump$/i })).toHaveValue("keep this dump");
  });

  it("supports copy and export for saved tasks", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn();
    const storage = createMemoryStorageApi([
      {
        id: "task-1",
        title: "Call Mom",
        description: "This weekend",
        priority: "high",
        dueDate: "2026-10-18",
        completed: false,
        createdAt: "2026-10-11T09:00:00.000Z",
      },
    ]);
    const copySpy = vi
      .spyOn(brainDumpActions, "copyTextToClipboard")
      .mockResolvedValue(undefined);
    const exportSpy = vi.spyOn(brainDumpActions, "downloadTextFile").mockReturnValue(true);

    render(<BrainDumpWorkspace extractTasks={extractTasks} storage={storage} />);

    expect(await screen.findByText("Call Mom")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /copy saved tasks to clipboard/i }));
    expect(copySpy).toHaveBeenCalledWith(
      [
        "1. Call Mom",
        "   This weekend",
        "   Priority: high",
        "   Due: 2026-10-18",
      ].join("\n"),
    );
    expect(screen.getByText(/saved tasks copied to clipboard/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export saved tasks as text file/i }));
    expect(exportSpy).toHaveBeenCalled();
    expect(screen.getByText(/saved tasks exported as a text file/i)).toBeInTheDocument();
  });

  it("restores saved tasks from storage without creating tasks from suggestions alone", async () => {
    const user = userEvent.setup();
    const extractTasks = vi.fn().mockResolvedValue(sampleResponse);
    const storage = createMemoryStorageApi([
      {
        id: "existing-1",
        title: "Existing task",
        description: "Already saved",
        priority: "high",
        dueDate: "2026-10-20",
        completed: false,
        createdAt: "2026-10-11T09:00:00.000Z",
      },
    ]);

    render(
      <BrainDumpWorkspace
        extractTasks={extractTasks}
        getReferenceDate={() => "2026-10-12"}
        storage={storage}
      />,
    );

    expect(await screen.findByText("Existing task")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /^brain dump$/i }), "new dump");
    await user.click(screen.getByRole("button", { name: /organize my thoughts/i }));
    await screen.findByRole("heading", { name: /review suggestions/i });

    expect(screen.getByText("Existing task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Call Mom")).toBeInTheDocument();
    expect(storage.saved).toHaveLength(0);
  });
});
