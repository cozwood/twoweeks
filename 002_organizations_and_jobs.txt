-- ============================================================
-- Migration 002: Organizations, Job Listings, Job Matches
-- Adds multi-mode support (marketplace vs staffing)
-- ============================================================

-- 1. Organizations table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  mode text not null default 'marketplace' check (mode in ('marketplace', 'staffing')),
  owner_id uuid not null references public.profiles(id),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add organization_id to profiles (nullable — marketplace users don't need one)
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id);

-- 3. Expand the role options — allow 'recruiter'
-- (The existing check constraint may vary; we'll use a safe approach)
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('seeker', 'employer', 'recruiter'));

-- 4. Add organization_id to seeker_cards (nullable)
alter table public.seeker_cards
  add column if not exists organization_id uuid references public.organizations(id);

-- 5. Job Listings table
create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
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

-- 6. Job Matches table (connects seekers to jobs)
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id),
  seeker_id uuid not null references public.profiles(id),
  recruiter_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'interested', 'declined', 'hired')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, seeker_id)
);

-- 7. Add job_id to intros (nullable — marketplace intros don't reference a job)
alter table public.intros
  add column if not exists job_id uuid references public.job_listings(id);

alter table public.intros
  add column if not exists organization_id uuid references public.organizations(id);

-- 8. Indexes
create index if not exists idx_organizations_owner on public.organizations(owner_id);
create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_profiles_organization on public.profiles(organization_id);
create index if not exists idx_seeker_cards_organization on public.seeker_cards(organization_id);
create index if not exists idx_job_listings_org on public.job_listings(organization_id);
create index if not exists idx_job_listings_active on public.job_listings(is_active);
create index if not exists idx_job_listings_created_by on public.job_listings(created_by);
create index if not exists idx_job_matches_job on public.job_matches(job_id);
create index if not exists idx_job_matches_seeker on public.job_matches(seeker_id);
create index if not exists idx_job_matches_recruiter on public.job_matches(recruiter_id);
create index if not exists idx_intros_job on public.intros(job_id);

-- 9. RLS policies for new tables
alter table public.organizations enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_matches enable row level security;

-- Organizations: members can read their own org
create policy "Users can view their organization"
  on public.organizations for select
  using (
    id in (select organization_id from public.profiles where id = auth.uid())
    or owner_id = auth.uid()
  );

-- Organizations: authenticated users can create an org (during onboarding)
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (owner_id = auth.uid());

-- Organizations: owners can update their org
create policy "Owners can update their organization"
  on public.organizations for update
  using (owner_id = auth.uid());

-- Job listings: org members can read, recruiters can insert/update
create policy "Org members can view job listings"
  on public.job_listings for select
  using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Recruiters can create job listings"
  on public.job_listings for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recruiter'
      and organization_id = job_listings.organization_id
    )
  );

create policy "Recruiters can update their job listings"
  on public.job_listings for update
  using (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recruiter'
    )
  );

-- Job matches: recruiters can manage, seekers can view their own
create policy "Recruiters can view all matches in their org"
  on public.job_matches for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recruiter'
      and organization_id in (
        select organization_id from public.job_listings where id = job_matches.job_id
      )
    )
    or seeker_id = auth.uid()
  );

create policy "Recruiters can create matches"
  on public.job_matches for insert
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recruiter'
    )
  );

create policy "Recruiters can update matches"
  on public.job_matches for update
  using (
    recruiter_id = auth.uid()
    or seeker_id = auth.uid()
  );
