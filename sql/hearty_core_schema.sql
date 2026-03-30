
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  theme text default 'clean',
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starting_weight numeric,
  target_weight numeric,
  meal_frequency integer default 3,
  leftovers_enabled boolean default false,
  dietary_mode text default 'balanced',
  exercise_mode text default 'home',
  support_mode_enabled boolean default false,
  support_mode_type text,
  units text default 'metric',
  created_at timestamptz default now()
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  logged_at timestamptz default now(),
  weight numeric,
  note text
);

create table if not exists hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  logged_at timestamptz default now(),
  amount_ml integer not null
);

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  energy integer,
  appetite integer,
  lesson_complete boolean default false,
  walk_complete boolean default false,
  weigh_in_complete boolean default false,
  unique(user_id, date)
);

create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_date date not null,
  meal_type text not null,
  title text,
  description text,
  support_mode_type text,
  locked boolean default false,
  source text default 'manual'
);

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  photo_date date not null,
  angle text,
  storage_mode text default 'local',
  local_key text,
  notes text
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_slug text not null,
  earned_at timestamptz default now()
);
