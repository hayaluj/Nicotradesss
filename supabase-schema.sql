-- Run this in the Supabase SQL editor
-- Tables created in dependency order

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  tier text default 'free' check (tier in ('free', 'course', 'vip')),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Courses
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  description text,
  price numeric,
  currency text default 'EUR',
  tier text default 'paid' check (tier in ('free', 'paid', 'vip')),
  level text default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  thumbnail_url text,
  status text default 'draft' check (status in ('draft', 'published', 'coming_soon')),
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table courses enable row level security;
create policy "Published courses visible to all" on courses for select using (status = 'published');

-- Enrollments (must exist before lessons policy)
create table if not exists enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  course_id uuid references courses,
  status text default 'active' check (status in ('active', 'cancelled')),
  payment_reference text,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);
alter table enrollments enable row level security;
create policy "Users see own enrollments" on enrollments for select using (auth.uid() = user_id);

-- Lessons (references enrollments in policy)
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses on delete cascade,
  title text not null,
  youtube_id text,
  description text,
  duration_minutes integer,
  sort_order integer default 0,
  is_free_preview boolean default false,
  status text default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz default now()
);
alter table lessons enable row level security;
create policy "Lessons visible to enrolled users" on lessons for select using (
  status = 'published' and (
    is_free_preview = true or
    exists (
      select 1 from enrollments e
      where e.user_id = auth.uid() and e.course_id = lessons.course_id and e.status = 'active'
    ) or
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.tier = 'vip'
    )
  )
);

-- Progress
create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  lesson_id uuid references lessons,
  course_id uuid references courses,
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);
alter table progress enable row level security;
create policy "Users manage own progress" on progress for all using (auth.uid() = user_id);

-- Trading signals
create table if not exists trading_signals (
  id uuid default gen_random_uuid() primary key,
  pair text not null,
  direction text check (direction in ('BUY', 'SELL')),
  entry_price numeric,
  stop_loss numeric,
  take_profit_1 numeric,
  take_profit_2 numeric,
  risk_reward text,
  timeframe text,
  status text default 'active' check (status in ('active', 'hit_tp', 'hit_sl', 'cancelled')),
  notes text,
  tier text default 'vip' check (tier in ('free', 'vip')),
  created_at timestamptz default now()
);
alter table trading_signals enable row level security;
create policy "Signals visible to auth users by tier" on trading_signals for select using (
  auth.uid() is not null and (
    tier = 'free' or
    exists (select 1 from profiles p where p.id = auth.uid() and p.tier = 'vip')
  )
);

-- Bookings
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  user_name text,
  user_email text,
  session_type text default '60min',
  preferred_datetime timestamptz,
  language text default 'en',
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  created_at timestamptz default now()
);
alter table bookings enable row level security;
create policy "Users manage own bookings" on bookings for all using (auth.uid() = user_id);

-- Email subscribers
create table if not exists email_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  language text default 'en',
  source text,
  status text default 'active' check (status in ('active', 'unsubscribed')),
  subscribed_at timestamptz default now()
);
alter table email_subscribers enable row level security;
create policy "Anyone can subscribe" on email_subscribers for insert with check (true);
