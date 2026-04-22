# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # ESLint
npm run preview      # Preview production build
npm run test         # Run tests once (Vitest)
npm run test:watch   # Watch mode
```

## Architecture

**Aktivly** is a Swedish-language activity booking and participant management SaaS. Users create activities (one-time or recurring), invite participants by email, and track RSVPs.

### Tech Stack

- **React 18 + TypeScript** via Vite (SWC compiler)
- **Routing**: React Router DOM v6
- **Server state**: TanStack Query v5 — cache keys follow `["activities", userId]`, `["activity", id]`, `["participated-activities", userId]` patterns
- **Forms**: React Hook Form + Zod validation
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS with HSL CSS variables
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Package manager**: Bun (bun.lockb) — also has package-lock.json, either works

### Path Aliases

`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### Supabase Integration

Client is initialized in `src/integrations/supabase/client.ts`. Requires two env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Row-Level Security is enforced at the database level. Migrations live in `supabase/migrations/`.

### Auth

`useAuth` hook (context-based, wraps the entire app) manages Supabase sessions with a **10-minute inactivity timeout** — it listens for mousedown, keydown, touchstart, scroll, mousemove and signs out on idle.

### Routing Structure

```
/                  Landing page (Hero, Features, FAQ, Pricing)
/login  /signup    Auth pages
/dashboard         Main authenticated hub with stats and upcoming events
/create            Activity creation form
/activity/:id      Detail, edit, participant management
/my-bookings       Activities the current user has joined
/booking/:id       Public participant booking/RSVP confirmation
/profile           User profile management
```

### Database Schema (key tables)

| Table | Key columns | Notes |
|-------|------------|-------|
| `activities` | `user_id`, `is_recurring`, `recurrence_type`, `recurrence_end_date`, `parent_activity_id` | `parent_activity_id` links child events to recurring template |
| `participants` | `activity_id`, `user_id` (nullable), `name`, `email`, `status`, `reason` | status: confirmed/pending/declined/waitlist/maybe |
| `profiles` | `user_id` (unique), `display_name`, `email`, `phone` | auto-created by trigger on auth.users insert |
| `activity_invitees` | `activity_id`, `name`, `email` | default invitee list for recurring activities |

### Recurring Activities

Templates have `is_recurring=true` with `recurrence_type` (weekly/monthly) and `recurrence_end_date`. Child occurrences store `parent_activity_id`. The dashboard shows the template plus its next 5 occurrences. Invitations are calculated to send 5 days before each occurrence.

### UI Conventions

- All UI text is **Swedish**
- Colors use HSL CSS variables (`--primary`, `--success`, `--warning`, `--destructive`)
- Custom Tailwind utilities: `gradient-primary`, `gradient-hero`
- Animations: `fade-in`, `slide-in`, `scale-in` with staggered delays
- Participant status badges use a shared status config object for consistent styling

### TypeScript Config

`tsconfig.json` has relaxed settings: `noImplicitAny: false`, `strictNullChecks: false`. Don't tighten these without verifying no breakage.
