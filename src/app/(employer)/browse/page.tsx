"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerCard } from "@/lib/types";

type FilterKey = "all" | "healthcare" | "trades" | "operations" | "on-site" | "hybrid" | "remote";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "healthcare", label: "Healthcare" },
  { key: "trades", label: "Skilled Trades" },
  { key: "operations", label: "Operations" },
  { key: "on-site", label: "On-site" },
  { key: "hybrid", label: "Hybrid" },
  { key: "remote", label: "Remote" },
];

export default function BrowsePage() {
  const [supabase] = useState(() => createClient());
  const [allSeekers, setAllSeekers] = useState<SeekerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(["all"]));
  const [introsSent, setIntrosSent] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

  // Modal state
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [modalSeeker, setModalSeeker] = useState<SeekerCard | null>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);
  const [introError, setIntroError] = useState("");
  const [introSuccess, setIntroSuccess] = useState(false);

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

  const filteredSeekers = allSeekers.filter((s) => {
    if (filters.has("all")) return true;
    if (filters.has("healthcare") && s.category === "Healthcare") return true;
    if (filters.has("trades") && s.category === "Skilled Trades") return true;
    if (filters.has("operations") && s.category === "Operations") return true;
    if (filters.has("on-site") && s.arrangement === "on-site") return true;
    if (filters.has("hybrid") && s.arrangement === "hybrid") return true;
    if (filters.has("remote") && s.arrangement === "remote") return true;
    return false;
  });

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

  const getCategoryInitials = (cat: string | null): string => {
    const m: Record<string, string> = { "Sales & Marketing": "SM", Healthcare: "HC", Technology: "TE", "Skilled Trades": "SK", Operations: "OP", Finance: "FI" };
    return m[cat || ""] || "TW";
  };

  const formatSalary = (min: number | null, max: number | null): string => {
    if (!min && !max) return "Open to offers";
    if (min && !max) return `$${(min / 1000).toFixed(0)}k+`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return `$${(min! / 1000).toFixed(0)}k – $${(max! / 1000).toFixed(0)}k`;
  };

  const handleSayHello = (seeker: SeekerCard) => {
    setModalSeeker(seeker);
    setIntroMessage("");
    setIntroError("");
    setIntroSuccess(false);
    setShowIntroModal(true);
  };

  const handleSendIntro = async () => {
    if (!modalSeeker || !introMessage.trim()) return;
    setSendingIntro(true);
    setIntroError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIntroError("Not authenticated"); return; }
      const { error } = await supabase.from("intros").insert({ employer_id: user.id, seeker_id: modalSeeker.profile_id, message: introMessage, status: "pending" });
      if (error) { setIntroError(error.message); }
      else {
        setIntroSuccess(true);
        setIntrosSent((p) => p + 1);
        setTimeout(() => { setShowIntroModal(false); setModalSeeker(null); setIntroMessage(""); setIntroSuccess(false); }, 1500);
      }
    } catch { setIntroError("Failed to send introduction"); }
    finally { setSendingIntro(false); }
  };

  if (loading) {
    return (
      <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ fontSize: 14, color: "var(--gray)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="section-header">
        <h2>Browse Seekers</h2>
        <p>{filteredSeekers.length} candidate{filteredSeekers.length !== 1 ? "s" : ""} in Iowa</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{allSeekers.length}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{introsSent}</div>
          <div className="stat-label">Intros Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{revealedCount}</div>
          <div className="stat-label">Revealed</div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button key={key} className={`filter-chip${filters.has(key) ? " active" : ""}`} onClick={() => toggleFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Seeker Cards */}
      {filteredSeekers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👀</div>
          <div className="empty-title">{allSeekers.length === 0 ? "No seekers yet" : "No matches for these filters"}</div>
          <div className="empty-desc">{allSeekers.length === 0 ? "Candidates are still signing up — check back soon." : "Try loosening your filters — good people show up every day."}</div>
        </div>
      ) : (
        filteredSeekers.map((seeker) => (
          <div key={seeker.id} className="card">
            <div className="card-dark-header">
              <div className="avatar">{getCategoryInitials(seeker.category)}</div>
              <div>
                <div className="card-title">{seeker.job_title || seeker.headline}</div>
                <div className="card-sub">{seeker.city || "Iowa"}, {seeker.state || "IA"}</div>
              </div>
            </div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">Experience</span>
                <span className="detail-value">{seeker.years_experience || "—"} years</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Setup</span>
                <span className="detail-value" style={{ textTransform: "capitalize" }}>{seeker.arrangement || "Flexible"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Available</span>
                <span className="detail-value" style={{ textTransform: "capitalize" }}>{seeker.availability || "Flexible"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pay range</span>
                <span className="detail-value">{formatSalary(seeker.salary_min, seeker.salary_max)}</span>
              </div>
            </div>
            <div className="tag-row">
              {seeker.category && <span className="tag">{seeker.category}</span>}
              {seeker.certifications?.map((c) => <span key={c} className="tag green">{c}</span>)}
              {seeker.skills?.slice(0, 3).map((s) => <span key={s} className="tag">{s}</span>)}
            </div>
            <div className="card-action">
              <button className="card-action-btn" onClick={() => handleSayHello(seeker)}>Say hello</button>
            </div>
          </div>
        ))
      )}

      {/* Intro Modal */}
      <div className={`modal-overlay${showIntroModal ? " show" : ""}`} onClick={() => setShowIntroModal(false)}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">Introduce yourself</div>
            <button className="modal-close" onClick={() => setShowIntroModal(false)}>×</button>
          </div>

          {introSuccess ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <div className="success-title">Intro sent!</div>
              <div className="success-desc">They'll see your message and decide what to share.</div>
            </div>
          ) : (
            <>
              {modalSeeker && (
                <div className="modal-summary">
                  <strong>{modalSeeker.job_title || modalSeeker.headline}</strong>
                  <span>{modalSeeker.years_experience} years · {modalSeeker.city || "Iowa"}, {modalSeeker.state || "IA"}</span>
                </div>
              )}
              <textarea
                className="modal-textarea"
                placeholder="Why this person caught your eye..."
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
              />
              <div className="modal-hint">Be specific. People can tell when it's genuine.</div>

              {introError && (
                <div style={{ background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
                  {introError}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowIntroModal(false)}>Cancel</button>
                <button
                  className="btn-send"
                  onClick={handleSendIntro}
                  disabled={sendingIntro || !introMessage.trim()}
                  style={{ opacity: sendingIntro || !introMessage.trim() ? 0.5 : 1 }}
                >
                  {sendingIntro ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
