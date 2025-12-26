-- Secret Santa Database Schema
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Rooms table: stores the game state
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  opening_order text[] default '{}',
  current_index integer default 0,
  round_started_at timestamptz,
  duration_sec integer default 180,
  is_started boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Submissions table: stores player guesses
create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  player_name text not null,
  round_index integer not null,
  guessed_santa_name text not null,
  created_at timestamptz default now(),

  -- Ensure one submission per player per round
  unique(room_id, player_name, round_index)
);

-- Indexes for better performance
create index if not exists idx_submissions_room on submissions(room_id);
create index if not exists idx_submissions_player_round on submissions(player_name, round_index);

-- Enable Row Level Security (RLS)
alter table rooms enable row level security;
alter table submissions enable row level security;

-- RLS Policies: Allow all operations for now (adjust for production)
create policy "Allow all operations on rooms"
  on rooms for all
  using (true)
  with check (true);

create policy "Allow all operations on submissions"
  on submissions for all
  using (true)
  with check (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_rooms_updated_at
  before update on rooms
  for each row
  execute function update_updated_at_column();

-- Enable Realtime for the rooms table
alter publication supabase_realtime add table rooms;

-- Comments for documentation
comment on table rooms is 'Stores the state of each Secret Santa game session';
comment on table submissions is 'Stores player guesses for who each recipient''s Secret Santa is';
comment on column rooms.opening_order is 'Randomized array of all player names in opening order';
comment on column rooms.current_index is 'Index into opening_order for current recipient';
comment on column rooms.round_started_at is 'Timestamp when current round started';
comment on column rooms.duration_sec is 'Timer duration in seconds for each round';
comment on column submissions.round_index is 'Index of the round (matches rooms.current_index)';
