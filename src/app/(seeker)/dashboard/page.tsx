"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Card { id: string; job_title: string; city: string; is_active: boolean; }
interface Intro { id: string; employer_id: string; message: string; status: "pending" | "revealed" | "passed"; created_at: string; }

export default function Dashboard() {
  const supabase = createClient();
  const [card, setCard] = useState<Card | null>(null);
  const [intros, setIntros] = useState<Intro[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealOpen, setRevealOpen] = useState(false);
  const [selectedIntro, setSelectedIntro] = useState<Intro | null>(null);
  const [revealData, setRevealData] = useState({ name: false, email: false, phone: false, linkedin: false });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: cardData } = await supabase
          .from("seeker_cards")
          .select("id, job_title, city, is_active")
          .eq("profile_id", user.id)
          .single();
        if (cardData) setCard(cardData);

        const { data: introsData } = await supabase
          .from("intros")
          .select("id, employer_id, message, status, created_at")
          .eq("seeker_id", user.id)
          .order("created_at", { ascending: false });
        if (introsData) setIntros(introsData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleToggle = async () => {
    if (!card) return;
    const { error } = await supabase.from("seeker_cards").update({ is_active: !card.is_active }).eq("id", card.id);
    if (!error) setCard({ ...card, is_active: !card.is_active });
  };

  const handlePass = async (id: string) => {
    const { error } = await supabase.from("intros").update({ status: "passed" }).eq("id", id);
    if (!error) setIntros(intros.map((i) => i.id === id ? { ...i, status: "passed" as const } : i));
  };

  const handleRevealClick = (intro: Intro) => {
    setSelectedIntro(intro);
    setRevealData({ name: false, email: false, phone: false, linkedin: false });
    setRevealOpen(true);
  };

  const handleReveal = async () => {
    if (!selectedIntro) return;
    const { error: re } = await supabase.from("reveals").insert({ intro_id: selectedIntro.id, show_name: revealData.name, show_email: revealData.email, show_phone: revealData.phone, show_linkedin: revealData.linkedin });
    if (!re) {
      const { error: ue } = await supabase.from("intros").update({ status: "revealed" }).eq("id", selectedIntro.id);
      if (!ue) { setIntros(intros.map((i) => i.id === selectedIntro.id ? { ...i, status: "revealed" as const } : i)); setRevealOpen(false); }
    }
  };

  if (loading) return <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><p style={{ fontSize: 14, color: "var(--gray)" }}>Loading…</p></div>;

  const pending = intros.filter((i) => i.status === "pending");
  const revealed = intros.filter((i) => i.status === "revealed");
  const passed = intros.filter((i) => i.status === "passed");

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="section-header">
        <h2>Your Dashboard</h2>
        {card && <p>{card.job_title} in {card.city}</p>}
      </div>

      {/* Status Banner */}
      <div className="status-banner">
        <div className={`status-dot ${card?.is_active ? "live" : "dark"}`} />
        <div className="status-text">
          {card?.is_active
            ? "You're live. Employers in your area can see your card."
            : "You're hidden. No one can see your card."}
        </div>
        <button className="status-btn" onClick={handleToggle}>
          {card?.is_active ? "Go dark" : "Go live"}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{pending.length}</div>
          <div className="stat-label">Interested</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{revealed.length}</div>
          <div className="stat-label">Talking</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{passed.length}</div>
          <div className="stat-label">Passed</div>
        </div>
      </div>

      {/* Pending Intros */}
      {pending.length > 0 && (
        <>
          <div className="section-label">They're interested ({pending.length})</div>
          {pending.map((intro) => (
            <div key={intro.id} className="intro-card">
              <div className="intro-date">{timeAgo(new Date(intro.created_at))}</div>
              <div className="intro-msg">"{intro.message}"</div>
              <div className="intro-actions">
                <button className="btn-pass" onClick={() => handlePass(intro.id)}>Pass</button>
                <button className="btn-reveal" onClick={() => handleRevealClick(intro)}>Show them who I am</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Revealed */}
      {revealed.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 8 }}>Talking ({revealed.length})</div>
          {revealed.map((intro) => (
            <div key={intro.id} className="outreach-row">
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--charcoal)" }}>Connected</span>
              <span className="badge badge-revealed">REVEALED</span>
            </div>
          ))}
        </>
      )}

      {/* Empty */}
      {intros.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-title">All quiet for now</div>
          <div className="empty-desc">When someone reaches out, it shows up here.</div>
        </div>
      )}

      {/* Reveal Modal */}
      <div className={`modal-overlay${revealOpen ? " show" : ""}`} onClick={() => setRevealOpen(false)}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">You're in control</div>
            <button className="modal-close" onClick={() => setRevealOpen(false)}>×</button>
          </div>

          {selectedIntro && (
            <>
              <div className="modal-summary">
                <strong>Their message</strong>
                <span style={{ fontStyle: "italic" }}>"{selectedIntro.message}"</span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--charcoal)", marginBottom: 10 }}>
                Only share what you're comfortable with
              </div>

              <div className="checkbox-list">
                {(["name", "email", "phone", "linkedin"] as const).map((key) => (
                  <div
                    key={key}
                    className={`checkbox-item${revealData[key] ? " checked" : ""}`}
                    onClick={() => setRevealData({ ...revealData, [key]: !revealData[key] })}
                  >
                    <div className="checkbox-box">
                      {revealData[key] && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="checkbox-label">
                      {key === "name" ? "My real name" : key === "email" ? "Email address" : key === "phone" ? "Phone number" : "LinkedIn"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="preview-section">
                <div className="preview-label">They'll see:</div>
                <div className="preview-badges">
                  {revealData.name && <span className="preview-badge">My real name</span>}
                  {revealData.email && <span className="preview-badge">Email address</span>}
                  {revealData.phone && <span className="preview-badge">Phone number</span>}
                  {revealData.linkedin && <span className="preview-badge">LinkedIn</span>}
                  {!Object.values(revealData).some((v) => v) && (
                    <span style={{ fontSize: 12, color: "var(--gray)" }}>Nothing selected</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setRevealOpen(false)}>Cancel</button>
                <button className="btn-send" onClick={handleReveal}>Let them in</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
