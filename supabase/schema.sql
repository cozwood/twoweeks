-- ============================================================
-- Two Weeks / Express Staffing — Complete Database Schema
-- Last updated: 2026-04-21
--
-- Run this in the Supabase SQL Editor to set up a fresh project.
-- ============================================================

-- ============================================
-- TABLES
-- ============================================

-- Branches: Express office locations
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  cities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles: extends Supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('seeker', 'employer', 'recruiter')),
  email text not null,
  name text,
  phone text,
  company text,
  title text,
  city text,
  state text not null default 'IA',
  branch_id uuid references public.branches(id),
  organization_id uuid,
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
  branch_id uuid references public.branches(id),
  organization_id uuid,
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

-- Job listings: positions that branches are hiring for
create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  organization_id uuid,
  created_by uuid not null references public.profiles(id),
  title text not null,
  description text,
  category text,
  years_experience text,
  salary_min integer,
  salary_max integer,
  arrangement text check (arrangement in ('on-site', 'hybrid', 'remote', 'flexible')),
  availability text,
  city text,
  state text default 'IA',
  required_skills text[] default '{}',
  required_certifications text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intros: employers reach out to seekers
create table if not exists public.intros (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.job_listings(id),
  branch_id uuid references public.branches(id),
  organization_id uuid,
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

-- Job matches: connects seekers to job listings
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id),
  seeker_id uuid not null references public.profiles(id),
  recruiter_id uuid references public.profiles(id),
  branch_id uuid references public.branches(id),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'interested', 'declined', 'hired')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, seeker_id)
);

-- Audit log: tracks all sensitive data access
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  branch_id uuid references public.branches(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_profiles_branch on public.profiles(branch_id);
create index if not exists idx_seeker_cards_profile on public.seeker_cards(profile_id);
create index if not exists idx_seeker_cards_active on public.seeker_cards(is_active) where is_active = true;
create index if not exists idx_seeker_cards_branch on public.seeker_cards(branch_id);
create index if not exists idx_block_list_seeker on public.block_list(seeker_id);
create index if not exists idx_job_listings_branch on public.job_listings(branch_id);
create index if not exists idx_job_listings_active on public.job_listings(is_active);
create index if not exists idx_job_listings_created_by on public.job_listings(created_by);
create index if not exists idx_intros_employer on public.intros(employer_id);
create index if not exists idx_intros_seeker on public.intros(seeker_id);
create index if not exists idx_intros_branch on public.intros(branch_id);
create index if not exists idx_intros_job on public.intros(job_id);
create index if not exists idx_job_matches_job on public.job_matches(job_id);
create index if not exists idx_job_matches_seeker on public.job_matches(seeker_id);
create index if not exists idx_job_matches_recruiter on public.job_matches(recruiter_id);
create index if not exists idx_job_matches_branch on public.job_matches(branch_id);
create index if not exists idx_audit_log_user on public.audit_log(user_id);
create index if not exists idx_audit_log_branch on public.audit_log(branch_id);
create index if not exists idx_audit_log_created on public.audit_log(created_at);

-- ============================================
-- TRIGGERS: auto-update updated_at
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
-- TRIGGER: auto-create profile on signup
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
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================

create or replace function public.my_branch_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.seeker_cards enable row level security;
alter table public.block_list enable row level security;
alter table public.intros enable row level security;
alter table public.reveals enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_matches enable row level security;
alter table public.audit_log enable row level security;

-- ── BRANCHES ──

create policy "branches_select_own"
  on public.branches for select
  using (id in (select branch_id from public.profiles where id = auth.uid()));

-- ── PROFILES ──

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_revealed"
  on public.profiles for select
  using (
    exists (
      select 1 from public.intros i
      join public.reveals r on r.intro_id = i.id
      where i.employer_id = auth.uid()
        and i.seeker_id = profiles.id
    )
  );

create policy "profiles_select_branch_recruiters"
  on public.profiles for select
  using (
    public.my_role() = 'recruiter'
    and (
      (role = 'seeker' and branch_id = public.my_branch_id())
      or (role = 'seeker' and branch_id is null)
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── SEEKER CARDS ──

create policy "seeker_cards_manage_own"
  on public.seeker_cards for all
  using (profile_id = auth.uid());

create policy "seeker_cards_browse_employers"
  on public.seeker_cards for select
  using (
    public.my_role() = 'employer'
    and is_active = true
    and not exists (
      select 1 from public.block_list bl
      join public.profiles emp on emp.id = auth.uid()
      where bl.seeker_id = seeker_cards.profile_id
        and emp.company is not null
        and bl.company_name = emp.company
    )
  );

create policy "seeker_cards_branch_recruiters"
  on public.seeker_cards for select
  using (
    public.my_role() = 'recruiter'
    and (branch_id = public.my_branch_id() or branch_id is null)
  );

create policy "seeker_cards_insert_recruiters"
  on public.seeker_cards for insert
  with check (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

create policy "seeker_cards_update_recruiters"
  on public.seeker_cards for update
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

-- ── BLOCK LIST ──

create policy "block_list_manage_own"
  on public.block_list for all
  using (seeker_id = auth.uid());

-- ── INTROS ──

create policy "intros_insert_employers"
  on public.intros for insert
  with check (employer_id = auth.uid());

create policy "intros_select_parties"
  on public.intros for select
  using (employer_id = auth.uid() or seeker_id = auth.uid());

create policy "intros_select_branch_recruiters"
  on public.intros for select
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

create policy "intros_update_seekers"
  on public.intros for update
  using (seeker_id = auth.uid());

create policy "intros_update_employers"
  on public.intros for update
  using (employer_id = auth.uid());

-- ── REVEALS ──

create policy "reveals_insert_seekers"
  on public.reveals for insert
  with check (
    exists (
      select 1 from public.intros
      where id = reveals.intro_id
        and seeker_id = auth.uid()
    )
  );

create policy "reveals_select_parties"
  on public.reveals for select
  using (
    exists (
      select 1 from public.intros
      where id = reveals.intro_id
        and (employer_id = auth.uid() or seeker_id = auth.uid())
    )
  );

create policy "reveals_select_branch_recruiters"
  on public.reveals for select
  using (
    public.my_role() = 'recruiter'
    and exists (
      select 1 from public.intros
      where id = reveals.intro_id
        and branch_id = public.my_branch_id()
    )
  );

-- ── JOB LISTINGS ──

create policy "job_listings_select_branch"
  on public.job_listings for select
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

create policy "job_listings_insert_branch"
  on public.job_listings for insert
  with check (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
    and created_by = auth.uid()
  );

create policy "job_listings_update_branch"
  on public.job_listings for update
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

-- ── JOB MATCHES ──

create policy "job_matches_select_branch"
  on public.job_matches for select
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

create policy "job_matches_select_seekers"
  on public.job_matches for select
  using (seeker_id = auth.uid());

create policy "job_matches_insert_branch"
  on public.job_matches for insert
  with check (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

create policy "job_matches_update_branch"
  on public.job_matches for update
  using (
    public.my_role() = 'recruiter'
    and branch_id = public.my_branch_id()
  );

-- ============================================
-- SEED DATA: Branches
-- ============================================

insert into public.branches (name, slug, cities) values
  ('Des Moines', 'des-moines', '{"Des Moines", "Ankeny", "West Des Moines", "Urbandale", "Ames"}'),
  ('Cedar Rapids / Iowa City', 'cedar-rapids-iowa-city', '{"Cedar Rapids", "Iowa City", "Marion", "Coralville"}')
on conflict (slug) do nothing;
