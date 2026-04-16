# Two Weeks — Project Continuation Brief

Paste this entire file into a new chat to continue building the project. It contains everything needed to pick up where we left off.

---

## What This Is

**Two Weeks** is an anonymous job matching platform for Iowa. Job seekers create anonymous "cards" showing their skills, experience, and preferences — but never their name or contact info. Employers browse cards and send "intros" (messages expressing interest). Seekers then choose what personal info to reveal (name, email, phone, LinkedIn) on their own terms.

**Tagline:** "Your boss has no idea you're here."

**Business model:** Free for seekers. Employers pay 4–8% when they hire. No subscriptions.

**Owner:** Carter Oswood (carter.oswood@gmail.com) — non-developer, staffing professional in Iowa.

---

## Tech Stack

- **Framework:** Next.js 16.2.3 with Turbopack (uses App Router with route groups)
- **Database + Auth:** Supabase (PostgreSQL + email/password auth)
- **UI Components:** shadcn/ui (Card, Button, Badge, Avatar, Dialog, Checkbox, Textarea, Input, Label, Separator)
- **Styling:** Tailwind CSS 4 + custom CSS variables in globals.css
- **Icons:** lucide-react
- **Deployment:** Vercel (auto-deploys from GitHub pushes)
- **Repo:** github.com/cozwood/twoweeks (branch: main)
- **Live URL:** https://twoweeks-iota.vercel.app/
- **Local path on Carter's Mac:** `~/Documents/Claude/Projects/TwoWeeks`

### IMPORTANT: Next.js Version Warning
AGENTS.md says: "This is NOT the Next.js you know. This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

---

## Supabase Credentials (in .env.local, gitignored)

```
NEXT_PUBLIC_SUPABASE_URL=https://jwifyjhqfevmcewkqydu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(The full key is in the .env.local file and also set in Vercel environment variables.)

---

## Database Schema (Supabase Tables)

### profiles
Created automatically by a Supabase trigger on auth.users signup.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | matches auth.users.id |
| role | text | 'seeker' or 'employer' |
| email | text | |
| name | text | nullable |
| phone | text | nullable |
| linkedin | text | nullable |
| company | text | nullable (employer only) |
| title | text | nullable (employer only) |
| city | text | nullable |
| state | text | default 'IA' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### seeker_cards
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| profile_id | uuid (FK → profiles.id) | |
| headline | text | nullable |
| job_title | text | nullable |
| category | text | nullable — "Healthcare", "Skilled Trades", "Operations", "Sales & Marketing", "Technology", "Finance" |
| years_experience | text | nullable |
| arrangement | text | 'on-site', 'hybrid', 'remote', 'flexible' |
| availability | text | 'immediately', '2 weeks', '1 month', 'flexible' |
| salary_min | integer | nullable |
| salary_max | integer | nullable |
| city | text | nullable |
| state | text | default 'IA' |
| certifications | text[] | array |
| skills | text[] | array |
| reasons | text[] | array |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### intros
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| employer_id | uuid (FK → profiles.id) | |
| seeker_id | uuid (FK → profiles.id) | |
| message | text | nullable |
| status | text | 'pending', 'revealed', 'passed', 'revoked', 'hired' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### reveals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| intro_id | uuid (FK → intros.id) | |
| show_name | boolean | |
| show_email | boolean | |
| show_phone | boolean | |
| show_linkedin | boolean | |
| revealed_at | timestamptz | |

### block_list
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| seeker_id | uuid (FK → profiles.id) | |
| company_name | text | |
| created_at | timestamptz | |

---

## File Structure

```
TwoWeeks/
├── middleware.ts                          # Auth middleware (redirects unauthenticated users)
├── components.json                       # shadcn/ui config
├── package.json                          # Next.js 16.2.3, Supabase SSR, shadcn deps
├── .env.local                            # Supabase credentials (gitignored)
├── CLAUDE.md                             # Points to AGENTS.md
├── AGENTS.md                             # Next.js version warning
└── src/
    ├── app/
    │   ├── layout.tsx                    # Root layout — app-shell (430px max-width centered)
    │   ├── globals.css                   # CSS variables + custom classes + Tailwind
    │   ├── page.tsx                      # Landing page (hero, features, CTAs)
    │   ├── login/
    │   │   ├── layout.tsx
    │   │   └── page.tsx                  # Email/password login
    │   ├── get-started/
    │   │   ├── layout.tsx
    │   │   ├── seeker/page.tsx           # 3-step seeker onboarding (chip-based)
    │   │   └── employer/page.tsx         # 2-step employer onboarding
    │   ├── (seeker)/                     # Route group — seeker pages with BottomNav
    │   │   ├── layout.tsx
    │   │   ├── dashboard/page.tsx        # Seeker home — status banner, intros, reveal modal
    │   │   └── profile/page.tsx          # Edit card — chip selections, block list
    │   └── (employer)/                   # Route group — employer pages with BottomNav
    │       ├── layout.tsx
    │       ├── browse/page.tsx           # Browse seekers — filter chips, seeker cards, intro modal
    │       └── contacts/page.tsx         # Revealed contacts, outreach history
    ├── components/
    │   ├── bottom-nav.tsx                # Role-based bottom navigation
    │   ├── chip.tsx
    │   ├── status-banner.tsx
    │   └── ui/                           # shadcn/ui components
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── checkbox.tsx
    │       ├── dialog.tsx
    │       ├── index.ts
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── separator.tsx
    │       └── textarea.tsx
    └── lib/
        ├── types.ts                      # TypeScript interfaces (Profile, SeekerCard, Intro, Reveal, BlockListEntry)
        ├── utils.ts                      # cn() helper for className merging
        └── supabase/
            ├── client.ts                 # Browser client (createBrowserClient)
            ├── server.ts                 # Server client (createServerClient with cookies)
            └── middleware.ts             # Session refresh middleware
