"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_OPTIONS,
  JOB_SEGMENTS,
  SEGMENT_CERTIFICATIONS,
  SEGMENT_SKILLS,
  WORK_SETUP_OPTIONS,
  CAN_START_OPTIONS,
  EXPRESS_BRANDING,
  parseSalaryRange,
  SALARY_RANGE_OPTIONS,
} from "@/lib/constants";

type Step = 1 | 2 | 3 | 4 | 5;

// ── Styles ──

const chipBase = {
  padding: "12px 18px",
  borderRadius: "24px",
  border: "2px solid #E5E5EA",
  background: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 600,
  color: "#1C1C1E",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.15s",
  minHeight: "48px",
  display: "inline-flex",
  alignItems: "center",
} as const;

const chipSelected = {
  ...chipBase,
  background: EXPRESS_BRANDING.primaryColor,
  color: "#FFFFFF",
  borderColor: EXPRESS_BRANDING.primaryColor,
} as const;

const chipGreen = {
  ...chipBase,
  background: "#F0FFF4",
  color: "#2F855A",
  borderColor: "#48BB78",
} as const;

const buttonPrimary = {
  display: "block",
  width: "100%",
  padding: "18px",
  borderRadius: "14px",
  fontSize: "17px",
  fontWeight: 700,
  textAlign: "center" as const,
  cursor: "pointer",
  border: "none",
  fontFamily: "inherit",
  background: EXPRESS_BRANDING.accentColor,
  color: "#FFFFFF",
  minHeight: "56px",
};

const buttonBack = {
  display: "block",
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: 600,
  textAlign: "center" as const,
  cursor: "pointer",
  border: "2px solid #E5E5EA",
  fontFamily: "inherit",
  background: "#FFFFFF",
  color: "#636366",
  marginTop: "10px",
};

const inputStyle = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "12px",
  border: "2px solid #E5E5EA",
  fontSize: "16px",
  fontFamily: "inherit",
  outline: "none",
  background: "#FFFFFF",
  color: "#1C1C1E",
  boxSizing: "border-box" as const,
  minHeight: "56px",
};

