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

create table if not exists gym_branches (
  id text primary key,
  name text not null,
  city text not null default '',
  address text not null default '',
  manager_name text not null default '',
  phone text not null default '',
  kind text not null check (kind in ('Physical', 'Online'))
);

create table if not exists integration_api_keys (
  id text primary key,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes jsonb not null default '[]'::jsonb,
  status text not null check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists memberships (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  plan_name text not null,
  status text not null check (status in ('Active', 'Expiring Soon', 'On Hold')),
  start_date date not null,
  renewal_date date not null,
  billing_cycle text check (billing_cycle in ('Monthly', 'Quarterly', 'Yearly')),
  amount_inr numeric default 0,
  payment_status text check (payment_status in ('Paid', 'Pending', 'Overdue', 'Partially Paid')),
  last_payment_date date,
  next_invoice_date date,
  payment_method text check (payment_method in ('UPI', 'Cash', 'Bank Transfer', 'Card')),
  outstanding_amount_inr numeric default 0
);

create table if not exists invoices (
  id text primary key,
  membership_id text not null references memberships(id) on delete cascade,
  member_id text not null references profiles(id) on delete cascade,
  invoice_number text not null,
  issued_on date not null,
  due_on date not null,
  amount_inr numeric not null default 0,
  status text not null check (status in ('Paid', 'Pending', 'Overdue', 'Partially Paid')),
  paid_on date,
  payment_method text check (payment_method in ('UPI', 'Cash', 'Bank Transfer', 'Card'))
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
  room text not null,
  zoom_link text
);

create table if not exists attendance (
  id text primary key,
  session_id text not null references classes_or_sessions(id) on delete cascade,
  member_id text not null references profiles(id) on delete cascade,
  status text not null check (status in ('Booked', 'Checked In', 'Missed'))
);

create table if not exists progress_check_ins (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric not null default 0,
  waist_cm numeric not null default 0,
  hips_cm numeric not null default 0,
  chest_cm numeric not null default 0,
  thigh_cm numeric not null default 0,
  coach_note text not null default '',
  energy_level text not null check (energy_level in ('Low', 'Medium', 'High'))
);

create table if not exists progress_photos (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  recorded_on date not null,
  label text not null,
  image_url text not null,
  note text not null default ''
);

create table if not exists inventory_items (
  id text primary key,
  name text not null,
  category text not null,
  supplement_type text,
  brand text not null default '',
  flavor text not null default '',
  supplier_name text not null default '',
  sku text not null unique,
  batch_code text not null default '',
  unit_size text not null default '',
  expiry_date date,
  stock_units integer not null default 0,
  reorder_level integer not null default 0,
  cost_price_inr numeric not null default 0,
  selling_price_inr numeric not null default 0,
  status text not null check (status in ('In Stock', 'Low Stock', 'Out of Stock'))
);

create table if not exists inventory_sales (
  id text primary key,
  item_id text not null references inventory_items(id) on delete cascade,
  sold_on date not null,
  quantity integer not null default 1,
  total_amount_inr numeric not null default 0,
  customer_name text not null default '',
  payment_method text not null check (payment_method in ('UPI', 'Cash', 'Bank Transfer', 'Card'))
);

create table if not exists intake_forms (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  audience text not null default '',
  status text not null check (status in ('Active', 'Draft')),
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists intake_form_responses (
  id text primary key,
  form_id text not null references intake_forms(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb
);

create table if not exists leads (
  id text primary key,
  full_name text not null,
  phone text not null,
  goal text not null default '',
  source text not null,
  status text not null,
  assigned_to text not null default '',
  next_follow_up date not null,
  note text not null default ''
);

create table if not exists diet_plans (
  id text primary key,
  member_name text not null,
  coach text not null default '',
  goal text not null,
  calories integer not null default 0,
  protein_grams integer not null default 0,
  meals jsonb not null default '[]'::jsonb,
  adherence integer not null default 0,
  updated_on date not null
);

create table if not exists custom_whatsapp_campaigns (
  id text primary key,
  title text not null,
  scheduled_for text not null default '',
  message text not null,
  recipients jsonb not null default '[]'::jsonb
);

create table if not exists trainer_notes (
  id text primary key,
  member_id text not null references profiles(id) on delete cascade,
  member_name text not null,
  trainer_name text not null default '',
  note text not null,
  focus_area text not null default '',
  updated_on date not null
);

create table if not exists user_permissions (
  user_id text primary key references profiles(id) on delete cascade,
  access_label text not null default '',
  allowed_routes jsonb not null default '[]'::jsonb
);
