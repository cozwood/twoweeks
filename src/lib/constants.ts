// ============================================================
// Shared constants — one source of truth for both modes
// Change these once, both marketplace and staffing update.
// ============================================================

export const EXPERIENCE_OPTIONS = ["0–2 yrs", "2–5 yrs", "5–10 yrs", "10–15 yrs", "15+ yrs"] as const;

// ── Job Segments ──
// Segment → specific titles. Seeker picks a segment first, then a title.
export const JOB_SEGMENTS: Record<string, string[]> = {
  "Manufacturing & Production": [
    "Machine Operator", "Assembler", "Quality Inspector", "Production Lead",
    "Warehouse Worker", "Logistics Coordinator", "Packaging Operator",
  ],
  "Skilled Trades": [
    "Welder", "Electrician", "HVAC Tech", "Plumber", "Maintenance Mechanic",
    "Millwright", "CNC Operator", "Painter/Coater",
  ],
  "Office & Admin": [
    "Administrative Assistant", "Data Entry Clerk", "Receptionist",
    "Office Manager", "Bookkeeper", "Executive Assistant",
  ],
  "Customer Service & Sales": [
    "Call Center Rep", "Retail Associate", "Inside Sales Rep",
    "Account Representative", "Support Specialist", "Cashier", "Server",
  ],
  "Healthcare Support": [
    "CNA", "Medical Assistant", "Phlebotomist", "Dental Assistant",
    "Pharmacy Tech", "Home Health Aide", "Patient Care Tech",
  ],
  "Transportation & Logistics": [
    "CDL Driver", "Forklift Operator", "Dispatcher", "Delivery Driver",
    "Route Planner", "Dock Worker",
  ],
  "IT & Technical": [
    "Help Desk Tech", "Junior Developer", "Network Technician",
    "Database Admin", "QA Tester", "Systems Admin",
  ],
  "Accounting & Finance": [
    "AP/AR Clerk", "Payroll Specialist", "Staff Accountant",
    "Financial Analyst", "Collections Specialist", "Billing Coordinator",
  ],
  "Human Resources": [
    "HR Coordinator", "Recruiter", "Benefits Admin",
    "Training Specialist", "HR Generalist",
  ],
  "Engineering & Design": [
    "Drafter", "CAD Technician", "Process Engineer", "Quality Engineer",
    "Project Coordinator", "Industrial Designer",
  ],
} as const;

// Flat list of all segment names (used as categories)
export const CATEGORIES = Object.keys(JOB_SEGMENTS) as string[];

// Flat list of all job titles across segments
export const JOB_TITLES = Object.values(JOB_SEGMENTS).flat() as string[];

// ── Segment-specific certifications ──
export const SEGMENT_CERTIFICATIONS: Record<string, string[]> = {
  "Manufacturing & Production": ["OSHA 10", "OSHA 30", "Forklift", "Lean/Six Sigma", "Lockout/Tagout", "CPR/First Aid"],
  "Skilled Trades": ["OSHA 10", "OSHA 30", "Journeyman License", "EPA 608", "AWS Welding Cert", "Electrical License", "Brazing Cert", "CPR/First Aid"],
  "Office & Admin": ["Microsoft Office Specialist", "Notary Public", "QuickBooks Certified", "Google Workspace Cert"],
  "Customer Service & Sales": ["ServSafe", "Food Handler", "CPR/First Aid", "Alcohol Compliance (TIPS)"],
  "Healthcare Support": ["CNA", "BLS/CPR", "Phlebotomy", "Medical Assistant Cert", "HIPAA Training", "First Aid", "Pharmacy Tech (CPhT)"],
  "Transportation & Logistics": ["CDL Class A", "CDL Class B", "Forklift", "Hazmat Endorsement", "TWIC Card", "DOT Medical Card"],
  "IT & Technical": ["CompTIA A+", "CompTIA Network+", "CompTIA Security+", "AWS Cloud Practitioner", "Google IT Support"],
  "Accounting & Finance": ["QuickBooks Certified", "Excel Expert", "Payroll Certification (CPP)", "Bookkeeper Certification"],
  "Human Resources": ["SHRM-CP", "PHR", "CPR/First Aid", "OSHA 10"],
  "Engineering & Design": ["AutoCAD Certified", "SolidWorks Cert", "PMP", "Lean/Six Sigma", "EIT/FE Exam"],
};