export default function KioskIntake() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>("");

  // Seeker fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [experience, setExperience] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const [workSetup, setWorkSetup] = useState<string | null>(null);
  const [salaryRange, setSalaryRange] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Get the branch info on load
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("branch_id")
          .eq("id", user.id)
          .single();
        if (profile?.branch_id) {
          setBranchId(profile.branch_id);
          const { data: branch } = await supabase
            .from("branches")
            .select("name")
            .eq("id", profile.branch_id)
            .single();
          if (branch) setBranchName(branch.name);
        }
      }
    })();
  }, []);

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const resolvedTitle = jobTitle === "Other" ? customTitle : jobTitle;

  const handleSubmit = async () => {
    if (!firstName || !lastName) {
      setError("First and last name are required.");
      return;
    }
    if (!segment) {
      setError("Please select a field.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Kiosk session expired. Please ask staff to log in again.");
        setSaving(false);
        return;
      }

      const salary = parseSalaryRange(salaryRange);

      // Walk-in seekers go into their own table — no auth account needed
      const { error: insertError } = await supabase.from("walk_in_seekers").insert({
        branch_id: branchId,
        entered_by: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        headline: resolvedTitle || segment,
        job_title: resolvedTitle || null,
        category: segment,
        years_experience: experience,
        arrangement: workSetup?.toLowerCase() || null,
        availability: availability?.toLowerCase() || null,
        salary_min: salary?.min || null,
        salary_max: salary?.max || null,
        certifications,
        skills,
        city: branchName?.split(" / ")[0] || null,
        state: "IA",
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setDone(true);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  const resetForm = () => {
    setStep(1);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setSegment(null);
    setJobTitle(null);
    setCustomTitle("");
    setExperience(null);
    setAvailability(null);
    setWorkSetup(null);
    setSalaryRange(null);
    setCertifications([]);
    setSkills([]);
    setError("");
    setDone(false);
  };

  // Auto-reset after submission
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (done) {
      resetTimer.current = setTimeout(() => resetForm(), 4000);
    }
    return () => { if (resetTimer.current) clearTimeout(resetTimer.current); };
  }, [done]);

  // ── Success screen ──
  if (done) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>✓</div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: EXPRESS_BRANDING.primaryColor, marginBottom: "8px" }}>
          You&apos;re all set, {firstName}!
        </h2>
        <p style={{ fontSize: "16px", color: "#636366", lineHeight: 1.5, marginBottom: "40px" }}>
          Your information has been saved. A recruiter will follow up with you about matching opportunities.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: "4px", padding: "16px 20px 0" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "4px",
              background: s <= step ? EXPRESS_BRANDING.primaryColor : "#E5E5EA",
              borderRadius: "2px",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* ── Step 1: Contact Info ── */}
      {step === 1 && (
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1C1C1E", margin: "0 0 4px" }}>
            Welcome!
          </h2>
          <p style={{ fontSize: "15px", color: "#636366", margin: "0 0 24px", lineHeight: 1.4 }}>
            Let&apos;s get your basic info so we can match you with the right job.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "6px" }}>First Name *</label>
              <input style={inputStyle} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "6px" }}>Last Name *</label>
              <input style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "6px" }}>Phone</label>
              <input style={inputStyle} type="tel" placeholder="(515) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "6px" }}>Email</label>
              <input style={inputStyle} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              style={{ ...buttonPrimary, opacity: (!firstName || !lastName) ? 0.4 : 1 }}
              disabled={!firstName || !lastName}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Field & Role ── */}
      {step === 2 && (
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1C1C1E", margin: "0 0 4px" }}>
            What kind of work?
          </h2>
          <p style={{ fontSize: "15px", color: "#636366", margin: "0 0 20px" }}>
            Pick the field that fits you best.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
            {Object.keys(JOB_SEGMENTS).map((seg) => (
              <button
                key={seg}
                style={segment === seg ? chipSelected : chipBase}
                onClick={() => { setSegment(seg); setJobTitle(null); setCustomTitle(""); setCertifications([]); setSkills([]); }}
              >
                {seg}
              </button>
            ))}
          </div>

          {segment && (
            <>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>What&apos;s your role?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                {JOB_SEGMENTS[segment].map((t) => (
                  <button key={t} style={jobTitle === t ? chipSelected : chipBase} onClick={() => { setJobTitle(t); setCustomTitle(""); }}>
                    {t}
                  </button>
                ))}
                <button style={jobTitle === "Other" ? chipSelected : chipBase} onClick={() => setJobTitle("Other")}>
                  Other
                </button>
              </div>
              {jobTitle === "Other" && (
                <input
                  style={{ ...inputStyle, marginBottom: "12px" }}
                  placeholder="Type your job title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              )}
            </>
          )}

          <div style={{ marginTop: "20px" }}>
            <button
              style={{ ...buttonPrimary, opacity: !segment ? 0.4 : 1 }}
              disabled={!segment}
              onClick={() => setStep(3)}
            >
              Continue
            </button>
            <button style={buttonBack} onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Experience & Availability ── */}
      {step === 3 && (
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1C1C1E", margin: "0 0 4px" }}>
            Experience & availability
          </h2>
          <p style={{ fontSize: "15px", color: "#636366", margin: "0 0 20px" }}>
            Helps us find the best match for you.
          </p>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Years of experience</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button key={opt} style={experience === opt ? chipSelected : chipBase} onClick={() => setExperience(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>When can you start?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {CAN_START_OPTIONS.map((opt) => (
                <button key={opt} style={availability === opt ? chipSelected : chipBase} onClick={() => setAvailability(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Work setup preference</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {WORK_SETUP_OPTIONS.map((opt) => (
                <button key={opt} style={workSetup === opt ? chipSelected : chipBase} onClick={() => setWorkSetup(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Pay range</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {SALARY_RANGE_OPTIONS.map((opt) => (
                <button key={opt} style={salaryRange === opt ? chipSelected : chipBase} onClick={() => setSalaryRange(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button style={buttonPrimary} onClick={() => setStep(4)}>
              Continue
            </button>
            <button style={buttonBack} onClick={() => setStep(2)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Certs & Skills ── */}
      {step === 4 && (
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1C1C1E", margin: "0 0 4px" }}>
            Certifications & skills
          </h2>
          <p style={{ fontSize: "15px", color: "#636366", margin: "0 0 20px" }}>
            Tap everything that applies. This helps us match you faster.
          </p>

          {segment && SEGMENT_CERTIFICATIONS[segment] && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Certifications</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {SEGMENT_CERTIFICATIONS[segment].map((c) => (
                  <button key={c} style={certifications.includes(c) ? chipGreen : chipBase} onClick={() => toggleMulti(certifications, setCertifications, c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {segment && SEGMENT_SKILLS[segment] && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {SEGMENT_SKILLS[segment].map((s) => (
                  <button key={s} style={skills.includes(s) ? chipSelected : chipBase} onClick={() => toggleMulti(skills, setSkills, s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <button style={buttonPrimary} onClick={() => setStep(5)}>
              Review
            </button>
            <button style={buttonBack} onClick={() => setStep(3)}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review & Submit ── */}
      {step === 5 && (
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1C1C1E", margin: "0 0 4px" }}>
            Review your info
          </h2>
          <p style={{ fontSize: "15px", color: "#636366", margin: "0 0 20px" }}>
            Make sure everything looks right, then hit submit.
          </p>

          <div style={{ background: "#FFFFFF", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {/* Header */}
            <div style={{ background: EXPRESS_BRANDING.primaryColor, padding: "18px 20px" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
                {firstName} {lastName}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                {resolvedTitle || segment || "—"}
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "16px 20px" }}>
              {[
                { label: "Phone", value: phone || "—" },
                { label: "Email", value: email || "—" },
                { label: "Field", value: segment || "—" },
                { label: "Experience", value: experience || "—" },
                { label: "Available", value: availability || "—" },
                { label: "Setup", value: workSetup || "—" },
                { label: "Pay range", value: salaryRange || "—" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #F5F5F5" : "none",
                  fontSize: "14px",
                }}>
                  <span style={{ color: "#636366" }}>{row.label}</span>
                  <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            {(certifications.length > 0 || skills.length > 0) && (
              <div style={{ padding: "12px 20px 16px", display: "flex", flexWrap: "wrap", gap: "8px", borderTop: "1px solid #F5F5F5" }}>
                {certifications.map((c) => (
                  <span key={c} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "#F0FFF4", color: "#2F855A" }}>{c}</span>
                ))}
                {skills.map((s) => (
                  <span key={s} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "#F5F5F5", color: "#3A3A3C" }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(229,62,62,0.1)", color: "#E53E3E", fontSize: "14px", marginTop: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: "24px" }}>
            <button
              style={{ ...buttonPrimary, opacity: saving ? 0.5 : 1 }}
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? "Saving..." : "Submit"}
            </button>
            <button style={buttonBack} onClick={() => setStep(4)}>Edit something</button>
          </div>
        </div>
      )}
    </div>
  );
}
