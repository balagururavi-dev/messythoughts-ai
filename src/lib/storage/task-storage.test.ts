import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/features/tasks/types";
import {
  loadTasks,
  saveTasks,
  TASK_STORAGE_KEY,
  TASK_STORAGE_VERSION,
} from "./task-storage";

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key]! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    dump: () => store,
  };
}

const sampleTask: Task = {
  id: "task-1",
  title: "Call Mom",
  description: "Maybe this weekend",
  priority: null,
  dueDate: null,
  completed: false,
  createdAt: "2026-10-12T10:00:00.000Z",
};

describe("task-storage", () => {
  it("returns empty when nothing is stored", () => {
    const storage = createMemoryStorage();
    expect(loadTasks(storage)).toEqual({ status: "empty", tasks: [] });
  });

  it("round-trips a versioned task list", () => {
    const storage = createMemoryStorage();
    expect(saveTasks([sampleTask], storage)).toEqual({ ok: true });

    const loaded = loadTasks(storage);
    expect(loaded).toEqual({ status: "ok", tasks: [sampleTask] });
    expect(JSON.parse(storage.dump()[TASK_STORAGE_KEY]!)).toMatchObject({
      version: TASK_STORAGE_VERSION,
      tasks: [sampleTask],
    });
  });

  it("handles malformed JSON without throwing", () => {
    const storage = createMemoryStorage({
      [TASK_STORAGE_KEY]: "{not-json",
    });

    expect(loadTasks(storage)).toMatchObject({
      status: "invalid",
      tasks: [],
    });
  });

  it("handles invalid stored shapes without throwing", () => {
    const storage = createMemoryStorage({
      [TASK_STORAGE_KEY]: JSON.stringify({
        version: 1,
        tasks: [{ title: "missing required fields" }],
      }),
    });

    expect(loadTasks(storage)).toMatchObject({
      status: "invalid",
      tasks: [],
    });
  });

  it("reports unavailable storage on read/write failures", () => {
    const failingStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };

    expect(loadTasks(failingStorage)).toMatchObject({
      status: "unavailable",
      tasks: [],
    });
    expect(saveTasks([sampleTask], failingStorage)).toMatchObject({
      ok: false,
    });
  });

  it("is safe when storage is null (server / unavailable)", () => {
    expect(loadTasks(null)).toMatchObject({ status: "unavailable", tasks: [] });
    expect(saveTasks([sampleTask], null)).toMatchObject({ ok: false });
  });
});