// ── Segment-specific skills ──
export const SEGMENT_SKILLS: Record<string, string[]> = {
  "Manufacturing & Production": ["Machine Operation", "Quality Control", "Heavy Lifting", "Inventory", "Forklift", "Assembly", "Packaging", "Blueprint Reading"],
  "Skilled Trades": ["Welding", "Electrical Wiring", "HVAC Systems", "Plumbing", "Blueprint Reading", "Hand/Power Tools", "Troubleshooting", "Preventive Maintenance"],
  "Office & Admin": ["Microsoft Office", "Data Entry", "Scheduling", "Filing/Organization", "Phone Systems", "Excel", "Typing 60+ WPM", "Customer Service"],
  "Customer Service & Sales": ["Customer Service", "Cash Handling", "POS Systems", "Conflict Resolution", "Upselling", "Phone Skills", "CRM Software", "Bilingual"],
  "Healthcare Support": ["Patient Care", "Vital Signs", "Medical Terminology", "EMR/EHR Systems", "Infection Control", "Medication Admin", "Wound Care", "CPR"],
  "Transportation & Logistics": ["Driving", "Route Planning", "Forklift", "Loading/Unloading", "GPS Navigation", "DOT Compliance", "Inventory", "Dispatch Software"],
  "IT & Technical": ["Help Desk", "Windows/Mac Support", "Networking", "Troubleshooting", "SQL", "Python", "Cloud Services", "Cybersecurity Basics"],
  "Accounting & Finance": ["Excel", "QuickBooks", "Accounts Payable", "Accounts Receivable", "Payroll", "Reconciliation", "Financial Reporting", "Data Entry"],
  "Human Resources": ["Recruiting", "Onboarding", "Benefits Admin", "HRIS Systems", "Conflict Resolution", "Training/Development", "Compliance", "Interviewing"],
  "Engineering & Design": ["AutoCAD", "SolidWorks", "Blueprint Reading", "Process Improvement", "Project Management", "Technical Writing", "3D Modeling", "GD&T"],
};

// Flat lists (kept for backward compat / staff pages)
export const CERTIFICATION_OPTIONS = [...new Set(Object.values(SEGMENT_CERTIFICATIONS).flat())] as string[];
export const SKILL_OPTIONS = [...new Set(Object.values(SEGMENT_SKILLS).flat())] as string[];

export const SALARY_RANGE_OPTIONS = [
  "$20–30k", "$30–40k", "$40–50k", "$50–60k", "$60–70k", "$70–80k", "$80–100k",
] as const;

export const LOCATION_OPTIONS = [
  "Des Moines", "Cedar Rapids", "Davenport", "Sioux City",
  "Iowa City", "Waterloo", "Ames", "Ankeny",
] as const;

export const WORK_SETUP_OPTIONS = ["On-site", "Hybrid", "Remote", "Flexible"] as const;

export const CAN_START_OPTIONS = ["Immediately", "2 weeks", "1 month", "Flexible"] as const;

export const WHY_LOOKING_OPTIONS = [
  "Underpaid", "Bad culture", "No growth", "Bad mgmt", "Commute", "Hours",
] as const;

export const INTRO_STATUSES = ["pending", "revealed", "passed", "revoked", "hired"] as const;
export const MATCH_STATUSES = ["pending", "reviewed", "interested", "declined", "hired"] as const;

// ── Helpers ──

export function parseSalaryRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const map: Record<string, { min: number; max: number }> = {
    "$20–30k": { min: 20000, max: 30000 },
    "$30–40k": { min: 30000, max: 40000 },
    "$40–50k": { min: 40000, max: 50000 },
    "$50–60k": { min: 50000, max: 60000 },
    "$60–70k": { min: 60000, max: 70000 },
    "$70–80k": { min: 70000, max: 80000 },
    "$80–100k": { min: 80000, max: 100000 },
  };
  return map[range] || null;
}

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Open to offers";
  if (min && !max) return `$${(min / 1000).toFixed(0)}k+`;
  if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k`;
  return `$${(min! / 1000).toFixed(0)}k – $${(max! / 1000).toFixed(0)}k`;
}

export function getCategoryFromTitle(title: string | null): string {
  if (!title) return "Manufacturing & Production";
  for (const [segment, titles] of Object.entries(JOB_SEGMENTS)) {
    if ((titles as readonly string[]).includes(title)) return segment;
  }
  return "Manufacturing & Production";
}

export function getCategoryInitials(cat: string | null): string {
  const m: Record<string, string> = {
    "Manufacturing & Production": "MF",
    "Skilled Trades": "ST",
    "Office & Admin": "OA",
    "Customer Service & Sales": "CS",
    "Healthcare Support": "HC",
    "Transportation & Logistics": "TL",
    "IT & Technical": "IT",
    "Accounting & Finance": "AF",
    "Human Resources": "HR",
    "Engineering & Design": "ED",
  };
  return m[cat || ""] || "TW";
}

// Express Employment Professionals branding
export const EXPRESS_BRANDING = {
  name: "Express Employment Professionals",
  shortName: "Express",
  primaryColor: "#0060A9",   // Express corporate blue
  secondaryColor: "#004B87", // Express dark blue (hover states)
  accentColor: "#4DA8DA",    // Express light blue (buttons, accents)
  lightBlue: "#E8F1FA",      // Express blue tint (tag backgrounds)
  tagline: "Helping People Succeed",
} as const;
