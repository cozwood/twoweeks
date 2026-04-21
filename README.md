# Two Weeks

Anonymous job matching platform for Iowa. Seekers create anonymous skill cards. Employers browse and send intros. Seekers control what personal info gets revealed.

Also powers **Express Staffing** — a branch-based SaaS staffing tool with tablet kiosk intake, job order management, and automated candidate matching.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, email/password auth)
- **UI:** shadcn/ui + Tailwind CSS 4
- **Icons:** lucide-react
- **Deployment:** Vercel

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/cozwood/twoweeks.git
cd twoweeks

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Then fill in your Supabase project URL and anon key

# 4. Set up the database
# Run supabase/schema.sql in your Supabase SQL Editor

# 5. Start dev server
npm run dev
```

Open [http://localhost:1573](http://localhost:1573) to see it running.

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    login/                      # Two Weeks login
    internal/                   # Express Employment login
    get-started/
      seeker/                   # Seeker onboarding (3 steps)
      employer/                 # Employer onboarding (2 steps)
    (seeker)/                   # Seeker pages (route group)
      dashboard/                # Intros, status, reveal flow
      profile/                  # Edit anonymous card
    (employer)/                 # Employer pages (route group)
      browse/                   # Browse seeker cards, send intros
      contacts/                 # Revealed contacts
    staff/                      # Recruiter dashboard (Express)
      dashboard/                # Branch overview
      candidates/               # Seeker pipeline
      jobs/                     # Job order management
      matches/                  # Candidate-job matching
    kiosk/                      # Tablet intake for walk-ins
  components/
    ui/                         # shadcn/ui primitives
    bottom-nav.tsx              # Role-based navigation
    chip.tsx                    # Selection chip component
    status-banner.tsx           # Status indicator
  lib/
    constants.ts                # Job segments, skills, certs, branding
    types.ts                    # TypeScript interfaces
    utils.ts                    # Utility helpers
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client
      middleware.ts             # Auth session middleware

supabase/
  schema.sql                    # Complete database schema + RLS + seed data

scripts/                        # Dev-only setup scripts (not for production)
docs/                           # Design prototypes and research
```

## Database

The full schema lives in `supabase/schema.sql`. Key tables:

- **profiles** — extends Supabase auth, stores role (seeker/employer/recruiter)
- **seeker_cards** — anonymous skill cards employers see
- **walk_in_seekers** — kiosk tablet intake (no auth account needed)
- **job_listings** — positions branches are hiring for
- **job_matches** — connects seekers to job listings
- **intros** — employer-to-seeker outreach
- **reveals** — what personal info the seeker chose to share
- **branches** — Express office locations (Des Moines, Cedar Rapids/Iowa City)
- **audit_log** — tracks sensitive data access

All tables use Row Level Security with branch isolation for multi-tenant safety.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Set these in `.env.local` for development and in Vercel for production.

## License

Proprietary. All rights reserved.
