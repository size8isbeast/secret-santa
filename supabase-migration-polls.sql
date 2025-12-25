-- Migration: Add poll voting tables and other missing features
-- Run this SQL in your Supabase SQL Editor

-- Add active_players column to rooms table (if it doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'rooms' and column_name = 'active_players'
  ) then
    alter table rooms add column active_players text[] default '{}';
  end if;
end $$;

-- Add results_unlocked column to rooms table (if it doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'rooms' and column_name = 'results_unlocked'
  ) then
    alter table rooms add column results_unlocked boolean default false;
  end if;
end $$;

-- Add poll_unlocked column to rooms table (if it doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'rooms' and column_name = 'poll_unlocked'
  ) then
    alter table rooms add column poll_unlocked boolean default false;
  end if;
end $$;

-- Add sweater_poll_unlocked column to rooms table (if it doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'rooms' and column_name = 'sweater_poll_unlocked'
  ) then
    alter table rooms add column sweater_poll_unlocked boolean default false;
  end if;
end $$;

-- Add guessed_santas and game_mode columns to submissions table (if they don't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'submissions' and column_name = 'guessed_santas'
  ) then
    alter table submissions add column guessed_santas text[] default '{}';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'submissions' and column_name = 'game_mode'
  ) then
    alter table submissions add column game_mode text default 'risk';
  end if;
end $$;

-- Actual Santas table: stores the revealed Secret Santa for each round
create table if not exists actual_santas (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  round_index integer not null,
  actual_santa_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure one actual Santa per round per room
  unique(room_id, round_index)
);

-- Poll Votes table: stores votes for "Best Gift Sender"
create table if not exists poll_votes (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  voter_name text not null,
  voted_for text not null,
  created_at timestamptz default now(),

  -- Ensure one vote per voter per room
  unique(room_id, voter_name)
);

-- Sweater Votes table: stores votes for "Ugliest Sweater"
create table if not exists sweater_votes (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  voter_name text not null,
  voted_for text not null,
  created_at timestamptz default now(),

  -- Ensure one vote per voter per room
  unique(room_id, voter_name)
);

-- Indexes for better performance
create index if not exists idx_actual_santas_room on actual_santas(room_id);
create index if not exists idx_poll_votes_room on poll_votes(room_id);
create index if not exists idx_sweater_votes_room on sweater_votes(room_id);

-- Enable Row Level Security (RLS)
alter table actual_santas enable row level security;
alter table poll_votes enable row level security;
alter table sweater_votes enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Allow all operations on actual_santas" on actual_santas;
drop policy if exists "Allow all operations on poll_votes" on poll_votes;
drop policy if exists "Allow all operations on sweater_votes" on sweater_votes;

-- RLS Policies: Allow all operations for development (adjust for production)
create policy "Allow all operations on actual_santas"
  on actual_santas for all
  using (true)
  with check (true);

create policy "Allow all operations on poll_votes"
  on poll_votes for all
  using (true)
  with check (true);

create policy "Allow all operations on sweater_votes"
  on sweater_votes for all
  using (true)
  with check (true);

-- Trigger to auto-update updated_at for actual_santas
create trigger update_actual_santas_updated_at
  before update on actual_santas
  for each row
  execute function update_updated_at_column();

-- Comments for documentation
comment on table actual_santas is 'Stores the revealed Secret Santa for each round (for scoring)';
comment on table poll_votes is 'Stores votes for who gave the best gift';
comment on table sweater_votes is 'Stores votes for who has the ugliest sweater';
