-- Hearty Meals Production Database Schema
-- Supabase / Postgres migration

create extension if not exists pgcrypto;

create table if not exists public.meal_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  country text not null default 'ZA',
  diet_type text not null default 'omnivore',
  proteins text[] not null default '{}',
  breakfast_preference text not null default 'both',
  starches text[] not null default '{}',
  vegetables text[] not null default '{}',
  fruits text[] not null default '{}',
  snacks_enabled boolean not null default false,
  dinner_for_lunch boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_preferences_country_check check (country in ('ZA','UK','US','CA','AU','OTHER')),
  constraint meal_preferences_diet_type_check check (diet_type in ('omnivore','vegetarian')),
  constraint meal_preferences_breakfast_check check (breakfast_preference in ('eggs','bowls','both'))
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  country text not null,
  diet_type text not null,
  snacks_enabled boolean not null default false,
  dinner_for_lunch boolean not null default false,
  plan jsonb not null,
  locked_meals jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start),
  constraint meal_plans_country_check check (country in ('ZA','UK','US','CA','AU','OTHER')),
  constraint meal_plans_diet_type_check check (diet_type in ('omnivore','vegetarian')),
  constraint meal_plans_plan_is_array check (jsonb_typeof(plan) = 'array'),
  constraint meal_plans_locked_meals_is_object check (jsonb_typeof(locked_meals) = 'object')
);

create table if not exists public.meal_plan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  event_type text not null,
  day_index int,
  meal_slot text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint meal_plan_events_event_type_check check (event_type in (
    'generated_week','regenerated_day','regenerated_meal','locked_meal',
    'unlocked_meal','changed_preferences','loaded_plan'
  )),
  constraint meal_plan_events_day_index_check check (day_index is null or (day_index >= 0 and day_index <= 6)),
  constraint meal_plan_events_slot_check check (meal_slot is null or meal_slot in (
    'breakfast','morningSnack','lunch','afternoonSnack','dinner'
  )),
  constraint meal_plan_events_details_is_object check (jsonb_typeof(details) = 'object')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_meal_preferences_updated_at on public.meal_preferences;
create trigger trg_meal_preferences_updated_at
before update on public.meal_preferences
for each row execute function public.set_updated_at();

drop trigger if exists trg_meal_plans_updated_at on public.meal_plans;
create trigger trg_meal_plans_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

alter table public.meal_preferences enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_events enable row level security;

drop policy if exists "Users can select own meal preferences" on public.meal_preferences;
create policy "Users can select own meal preferences" on public.meal_preferences
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal preferences" on public.meal_preferences;
create policy "Users can insert own meal preferences" on public.meal_preferences
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own meal preferences" on public.meal_preferences;
create policy "Users can update own meal preferences" on public.meal_preferences
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meal preferences" on public.meal_preferences;
create policy "Users can delete own meal preferences" on public.meal_preferences
for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own meal plans" on public.meal_plans;
create policy "Users can select own meal plans" on public.meal_plans
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal plans" on public.meal_plans;
create policy "Users can insert own meal plans" on public.meal_plans
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own meal plans" on public.meal_plans;
create policy "Users can update own meal plans" on public.meal_plans
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meal plans" on public.meal_plans;
create policy "Users can delete own meal plans" on public.meal_plans
for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own meal events" on public.meal_plan_events;
create policy "Users can select own meal events" on public.meal_plan_events
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal events" on public.meal_plan_events;
create policy "Users can insert own meal events" on public.meal_plan_events
for insert with check (auth.uid() = user_id);

create index if not exists idx_meal_plans_user_week on public.meal_plans(user_id, week_start desc);
create index if not exists idx_meal_events_user_created on public.meal_plan_events(user_id, created_at desc);
create index if not exists idx_meal_events_plan on public.meal_plan_events(meal_plan_id);
