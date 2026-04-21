"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JobMatch, JobListing, SeekerCard, Profile } from "@/lib/types";
import { formatSalary, EXPRESS_BRANDING } from "@/lib/constants";

interface MatchWithDetails extends JobMatch {
  job_listings?: Pick<JobListing, "title" | "city" | "category"> | null;
  seeker_profiles?: Pick<Profile, "name" | "email" | "phone"> | null;
  seeker_cards?: Pick<SeekerCard, "job_title" | "years_experience" | "city" | "skills" | "certifications"> | null;
}

type StatusFilter = "all" | "pending" | "reviewed" | "interested" | "hired" | "declined";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF7ED", text: "#4DA8DA" },
  reviewed: { bg: "#F5F5F5", text: "#3A3A3C" },
  interested: { bg: "#F0FFF4", text: "#22863A" },
  hired: { bg: "#0060A9", text: "#FFFFFF" },
  declined: { bg: "#FFF5F5", text: "#E53E3E" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  reviewed: "Reviewed",
  interested: "Interested",
  hired: "Hired",
  declined: "Declined",
};

export default function MatchesPage() {
  const [supabase] = useState(() => createClient());
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Notes modal
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch matches with related data
      const { data } = await supabase
        .from("job_matches")
        .select(`
          *,
          job_listings:job_id(title, city, category)
        `)
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        // Enrich with seeker info
        const enriched = await Promise.all(
          (data as MatchWithDetails[]).map(async (m) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, email, phone")
              .eq("id", m.seeker_id)
              .single();
            const { data: card } = await supabase
              .from("seeker_cards")
              .select("job_title, years_experience, city, skills, certifications")
              .eq("profile_id", m.seeker_id)
              .single();
            return {
              ...m,
              seeker_profiles: profile as Pick<Profile, "name" | "email" | "phone"> | null,
              seeker_cards: card as Pick<SeekerCard, "job_title" | "years_experience" | "city" | "skills" | "certifications"> | null,
            };
          })
        );
        setMatches(enriched);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const updateStatus = async (matchId: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_matches")
      .update({ status: newStatus })
      .eq("id", matchId);
    if (!error) {
      setMatches(matches.map((m) => m.id === matchId ? { ...m, status: newStatus as JobMatch["status"] } : m));
    }
  };

  const saveNotes = async () => {
    if (!selectedMatch) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("job_matches")
      .update({ notes })
      .eq("id", selectedMatch.id);
    if (!error) {
      setMatches(matches.map((m) => m.id === selectedMatch.id ? { ...m, notes } : m));
      setNotesOpen(false);
    }
    setSavingNotes(false);
  };

  const filtered = statusFilter === "all"
    ? matches
    : matches.filter((m) => m.status === statusFilter);

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
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 8px 0", color: "#FFFFFF" }}>Matches</h1>
        <div style={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9 }}>
          {matches.length} total match{matches.length !== 1 ? "es" : ""}
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: "flex", gap: 8, padding: "16px", overflowX: "auto" }}>
        {(["all", "pending", "reviewed", "interested", "hired", "declined"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "10px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              border: statusFilter === s ? "1px solid #0060A9" : "1px solid #E5E5EA",
              background: statusFilter === s ? "#0060A9" : "#FFFFFF",
              color: statusFilter === s ? "#FFFFFF" : "#636366",
              cursor: "pointer"
            }}
          >
            {s === "all" ? "All" : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 28px" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🔗</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>
            {matches.length === 0 ? "No matches yet" : "No matches with this status"}
          </div>
          <div style={{ fontSize: 14, color: "#636366", lineHeight: 1.6 }}>
            {matches.length === 0
              ? "Match candidates to jobs from the Candidates page."
              : "Try a different filter."}
          </div>
        </div>
      ) : (
        <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((match) => (
            <div
              key={match.id}
              style={{
                borderRadius: 16,
                background: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden"
              }}
            >
              {/* Match header */}
              <div style={{ padding: "12px 16px", background: "#FFFFFF", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>
                    {match.seeker_profiles?.name || match.seeker_cards?.job_title || "Candidate"}
                  </div>
                  <div style={{ fontSize: 12, color: "#636366", marginTop: 4 }}>
                    {match.seeker_cards?.job_title && match.seeker_profiles?.name ? `${match.seeker_cards.job_title} · ` : ""}
                    {match.seeker_cards?.city || "Iowa"}, IA
                  </div>
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: STATUS_COLORS[match.status]?.bg || "#E8F1FA",
                  color: STATUS_COLORS[match.status]?.text || "#0060A9"
                }}>
                  {STATUS_LABELS[match.status] || match.status}
                </span>
              </div>

              {/* Job info */}
              <div style={{ padding: "12px 16px", background: "#F5F5F5" }}>
                <div style={{ fontSize: 12, color: "#636366", fontWeight: 600 }}>Matched to</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E", marginTop: 4 }}>
                  {match.job_listings?.title || "Unknown Job"}
                </div>
                <div style={{ fontSize: 12, color: "#636366" }}>
                  {match.job_listings?.city || "Iowa"} · {match.job_listings?.category}
                </div>
              </div>

              {/* Contact (staffing mode: full visibility) */}
              {(match.seeker_profiles?.email || match.seeker_profiles?.phone) && (
                <div style={{ padding: "8px 16px", background: "#FFFFFF", fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  {match.seeker_profiles.email && <div style={{ color: "#636366" }}>{match.seeker_profiles.email}</div>}
                  {match.seeker_profiles.phone && <div style={{ color: "#636366" }}>{match.seeker_profiles.phone}</div>}
                </div>
              )}

              {/* Notes */}
              {match.notes && (
                <div style={{ padding: "8px 16px", background: "#FFFFFF", borderTop: "1px solid #F5F5F5" }}>
                  <div style={{ fontSize: 12, color: "#636366", fontStyle: "italic" }}>"{match.notes}"</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ padding: "12px 16px", background: "#FFFFFF", display: "flex", gap: 8 }}>
                {match.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(match.id, "declined")}
                      style={{
                        flex: 1,
                        border: "1.5px solid #E5E5EA",
                        color: "#0060A9",
                        fontWeight: 600,
                        padding: "10px 16px",
                        background: "#FFFFFF",
                        borderRadius: 10,
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => updateStatus(match.id, "interested")}
                      style={{
                        flex: 1,
                        background: "#48BB78",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        padding: "10px 16px",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#38A169")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#48BB78")}
                    >
                      Interested
                    </button>
                  </>
                )}
                {match.status === "interested" && (
                  <button
                    onClick={() => updateStatus(match.id, "hired")}
                    style={{
                      flex: 1,
                      background: "#0060A9",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
                  >
                    Mark Hired
                  </button>
                )}
                <button
                  onClick={() => { setSelectedMatch(match); setNotes(match.notes || ""); setNotesOpen(true); }}
                  style={{
                    border: "1.5px solid #E5E5EA",
                    color: "#0060A9",
                    fontWeight: 600,
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  Notes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {notesOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50
          }}
          onClick={() => setNotesOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: "#FFFFFF"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 16px", borderBottom: "1px solid #E5E5EA" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1C1E", margin: 0 }}>Match Notes</h2>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
              {selectedMatch && (
                <div style={{ background: "#F5F5F5", padding: 12, borderRadius: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>
                    {selectedMatch.seeker_profiles?.name || "Candidate"} → {selectedMatch.job_listings?.title || "Job"}
                  </div>
                </div>
              )}
              <textarea
                placeholder="Add notes about this match..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  border: "1.5px solid #E5E5EA",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  minHeight: 96,
                  boxSizing: "border-box",
                  resize: "none"
                }}
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setNotesOpen(false)}
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
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  style={{
                    flex: 2,
                    background: "#0060A9",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: savingNotes ? "not-allowed" : "pointer",
                    opacity: savingNotes ? 0.6 : 1,
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!savingNotes) e.currentTarget.style.background = "#004B87";
                  }}
                  onMouseLeave={(e) => {
                    if (!savingNotes) e.currentTarget.style.background = "#0060A9";
                  }}
                >
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
