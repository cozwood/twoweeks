// ============================================================
// Database types — mirrors supabase/schema.sql
// ============================================================

export interface Profile {
  id: string
  role: 'seeker' | 'employer' | 'recruiter'
  email: string
  name: string | null
  phone: string | null
  company: string | null
  title: string | null
  city: string | null
  state: string
  branch_id: string | null
  organization_id: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface SeekerCard {
  id: string
  profile_id: string
  headline: string | null
  job_title: string | null
  category: string | null
  years_experience: string | null
  arrangement: 'on-site' | 'hybrid' | 'remote' | 'flexible' | null
  availability: 'immediately' | '2 weeks' | '1 month' | 'flexible' | null
  salary_min: number | null
  salary_max: number | null
  city: string | null
  state: string
  certifications: string[]
  skills: string[]
  reasons: string[]
  is_active: boolean
  branch_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

export interface WalkInSeeker {
  id: string
  branch_id: string
  entered_by: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  headline: string | null
  job_title: string | null
  category: string | null
  years_experience: string | null
  arrangement: 'on-site' | 'hybrid' | 'remote' | 'flexible' | null
  availability: 'immediately' | '2 weeks' | '1 month' | 'flexible' | null
  salary_min: number | null
  salary_max: number | null
  certifications: string[]
  skills: string[]
  city: string | null
  state: string
  status: 'new' | 'contacted' | 'matched' | 'placed' | 'inactive'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BlockListEntry {
  id: string
  seeker_id: string
  company_name: string
  created_at: string
}

export interface Intro {
  id: string
  employer_id: string
  seeker_id: string
  job_id: string | null
  branch_id: string | null
  organization_id: string | null
  message: string | null
  status: 'pending' | 'revealed' | 'passed' | 'revoked' | 'hired'
  created_at: string
  updated_at: string
}

export interface Reveal {
  id: string
  intro_id: string
  show_name: boolean
  show_email: boolean
  show_phone: boolean
  show_linkedin: boolean
  revealed_at: string
}

export interface JobListing {
  id: string
  branch_id: string | null
  organization_id: string | null
  created_by: string
  title: string
  description: string | null
  category: string | null
  years_experience: string | null
  salary_min: number | null
  salary_max: number | null
  arrangement: 'on-site' | 'hybrid' | 'remote' | 'flexible' | null
  availability: string | null
  city: string | null
  state: string
  required_skills: string[]
  required_certifications: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface JobMatch {
  id: string
  job_id: string
  seeker_id: string
  recruiter_id: string | null
  branch_id: string | null
  status: 'pending' | 'reviewed' | 'interested' | 'declined' | 'hired'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  name: string
  slug: string
  cities: string[]
  is_active: boolean
  created_at: string
}

export interface AuditLogEntry {
  id: string
  user_id: string | null
  branch_id: string | null
  action: string
  table_name: string
  record_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}
