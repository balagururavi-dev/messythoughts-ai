import type { ExtractedTask, Task } from "../types";

export type TaskFilter = "all" | "active" | "completed" | "overdue";

export type TaskSummary = {
  total: number;
  active: number;
  completed: number;
  overdue: number;
};

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Builds a saved task from an explicitly accepted suggestion.
 * IDs and timestamps are application-generated; completed starts false.
 */
export function createTaskFromSuggestion(
  suggestion: ExtractedTask,
  createdAt: string = new Date().toISOString(),
): Task {
  return {
    id: createId(),
    title: suggestion.title.trim(),
    description: suggestion.description.trim(),
    priority: suggestion.priority,
    dueDate: suggestion.dueDate,
    completed: false,
    createdAt,
  };
}

export function isTaskOverdue(task: Task, referenceDate: string): boolean {
  if (task.completed || !task.dueDate) {
    return false;
  }
  return task.dueDate < referenceDate;
}

export function summarizeTasks(tasks: Task[], referenceDate: string): TaskSummary {
  let active = 0;
  let completed = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
    } else {
      active += 1;
      if (isTaskOverdue(task, referenceDate)) {
        overdue += 1;
      }
    }
  }

  return {
    total: tasks.length,
    active,
    completed,
    overdue,
  };
}

export function filterTasks(
  tasks: Task[],
  options: {
    query: string;
    filter: TaskFilter;
    referenceDate: string;
  },
): Task[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (options.filter === "active" && task.completed) {
      return false;
    }
    if (options.filter === "completed" && !task.completed) {
      return false;
    }
    if (options.filter === "overdue" && !isTaskOverdue(task, options.referenceDate)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${task.title} ${task.description}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
