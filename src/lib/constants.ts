// ============================================================
// Shared constants — one source of truth for both modes
// Change these once, both marketplace and staffing update.
// ============================================================

export const EXPERIENCE_OPTIONS = ["0–2 yrs", "2–5 yrs", "5–10 yrs", "10–15 yrs", "15+ yrs"];

export const CATEGORIES = [
  "Healthcare",
  "Skilled Trades",
  "Operations",
  "Sales & Marketing",
  "Technology",
  "Finance",
] as const;

export const JOB_TITLES = [
  "Cashier", "Server", "Cook", "CNA", "Warehouse Worker",
  "Forklift Operator", "Machine Operator", "Welder", "Electrician",
  "HVAC Tech", "Admin Assistant", "Bookkeeper", "CDL Driver",
  "Retail Associate", "Maintenance Tech",
] as const;

export const CERTIFICATION_OPTIONS = [
  "CNA", "CDL", "OSHA 10", "Forklift", "ServSafe",
  "CPR/First Aid", "CompTIA A+", "Phlebotomy",
] as const;

export const SKILL_OPTIONS = [
  "Customer Service", "Forklift", "Excel", "Heavy Lifting",
  "Inventory", "Cash Handling", "Welding", "Driving",
  "Data Entry", "Patient Care",
] as const;

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
  if (!title) return "Operations";
  const map: Record<string, string> = {
    "Cashier": "Sales & Marketing",
    "Server": "Sales & Marketing",
    "Cook": "Operations",
    "CNA": "Healthcare",
    "Warehouse Worker": "Skilled Trades",
    "Forklift Operator": "Skilled Trades",
    "Machine Operator": "Skilled Trades",
    "Welder": "Skilled Trades",
    "Electrician": "Skilled Trades",
    "HVAC Tech": "Skilled Trades",
    "Admin Assistant": "Operations",
    "Bookkeeper": "Finance",
    "CDL Driver": "Skilled Trades",
    "Retail Associate": "Sales & Marketing",
    "Maintenance Tech": "Skilled Trades",
  };
  return map[title] || "Operations";
}

export function getCategoryInitials(cat: string | null): string {
  const m: Record<string, string> = {
    "Sales & Marketing": "SM",
    Healthcare: "HC",
    Technology: "TE",
    "Skilled Trades": "SK",
    Operations: "OP",
    Finance: "FI",
  };
  return m[cat || ""] || "TW";
}

// Express Employment Professionals branding
export const EXPRESS_BRANDING = {
  name: "Express Employment Professionals",
  shortName: "Express",
  primaryColor: "#003768",   // Express navy blue
  accentColor: "#F7941D",    // Express orange
  tagline: "Staffing made simple.",
} as const;
