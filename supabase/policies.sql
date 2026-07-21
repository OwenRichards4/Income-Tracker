-- Row-Level Security policies for Finance Tracker.
-- Run once in the Supabase SQL editor (Database > SQL Editor) after applying
-- migrations (`npm run db:migrate`). See README.md step 4.
--
-- Each table is scoped so a user can only see/modify their own rows —
-- required before storing real (multi-user) data, since the app itself
-- relies on RLS rather than filtering by user_id in every query.

alter table public.roles enable row level security;
alter table public.shifts enable row level security;
alter table public.wage_entries enable row level security;
alter table public.settings enable row level security;

create policy "roles: owner full access" on public.roles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "shifts: owner full access" on public.shifts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wage_entries: owner full access" on public.wage_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "settings: owner full access" on public.settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
