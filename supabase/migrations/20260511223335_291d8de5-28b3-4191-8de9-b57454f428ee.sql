
-- Enums
create type public.app_role as enum ('admin','moderator','user');
create type public.gender_t as enum ('female','male','nonbinary','other');
create type public.smoking_t as enum ('no','occasionally','yes');
create type public.drinking_t as enum ('no','socially','often');
create type public.sleep_t as enum ('early','late','flexible');
create type public.social_t as enum ('homebody','balanced','social');
create type public.pets_t as enum ('none','have','ok_with');
create type public.like_kind as enum ('like','pass');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  age int,
  gender gender_t,
  occupation text,
  city text,
  budget_min int,
  budget_max int,
  move_in_date date,
  smoking smoking_t,
  drinking drinking_t,
  sleep_schedule sleep_t,
  social_level social_t,
  cleanliness int check (cleanliness between 1 and 5),
  pets pets_t,
  languages text[] not null default '{}',
  photo_url text,
  phone text,
  contact_handle text,
  phone_verified boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles select authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles insert own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "roles select own or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin write" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Likes
create table public.likes (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind like_kind not null,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
alter table public.likes enable row level security;
create policy "likes select own" on public.likes for select to authenticated
  using (from_user = auth.uid());
create policy "likes insert own" on public.likes for insert to authenticated
  with check (from_user = auth.uid());

-- Matches (canonical ordered pair)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
alter table public.matches enable row level security;
create policy "matches select participants" on public.matches for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- On mutual like, create match
create or replace function public.handle_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare a uuid; b uuid;
begin
  if new.kind = 'like' then
    if exists (select 1 from public.likes
               where from_user = new.to_user and to_user = new.from_user and kind='like') then
      a := least(new.from_user, new.to_user);
      b := greatest(new.from_user, new.to_user);
      insert into public.matches (user_a, user_b) values (a,b)
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;
create trigger likes_after_insert after insert on public.likes
  for each row execute function public.handle_like();

-- Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports insert own" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reports select own or admin" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Blocks
create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "blocks select own" on public.blocks for select to authenticated
  using (blocker_id = auth.uid());
create policy "blocks insert own" on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());
create policy "blocks delete own" on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- Auth user trigger (created last so handle_new_user can reference user_roles)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
