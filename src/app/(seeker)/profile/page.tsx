"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_OPTIONS,
  WORK_SETUP_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/constants";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function salaryToRange(min: number | null, max: number | null): string {
  if (!min || !max) return "";
  const ranges: Record<string, string> = { "40000-60000": "$40–60k", "60000-80000": "$60–80k", "80000-100000": "$80–100k", "100000-120000": "$100–120k" };
  return ranges[`${min}-${max}`] || (min < 40000 ? "Under $40k" : "$120k+");
}

function rangeToSalary(range: string): { min: number; max: number } | null {
  const m: Record<string, { min: number; max: number }> = {
    "Under $40k": { min: 0, max: 40000 }, "$40–60k": { min: 40000, max: 60000 },
    "$60–80k": { min: 60000, max: 80000 }, "$80–100k": { min: 80000, max: 100000 },
    "$100–120k": { min: 100000, max: 120000 }, "$120k+": { min: 120000, max: 200000 },
  };
  return m[range] || null;
}

interface ProfileData { headline: string; field: string; experience: string; workSetup: string; payRange: string; city: string; }
interface BlockedCompany { id: string; company_name: string; }

const HEADLINE_OPTIONS = ["I lead teams and hit targets", "I build and ship software", "I keep operations running smooth", "I manage the money", "I take care of people", "I work with my hands"];
const FIELD_OPTIONS = ["Sales & Marketing", "Technology", "Finance", "Operations", "Healthcare", "Skilled Trades"];
// EXPERIENCE_OPTIONS and WORK_SETUP_OPTIONS imported from constants
const PAY_RANGE_OPTIONS = ["Under $40k", "$40–60k", "$60–80k", "$80–100k", "$100–120k", "$120k+"];
const CITY_OPTIONS = ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City", "Waterloo", "Ames", "West Des Moines", "Ankeny"];
const AVAILABLE_COMPANIES = [
  "Express Employment", "Rockwell Collins", "Principal Financial", "UnityPoint Health",
  "Hy-Vee", "John Deere", "Casey's", "Pella Corporation", "Corteva", "Wells Fargo (DSM)", "Vermeer",
];

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
  const [profile, setProfile] = useState<ProfileData>({ headline: "", field: "", experience: "", workSetup: "", payRange: "", city: "" });
  const [blocked, setBlocked] = useState<BlockedCompany[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: card } = await supabase.from("seeker_cards").select("headline, category, years_experience, arrangement, salary_min, salary_max, city").eq("profile_id", user.id).single();
        if (card) {
          setProfile({
            headline: card.headline || "",
            field: card.category || "",
            experience: card.years_experience || "",
            workSetup: card.arrangement ? capitalize(card.arrangement) : "",
            payRange: salaryToRange(card.salary_min, card.salary_max),
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
    const salary = rangeToSalary(profile.payRange);
    const { error } = await supabase.from("seeker_cards").update({
      headline: profile.headline, category: profile.field, years_experience: profile.experience,
      arrangement: profile.workSetup.toLowerCase() || null, salary_min: salary?.min || null, salary_max: salary?.max || null, city: profile.city,
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

      {/* Field */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", marginBottom: 8 }}>Field</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FIELD_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, field: o })}
              style={profile.field === o ? chipSelectedStyle : chipBaseStyle}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PAY_RANGE_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setProfile({ ...profile, payRange: o })}
              style={profile.payRange === o ? chipSelectedStyle : chipBaseStyle}
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
          {CITY_OPTIONS.map((o) => (
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

          {/* Currently blocked */}
          {blocked.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
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
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {c.company_name} ✕
                </button>
              ))}
            </div>
          )}

          {/* Available to block */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AVAILABLE_COMPANIES.filter((name) => !isBlocked(name)).map((name) => (
              <button
                key={name}
                onClick={() => toggleBlock(name)}
                style={{
                  padding: "8px 12px",
                  background: "#F5F5F5",
                  color: "#3A3A3C",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  border: "1.5px solid #E5E5EA",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FFF5F5";
                  e.currentTarget.style.color = "#E53E3E";
                  e.currentTarget.style.borderColor = "#E53E3E";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F5F5F5";
                  e.currentTarget.style.color = "#3A3A3C";
                  e.currentTarget.style.borderColor = "#E5E5EA";
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
