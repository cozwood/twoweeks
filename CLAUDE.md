# Two Weeks — Development Notes

## Architecture

Two products sharing one database:
- **Two Weeks** — Anonymous job marketplace (seekers + employers)
- **Express Staffing** — Branch-based SaaS staffing tool (recruiters + kiosk intake)

## Important

- This is **Next.js 16** — APIs may differ from training data. Check `node_modules/next/dist/docs/` before writing new code.
- All constants live in `src/lib/constants.ts` — single source of truth. When changing segments, skills, certs, or branding, update there first and grep for any hardcoded duplicates.
- Database schema is in `supabase/schema.sql`. RLS is branch-scoped for multi-tenant isolation.
- Supabase credentials are in `.env.local` (gitignored). Never hardcode them.

## Roles

| Role | Routes | Login |
|------|--------|-------|
| Seeker | `/(seeker)/*` | `/login` |
| Employer | `/(employer)/*` | `/login` |
| Recruiter | `/staff/*`, `/kiosk` | `/internal` |

## Route Groups

- `(seeker)` and `(employer)` are Next.js route groups (parentheses don't appear in URL)
- `/staff` is the recruiter dashboard
- `/kiosk` is the tablet walk-in intake (stays logged in, cycles through submissions)
- `/internal` is the Express-branded recruiter login

## Middleware

`src/lib/supabase/middleware.ts` handles auth redirects:
- Public routes: `/`, `/login`, `/internal`, `/get-started/*`
- `/kiosk` and `/staff` redirect to `/internal` when unauthenticated
- Everything else redirects to `/login`
