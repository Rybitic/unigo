-- UniGO schema for Supabase. Mirrors the localStorage data model in src/lib/db.js.
-- Auth users live in auth.users; profiles extend them 1:1.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  avatar text,
  headline text,
  university text,
  bio text,
  city text,
  country text,
  format text check (format in ('online', 'in-person', 'both')) default 'both',
  available_days text[] default '{}',
  available_times text[] default '{}',
  interests text[] default '{}',
  onboarded boolean default false,
  created_at timestamptz default now()
);

create table profile_skills (
  profile_id uuid references profiles on delete cascade,
  skill text not null,
  direction text check (direction in ('teach', 'learn')) not null,
  level text check (level in ('Beginner', 'Intermediate', 'Advanced', 'Expert')) not null,
  primary key (profile_id, skill, direction)
);

create table swipes (
  from_id uuid references profiles on delete cascade,
  to_id uuid references profiles on delete cascade,
  action text check (action in ('like', 'pass')) not null,
  created_at timestamptz default now(),
  primary key (from_id, to_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles on delete cascade,
  user_b uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

-- Create a match automatically when a like is reciprocated.
create function handle_like() returns trigger language plpgsql security definer as $$
begin
  if new.action = 'like' and exists (
    select 1 from swipes where from_id = new.to_id and to_id = new.from_id and action = 'like'
  ) then
    insert into matches (user_a, user_b)
    values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id))
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_like after insert or update on swipes for each row execute function handle_like();

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches on delete cascade,
  sender_id uuid references profiles on delete cascade,
  body text,
  session_id uuid,
  created_at timestamptz default now()
);

create table learning_sessions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches on delete cascade,
  proposer uuid references profiles,
  teacher uuid references profiles,
  learner uuid references profiles,
  skill text not null,
  date date not null,
  time time not null,
  duration int not null,
  format text,
  place text,
  note text,
  status text check (status in ('proposed', 'confirmed', 'completed', 'declined', 'cancelled')) default 'proposed',
  created_at timestamptz default now()
);

-- Row level security: profiles are public to signed-in users; everything
-- else is visible only to the people involved.
alter table profiles enable row level security;
alter table profile_skills enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table learning_sessions enable row level security;

create policy "read profiles" on profiles for select to authenticated using (true);
create policy "edit own profile" on profiles for all using (auth.uid() = id);
create policy "read skills" on profile_skills for select to authenticated using (true);
create policy "edit own skills" on profile_skills for all using (auth.uid() = profile_id);
create policy "own swipes" on swipes for all using (auth.uid() = from_id);
create policy "own matches" on matches for select using (auth.uid() in (user_a, user_b));
create policy "match messages" on messages for all using (
  exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b))
);
create policy "match sessions" on learning_sessions for all using (
  exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b))
);
