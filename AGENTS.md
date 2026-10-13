# MessyThoughts — Agent Instructions

## Product
MessyThoughts converts unstructured thoughts into actionable task suggestions.
Users review, edit, accept, or discard every suggestion before it becomes a saved task.

## Engineering
- Use the existing Next.js App Router, TypeScript, and Tailwind setup.
- Inspect relevant existing files before changing code. Follow established patterns.
- Keep UI, domain logic, API validation, and AI provider integration separate.
- Use Zod at external boundaries, including requests, AI outputs, and persisted data.
- Keep Gemini API credentials server-side. Never expose secrets to client code.
- Treat AI output as untrusted input. Never execute model-generated code or actions.
- AI must not invent tasks, deadlines, or certainty. Preserve ambiguity.
- Generate task IDs and creation timestamps in application code, not the model.
- Persist MVP tasks locally in the browser; do not introduce authentication or a database.
- Prefer small, typed, testable functions over unnecessary abstractions.

## Workflow
- Implement only the current requested task.
- Inspect package scripts and existing architecture before choosing commands or libraries.
- Avoid unrelated refactors, new dependencies, and speculative features.
- Do not overwrite existing work without inspecting it first.
- Run relevant tests, lint, type checks, and build when available.
- Never claim a check passed unless you ran it and verified the result.
- Report changed files, checks performed, and any unresolved issues.
- Stop at the task checkpoint and wait for user approval before continuing.
- Do not repeat the entire project plan in every response.