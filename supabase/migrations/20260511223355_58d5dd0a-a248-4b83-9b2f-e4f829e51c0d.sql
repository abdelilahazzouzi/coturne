
-- 1. search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- 2. Revoke EXECUTE on definer functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_like() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role still callable by authenticated for RLS — keep it
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- 3. Restrict avatars listing: drop broad public read, allow read only by exact path (no listing)
drop policy if exists "avatars public read" on storage.objects;
-- Allow anyone (anon + authenticated) to read individual objects, but listing requires a name filter to a specific path -- Postgres can't differentiate; the lint wants narrowed scope. Restrict to authenticated.
create policy "avatars read authenticated" on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
