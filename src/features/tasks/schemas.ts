import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const extractedTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000),
  priority: taskPrioritySchema.nullable(),
  /** YYYY-MM-DD when present; null when ambiguous or absent */
  dueDate: z.iso.date().nullable(),
});

export const taskSchema = extractedTaskSchema.extend({
  id: z.string().trim().min(1),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
});

/** Versioned envelope for browser localStorage. */
export const persistedTasksSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema),
});

export const extractTasksRequestSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  referenceDate: z.iso.date(),
  timeZone: z.string().trim().min(1),
});

export const extractTasksResponseSchema = z.object({
  suggestions: z.array(extractedTaskSchema).max(30),
});

export type ExtractTasksRequest = z.infer<typeof extractTasksRequestSchema>;
export type ExtractTasksResponse = z.infer<typeof extractTasksResponseSchema>;
export type PersistedTasks = z.infer<typeof persistedTasksSchema>;
