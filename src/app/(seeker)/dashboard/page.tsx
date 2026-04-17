"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

interface Card { id: string; job_title: string; city: string; is_active: boolean; }
interface Intro { id: string; employer_id: string; message: string | null; status: "pending" | "revealed" | "passed"; created_at: string; employer_company?: string; }

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
        if (introsData) {
          const enriched = await Promise.all(introsData.map(async (intro) => {
            const { data: emp } = await supabase.from("profiles").select("company").eq("id", intro.employer_id).single();
            return { ...intro, employer_company: emp?.company || "A company" };
          }));
          setIntros(enriched);
        }
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

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "#F5F5F5" }}>
      <p style={{ fontSize: "14px", color: "#636366" }}>Loading…</p>
    </div>
  );

  const pending = intros.filter((i) => i.status === "pending");
  const revealed = intros.filter((i) => i.status === "revealed");
  const passed = intros.filter((i) => i.status === "passed");

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 24, paddingBottom: 8 }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1C1C1E" }}>Your Dashboard</h2>
        {card && <p style={{ fontSize: "14px", color: "#636366", marginTop: 4 }}>{card.job_title} in {card.city}</p>}
      </div>

      {/* Status Banner */}
      <div style={{ margin: "12px 16px", padding: 12, borderRadius: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            background: card?.is_active ? "#48BB78" : "#AEAEB2",
            boxShadow: card?.is_active ? "0 0 0 3px rgba(72,187,120,0.2)" : "none",
          }}
        />
        <div style={{ flex: 1, fontSize: "12px", color: "#636366", lineHeight: 1.5 }}>
          {card?.is_active
            ? "You're live. Employers in your area can see your card."
            : "You're hidden. No one can see your card."}
        </div>
        <button
          onClick={handleToggle}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: "#FFFFFF",
            border: "1px solid #E5E5EA",
            borderRadius: 6,
            cursor: "pointer",
            color: "#1C1C1E",
          }}
        >
          {card?.is_active ? "Go dark" : "Go live"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, margin: "12px 16px", background: "#FFFFFF", borderRadius: 48, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1C1C1E" }}>{pending.length}</div>
          <div style={{ fontSize: "12px", color: "#636366", marginTop: 4, fontWeight: 500 }}>Interested</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1C1C1E" }}>{revealed.length}</div>
          <div style={{ fontSize: "12px", color: "#636366", marginTop: 4, fontWeight: 500 }}>Talking</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1C1C1E" }}>{passed.length}</div>
          <div style={{ fontSize: "12px", color: "#636366", marginTop: 4, fontWeight: 500 }}>Passed</div>
        </div>
      </div>

      {/* Pending Intros */}
      {pending.length > 0 && (
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1C1C1E", paddingLeft: 8, paddingRight: 8, paddingTop: 12, paddingBottom: 12 }}>They're interested ({pending.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((intro) => (
              <div key={intro.id} style={{ padding: 16, borderRadius: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "12px", color: "#AEAEB2", marginBottom: 8 }}>{formatDate(new Date(intro.created_at))}</div>
                <div style={{ fontSize: "14px", color: "#1C1C1E", fontStyle: "italic", lineHeight: 1.5, marginBottom: 14 }}>
                  &ldquo;{intro.message || `We're interested in your profile. Would love to chat!`}&rdquo;
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handlePass(intro.id)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "#FFFFFF",
                      border: "1px solid #E5E5EA",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "#1C1C1E",
                    }}
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleRevealClick(intro)}
                    style={{
                      flex: 2,
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "#1C1C1E",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2C2C2E"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#1C1C1E"}
                  >
                    Show them who I am
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revealed */}
      {revealed.length > 0 && (
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1C1C1E", paddingLeft: 8, paddingRight: 8, paddingTop: 12, paddingBottom: 12, marginTop: 8 }}>Talking ({revealed.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {revealed.map((intro) => (
              <div key={intro.id} style={{ padding: 16, background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: intro.message ? 8 : 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#1C1C1E" }}>Connected</span>
                  <span style={{ padding: "4px 10px", borderRadius: 20, background: "#1C1C1E", color: "#FFFFFF", fontSize: "11px", fontWeight: 700 }}>REVEALED</span>
                </div>
                {intro.message && (
                  <div style={{ fontSize: "13px", color: "#636366", fontStyle: "italic", lineHeight: 1.5 }}>
                    &ldquo;{intro.message}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {intros.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40, paddingLeft: 28, paddingRight: 28 }}>
          <div style={{ fontSize: "36px", marginBottom: 12, opacity: 0.4 }}>💬</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>All quiet for now</div>
          <div style={{ fontSize: "14px", color: "#636366", lineHeight: 1.5 }}>When someone reaches out, it shows up here.</div>
        </div>
      )}

      {/* Reveal Modal */}
      {revealOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: 20,
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1C1C1E" }}>You&apos;re in control</h2>
              <button
                onClick={() => setRevealOpen(false)}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F5F5F5", cursor: "pointer", fontSize: 16, color: "#636366", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>

            {selectedIntro && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#F5F5F5", padding: 16, borderRadius: 16 }}>
                  <div style={{ fontSize: "12px", color: "#AEAEB2", marginBottom: 4 }}>They wrote:</div>
                  <div style={{ fontSize: "14px", color: "#1C1C1E", fontStyle: "italic", lineHeight: 1.5 }}>
                    &ldquo;{selectedIntro.message || `We're interested in your profile. Would love to chat!`}&rdquo;
                  </div>
                </div>

                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1C1C1E" }}>
                  Only share what you're comfortable with
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(["name", "email", "phone", "linkedin"] as const).map((key) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={revealData[key]}
                        onChange={() => setRevealData({ ...revealData, [key]: !revealData[key] })}
                        style={{
                          width: 20,
                          height: 20,
                          cursor: "pointer",
                          accentColor: "#1C1C1E",
                        }}
                      />
                      <span
                        style={{ fontSize: "14px", color: "#1C1C1E", fontWeight: 500, cursor: "pointer", flex: 1 }}
                        onClick={() => setRevealData({ ...revealData, [key]: !revealData[key] })}
                      >
                        {key === "name" ? "My real name" : key === "email" ? "Email address" : key === "phone" ? "Phone number" : "LinkedIn"}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: "12px", color: "#636366", fontWeight: 600, marginBottom: 8 }}>They'll see:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {revealData.name && <span style={{ padding: "4px 10px", borderRadius: 20, background: "#1C1C1E", color: "#FFFFFF", fontSize: "11px", fontWeight: 700 }}>Name</span>}
                    {revealData.email && <span style={{ padding: "4px 10px", borderRadius: 20, background: "#1C1C1E", color: "#FFFFFF", fontSize: "11px", fontWeight: 700 }}>Email</span>}
                    {revealData.phone && <span style={{ padding: "4px 10px", borderRadius: 20, background: "#1C1C1E", color: "#FFFFFF", fontSize: "11px", fontWeight: 700 }}>Phone</span>}
                    {revealData.linkedin && <span style={{ padding: "4px 10px", borderRadius: 20, background: "#1C1C1E", color: "#FFFFFF", fontSize: "11px", fontWeight: 700 }}>LinkedIn</span>}
                    {!Object.values(revealData).some((v) => v) && (
                      <span style={{ fontSize: "12px", color: "#636366" }}>Nothing selected</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, paddingTop: 16 }}>
                  <button
                    onClick={() => setRevealOpen(false)}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: "#FFFFFF",
                      border: "1px solid #E5E5EA",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "#1C1C1E",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReveal}
                    style={{
                      flex: 2,
                      padding: "10px 12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: "#1C1C1E",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2C2C2E"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#1C1C1E"}
                  >
                    Let them in
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: -1,
                cursor: "pointer",
              }}
              onClick={() => setRevealOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
