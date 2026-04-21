"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_OPTIONS,
  WORK_SETUP_OPTIONS,
  LOCATION_OPTIONS,
  HOURLY_RANGE_OPTIONS,
  SALARY_RANGE_OPTIONS,
  JOB_SEGMENTS,
  parseSalaryRange,
} from "@/lib/constants";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convert stored salary_min/max back to the closest matching range chips */
function salaryToRanges(min: number | null, max: number | null): { payType: "hourly" | "salary"; ranges: string[] } {
  if (!min && !max) return { payType: "hourly", ranges: [] };
  // Try hourly ranges first
  const hourlyMatches: string[] = [];
  for (const r of HOURLY_RANGE_OPTIONS) {
    const parsed = parseSalaryRange(r);
    if (parsed && min !== null && max !== null && parsed.min >= min && parsed.max <= max) hourlyMatches.push(r);
  }
  if (hourlyMatches.length > 0) return { payType: "hourly", ranges: hourlyMatches };
  // Try salary ranges
  const salaryMatches: string[] = [];
  for (const r of SALARY_RANGE_OPTIONS) {
    const parsed = parseSalaryRange(r);
    if (parsed && min !== null && max !== null && parsed.min >= min && parsed.max <= max) salaryMatches.push(r);
  }
  if (salaryMatches.length > 0) return { payType: "salary", ranges: salaryMatches };
  // Fallback: return empty
  return { payType: "hourly", ranges: [] };
}

interface ProfileData { headline: string; field: string; jobTitle: string; experience: string; workSetup: string; city: string; }
interface BlockedCompany { id: string; company_name: string; }

const HEADLINE_OPTIONS = ["I lead teams and hit targets", "I build and ship software", "I keep operations running smooth", "I manage the money", "I take care of people", "I work with my hands"];
const SEGMENT_NAMES = Object.keys(JOB_SEGMENTS);

const chipBaseStyle = {
  padding: "8px 16px",
  borderRadius: 20,
  border: "1.5px solid #E5E5EA",
  background: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  color: "#636366",
  cursor: "pointer",
  transition: "all 0.2s ease",
} as const;

const chipSelectedStyle = {
  ...chipBaseStyle,
  background: "#1C1C1E",
  color: "#FFFFFF",
  borderColor: "#1C1C1E",
} as const;

