# Aktivly

Activity booking and participant management platform. Create activities, invite participants by email, and track RSVPs.

## Getting started

```bash
npm install
npm run dev
```

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Commands

```bash
npm run dev          # Dev server at http://localhost:8080
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests
```

## Update databases:

npx supabase link --project-ref sovuuhzyeyegzizqqoyi
npx supabase db push

npx supabase link --project-ref etggxmisotmbiokcnnvb
npx supabase db push