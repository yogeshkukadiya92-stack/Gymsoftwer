create table if not exists profiles (
  id text primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('member', 'trainer', 'admin')),
  fitness_goal text,
  branch text,
  joined_on date not null default now()
);

create table if not exists memberships (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  plan_name text not null,
  status text not null check (status in ('Active', 'Expiring Soon', 'On Hold')),
  start_date date not null,
  renewal_date date not null
);

create table if not exists exercises (
  id text primary key,
  name text not null,
  category text not null,
  difficulty text not null,
  primary_muscle text not null,
  equipment text not null,
  media_type text not null,
  media_url text not null,
  cues text[] not null default '{}'
);

create table if not exists workout_plans (
  id text primary key,
  name text not null,
  goal text not null,
  coach text not null,
  split text not null,
  duration_weeks integer not null
);

create table if not exists workout_plan_exercises (
  id text primary key,
  workout_plan_id text not null references workout_plans(id) on delete cascade,
  exercise_id text not null references exercises(id) on delete cascade,
  sets integer not null,
  reps text not null,
  rest_seconds integer not null,
  notes text not null
);

create table if not exists member_workout_assignments (
  id text primary key,
  plan_id text not null references workout_plans(id) on delete cascade,
  member_id text not null references profiles(id) on delete cascade,
  start_date date not null,
  status text not null check (status in ('Active', 'Paused', 'Completed'))
);

create table if not exists workout_logs (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  exercise_id text not null references exercises(id) on delete cascade,
  date date not null,
  sets_completed integer not null,
  reps_completed text not null,
  weight_kg numeric not null,
  notes text
);

create table if not exists classes_or_sessions (
  id text primary key,
  title text not null,
  coach text not null,
  day text not null,
  time text not null,
  capacity integer not null,
  room text not null
);

create table if not exists attendance (
  id text primary key,
  session_id text not null references classes_or_sessions(id) on delete cascade,
  member_id text not null references profiles(id) on delete cascade,
  status text not null check (status in ('Booked', 'Checked In', 'Missed'))
);
