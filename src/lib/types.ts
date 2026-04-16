export interface Profile {
  id: string
  role: 'seeker' | 'employer'
  email: string
  name: string | null
  phone: string | null
  linkedin: string | null
  company: string | null
  title: string | null
  city: string | null
  state: string
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
