create extension if not exists "pgcrypto";

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content_json jsonb not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);
create index if not exists resumes_updated_at_idx on public.resumes (updated_at desc);

alter table public.resumes enable row level security;

create policy "users can view own resumes"
on public.resumes
for select
using (auth.uid() = user_id);

create policy "users can insert own resumes"
on public.resumes
for insert
with check (auth.uid() = user_id);

create policy "users can update own resumes"
on public.resumes
for update
using (auth.uid() = user_id);

create policy "users can delete own resumes"
on public.resumes
for delete
using (auth.uid() = user_id);
