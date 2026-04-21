"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerCard, Profile } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  WORK_SETUP_OPTIONS,
  formatSalary,
  getCategoryInitials,
  EXPRESS_BRANDING,
} from "@/lib/constants";

type FilterKey = string;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "trades", label: "Trades" },
  { key: "office", label: "Office" },
  { key: "service", label: "Service & Sales" },
  { key: "healthcare", label: "Healthcare" },
  { key: "transport", label: "Transport" },
  { key: "it", label: "IT" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "HR" },
  { key: "engineering", label: "Engineering" },
];

const CATEGORY_MAP: Record<string, string> = {
  manufacturing: "Manufacturing & Production",
  trades: "Skilled Trades",
  office: "Office & Admin",
  service: "Customer Service & Sales",
  healthcare: "Healthcare Support",
  transport: "Transportation & Logistics",
  it: "IT & Technical",
  finance: "Accounting & Finance",
  hr: "Human Resources",
  engineering: "Engineering & Design",
};

interface CandidateWithProfile extends SeekerCard {
  profiles?: Pick<Profile, "name" | "email" | "phone"> | null;
}

export default function CandidatesPage() {
  const [supabase] = useState(() => createClient());
  const [candidates, setCandidates] = useState<CandidateWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(["all"]));

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithProfile | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      // In staffing mode, recruiters see full profiles
      const { data } = await supabase
        .from("seeker_cards")
        .select("*, profiles:profile_id(name, email, phone)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) setCandidates(data as CandidateWithProfile[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const toggleFilter = (f: FilterKey) => {
    const next = new Set(filters);
    if (f === "all") { next.clear(); next.add("all"); }
    else {
      next.delete("all");
      next.has(f) ? next.delete(f) : next.add(f);
      if (next.size === 0) next.add("all");
    }
    setFilters(next);
  };

  const filtered = candidates.filter((c) => {
    if (filters.has("all")) return true;
    for (const f of filters) {
      if (f !== "all" && CATEGORY_MAP[f] && c.category === CATEGORY_MAP[f]) return true;
    }
    return false;
  });

  const handleViewCandidate = async (c: CandidateWithProfile) => {
    setSelectedCandidate(c);
    // Fetch full profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", c.profile_id)
      .single();
    setCandidateProfile(prof as Profile | null);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        <p style={{ fontSize: 14, color: "#636366" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#0060A9", padding: "20px 16px", color: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA8DA", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4DA8DA", textTransform: "uppercase" }}>
            {EXPRESS_BRANDING.shortName} Staffing
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 8px 0", color: "#FFFFFF" }}>Candidates</h1>
        <div style={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9 }}>
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""} in pipeline
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, padding: "16px", overflowX: "auto" }}>
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            style={{
              padding: "10px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              border: filters.has(key) ? "1px solid #0060A9" : "1px solid #E5E5EA",
              background: filters.has(key) ? "#0060A9" : "#FFFFFF",
              color: filters.has(key) ? "#FFFFFF" : "#636366",
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Candidates List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 28px" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>No candidates yet</div>
          <div style={{ fontSize: 14, color: "#636366", lineHeight: 1.6 }}>Candidates show up here as they complete intake.</div>
        </div>
      ) : (
        <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: 16,
                background: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden"
              }}
            >
              {/* Header — Express navy */}
              <div style={{ background: "#004B87", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: "#004B87",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    border: "2px solid rgba(255,255,255,0.3)"
                  }}
                >
                  {c.profiles?.name
                    ? c.profiles.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : getCategoryInitials(c.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.profiles?.name || c.job_title || c.headline || "Candidate"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
                    {c.job_title && c.profiles?.name ? `${c.job_title} · ` : ""}
                    {c.city || "Iowa"}, {c.state || "IA"}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "16px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: 8 }}>
                {c.profiles?.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #F5F5F5", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Email</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 600, fontSize: 12 }}>{c.profiles.email}</span>
                  </div>
                )}
                {c.profiles?.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #F5F5F5", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Phone</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{c.profiles.phone}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #F5F5F5", fontSize: 14 }}>
                  <span style={{ color: "#636366" }}>Experience</span>
                  <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{c.years_experience || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #F5F5F5", fontSize: 14 }}>
                  <span style={{ color: "#636366" }}>Setup</span>
                  <span style={{ color: "#1C1C1E", fontWeight: 600, textTransform: "capitalize" }}>{c.arrangement || "Flexible"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #F5F5F5", fontSize: 14 }}>
                  <span style={{ color: "#636366" }}>Available</span>
                  <span style={{ color: "#1C1C1E", fontWeight: 600, textTransform: "capitalize" }}>{c.availability || "Flexible"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                  <span style={{ color: "#636366" }}>Pay range</span>
                  <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{formatSalary(c.salary_min, c.salary_max)}</span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid #F5F5F5", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {c.category && (
                  <span style={{ background: "#E8F1FA", color: "#0060A9", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                    {c.category}
                  </span>
                )}
                {c.certifications?.map((cert) => (
                  <span key={cert} style={{ background: "#F0FFF4", color: "#22863A", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                    {cert}
                  </span>
                ))}
                {c.skills?.slice(0, 3).map((s) => (
                  <span key={s} style={{ background: "#E8F1FA", color: "#0060A9", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: "16px", background: "#FFFFFF", display: "flex", gap: 12 }}>
                <button
                  onClick={() => handleViewCandidate(c)}
                  style={{
                    flex: 1,
                    border: "1.5px solid #0060A9",
                    color: "#0060A9",
                    fontWeight: 600,
                    padding: "12px 16px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                >
                  View details
                </button>
                <button
                  onClick={() => handleViewCandidate(c)}
                  style={{
                    flex: 1,
                    background: "#0060A9",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
                >
                  Match to job
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {detailOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50
          }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: "#FFFFFF",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 16px", borderBottom: "1px solid #E5E5EA" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1C1E", margin: 0 }}>Candidate Details</h2>
            </div>

            {selectedCandidate && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Name & contact — full visibility in staffing mode */}
                <div style={{ background: "#FFF7ED", padding: 16, borderRadius: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E" }}>
                    {candidateProfile?.name || selectedCandidate.job_title || "Candidate"}
                  </div>
                  {candidateProfile?.email && (
                    <div style={{ fontSize: 12, color: "#636366" }}>{candidateProfile.email}</div>
                  )}
                  {candidateProfile?.phone && (
                    <div style={{ fontSize: 12, color: "#636366" }}>{candidateProfile.phone}</div>
                  )}
                  {candidateProfile?.company && (
                    <div style={{ fontSize: 12, color: "#636366" }}>{candidateProfile.company}</div>
                  )}
                </div>

                {/* Card info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Title</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E" }}>{selectedCandidate.job_title || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Experience</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E" }}>{selectedCandidate.years_experience || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Location</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E" }}>{selectedCandidate.city || "Iowa"}, {selectedCandidate.state}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Setup</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E", textTransform: "capitalize" }}>{selectedCandidate.arrangement || "Flexible"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Available</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E", textTransform: "capitalize" }}>{selectedCandidate.availability || "Flexible"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Pay range</span>
                    <span style={{ fontWeight: 600, color: "#1C1C1E" }}>{formatSalary(selectedCandidate.salary_min, selectedCandidate.salary_max)}</span>
                  </div>
                </div>

                {/* Skills & certs */}
                {(selectedCandidate.certifications?.length > 0 || selectedCandidate.skills?.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 8 }}>
                    {selectedCandidate.certifications?.map((c) => (
                      <span key={c} style={{ background: "#F0FFF4", color: "#22863A", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        {c}
                      </span>
                    ))}
                    {selectedCandidate.skills?.map((s) => (
                      <span key={s} style={{ background: "#E8F1FA", color: "#0060A9", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Why looking */}
                {selectedCandidate.reasons?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#636366", marginBottom: 8 }}>Why they're looking</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {selectedCandidate.reasons.map((r) => (
                        <span key={r} style={{ background: "#FFF5F5", color: "#E53E3E", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, paddingTop: 16 }}>
                  <button
                    onClick={() => setDetailOpen(false)}
                    style={{
                      flex: 1,
                      border: "1.5px solid #E5E5EA",
                      color: "#0060A9",
                      fontWeight: 600,
                      padding: "12px 16px",
                      background: "#FFFFFF",
                      borderRadius: 10,
                      fontSize: 14,
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                  <button
                    style={{
                      flex: 2,
                      background: "#0060A9",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      padding: "12px 16px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
                  >
                    Match to job
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
