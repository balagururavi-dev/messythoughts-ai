"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadTasks,
  saveTasks,
  type LoadTasksResult,
  type SaveTasksResult,
} from "@/lib/storage/task-storage";
import { createTaskFromSuggestion } from "../lib/session-tasks";
import type { ExtractedTask, Task } from "../types";

export type TaskStorageApi = {
  loadTasks: () => LoadTasksResult;
  saveTasks: (tasks: Task[]) => SaveTasksResult;
};

const defaultStorage: TaskStorageApi = {
  loadTasks,
  saveTasks,
};

export type UseTasksOptions = {
  storage?: TaskStorageApi;
};

type TasksState = {
  tasks: Task[];
  hydrated: boolean;
  storageWarning: string | null;
};

function readStorageState(storage: TaskStorageApi): Omit<TasksState, "hydrated"> {
  const result = storage.loadTasks();

  if (result.status === "ok") {
    return { tasks: result.tasks, storageWarning: null };
  }

  if (result.status === "invalid") {
    return {
      tasks: [],
      storageWarning: `${result.reason} Starting with an empty task list. The next save will replace the corrupt data.`,
    };
  }

  if (result.status === "unavailable") {
    return { tasks: [], storageWarning: result.reason };
  }

  return { tasks: [], storageWarning: null };
}

export function useTasks({ storage = defaultStorage }: UseTasksOptions = {}) {
  const [state, setState] = useState<TasksState>({
    tasks: [],
    hydrated: false,
    storageWarning: null,
  });
  const acceptGuardRef = useRef(new Set<string>());
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    let active = true;

    const frame = window.requestAnimationFrame(() => {
      if (!active) {
        return;
      }

      const next = readStorageState(storage);
      skipNextSaveRef.current = true;
      setState({
        tasks: next.tasks,
        storageWarning: next.storageWarning,
        hydrated: true,
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, [storage]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const result = storage.saveTasks(state.tasks);
    let frame = 0;

    if (!result.ok) {
      frame = window.requestAnimationFrame(() => {
        setState((current) => ({
          ...current,
          storageWarning: result.reason,
        }));
      });
    } else {
      frame = window.requestAnimationFrame(() => {
        setState((current) =>
          current.storageWarning === null
            ? current
            : { ...current, storageWarning: null },
        );
      });
    }

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [state.tasks, state.hydrated, storage]);

  const acceptSuggestion = useCallback((suggestion: ExtractedTask, clientId: string) => {
    if (acceptGuardRef.current.has(clientId)) {
      return null;
    }

    const title = suggestion.title.trim();
    if (!title) {
      return null;
    }

    acceptGuardRef.current.add(clientId);

    const task = createTaskFromSuggestion({
      ...suggestion,
      title,
      description: suggestion.description.trim(),
    });

    setState((current) => ({
      ...current,
      tasks: [...current.tasks, task],
    }));
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<ExtractedTask>) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const nextTitle = patch.title === undefined ? task.title : patch.title.trim();
        if (!nextTitle) {
          return task;
        }

        return {
          ...task,
          title: nextTitle,
          description:
            patch.description === undefined
              ? task.description
              : patch.description.trim(),
          priority: patch.priority === undefined ? task.priority : patch.priority,
          dueDate: patch.dueDate === undefined ? task.dueDate : patch.dueDate,
        };
      }),
    }));
  }, []);

  const setCompleted = useCallback((id: string, completed: boolean) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, completed } : task,
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
  }, []);

  return {
    tasks: state.tasks,
    hydrated: state.hydrated,
    storageWarning: state.storageWarning,
    acceptSuggestion,
    updateTask,
    setCompleted,
    deleteTask,
  };
}