export default function Profile() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ headline: "", field: "", jobTitle: "", experience: "", workSetup: "", city: "" });
  const [payType, setPayType] = useState<"hourly" | "salary">("hourly");
  const [salaryRanges, setSalaryRanges] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<BlockedCompany[]>([]);
  const [blockInput, setBlockInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: card } = await supabase.from("seeker_cards").select("headline, category, job_title, years_experience, arrangement, salary_min, salary_max, city").eq("profile_id", user.id).single();
        if (card) {
          const { payType: pt, ranges: sr } = salaryToRanges(card.salary_min, card.salary_max);
          setPayType(pt);
          setSalaryRanges(sr);
          setProfile({
            headline: card.headline || "",
            field: card.category || "",
            jobTitle: card.job_title || "",
            experience: card.years_experience || "",
            workSetup: card.arrangement ? capitalize(card.arrangement) : "",
            city: card.city || "",
          });
        }

        const { data: blocks } = await supabase.from("block_list").select("id, company_name").eq("seeker_id", user.id);
        if (blocks) setBlocked(blocks);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    for (const r of salaryRanges) {
      const parsed = parseSalaryRange(r);
      if (parsed) {
        if (salaryMin === null || parsed.min < salaryMin) salaryMin = parsed.min;
        if (salaryMax === null || parsed.max > salaryMax) salaryMax = parsed.max;
      }
    }
    const { error } = await supabase.from("seeker_cards").update({
      headline: profile.headline, category: profile.field, job_title: profile.jobTitle,
      years_experience: profile.experience,
      arrangement: profile.workSetup.toLowerCase() || null, salary_min: salaryMin, salary_max: salaryMax, city: profile.city,
    }).eq("profile_id", user.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const toggleBlock = async (companyName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isBlocked = blocked.some((c) => c.company_name === companyName);
    if (isBlocked) {
      const { error } = await supabase.from("block_list").delete().eq("seeker_id", user.id).eq("company_name", companyName);
      if (!error) setBlocked(blocked.filter((c) => c.company_name !== companyName));
    } else {
      const { data, error } = await supabase.from("block_list").insert({ seeker_id: user.id, company_name: companyName }).select().single();
      if (!error && data) setBlocked([...blocked, { id: data.id, company_name: companyName }]);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ fontSize: 14, color: "#636366" }}>Loading…</p>
    </div>
  );

  const isBlocked = (name: string) => blocked.some((c) => c.company_name === name);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80, background: "#F5F5F5" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 8px 20px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E", margin: 0 }}>This is what they see</h2>
        <p style={{ fontSize: 14, color: "#636366", marginTop: 4, marginBottom: 0 }}>Pick what fits — no typing required.</p>
      </div>

      {/* Headline */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>Pick a headline</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {HEADLINE_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, headline: o })}
              style={profile.headline === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Field / Segment */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>What field are you in?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SEGMENT_NAMES.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, field: o, jobTitle: "" })}
              style={profile.field === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Role within segment */}
      {profile.field && JOB_SEGMENTS[profile.field] && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>What&apos;s your role?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {JOB_SEGMENTS[profile.field].map((t) => (
              <button
                key={t}
                onClick={() => setProfile({ ...profile, jobTitle: t })}
                style={profile.jobTitle === t ? chipSelectedStyle : chipBaseStyle}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setProfile({ ...profile, jobTitle: "Other" })}
              style={profile.jobTitle && !JOB_SEGMENTS[profile.field]?.includes(profile.jobTitle) && profile.jobTitle !== "" ? chipSelectedStyle : chipBaseStyle}
            >
              Other
            </button>
          </div>
          {profile.jobTitle === "Other" && (
            <input
              type="text"
              placeholder="Type your job title"
              onChange={(e) => { if (e.target.value) setProfile({ ...profile, jobTitle: e.target.value }); }}
              style={{ marginTop: 8, width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E5EA", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FFFFFF", color: "#1C1C1E", boxSizing: "border-box" }}
            />
          )}
        </div>
      )}

      {/* Experience */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>Experience</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXPERIENCE_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, experience: o })}
              style={profile.experience === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Work setup */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>Work setup</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WORK_SETUP_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, workSetup: o })}
              style={profile.workSetup === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Pay range */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>Pay range</div>
        {/* Hourly / Salary toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "1.5px solid #E5E5EA", width: "fit-content" }}>
          <button
            onClick={() => { setPayType("hourly"); setSalaryRanges([]); }}
            style={{
              padding: "8px 20px", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: payType === "hourly" ? "#1C1C1E" : "#FFFFFF",
              color: payType === "hourly" ? "#FFFFFF" : "#636366",
            }}
          >
            Hourly
          </button>
          <button
            onClick={() => { setPayType("salary"); setSalaryRanges([]); }}
            style={{
              padding: "8px 20px", border: "none", borderLeft: "1.5px solid #E5E5EA", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: payType === "salary" ? "#1C1C1E" : "#FFFFFF",
              color: payType === "salary" ? "#FFFFFF" : "#636366",
            }}
          >
            Salary
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(payType === "hourly" ? HOURLY_RANGE_OPTIONS : SALARY_RANGE_OPTIONS).map((o) => (
            <button
              key={o}
              onClick={() => setSalaryRanges(salaryRanges.includes(o) ? salaryRanges.filter((v) => v !== o) : [...salaryRanges, o])}
              style={salaryRanges.includes(o) ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>City</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LOCATION_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, city: o })}
              style={profile.city === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: saving ? "#2C2C2E" : "#1C1C1E",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            borderRadius: 8,
            cursor: saving ? "default" : "pointer",
            transition: "background 0.2s ease",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      {/* Block List */}
      <div style={{ padding: "16px 16px" }}>
        <div style={{
          borderRadius: 16,
          background: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", marginBottom: 12 }}>Hide from these companies</div>

          {/* Add company input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Type a company name"
              value={blockInput}
              onChange={(e) => setBlockInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && blockInput.trim()) {
                  toggleBlock(blockInput.trim());
                  setBlockInput("");
                }
              }}
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1.5px solid #E5E5EA",
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "inherit",
                color: "#1C1C1E",
                background: "#FFFFFF",
                outline: "none",
              }}
            />
            <button
              onClick={() => {
                if (blockInput.trim()) {
                  toggleBlock(blockInput.trim());
                  setBlockInput("");
                }
              }}
              style={{
                padding: "10px 16px",
                background: "#1C1C1E",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Block
            </button>
          </div>

          {/* Currently blocked */}
          {blocked.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {blocked.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleBlock(c.company_name)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#FFF5F5",
                    color: "#E53E3E",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {c.company_name} ✕
                </button>
              ))}
            </div>
          )}

          {blocked.length === 0 && (
            <div style={{ fontSize: 12, color: "#AEAEB2" }}>No companies blocked yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
