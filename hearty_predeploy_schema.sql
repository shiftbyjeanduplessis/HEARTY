-- Hearty predeploy Supabase schema
-- Run this once in Supabase SQL Editor after auth is enabled.
-- This schema stores settings and progress. Progress photos remain local-only.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  user_name text,
  account_email text,
  height_cm numeric,
  starting_weight_kg numeric,
  current_weight_kg numeric,
  target_weight_kg numeric,
  medication_name text,
  injection_name text,
  injection_dose text,
  injection_day text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'clean_blue',
  units_system text not null default 'metric',
  hydration_auto boolean not null default true,
  hydration_target_litres numeric not null default 3.0,
  social_enabled boolean not null default true,
  injection_reminder_enabled boolean not null default true,
  photo_privacy text not null default 'local_only',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_check check (theme in ('clean_blue','sunlit','midnight','rose_aurora')),
  constraint user_settings_units_check check (units_system in ('metric','imperial')),
  constraint user_settings_photo_privacy_check check (photo_privacy in ('local_only','metadata_only'))
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  weight_kg numeric not null,
  source text default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  litres numeric not null default 0,
  glass_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.injection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  logged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.support_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  nausea integer not null default 0,
  low_appetite integer not null default 0,
  fatigue integer not null default 0,
  constipation integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date),
  constraint support_logs_range check (
    nausea between 0 and 100 and low_appetite between 0 and 100 and fatigue between 0 and 100 and constipation between 0 and 100
  )
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null,
  completed_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  unique(user_id, lesson_key)
);

create table if not exists public.badge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  unique(user_id, badge_key)
);

create table if not exists public.daily_task_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  task_key text not null,
  completed boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date, task_key)
);

create table if not exists public.meal_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_week_start date,
  plan_json jsonb not null default '{}'::jsonb,
  locked_meals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  mode text,
  session_json jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  share_photos_updates boolean not null default true,
  share_water boolean not null default false,
  posts_local_only boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','user_settings','weight_logs','hydration_logs','injection_logs','support_logs',
    'daily_task_logs','meal_plan_snapshots','exercise_sessions','social_settings'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.weight_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.injection_logs enable row level security;
alter table public.support_logs enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.badge_events enable row level security;
alter table public.daily_task_logs enable row level security;
alter table public.meal_plan_snapshots enable row level security;
alter table public.exercise_sessions enable row level security;
alter table public.social_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','user_settings','weight_logs','hydration_logs','injection_logs','support_logs',
    'lesson_progress','badge_events','daily_task_logs','meal_plan_snapshots','exercise_sessions','social_settings'
  ] loop
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);
    execute format('create policy "%s_select_own" on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_update_own" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- Helpful indexes
create index if not exists weight_logs_user_date_idx on public.weight_logs(user_id, log_date desc);
create index if not exists hydration_logs_user_date_idx on public.hydration_logs(user_id, log_date desc);
create index if not exists support_logs_user_date_idx on public.support_logs(user_id, log_date desc);
create index if not exists injection_logs_user_date_idx on public.injection_logs(user_id, log_date desc);
create index if not exists exercise_sessions_user_date_idx on public.exercise_sessions(user_id, session_date desc);
