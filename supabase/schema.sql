-- UniGO database schema for Supabase.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
--
-- Accounts use Supabase Auth (email + password). Ids are stored as text so
-- the built-in demo community members (ids like 'u_alex') can take part in
-- swipes, matches and chats alongside real users (uuid ids).

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.swipes (
  from_id text not null,
  to_id text not null,
  action text not null check (action in ('like', 'pass')),
  at bigint not null,
  primary key (from_id, to_id)
);

create table if not exists public.matches (
  id text primary key,
  user_a text not null,
  user_b text not null,
  at bigint not null
);

create table if not exists public.messages (
  id text primary key,
  match_id text not null references public.matches on delete cascade,
  from_id text not null,
  body text,
  type text,
  session_id text,
  at bigint not null
);
create index if not exists messages_match_idx on public.messages (match_id, at);

create table if not exists public.learning_sessions (
  id text primary key,
  match_id text not null references public.matches on delete cascade,
  data jsonb not null,
  at bigint not null
);

-- Helpers ---------------------------------------------------------------

-- Demo community members have ids starting with 'u_'; real users are uuids.
create or replace function public.is_bot(uid text) returns boolean
language sql immutable as $$ select uid like 'u\_%' $$;

create or replace function public.is_match_member(mid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches m
    where m.id = mid and auth.uid()::text in (m.user_a, m.user_b)
  )
$$;

-- Lets a signed-in user permanently delete their own account and data.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text;
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from matches where me in (user_a, user_b);
  delete from swipes where me in (from_id, to_id);
  delete from auth.users where id = auth.uid();
end $$;
grant execute on function public.delete_my_account() to authenticated;

-- Row level security ----------------------------------------------------

alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.learning_sessions enable row level security;

drop policy if exists "profiles: read" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read" on public.profiles for select to authenticated using (true);
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles for update to authenticated using (id = auth.uid());

-- You can see swipes you made or received. You write your own swipes, plus
-- the demo members' responses to you.
drop policy if exists "swipes: read" on public.swipes;
drop policy if exists "swipes: write" on public.swipes;
create policy "swipes: read" on public.swipes for select to authenticated
  using (auth.uid()::text in (from_id, to_id));
create policy "swipes: write" on public.swipes for all to authenticated
  using (from_id = auth.uid()::text or (public.is_bot(from_id) and to_id = auth.uid()::text))
  with check (from_id = auth.uid()::text or (public.is_bot(from_id) and to_id = auth.uid()::text));

-- A match can only be created when the other person (or demo member) liked you.
drop policy if exists "matches: read" on public.matches;
drop policy if exists "matches: create" on public.matches;
drop policy if exists "matches: delete" on public.matches;
create policy "matches: read" on public.matches for select to authenticated
  using (auth.uid()::text in (user_a, user_b));
create policy "matches: create" on public.matches for insert to authenticated
  with check (
    auth.uid()::text in (user_a, user_b) and (
      public.is_bot(case when user_a = auth.uid()::text then user_b else user_a end)
      or exists (
        select 1 from public.swipes s
        where s.from_id = (case when user_a = auth.uid()::text then user_b else user_a end)
          and s.to_id = auth.uid()::text and s.action = 'like'
      )
    )
  );
create policy "matches: delete" on public.matches for delete to authenticated
  using (auth.uid()::text in (user_a, user_b));

drop policy if exists "messages: read" on public.messages;
drop policy if exists "messages: send" on public.messages;
create policy "messages: read" on public.messages for select to authenticated
  using (public.is_match_member(match_id));
create policy "messages: send" on public.messages for insert to authenticated
  with check (public.is_match_member(match_id) and (from_id = auth.uid()::text or public.is_bot(from_id)));

drop policy if exists "sessions: members" on public.learning_sessions;
create policy "sessions: members" on public.learning_sessions for all to authenticated
  using (public.is_match_member(match_id))
  with check (public.is_match_member(match_id));
