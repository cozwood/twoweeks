"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
const EXPERIENCE_OPTIONS = ["Just starting (0 yrs)", "A few years (3 yrs)", "Seasoned (8 yrs)", "Veteran (15 yrs)"];
const WORK_SETUP_OPTIONS = ["Remote", "Hybrid", "On-site", "Flexible"];
const PAY_RANGE_OPTIONS = ["Under $40k", "$40–60k", "$60–80k", "$80–100k", "$100–120k", "$120k+"];
const CITY_OPTIONS = ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City", "Waterloo", "Ames", "West Des Moines", "Ankeny"];
const AVAILABLE_COMPANIES = [
  "Express Employment", "Rockwell Collins", "Principal Financial", "UnityPoint Health",
  "Hy-Vee", "John Deere", "Casey's", "Pella Corporation", "Corteva", "Wells Fargo (DSM)", "Vermeer",
];

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

  if (loading) return <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><p style={{ fontSize: 14, color: "var(--gray)" }}>Loading…</p></div>;

  const isBlocked = (name: string) => blocked.some((c) => c.company_name === name);

  return (
    <div className="screen-body">
      <div className="section-header">
        <h2>This is what they see</h2>
        <p>Pick what fits — no typing required.</p>
      </div>

      {/* Headline */}
      <div className="chip-group">
        <div className="chip-group-label">Pick a headline</div>
        <div className="chip-row">
          {HEADLINE_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.headline === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, headline: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* Field */}
      <div className="chip-group">
        <div className="chip-group-label">Field</div>
        <div className="chip-row">
          {FIELD_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.field === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, field: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="chip-group">
        <div className="chip-group-label">Experience</div>
        <div className="chip-row">
          {EXPERIENCE_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.experience === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, experience: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* Work setup */}
      <div className="chip-group">
        <div className="chip-group-label">Work setup</div>
        <div className="chip-row">
          {WORK_SETUP_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.workSetup === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, workSetup: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* Pay range */}
      <div className="chip-group">
        <div className="chip-group-label">Pay range</div>
        <div className="chip-row">
          {PAY_RANGE_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.payRange === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, payRange: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* City */}
      <div className="chip-group">
        <div className="chip-group-label">City</div>
        <div className="chip-row">
          {CITY_OPTIONS.map((o) => (
            <button key={o} className={`chip${profile.city === o ? " selected" : ""}`} onClick={() => setProfile({ ...profile, city: o })}>{o}</button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="cta-section">
        <button
          className="cta-btn cta-charcoal"
          onClick={handleSave}
          disabled={saving}
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      {/* Block List */}
      <div className="block-section">
        <div className="block-card">
          <div className="block-title">Hide from these companies</div>

          {/* Currently blocked */}
          {blocked.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {blocked.map((c) => (
                <span key={c.id} className="blocked-item" onClick={() => toggleBlock(c.company_name)}>
                  {c.company_name} ✕
                </span>
              ))}
            </div>
          )}

          {/* Available to block */}
          <div>
            {AVAILABLE_COMPANIES.filter((name) => !isBlocked(name)).map((name) => (
              <span key={name} className="company-chip" onClick={() => toggleBlock(name)}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
