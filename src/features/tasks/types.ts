export type TaskPriority = "low" | "medium" | "high";

export type ExtractedTask = {
  title: string;
  description: string;
  priority: TaskPriority | null;
  /** YYYY-MM-DD when present */
  dueDate: string | null;
};

export type Task = ExtractedTask & {
  id: string;
  completed: boolean;
  createdAt: string;
};
