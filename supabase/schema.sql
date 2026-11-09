-- Run on your own Supabase project. No credentials or real customer data included.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'customer' check (role in ('customer','merchant','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
grant update(name) on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated using (auth.uid()=id);
create policy "Update own name" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create or replace function public.create_member_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,role) values(new.id,left(coalesce(new.raw_user_meta_data->>'name',''),80),'customer');
  return new;
end; $$;
drop trigger if exists on_member_created on auth.users;
create trigger on_member_created after insert on auth.users for each row execute function public.create_member_profile();
-- Assign staff roles ONLY in the server/SQL editor after verification.
-- update public.profiles set role='admin' where id='<verified-auth-user-id>';
