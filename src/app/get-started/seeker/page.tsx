"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step = 1 | 2 | 3;

const EXPERIENCE_OPTIONS = ["0–2 yrs", "3–5 yrs", "5–8 yrs", "8–12 yrs", "12+ yrs"];
const JOB_TITLES = [
  "Cashier", "Server", "Cook", "CNA", "Warehouse Worker",
  "Forklift Operator", "Machine Operator", "Welder", "Electrician",
  "HVAC Tech", "Admin Assistant", "Bookkeeper", "CDL Driver",
  "Retail Associate", "Maintenance Tech",
];
const CERTIFICATION_OPTIONS = ["CNA", "CDL", "OSHA 10", "Forklift", "ServSafe", "CPR/First Aid", "CompTIA A+", "Phlebotomy"];
const SKILL_OPTIONS = ["Customer Service", "Forklift", "Excel", "Heavy Lifting", "Inventory", "Cash Handling", "Welding", "Driving", "Data Entry", "Patient Care"];
const SALARY_RANGE_OPTIONS = ["$20–30k", "$30–40k", "$40–50k", "$50–60k", "$60–70k"];
const LOCATION_OPTIONS = ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Ames", "Ankeny"];
const WORK_SETUP_OPTIONS = ["On-site", "Hybrid", "Remote", "Flexible"];
const CAN_START_OPTIONS = ["Immediately", "2 weeks", "1 month", "Flexible"];
const WHY_LOOKING_OPTIONS = ["Underpaid", "Bad culture", "No growth", "Bad mgmt", "Commute", "Hours"];

function parseSalaryRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const map: Record<string, { min: number; max: number }> = {
    "$20–30k": { min: 20000, max: 30000 },
    "$30–40k": { min: 30000, max: 40000 },
    "$40–50k": { min: 40000, max: 50000 },
    "$50–60k": { min: 50000, max: 60000 },
    "$60–70k": { min: 60000, max: 70000 },
  };
  return map[range] || null;
}

function arrangementValue(setup: string | null): string | null {
  if (!setup) return null;
  return setup.toLowerCase() as string;
}

function availabilityValue(start: string | null): string | null {
  if (!start) return null;
  return start.toLowerCase() as string;
}

