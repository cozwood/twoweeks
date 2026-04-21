# Agent Instructions

## Next.js Version Warning

This project uses Next.js 16, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Code Standards

- TypeScript strict mode is enabled. All code must type-check cleanly.
- Use `src/lib/constants.ts` as the single source of truth for job segments, certifications, skills, and branding.
- When making changes, grep the entire codebase for related references. Update every file — not just the obvious one.
- Never hardcode Supabase credentials. Use environment variables.
- Database types are defined in `src/lib/types.ts` and must match `supabase/schema.sql`.
