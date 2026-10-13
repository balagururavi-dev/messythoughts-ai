
---
name: implement-one-task
description: Implement one approved MessyThoughts development checkpoint, validate it, and stop for user review.
---

# Implement One Task

## Before coding
1. Read AGENTS.md.
2. Read the relevant section of docs/plan.md.
3. Inspect the files directly related to the requested task.
4. Identify existing patterns and constraints.
5. Summarize the intended changes briefly if the task is ambiguous.

## Implementation
1. Implement only the approved checkpoint.
2. Prefer modifying existing code over creating duplicate abstractions.
3. Avoid unrelated refactoring and dependency additions.
4. Follow existing naming, typing, and error-handling conventions.
5. Add focused tests for the behavior being implemented.
6. Do not make live AI calls when a mocked provider is sufficient.

## Verification
1. Run the smallest relevant test suite first.
2. Run applicable lint and type checks.
3. Run the production build when appropriate.
4. Fix regressions introduced by the change.
5. Never report a command as successful without verifying its output.

## Completion response
Report:
- What changed
- Files created or modified
- Checks actually run and their results
- Known limitations or unresolved issues
- The next checkpoint, without implementing it

Stop and wait for user approval.