import { persistedTasksSchema } from "@/features/tasks/schemas";
import type { Task } from "@/features/tasks/types";

export const TASK_STORAGE_KEY = "messythoughts.tasks.v1";
export const TASK_STORAGE_VERSION = 1 as const;

export type LoadTasksResult =
  | { status: "ok"; tasks: Task[] }
  | { status: "empty"; tasks: [] }
  | { status: "invalid"; tasks: []; reason: string }
  | { status: "unavailable"; tasks: []; reason: string };

export type SaveTasksResult =
  | { ok: true }
  | { ok: false; reason: string };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Loads and validates persisted tasks from localStorage.
 * Safe on the server and when storage is unavailable.
 */
export function loadTasks(
  storage: StorageLike | null = getBrowserStorage(),
): LoadTasksResult {
  if (!storage) {
    return {
      status: "unavailable",
      tasks: [],
      reason: "localStorage is unavailable.",
    };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(TASK_STORAGE_KEY);
  } catch {
    return {
      status: "unavailable",
      tasks: [],
      reason: "Unable to read tasks from localStorage.",
    };
  }

  if (raw === null || raw.trim() === "") {
    return { status: "empty", tasks: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: "invalid",
      tasks: [],
      reason: "Stored tasks contain malformed JSON.",
    };
  }

  const result = persistedTasksSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "invalid",
      tasks: [],
      reason: "Stored tasks failed validation.",
    };
  }

  return { status: "ok", tasks: result.data.tasks };
}

/**
 * Persists tasks in a versioned envelope. Never throws to callers.
 */
export function saveTasks(
  tasks: Task[],
  storage: StorageLike | null = getBrowserStorage(),
): SaveTasksResult {
  if (!storage) {
    return { ok: false, reason: "localStorage is unavailable." };
  }

  const envelope = {
    version: TASK_STORAGE_VERSION,
    tasks,
  };

  const validated = persistedTasksSchema.safeParse(envelope);
  if (!validated.success) {
    return { ok: false, reason: "Tasks failed validation before saving." };
  }

  try {
    storage.setItem(TASK_STORAGE_KEY, JSON.stringify(validated.data));
    return { ok: true };
  } catch {
    return { ok: false, reason: "Unable to write tasks to localStorage." };
  }
}
