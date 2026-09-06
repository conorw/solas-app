# Solas Attendance Tracker

SvelteKit app for tracking attendance. Uses Supabase for auth and data.

## Developing

```bash
npm install
npm run supabase:start   # Docker required; applies migrations in supabase/
# Copy keys from `npm run supabase:status` into .env (or use npm run test:e2e:local)
npm run seed:dev
npm run dev
```

## Testing

Unit tests need no database:

```bash
npm run test:unit
```

E2E against **local Supabase** (no remote project / GitHub secrets):

```bash
npm run supabase:start
npm run test:e2e:local
```

Or step by step: start Supabase, put `PUBLIC_SUPABASE_*` + service role from `supabase status` into `.env`, set `TEST_*` users, then `npm run seed:dev` and `npm run test:e2e`.

To seed a remote staging project instead, set `SEED_ALLOWED_SUPABASE_REFS` (and optionally `SEED_BLOCKED_SUPABASE_REFS`) in `.env` — never commit real project refs.

CI (`.github/workflows/test.yml`) starts local Supabase on the runner the same way.

## Building

```bash
npm run build
npm run preview
```

> To deploy, use the Vercel adapter already configured for this project.
