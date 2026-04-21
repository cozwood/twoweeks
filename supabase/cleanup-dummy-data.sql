-- ============================================================
-- CLEANUP: Remove all dummy/seed data
-- Run this in the Supabase SQL Editor BEFORE running migration 003
-- ============================================================

-- Order matters — delete from child tables first to respect foreign keys

-- 1. Reveals (depends on intros)
delete from public.reveals;

-- 2. Job matches (depends on job_listings, profiles)
delete from public.job_matches;

-- 3. Intros (depends on profiles)
delete from public.intros;

-- 4. Block list (depends on profiles)
delete from public.block_list;

-- 5. Seeker cards (depends on profiles)
delete from public.seeker_cards;

-- 6. Job listings (depends on organizations, profiles)
delete from public.job_listings;

-- 7. Organizations (from migration 002)
delete from public.organizations;

-- 8. Profiles (depends on auth.users)
delete from public.profiles;

-- 9. Auth users — requires admin/service role
-- Run this from Supabase dashboard: Authentication > Users > select all > delete
-- OR uncomment below if running with service role key:
-- delete from auth.users;

-- Verify everything is clean
select 'reveals' as tbl, count(*) from public.reveals
union all select 'job_matches', count(*) from public.job_matches
union all select 'intros', count(*) from public.intros
union all select 'block_list', count(*) from public.block_list
union all select 'seeker_cards', count(*) from public.seeker_cards
union all select 'job_listings', count(*) from public.job_listings
union all select 'organizations', count(*) from public.organizations
union all select 'profiles', count(*) from public.profiles;
