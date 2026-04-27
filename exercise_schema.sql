-- HEARTY Exercise Production Rollout Schema
-- Local-first client syncs completed sessions and progression events to Supabase.

create table if not exists public.exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text not null,
  mode text not null check (mode in ('home', 'gym')),
  support_mode_active boolean not null default false,
  support_mode_reason text,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null default 'completed' check (status in ('started', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_session_id)
);

create table if not exists public.exercise_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exercise_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null,
  exercise_id text not null,
  exercise_name text not null,
  level integer,
  weight_kg numeric,
  target_min_reps integer,
  target_max_reps integer,
  sets_completed integer not null default 0,
  reps_completed jsonb not null default '[]'::jsonb,
  controlled boolean not null default true,
  progression_paused boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('home', 'gym')),
  pattern text not null,
  exercise_id text not null,
  level integer not null default 1,
  weight_kg numeric,
  top_rep_confirmations integer not null default 0,
  last_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, mode, pattern, exercise_id)
);

create table if not exists public.exercise_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  synced_at timestamptz not null default now(),
  unique(user_id, client_event_id)
);

alter table public.exercise_sessions enable row level security;
alter table public.exercise_session_items enable row level security;
alter table public.exercise_progress enable row level security;
alter table public.exercise_sync_events enable row level security;

create policy "Users can manage own exercise sessions"
on public.exercise_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own exercise session items"
on public.exercise_session_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own exercise progress"
on public.exercise_progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own exercise sync events"
on public.exercise_sync_events for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
