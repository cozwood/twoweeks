-- Two Weeks — Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project

-- ============================================
-- TABLES
-- ============================================

-- Profiles: extends Supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('seeker', 'employer')),
  email text not null,
  name text,
  phone text,
  linkedin text,
  company text,
  title text,
  city text,
  state text not null default 'IA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seeker cards: the anonymous card employers see
create table if not exists public.seeker_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade unique,
  headline text,
  job_title text,
  category text,
  years_experience text,
  arrangement text check (arrangement in ('on-site', 'hybrid', 'remote', 'flexible')),
  availability text check (availability in ('immediately', '2 weeks', '1 month', 'flexible')),
  salary_min integer,
  salary_max integer,
  city text,
  state text not null default 'IA',
  certifications text[] default '{}',
  skills text[] default '{}',
  reasons text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Block list: seekers hide from specific companies
create table if not exists public.block_list (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  created_at timestamptz not null default now(),
  unique(seeker_id, company_name)
);

-- Intros: employers reach out to seekers
create table if not exists public.intros (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'revealed', 'passed', 'revoked', 'hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reveals: what the seeker chose to share
create table if not exists public.reveals (
  id uuid primary key default gen_random_uuid(),
  intro_id uuid not null references public.intros(id) on delete cascade unique,
  show_name boolean not null default false,
  show_email boolean not null default false,
  show_phone boolean not null default false,
  show_linkedin boolean not null default false,
  revealed_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_seeker_cards_profile on public.seeker_cards(profile_id);
create index if not exists idx_seeker_cards_active on public.seeker_cards(is_active) where is_active = true;
create index if not exists idx_block_list_seeker on public.block_list(seeker_id);
create index if not exists idx_intros_employer on public.intros(employer_id);
create index if not exists idx_intros_seeker on public.intros(seeker_id);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_seeker_cards_updated
  before update on public.seeker_cards
  for each row execute function public.handle_updated_at();

create trigger on_intros_updated
  before update on public.intros
  for each row execute function public.handle_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, name, company, city)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'seeker'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'city'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.seeker_cards enable row level security;
alter table public.block_list enable row level security;
alter table public.intros enable row level security;
alter table public.reveals enable row level security;

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Employers can read profiles of seekers who revealed to them
create policy "Employers can read revealed seeker profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.intros i
      join public.reveals r on r.intro_id = i.id
      where i.employer_id = auth.uid()
      and i.seeker_id = profiles.id
    )
  );

-- Seeker cards
create policy "Seekers can manage own card"
  on public.seeker_cards for all using (profile_id = auth.uid());

create policy "Employers can browse active cards"
  on public.seeker_cards for select using (
    is_active = true
    and not exists (
      select 1 from public.block_list bl
      join public.profiles emp on emp.id = auth.uid()
      where bl.seeker_id = seeker_cards.profile_id
      and emp.company is not null
      and bl.company_name = emp.company
    )
  );

-- Block list
create policy "Seekers manage own block list"
  on public.block_list for all using (seeker_id = auth.uid());

-- Intros
create policy "Employers can create intros"
  on public.intros for insert with check (employer_id = auth.uid());

create policy "Users can read own intros"
  on public.intros for select using (employer_id = auth.uid() or seeker_id = auth.uid());

create policy "Seekers can update intro status"
  on public.intros for update using (seeker_id = auth.uid());

create policy "Employers can update intro to hired"
  on public.intros for update using (employer_id = auth.uid());

-- Reveals
create policy "Seekers can create reveals"
  on public.reveals for insert with check (
    exists (
      select 1 from public.intros
      where id = reveals.intro_id and seeker_id = auth.uid()
    )
  );

create policy "Intro parties can view reveals"
  on public.reveals for select using (
    exists (
      select 1 from public.intros
      where id = reveals.intro_id
      and (employer_id = auth.uid() or seeker_id = auth.uid())
    )
  );
