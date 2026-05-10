
-- Roles
create type public.app_role as enum ('admin','cr','student');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'student',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  nickname text,
  roll text not null unique,
  registration_number text,
  session text,
  batch text,
  department text not null default 'Law and Land Administration',
  blood_group text,
  district text,
  gender text,
  facebook_link text,
  profile_photo text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  file_url text,
  file_type text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

-- Interactions
create table public.post_interactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('like','view','download')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);
alter table public.post_interactions enable row level security;

-- Site settings (single row, key/value JSON)
create table public.site_settings (
  id int primary key default 1,
  theme text not null default 'royal',
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
alter table public.site_settings enable row level security;

insert into public.site_settings (id, theme, content) values (1, 'royal', '{}'::jsonb);

-- RLS policies
-- user_roles
create policy "roles readable by all auth" on public.user_roles for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- profiles - public read
create policy "profiles public read" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- posts
create policy "posts public read" on public.posts for select using (true);
create policy "auth users create posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "owners update posts" on public.posts for update to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "owners delete posts" on public.posts for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- interactions
create policy "interactions public read" on public.post_interactions for select using (true);
create policy "auth users create interactions" on public.post_interactions for insert to authenticated with check (auth.uid() = user_id);
create policy "owners delete interactions" on public.post_interactions for delete to authenticated using (auth.uid() = user_id);

-- site_settings
create policy "settings public read" on public.site_settings for select using (true);
create policy "admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Storage bucket for uploads & avatars
insert into storage.buckets (id, name, public) values ('uploads','uploads', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;

create policy "public read uploads" on storage.objects for select using (bucket_id in ('uploads','avatars'));
create policy "auth upload" on storage.objects for insert to authenticated with check (bucket_id in ('uploads','avatars'));
create policy "auth update own files" on storage.objects for update to authenticated using (bucket_id in ('uploads','avatars') and auth.uid() = owner);
create policy "auth delete own files" on storage.objects for delete to authenticated using (bucket_id in ('uploads','avatars') and auth.uid() = owner);
