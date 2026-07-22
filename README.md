# Finance Tracker

Shift and income logging PWA with tax-estimate tooling. See `bartender-tracker-project-brief.md` for product context.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres via Supabase, accessed through Drizzle ORM
- Supabase Auth (with Row-Level Security scoping each row to its owner)

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API
   - `DATABASE_URL` — Project Settings → Database → use the pooled **Transaction** connection string
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally; on Vercel, set this to the deployed URL in the project's env vars (used to build the magic-link redirect — see step 5)
3. Install dependencies and push the schema:
   ```bash
   npm install
   npm run db:generate   # writes SQL migrations from src/db/schema.ts
   npm run db:migrate    # applies them
   ```
   The first generated migration (`drizzle/0000_*.sql`) has already been hand-edited to drop
   its `CREATE TABLE auth.users` statement — that table is owned by Supabase and already
   exists. `src/db/schema.ts` still declares a stub `authUsers` table so Drizzle can type the
   foreign keys; only the FK constraints from the migration should touch it, never a `CREATE`.
4. In the Supabase SQL editor, run `supabase/policies.sql` — enables Row-Level Security on `roles`, `shifts`, `wage_entries`, and `settings`, scoping each to `auth.uid() = user_id`. Do this before storing real data.
5. In the Supabase dashboard, confirm **Email** is enabled under Authentication → Providers (it is by default) — sign-in uses passwordless magic links, not passwords. Under Authentication → URL Configuration, set **Site URL** and add each deployment's URL (including `NEXT_PUBLIC_SITE_URL`'s value) to **Redirect URLs** as `<url>/**`, or magic links won't be allowed to redirect back.
6. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Project layout

- `src/db/schema.ts` — Drizzle table definitions (`roles`, `shifts`, `wage_entries`, `settings`)
- `src/db/index.ts` — Drizzle client
- `supabase/policies.sql` — Row-Level Security policies (run manually in the SQL editor; see Setup step 4)
- `src/lib/supabase/` — browser/server/middleware Supabase Auth clients
- `src/proxy.ts` — refreshes the Supabase session cookie on every request (Next 16's replacement for `middleware.ts`)
- `src/app/login/`, `src/app/auth/` — magic-link sign-in page and callback/sign-out routes
- `src/lib/tax/estimate.ts` — flat-rate tax estimate calculation, isolated as its own module
- `src/app/manifest.ts`, `src/app/icon*.tsx` — PWA manifest and placeholder app icons (swap once visual design is finalized)

Offline support (service worker + background sync) is deferred until the core logging/dashboard flows exist — see the brief's feature priority list.
