import {
  extractTasksRequestSchema,
  extractTasksResponseSchema,
  type ExtractTasksRequest,
  type ExtractTasksResponse,
} from "../schemas";

export class ExtractTasksClientError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ExtractTasksClientError";
    this.status = status;
  }
}

/**
 * Calls POST /api/tasks/extract and validates the response.
 * Does not persist tasks.
 */
export async function requestTaskExtraction(
  input: ExtractTasksRequest,
): Promise<ExtractTasksResponse> {
  const request = extractTasksRequestSchema.safeParse(input);
  if (!request.success) {
    throw new ExtractTasksClientError("Enter a brain dump between 1 and 10,000 characters.");
  }

  let response: Response;
  try {
    response = await fetch("/api/tasks/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.data),
    });
  } catch {
    throw new ExtractTasksClientError("Network error. Check your connection and try again.");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Failed to extract task suggestions.";
    throw new ExtractTasksClientError(message, response.status);
  }

  const parsed = extractTasksResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ExtractTasksClientError("Received an invalid response from the server.");
  }

  return parsed.data;
}
