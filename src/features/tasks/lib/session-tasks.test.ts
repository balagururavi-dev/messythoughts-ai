import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import {
  createTaskFromSuggestion,
  filterTasks,
  summarizeTasks,
} from "./session-tasks";

const tasks: Task[] = [
  {
    id: "1",
    title: "Call Mom",
    description: "Maybe this weekend",
    priority: null,
    dueDate: "2026-10-10",
    completed: false,
    createdAt: "2026-10-12T10:00:00.000Z",
  },
  {
    id: "2",
    title: "Finish slides",
    description: "Deck for Friday",
    priority: "medium",
    dueDate: "2026-10-16",
    completed: true,
    createdAt: "2026-10-12T11:00:00.000Z",
  },
  {
    id: "3",
    title: "Buy milk",
    description: "",
    priority: "low",
    dueDate: null,
    completed: false,
    createdAt: "2026-10-12T12:00:00.000Z",
  },
];

describe("session-tasks", () => {
  it("creates a task with app-generated id, timestamp, and completed false", () => {
    const task = createTaskFromSuggestion(
      {
        title: "  Call Mom  ",
        description: "  Maybe this weekend  ",
        priority: null,
        dueDate: null,
      },
      "2026-10-12T10:00:00.000Z",
    );

    expect(task.id.length).toBeGreaterThan(0);
    expect(task.title).toBe("Call Mom");
    expect(task.description).toBe("Maybe this weekend");
    expect(task.completed).toBe(false);
    expect(task.createdAt).toBe("2026-10-12T10:00:00.000Z");
  });

  it("summarizes and filters tasks", () => {
    expect(summarizeTasks(tasks, "2026-10-12")).toEqual({
      total: 3,
      active: 2,
      completed: 1,
      overdue: 1,
    });

    expect(
      filterTasks(tasks, {
        query: "",
        filter: "active",
        referenceDate: "2026-10-12",
      }).map((task) => task.id),
    ).toEqual(["1", "3"]);

    expect(
      filterTasks(tasks, {
        query: "slides",
        filter: "all",
        referenceDate: "2026-10-12",
      }).map((task) => task.id),
    ).toEqual(["2"]);

    expect(
      filterTasks(tasks, {
        query: "",
        filter: "completed",
        referenceDate: "2026-10-12",
      }).map((task) => task.id),
    ).toEqual(["2"]);
  });
});
