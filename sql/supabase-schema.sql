-- Таблиця сімей
create table families (
  id uuid default gen_random_uuid() primary key,
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- Члени сім'ї
create table family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(family_id, user_id)
);

-- Стан таймера (один рядок на сім'ю на день)
create table timer_state (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references families(id) on delete cascade not null,
  date date not null default current_date,
  active_parent text check (active_parent in ('mama', 'papa')),
  mama_time_ms bigint default 0,
  papa_time_ms bigint default 0,
  last_switch_at timestamptz,
  updated_at timestamptz default now(),
  unique(family_id, date)
);

-- Індекси
create index idx_family_members_user on family_members(user_id);
create index idx_timer_state_family_date on timer_state(family_id, date);

-- RLS (Row Level Security)
alter table families enable row level security;
alter table family_members enable row level security;
alter table timer_state enable row level security;

-- Політики: користувач бачить тільки свою сім'ю
create policy "Users can view their families"
  on families for select
  using (id in (select family_id from family_members where user_id = auth.uid()));

create policy "Users can view any family by invite code"
  on families for select
  using (true);

create policy "Authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

create policy "Users can view their family members"
  on family_members for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Authenticated users can join families"
  on family_members for insert
  with check (auth.uid() = user_id);

create policy "Users can view their timer state"
  on timer_state for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Users can insert timer state"
  on timer_state for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Users can update timer state"
  on timer_state for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Увімкнути realtime для timer_state
alter publication supabase_realtime add table timer_state;
