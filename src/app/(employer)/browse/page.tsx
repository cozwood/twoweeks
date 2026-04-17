"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerCard } from "@/lib/types";
import {
  formatSalary,
  getCategoryInitials,
} from "@/lib/constants";

const CATEGORY_FILTERS: Record<string, { key: string; label: string }> = {
  "Manufacturing & Production": { key: "manufacturing", label: "Manufacturing" },
  "Skilled Trades": { key: "trades", label: "Trades" },
  "Office & Admin": { key: "office", label: "Office" },
  "Customer Service & Sales": { key: "service", label: "Service & Sales" },
  "Healthcare Support": { key: "healthcare", label: "Healthcare" },
  "Transportation & Logistics": { key: "transport", label: "Transport" },
  "IT & Technical": { key: "it", label: "IT" },
  "Accounting & Finance": { key: "finance", label: "Finance" },
  "Human Resources": { key: "hr", label: "HR" },
  "Engineering & Design": { key: "engineering", label: "Engineering" },
};

const UTILITY_FILTERS = [
  { key: "on-site", label: "On-site" },
  { key: "ready-now", label: "Ready now" },
];

function formatExperience(val: string | null): string {
  if (!val) return "—";
  // If it already looks like a range string (e.g. "5–10 yrs"), display as-is
  if (val.includes("yrs") || val.includes("years") || val.includes("+")) return val;
  // If it's a raw number, bucket it
  const num = parseInt(val);
  if (isNaN(num)) return val;
  if (num < 2) return "0–2 yrs";
  if (num < 5) return "2–5 yrs";
  if (num < 10) return "5–10 yrs";
  if (num < 15) return "10–15 yrs";
  return "15+ yrs";
}

