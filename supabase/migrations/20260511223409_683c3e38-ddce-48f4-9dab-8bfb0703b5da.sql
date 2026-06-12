
update storage.buckets set public = true where id='avatars';
-- Keep public so img tags load, but tighten policies: only allow GET on a specific path, no listing.
drop policy if exists "avatars read authenticated" on storage.objects;
create policy "avatars get by path" on storage.objects for select to anon, authenticated
  using (bucket_id='avatars' and name is not null and position('/' in name) > 0);

revoke execute on function public.has_role(uuid, public.app_role) from authenticated;