export default function SeekerOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);

  // Account fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Card fields
  const [experience, setExperience] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [workSetup, setWorkSetup] = useState<string | null>(null);
  const [canStart, setCanStart] = useState<string | null>(null);
  const [whyLooking, setWhyLooking] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handlePostCard = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "seeker" },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    // 2. Create seeker card
    const salary = parseSalaryRange(salaryRange);
    const { error: cardError } = await supabase.from("seeker_cards").insert({
      profile_id: user.id,
      job_title: jobTitle,
      headline: jobTitle,
      category: getCategoryFromTitle(jobTitle),
      years_experience: experience,
      arrangement: arrangementValue(workSetup),
      availability: availabilityValue(canStart),
      salary_min: salary?.min || null,
      salary_max: salary?.max || null,
      city: location,
      state: "IA",
      certifications,
      skills,
      reasons: whyLooking,
      is_active: true,
    });

    if (cardError) {
      setError(cardError.message);
      setLoading(false);
      return;
    }

    // 3. Update profile with city
    if (location) {
      await supabase
        .from("profiles")
        .update({ city: location })
        .eq("id", user.id);
    }

    router.push("/dashboard");
  };

  return (
    <div className="screen-body">
      {/* Step Bar */}
      <div className="step-bar">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`step-segment ${s <= step ? "filled" : ""}`} />
        ))}
      </div>
      <div className="step-label">
        Step {step} of 3 — {step === 1 ? "Experience" : step === 2 ? "Preferences" : "Review"}
      </div>

      {step === 1 && (
        <>
          <div className="section-header">
            <h2>Build your card</h2>
            <p>Everything stays anonymous. Just tap.</p>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Years of Experience</div>
            <div className="chip-row">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <span key={opt} className={`chip ${experience === opt ? "selected" : ""}`} onClick={() => setExperience(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Job Title</div>
            <div className="chip-row">
              {JOB_TITLES.map((t) => (
                <span key={t} className={`chip ${jobTitle === t ? "selected" : ""}`} onClick={() => setJobTitle(t)}>{t}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Certifications <span className="optional">(optional)</span></div>
            <div className="chip-row">
              {CERTIFICATION_OPTIONS.map((c) => (
                <span key={c} className={`chip cert-chip ${certifications.includes(c) ? "selected" : ""}`} onClick={() => toggleMulti(certifications, setCertifications, c)}>{c}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Skills <span className="optional">(optional, max 6)</span></div>
            <div className="chip-row">
              {SKILL_OPTIONS.map((s) => (
                <span
                  key={s}
                  className={`chip ${skills.includes(s) ? "selected" : ""}`}
                  onClick={() => {
                    if (skills.includes(s)) setSkills(skills.filter((v) => v !== s));
                    else if (skills.length < 6) setSkills([...skills, s]);
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="cta-section">
            <button className="cta-btn cta-charcoal" onClick={() => setStep(2)}>Continue</button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link href="/" className="footer-link">Back</Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="section-header">
            <h2>Preferences</h2>
            <p>All optional. Helps us find better matches.</p>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Salary range</div>
            <div className="chip-row">
              {SALARY_RANGE_OPTIONS.map((opt) => (
                <span key={opt} className={`chip ${salaryRange === opt ? "selected" : ""}`} onClick={() => setSalaryRange(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Location</div>
            <div className="chip-row">
              {LOCATION_OPTIONS.map((loc) => (
                <span key={loc} className={`chip ${location === loc ? "selected" : ""}`} onClick={() => setLocation(loc)}>{loc}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Work setup</div>
            <div className="chip-row">
              {WORK_SETUP_OPTIONS.map((opt) => (
                <span key={opt} className={`chip ${workSetup === opt ? "selected" : ""}`} onClick={() => setWorkSetup(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Can start</div>
            <div className="chip-row">
              {CAN_START_OPTIONS.map((opt) => (
                <span key={opt} className={`chip ${canStart === opt ? "selected" : ""}`} onClick={() => setCanStart(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">Why are you looking? <span className="optional">(optional)</span></div>
            <div className="chip-row">
              {WHY_LOOKING_OPTIONS.map((opt) => (
                <span key={opt} className={`chip ${whyLooking.includes(opt) ? "selected" : ""}`} onClick={() => toggleMulti(whyLooking, setWhyLooking, opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div className="cta-section">
            <button className="cta-btn cta-charcoal" onClick={() => setStep(3)}>Continue</button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span className="footer-link" onClick={() => setStep(1)}>Back</span>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="section-header">
            <h2>Your Card</h2>
            <p>This is what employers see. Nothing identifying.</p>
          </div>

          <div className="card-preview">
            <div className="card-dark-header">
              <div className="avatar">?</div>
              <div>
                <div className="card-title">{jobTitle || "Job Title"}</div>
                <div className="card-sub">{location ? `${location}, IA` : "Iowa"}</div>
              </div>
            </div>
            <div className="card-body">
              <div className="detail-row"><span className="detail-label">Experience</span><span className="detail-value">{experience || "—"}</span></div>
              <div className="detail-row"><span className="detail-label">Setup</span><span className="detail-value">{workSetup || "—"}</span></div>
              <div className="detail-row"><span className="detail-label">Available</span><span className="detail-value">{canStart || "—"}</span></div>
              <div className="detail-row"><span className="detail-label">Pay range</span><span className="detail-value">{salaryRange || "—"}</span></div>
            </div>
            {(certifications.length > 0 || skills.length > 0) && (
              <div className="tag-row">
                {certifications.map((c) => <span key={c} className="tag green">{c}</span>)}
                {skills.map((s) => <span key={s} className="tag">{s}</span>)}
              </div>
            )}
          </div>

          <div className="hidden-info">
            <strong>What stays hidden</strong>
            <span>Your name, email, and phone are never shown until you choose to reveal them.</span>
          </div>

          {/* Account creation */}
          <div style={{ padding: "0 22px", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--charcoal)", marginBottom: "10px" }}>
              Create your account
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1.5px solid var(--border)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "var(--white)",
                color: "var(--charcoal)",
                marginBottom: "10px",
              }}
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1.5px solid var(--border)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "var(--white)",
                color: "var(--charcoal)",
              }}
            />
          </div>

          {error && (
            <div style={{ padding: "0 22px", marginBottom: "14px" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "var(--red-bg)",
                color: "var(--red)",
                fontSize: "13px",
              }}>
                {error}
              </div>
            </div>
          )}

          <div className="cta-section">
            <button
              className="cta-btn cta-charcoal"
              onClick={handlePostCard}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Creating your card..." : "Post my card"}
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span className="footer-link" onClick={() => setStep(2)}>Edit something</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getCategoryFromTitle(title: string | null): string {
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
