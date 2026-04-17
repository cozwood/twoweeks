export interface Profile {
  id: string
  role: 'seeker' | 'employer' | 'recruiter'
  email: string
  name: string | null
  phone: string | null
  linkedin: string | null
  company: string | null
  title: string | null
  city: string | null
  state: string
  organization_id: string | null
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
  organization_id: string | null
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
  message: string | null
  status: 'pending' | 'revealed' | 'passed' | 'revoked' | 'hired'
  job_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

export interface Reveal {
  id: string
  intro_id: string
  show_name: boolean
  show_email: boolean
  show_phone: boolean
  show_linkedin: boolean  // kept for DB compat, always false for new reveals
  revealed_at: string
}

// ── New types for multi-mode support ──

export interface Organization {
  id: string
  name: string
  slug: string
  mode: 'marketplace' | 'staffing'
  owner_id: string
  config: OrganizationConfig
  created_at: string
  updated_at: string
}

export interface OrganizationConfig {
  show_company_names?: boolean
  show_seeker_names?: boolean
  allow_self_serve?: boolean
  require_recruiter_approval?: boolean
  branding?: {
    primary_color?: string
    logo_url?: string
  }
}

export interface JobListing {
  id: string
  organization_id: string
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
  status: 'pending' | 'reviewed' | 'interested' | 'declined' | 'hired'
  notes: string | null
  created_at: string
  updated_at: string
}
