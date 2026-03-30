
-- HEARTY missing app tables only
-- Safe companion migration for the existing HEARTY schema.
-- This does NOT recreate profiles, purchases, access_grants, tester_invites, or billing_events.

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  onboarding_complete boolean not null default false,
  theme text default 'clean',
  target_weight numeric,
  starting_weight numeric,
  meal_frequency integer default 3,
  leftovers_enabled boolean not null default false,
  dietary_mode text default 'balanced',
  exercise_mode text default 'home',
  support_mode_enabled boolean not null default false,
  support_mode_type text,
  units text not null default 'metric',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  weight numeric not null,
  note text
);
create index if not exists idx_weight_logs_user_logged_at on public.weight_logs(user_id, logged_at desc);

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0)
);
create index if not exists idx_hydration_logs_user_logged_at on public.hydration_logs(user_id, logged_at desc);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  energy integer,
  appetite integer,
  lesson_complete boolean not null default false,
  walk_complete boolean not null default false,
  weigh_in_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_date date not null,
  meal_type text not null,
  title text not null,
  description text,
  support_mode_type text,
  locked boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists idx_meal_plans_user_plan_date on public.meal_plans(user_id, plan_date);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_date date not null default current_date,
  angle text,
  storage_mode text default 'local',
  local_key text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_slug text not null,
  earned_at timestamptz not null default now()
);
create index if not exists idx_user_badges_user_earned_at on public.user_badges(user_id, earned_at desc);

alter table public.user_settings enable row level security;
alter table public.weight_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.meal_plans enable row level security;
alter table public.progress_photos enable row level security;
alter table public.user_badges enable row level security;

do $$ begin
  create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "weight_logs_own_all" on public.weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hydration_logs_own_all" on public.hydration_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "daily_checkins_own_all" on public.daily_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "meal_plans_own_all" on public.meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "progress_photos_own_all" on public.progress_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_badges_own_all" on public.user_badges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