export default function BrowsePage() {
  const [supabase] = useState(() => createClient());
  const [allSeekers, setAllSeekers] = useState<SeekerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Set<string>>(new Set(["all"]));
  const [introsSent, setIntrosSent] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: cards } = await supabase
        .from("seeker_cards")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cards) setAllSeekers(cards);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count: ic } = await supabase.from("intros").select("*", { count: "exact", head: true }).eq("employer_id", user.id);
        const { count: rc } = await supabase.from("intros").select("*", { count: "exact", head: true }).eq("employer_id", user.id).eq("status", "revealed");
        setIntrosSent(ic || 0);
        setRevealedCount(rc || 0);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Build filter chips from categories that actually have seekers
  const filterOptions = (() => {
    const cats = new Set(allSeekers.map((s) => s.category).filter(Boolean));
    const catFilters = Array.from(cats)
      .map((c) => CATEGORY_FILTERS[c!])
      .filter(Boolean);
    return [{ key: "all", label: "All" }, ...catFilters, ...UTILITY_FILTERS];
  })();

  const filteredSeekers = allSeekers.filter((s) => {
    if (filters.has("all")) return true;
    for (const f of filters) {
      // Match category filters by finding the original category name
      const catEntry = Object.entries(CATEGORY_FILTERS).find(([, v]) => v.key === f);
      if (catEntry && s.category === catEntry[0]) return true;
      if (f === "on-site" && s.arrangement === "on-site") return true;
      if (f === "ready-now" && (s.availability === "immediately" || s.availability === "2 weeks")) return true;
    }
    return false;
  });

  const toggleFilter = (f: string) => {
    const next = new Set(filters);
    if (f === "all") { next.clear(); next.add("all"); }
    else {
      next.delete("all");
      next.has(f) ? next.delete(f) : next.add(f);
      if (next.size === 0) next.add("all");
    }
    setFilters(next);
  };

  const handleInterested = async (seeker: SeekerCard) => {
    setSendingId(seeker.profile_id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("intros").insert({ employer_id: user.id, seeker_id: seeker.profile_id, status: "pending" });
      if (!error) {
        setSentIds((prev) => new Set(prev).add(seeker.profile_id));
        setIntrosSent((p) => p + 1);
      }
    } catch { /* silent */ }
    finally { setSendingId(null); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "#F5F5F5" }}>
        <p style={{ fontSize: 14, color: "#636366" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F5F5F5", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 8px", background: "#fff" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1C1C1E", letterSpacing: -0.5 }}>Browse Seekers</h2>
        <p style={{ fontSize: 13, color: "#636366", marginTop: 2 }}>{filteredSeekers.length} candidate{filteredSeekers.length !== 1 ? "s" : ""} in Iowa</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, padding: "12px 16px", margin: "0 0 4px" }}>
        {[
          { num: allSeekers.length, label: "Matches" },
          { num: introsSent, label: "Intros Sent" },
          { num: revealedCount, label: "Revealed" },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", background: "#fff",
            borderRadius: 16, padding: "14px 8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>{s.num}</div>
            <div style={{ fontSize: 11, color: "#636366", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto" }}>
        {filterOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              border: filters.has(key) ? "1.5px solid #1C1C1E" : "1.5px solid #E5E5EA",
              background: filters.has(key) ? "#1C1C1E" : "#fff",
              color: filters.has(key) ? "#fff" : "#636366",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Seeker Cards */}
      {filteredSeekers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 28px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>👀</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 6 }}>
            {allSeekers.length === 0 ? "No seekers yet" : "No matches for these filters"}
          </div>
          <div style={{ fontSize: 13, color: "#636366", lineHeight: 1.45 }}>
            {allSeekers.length === 0 ? "Candidates are still signing up — check back soon." : "Try loosening your filters — good people show up every day."}
          </div>
        </div>
      ) : (
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredSeekers.map((seeker) => (
            <div key={seeker.id} style={{
              background: "#fff", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {/* Dark Header */}
              <div style={{
                background: "#1C1C1E", padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "#3A3A3C", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {getCategoryInitials(seeker.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {seeker.headline || seeker.job_title}
                  </div>
                  <div style={{ fontSize: 12, color: "#AEAEB2", marginTop: 1 }}>
                    {seeker.city || "Iowa"}, {seeker.state || "IA"}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "14px 18px" }}>
                {[
                  { label: "Experience", value: formatExperience(seeker.years_experience) },
                  { label: "Setup", value: seeker.arrangement ? seeker.arrangement.charAt(0).toUpperCase() + seeker.arrangement.slice(1) : "Flexible" },
                  { label: "Available", value: seeker.availability ? seeker.availability.charAt(0).toUpperCase() + seeker.availability.slice(1) : "Flexible" },
                  { label: "Pay range", value: formatSalary(seeker.salary_min, seeker.salary_max) },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #F5F5F5" : "none",
                    fontSize: 13,
                  }}>
                    <span style={{ color: "#636366" }}>{row.label}</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {(seeker.category || (seeker.certifications?.length > 0) || (seeker.skills?.length > 0)) && (
                <div style={{ padding: "8px 18px 12px", display: "flex", flexWrap: "wrap", gap: 6, borderTop: "1px solid #F5F5F5" }}>
                  {seeker.category && (
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: "#F5F5F5", color: "#1C1C1E", fontSize: 11, fontWeight: 600 }}>
                      {seeker.category}
                    </span>
                  )}
                  {seeker.certifications?.map((c) => (
                    <span key={c} style={{ padding: "4px 10px", borderRadius: 6, background: "#F0FFF4", color: "#2F855A", fontSize: 11, fontWeight: 600 }}>
                      {c}
                    </span>
                  ))}
                  {seeker.skills?.slice(0, 3).map((s) => (
                    <span key={s} style={{ padding: "4px 10px", borderRadius: 6, background: "#F5F5F5", color: "#3A3A3C", fontSize: 11, fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div style={{ padding: "8px 18px 16px" }}>
                {sentIds.has(seeker.profile_id) ? (
                  <div style={{
                    width: "100%", padding: 14, borderRadius: 12,
                    background: "#F0FFF4", color: "#2F855A", fontSize: 14, fontWeight: 600,
                    textAlign: "center",
                  }}>
                    Interest sent ✓
                  </div>
                ) : (
                  <button
                    onClick={() => handleInterested(seeker)}
                    disabled={sendingId === seeker.profile_id}
                    style={{
                      width: "100%", padding: 14, borderRadius: 12, border: "none",
                      background: "#1C1C1E", color: "#fff", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                      opacity: sendingId === seeker.profile_id ? 0.5 : 1,
                    }}
                  >
                    {sendingId === seeker.profile_id ? "Sending…" : "I'm interested"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
