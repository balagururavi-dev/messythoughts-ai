# MessyThoughts

Turn messy thoughts into task suggestions with Gemini AI — review and accept only what you want saved. Tasks stay in your browser (`localStorage`); nothing is auto-saved.

Built by [Balaguru Ravi](https://www.balagururavi.com).

## Features

- Brain dump → structured AI suggestions (title, description, priority, due date)
- Edit, accept, or discard each suggestion before it becomes a task
- Saved-task dashboard with search, filters, edit, complete, and delete
- Clear / copy / export for the brain dump; copy / export for saved tasks
- Light and dark themes (preference stored locally)
- Server-side Gemini extraction with Zod validation and fail-closed parsing

## Stack

- Next.js App Router, React 19, TypeScript
- Tailwind CSS v4
- Gemini via `@google/genai`
- Zod
- Vitest + React Testing Library
- Browser `localStorage`

## Getting started

```bash
npm install
cp .env.example .env.local
```

Set credentials in `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
# Optional model override (defaults to gemini-3.1-flash-lite)
# GEMINI_MODEL=
```

Never expose these as `NEXT_PUBLIC_*` — they must stay server-only.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start the development server |
| `npm run build`   | Production build           |
| `npm run start`   | Serve the production build |
| `npm run lint`    | Run ESLint                 |
| `npm test`        | Run unit/UI tests once     |
| `npm run test:watch` | Vitest watch mode       |

## Project layout

```
src/
  app/                 # App Router pages and API routes
  components/          # Shared chrome (header, theme, brand)
  features/tasks/      # Domain UI, schemas, extraction, storage hooks
  lib/                 # Gemini client, rate limit, theme, storage
docs/
  plan.md              # MVP plan and checkpoints
  current-state.md     # What’s done / next
```

## Notes

- Suggestions never become saved tasks until you accept them.
- Extract API applies best-effort in-memory rate limiting (per serverless isolate, not fleet-wide).
- See `docs/plan.md` for scope and out-of-scope items.

## Deploy

1. Set `GEMINI_API_KEY` on the host (e.g. Vercel project env).
2. Deploy the Next.js app as usual (`npm run build` / Vercel).
