-- Bu miqrasiya yalnız ayrıca seçilmiş layihədə icra edilməlidir.
create table if not exists public.skillproof_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  data jsonb not null default '{"vacancies": []}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.skillproof_workspaces enable row level security;
revoke all on public.skillproof_workspaces from anon;
grant select, insert, update on public.skillproof_workspaces to authenticated;

create policy "HR reads own workspace" on public.skillproof_workspaces
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "HR inserts own workspace" on public.skillproof_workspaces
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "HR updates own workspace" on public.skillproof_workspaces
for update to authenticated using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
