# Solas Attendance Tracker

SvelteKit app for tracking attendance. Uses Supabase for auth and data.

Optional: set `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` (EU default) for staff-app usage analytics. Session replay and autocapture are off; events do not include PII. Leave the key empty locally and in CI.

## Developing

Local work always uses **local Supabase** (`supabase start`), not a remote staging project — even if `.env` still has remote keys.

```bash
npm install
npm run supabase:start   # Docker required; applies migrations in supabase/
npm run seed:dev         # seeds the local stack
npm run dev              # vite with local Supabase env forced
```

Optional: `npm run supabase:env` writes local keys into `.env` (useful for tools that only read the file). Plain Vite without the local wrapper: `npm run dev:vite`.

## Testing

Unit tests need no database:

```bash
npm run test:unit
```

E2E (local Supabase required):

```bash
npm run supabase:start
npm run test:e2e
```

To seed a remote staging project instead: set `SEED_REMOTE=1`, `SEED_ALLOWED_SUPABASE_REFS`, and remote `PUBLIC_SUPABASE_*` in `.env` — never commit real project refs.

CI (`.github/workflows/test.yml`) starts local Supabase on the runner the same way.

## Building

```bash
npm run build
npm run preview
```

> To deploy, use the Vercel adapter already configured for this project.
