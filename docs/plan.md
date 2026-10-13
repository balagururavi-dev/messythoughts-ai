
# MessyThoughts — MVP Plan

## Product Goal
Turn messy thoughts into useful task suggestions with AI, while keeping the user
in control of every task that gets saved.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Gemini via @google/genai
- Zod
- Vitest and React Testing Library
- Browser localStorage
- Vercel deployment

## MVP Scope

### Phase 1 — Foundation
- [x] Create project and verify build
- [x] Establish domain types and Zod schemas
- [x] Establish feature-oriented architecture

### Phase 2 — AI Extraction
- [x] Define structured extraction output
- [x] Implement server-side Gemini integration
- [x] Validate model output and relative dates
- [x] Handle empty input, malformed output, and provider failures
- [x] Add mocked unit tests

### Phase 3 — Review Experience
- [x] Build brain-dump input
- [x] Generate suggestions
- [x] Allow editing, accepting, and discarding suggestions
- [x] Keep suggestions separate from saved tasks
- [x] Add loading, error, and empty states

### Phase 4 — Task Management
- [x] Save accepted tasks with application-generated IDs
- [x] Support editing, completion, and deletion
- [x] Add search and filtering
- [x] Persist tasks in localStorage
- [x] Validate stored data and handle corrupted storage

### Phase 5 — Quality and Release
- [x] Test important user journeys (mocked AI / storage)
- [x] Verify responsive and accessible UI patterns in product UI
- [x] Verify production build
- [ ] Configure production environment variables on the host
- [ ] Deploy to Vercel

## Product hardening notes
- Gemini credentials remain server-only (`GEMINI_API_KEY`, never `NEXT_PUBLIC_`).
- Extract route validates requests/timezone, returns stable errors, and applies
  best-effort in-memory rate limiting (not distributed across serverless isolates).
- Brain-dump clear/copy/export utilities are available with accessible feedback.
- Portfolio attribution: Built by Balaguru Ravi — https://www.balagururavi.com

## Out of Scope
- User accounts and cloud sync
- Multi-agent orchestration
- Vector databases and RAG
- Calendar integrations and notifications
- Automatic task creation without confirmation
- Distributed / shared rate-limit store

## Working Agreement
Work on one checkpoint at a time. Update this plan when a checkpoint is
completed. Do not start the next checkpoint without user approval.