```

---

## Design System

- **Mobile-first:** 430px max-width app shell centered on screen, `box-shadow: 0 0 40px rgba(0,0,0,0.08)`
- **Background:** #E5E5EA (gray) behind the white app shell
- **Primary color:** Charcoal #1C1C1E (buttons, headers, selected chips)
- **Off-white:** #F5F5F5 (screen body background)
- **Cards:** shadcn Card with `border-0 shadow-sm`, dark charcoal header sections
- **Chips:** Rounded-full buttons, charcoal when selected, white with border when not
- **Typography:** System font stack (-apple-system, Inter)
- **Icons:** lucide-react at 22px in bottom nav

---

## Git History

```
cc3ad3f Rewrite all pages with shadcn/ui components for polished mobile UI
0db3d9a Redesign all pages to match prototype design system
68263d4 Fix browse page: fetch real seekers from Supabase, remove hardcoded sample data
d59d441 Two Weeks — clean rebuild with real auth and Supabase
```

---

## How Auth & Signup Works

1. **Seeker signup:** `/get-started/seeker` — 3-step chip-based onboarding → calls `supabase.auth.signUp()` with `data: { role: "seeker" }` → inserts a `seeker_cards` row → redirects to `/dashboard`
2. **Employer signup:** `/get-started/employer` — 2-step form → calls `supabase.auth.signUp()` with `data: { role: "employer", name, company }` → updates `profiles` row → redirects to `/browse`
3. **Login:** `/login` — email/password → checks `profiles.role` → redirects to `/browse` (employer) or `/dashboard` (seeker)
4. **Middleware:** Protects all routes except `/`, `/login`, `/get-started/*`. Redirects unauthenticated users to `/login`.
5. **Profile creation:** A Supabase database trigger automatically creates a `profiles` row when a user signs up via `auth.users`.

---

## Pending / Next Tasks

These were the tasks queued when the previous session ended:

1. **Upload 10 dummy seekers and 10 dummy companies** — The database is empty. Need to insert test data directly into Supabase so the browse page shows real cards. This requires inserting into `auth.users` (via Supabase admin/service role key), then `profiles`, then `seeker_cards` for seekers.

2. **Signup notification system** — Carter asked: "I signed up...but where does my email go? How will I know when someone signs up?" Options to discuss:
   - Supabase Database Webhooks → call an edge function → send email via Resend/SendGrid
   - Supabase Auth Hooks (on signup event)
   - Simple: a Supabase Edge Function triggered by new row in `profiles` that emails Carter
   - Or a lightweight admin dashboard page

3. **Design polish still needed:**
   - Landing page (`page.tsx`), login page, and onboarding pages still use old custom CSS classes (not shadcn). The four authenticated pages (browse, dashboard, contacts, profile) were rewritten with shadcn.
   - Change tagline (Carter mentioned wanting to update it)
   - Add city radius slider
   - Auto-load certifications by profession

4. **Push latest commit** — The shadcn rewrite was committed (`cc3ad3f`) but Carter needs to run `cd ~/Documents/Claude/Projects/TwoWeeks && git push` to deploy it.

---

## Important Notes for the Next Session

- **Carter is not a developer.** Keep explanations simple. When terminal commands are needed, give him exact copy-paste commands.
- **Correct local path:** `~/Documents/Claude/Projects/TwoWeeks` (NOT `~/Documents/TwoWeeks`)
- **Git push must happen from Carter's terminal** — the sandbox can't authenticate to GitHub.
- **Vercel auto-deploys** from GitHub pushes to main branch.
- **shadcn/ui is already installed** — `components.json` is configured, UI components are in `src/components/ui/`.
- **Checkbox uses `onCheckedChange`** (not `onChange`) — this was already fixed in the last commit.
- **RLS is enabled** on Supabase tables — seeker_cards query filters by `is_active: true`.
