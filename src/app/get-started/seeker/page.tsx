"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step = 1 | 2 | 3;

import {
  EXPERIENCE_OPTIONS,
  JOB_TITLES,
  CERTIFICATION_OPTIONS,
  SKILL_OPTIONS,
  SALARY_RANGE_OPTIONS,
  LOCATION_OPTIONS,
  WORK_SETUP_OPTIONS,
  CAN_START_OPTIONS,
  WHY_LOOKING_OPTIONS,
} from "@/lib/constants";

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
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F5F5F5" }}>
      {/* Step Bar */}
      <div style={{ display: "flex", gap: "4px", padding: "16px 22px 0" }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, height: "3px", background: s <= step ? "#1C1C1E" : "#E5E5EA", borderRadius: "2px", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "11px", color: "#AEAEB2", padding: "8px 0 0", fontWeight: 500 }}>
        Step {step} of 3 — {step === 1 ? "Experience" : step === 2 ? "Preferences" : "Review"}
      </div>

      {step === 1 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0 }}>Build your card</h2>
            <p style={{ fontSize: "14px", color: "#636366", marginTop: "4px", lineHeight: 1.4 }}>Everything stays anonymous. Just tap.</p>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Years of Experience</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <span key={opt} style={{ padding: "9px 15px", borderRadius: "22px", border: experience === opt ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: experience === opt ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: experience === opt ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setExperience(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Job Title</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {JOB_TITLES.map((t) => (
                <span key={t} style={{ padding: "9px 15px", borderRadius: "22px", border: jobTitle === t ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: jobTitle === t ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: jobTitle === t ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setJobTitle(t)}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Certifications <span style={{ fontWeight: 400, color: "#AEAEB2" }}>(optional)</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {CERTIFICATION_OPTIONS.map((c) => (
                <span key={c} style={{ padding: "9px 15px", borderRadius: "22px", border: certifications.includes(c) ? "1.5px solid #48BB78" : "1.5px solid #E5E5EA", background: certifications.includes(c) ? "#F0FFF4" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: certifications.includes(c) ? "#48BB78" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => toggleMulti(certifications, setCertifications, c)}>{c}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Skills <span style={{ fontWeight: 400, color: "#AEAEB2" }}>(optional, max 6)</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {SKILL_OPTIONS.map((s) => (
                <span
                  key={s}
                  style={{ padding: "9px 15px", borderRadius: "22px", border: skills.includes(s) ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: skills.includes(s) ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: skills.includes(s) ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }}
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

          <div style={{ padding: "8px 20px 20px" }}>
            <button style={{ display: "block", width: "100%", padding: "15px", borderRadius: "14px", fontSize: "15px", fontWeight: 600, textAlign: "center", cursor: "pointer", marginBottom: "10px", border: "1.5px solid transparent", fontFamily: "inherit", background: "#1C1C1E", color: "#FFFFFF" }} onClick={() => setStep(2)}>Continue</button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link href="/" style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Back</Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0 }}>Preferences</h2>
            <p style={{ fontSize: "14px", color: "#636366", marginTop: "4px", lineHeight: 1.4 }}>All optional. Helps us find better matches.</p>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Salary range</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {SALARY_RANGE_OPTIONS.map((opt) => (
                <span key={opt} style={{ padding: "9px 15px", borderRadius: "22px", border: salaryRange === opt ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: salaryRange === opt ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: salaryRange === opt ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setSalaryRange(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Location</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {LOCATION_OPTIONS.map((loc) => (
                <span key={loc} style={{ padding: "9px 15px", borderRadius: "22px", border: location === loc ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: location === loc ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: location === loc ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setLocation(loc)}>{loc}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Work setup</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {WORK_SETUP_OPTIONS.map((opt) => (
                <span key={opt} style={{ padding: "9px 15px", borderRadius: "22px", border: workSetup === opt ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: workSetup === opt ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: workSetup === opt ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setWorkSetup(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Can start</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {CAN_START_OPTIONS.map((opt) => (
                <span key={opt} style={{ padding: "9px 15px", borderRadius: "22px", border: canStart === opt ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: canStart === opt ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: canStart === opt ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => setCanStart(opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Why are you looking? <span style={{ fontWeight: 400, color: "#AEAEB2" }}>(optional)</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {WHY_LOOKING_OPTIONS.map((opt) => (
                <span key={opt} style={{ padding: "9px 15px", borderRadius: "22px", border: whyLooking.includes(opt) ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA", background: whyLooking.includes(opt) ? "#1C1C1E" : "#FFFFFF", fontSize: "13px", fontWeight: 500, color: whyLooking.includes(opt) ? "#FFFFFF" : "#1C1C1E", cursor: "pointer", userSelect: "none", fontFamily: "inherit" }} onClick={() => toggleMulti(whyLooking, setWhyLooking, opt)}>{opt}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "8px 20px 20px" }}>
            <button style={{ display: "block", width: "100%", padding: "15px", borderRadius: "14px", fontSize: "15px", fontWeight: 600, textAlign: "center", cursor: "pointer", marginBottom: "10px", border: "1.5px solid transparent", fontFamily: "inherit", background: "#1C1C1E", color: "#FFFFFF" }} onClick={() => setStep(3)}>Continue</button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }} onClick={() => setStep(1)}>Back</span>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0 }}>Your Card</h2>
            <p style={{ fontSize: "14px", color: "#636366", marginTop: "4px", lineHeight: 1.4 }}>This is what employers see. Nothing identifying.</p>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: "16px", margin: "0 20px 16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ background: "#1C1C1E", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#3A3A3C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>?</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#FFFFFF" }}>{jobTitle || "Job Title"}</div>
                <div style={{ fontSize: "12px", color: "#AEAEB2", marginTop: "1px" }}>{location ? `${location}, IA` : "Iowa"}</div>
              </div>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F5", fontSize: "13px" }}><span style={{ color: "#636366" }}>Experience</span><span style={{ color: "#1C1C1E", fontWeight: 600 }}>{experience || "—"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F5", fontSize: "13px" }}><span style={{ color: "#636366" }}>Setup</span><span style={{ color: "#1C1C1E", fontWeight: 600 }}>{workSetup || "—"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F5", fontSize: "13px" }}><span style={{ color: "#636366" }}>Available</span><span style={{ color: "#1C1C1E", fontWeight: 600 }}>{canStart || "—"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F5", fontSize: "13px" }}><span style={{ color: "#636366" }}>Pay range</span><span style={{ color: "#1C1C1E", fontWeight: 600 }}>{salaryRange || "—"}</span></div>
            </div>
            {(certifications.length > 0 || skills.length > 0) && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "12px 18px 16px" }}>
                {certifications.map((c) => <span key={c} style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "#F0FFF4", color: "#2F855A" }}>{c}</span>)}
                {skills.map((s) => <span key={s} style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "#F5F5F5", color: "#3A3A3C" }}>{s}</span>)}
              </div>
            )}
          </div>

          <div style={{ margin: "0 20px 16px", padding: "14px 16px", borderRadius: "12px", background: "#F5F5F5", fontSize: "13px", color: "#636366", lineHeight: 1.4 }}>
            <strong>What stays hidden</strong>
            <span>Your name, email, and phone are never shown until you choose to reveal them.</span>
          </div>

          {/* Account creation */}
          <div style={{ padding: "0 22px", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1C1C1E", marginBottom: "10px" }}>
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
                border: "1.5px solid #E5E5EA",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "#FFFFFF",
                color: "#1C1C1E",
                marginBottom: "10px",
                boxSizing: "border-box",
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
                border: "1.5px solid #E5E5EA",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "#FFFFFF",
                color: "#1C1C1E",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{ padding: "0 22px", marginBottom: "14px" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF5F5",
                color: "#E53E3E",
                fontSize: "13px",
              }}>
                {error}
              </div>
            </div>
          )}

          <div style={{ padding: "8px 20px 20px" }}>
            <button
              style={{
                display: "block",
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: 600,
                textAlign: "center",
                cursor: "pointer",
                marginBottom: "10px",
                border: "1.5px solid transparent",
                fontFamily: "inherit",
                background: "#1C1C1E",
                color: "#FFFFFF",
                opacity: loading ? 0.6 : 1,
              }}
              onClick={handlePostCard}
              disabled={loading}
            >
              {loading ? "Creating your card..." : "Post my card"}
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }} onClick={() => setStep(2)}>Edit something</span>
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
