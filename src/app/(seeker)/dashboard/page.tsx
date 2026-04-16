"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(diffDays / 30);
  return `${months}mo ago`;
}

interface SeekerCard {
  id: string;
  job_title: string;
  city: string;
  is_active: boolean;
}

interface Intro {
  id: string;
  employer_id: string;
  message: string;
  status: "pending" | "revealed" | "passed";
  created_at: string;
  employer?: {
    company_name: string;
  };
}

interface Stat {
  label: string;
  value: number;
}

export default function Dashboard() {
  const supabase = createClient();
  const [seekerCard, setSeekerCard] = useState<SeekerCard | null>(null);
  const [intros, setIntros] = useState<Intro[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealOpen, setRevealOpen] = useState(false);
  const [selectedIntro, setSelectedIntro] = useState<Intro | null>(null);

  const [revealData, setRevealData] = useState({
    name: false,
    email: false,
    phone: false,
    linkedin: false,
  });

  const fallbackCard: SeekerCard = {
    id: "1",
    job_title: "Senior Software Engineer",
    city: "Des Moines",
    is_active: true,
  };

  const fallbackIntros: Intro[] = [
    {
      id: "1",
      employer_id: "emp1",
      message: "We love your profile and think you'd be a great fit for our team.",
      status: "pending",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      employer: { company_name: "Tech Corp" },
    },
    {
      id: "2",
      employer_id: "emp2",
      message: "Interested in discussing a VP Engineering role?",
      status: "pending",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      employer: { company_name: "Innovation Labs" },
    },
    {
      id: "3",
      employer_id: "emp3",
      message: "Your experience matches perfectly with what we're looking for.",
      status: "revealed",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      employer: { company_name: "Digital Solutions" },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSeekerCard(fallbackCard);
          setIntros(fallbackIntros);
          setLoading(false);
          return;
        }

        const { data: cardData } = await supabase
          .from("seeker_cards")
          .select("id, job_title, city, is_active")
          .eq("profile_id", user.id)
          .single();

        if (cardData) {
          setSeekerCard(cardData);
        } else {
          setSeekerCard(fallbackCard);
        }

        const { data: introsData } = await supabase
          .from("intros")
          .select("id, employer_id, message, status, created_at")
          .eq("seeker_id", user.id)
          .order("created_at", { ascending: false });

        if (introsData) {
          setIntros(introsData);
        } else {
          setIntros(fallbackIntros);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSeekerCard(fallbackCard);
        setIntros(fallbackIntros);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusToggle = async () => {
    if (!seekerCard) return;

    try {
      const { error } = await supabase
        .from("seeker_cards")
        .update({ is_active: !seekerCard.is_active })
        .eq("id", seekerCard.id);

      if (!error) {
        setSeekerCard({ ...seekerCard, is_active: !seekerCard.is_active });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handlePass = async (introId: string) => {
    try {
      const { error } = await supabase
        .from("intros")
        .update({ status: "passed" })
        .eq("id", introId);

      if (!error) {
        setIntros(intros.map((intro) =>
          intro.id === introId ? { ...intro, status: "passed" } : intro
        ));
      }
    } catch (error) {
      console.error("Error passing intro:", error);
    }
  };

  const handleRevealClick = (intro: Intro) => {
    setSelectedIntro(intro);
    setRevealData({ name: false, email: false, phone: false, linkedin: false });
    setRevealOpen(true);
  };

  const handleReveal = async () => {
    if (!selectedIntro) return;

    try {
      const { error: revealError } = await supabase.from("reveals").insert({
        intro_id: selectedIntro.id,
        show_name: revealData.name,
        show_email: revealData.email,
        show_phone: revealData.phone,
        show_linkedin: revealData.linkedin,
      });

      if (!revealError) {
        const { error: updateError } = await supabase
          .from("intros")
          .update({ status: "revealed" })
          .eq("id", selectedIntro.id);

        if (!updateError) {
          setIntros(
            intros.map((intro) =>
              intro.id === selectedIntro.id
                ? { ...intro, status: "revealed" }
                : intro
            )
          );
          setRevealOpen(false);
        }
      }
    } catch (error) {
      console.error("Error revealing:", error);
    }
  };

  if (loading) {
    return <div style={{ padding: "1rem", textAlign: "center" }}>Loading...</div>;
  }

  const pendingIntros = intros.filter((i) => i.status === "pending");
  const revealedIntros = intros.filter((i) => i.status === "revealed");

  const stats: Stat[] = [
    { label: "Interested", value: pendingIntros.length },
    { label: "Talking", value: revealedIntros.length },
    { label: "Passed", value: intros.filter((i) => i.status === "passed").length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--off-white)" }}>
      <div style={{ flex: 1, padding: "1rem", paddingTop: "2rem", paddingBottom: "1rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            Your Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--gray)" }}>
            {seekerCard?.job_title} in {seekerCard?.city}
          </p>
        </div>

        <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", backgroundColor: seekerCard?.is_active ? "var(--green)" : "var(--gray-dark)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: 500 }}>
            {seekerCard?.is_active ? "You're live. Employers in your area can see your card." : "You're hidden. No one can see your card."}
          </span>
          <button
            onClick={handleStatusToggle}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "var(--charcoal)",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {seekerCard?.is_active ? "Go dark" : "Go live"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ padding: "1rem", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "0.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.25rem" }}>
                {stat.value}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {pendingIntros.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>
              They're interested ({pendingIntros.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingIntros.map((intro) => (
                <div key={intro.id} style={{ padding: "1rem", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--gray)", marginBottom: "0.5rem" }}>
                    {intro.created_at ? formatDistanceToNow(new Date(intro.created_at)) : "Recently"}
                  </p>
                  <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--charcoal)", marginBottom: "1rem" }}>
                    "{intro.message}"
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handlePass(intro.id)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        fontSize: "0.75rem",
                        height: "2rem",
                        backgroundColor: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        color: "var(--charcoal)",
                        fontWeight: 500,
                      }}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handleRevealClick(intro)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        fontSize: "0.75rem",
                        height: "2rem",
                        backgroundColor: "var(--charcoal)",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Show them who I am
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {revealedIntros.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>
              Talking ({revealedIntros.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {revealedIntros.map((intro) => (
                <div key={intro.id} style={{ padding: "1rem", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--charcoal)" }}>
                      Connected
                    </p>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "var(--charcoal)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                      REVEALED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {intros.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: "0.5rem" }}>
              All quiet for now
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--gray)" }}>
              When someone reaches out, it shows up here.
            </p>
          </div>
        ) : null}
      </div>

      {revealOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50,
          }}
          onClick={() => setRevealOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "28rem",
              backgroundColor: "white",
              borderTopLeftRadius: "1rem",
              borderTopRightRadius: "1rem",
              padding: "1.5rem",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--charcoal)" }}>
                You're in control
              </h2>
              <button
                onClick={() => setRevealOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--charcoal)",
                }}
              >
                ×
              </button>
            </div>

            {selectedIntro && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--gray)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Their message
                  </p>
                  <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--charcoal)" }}>
                    "{selectedIntro.message}"
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: "0.625rem" }}>
                    Only share what you're comfortable with
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(["name", "email", "phone", "linkedin"] as const).map((key) => (
                      <label
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          cursor: "pointer",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          backgroundColor: revealData[key] ? "var(--off-white)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={revealData[key]}
                          onChange={(e) =>
                            setRevealData({ ...revealData, [key]: e.target.checked })
                          }
                          style={{
                            width: "1rem",
                            height: "1rem",
                            cursor: "pointer",
                            accentColor: "var(--charcoal)",
                          }}
                        />
                        <span style={{ fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: 500 }}>
                          {key === "name" ? "My real name" : key === "email" ? "Email address" : key === "phone" ? "Phone number" : "LinkedIn"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--gray)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    They'll see:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {revealData.name && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "var(--charcoal)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                        My real name
                      </span>
                    )}
                    {revealData.email && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "var(--charcoal)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                        Email address
                      </span>
                    )}
                    {revealData.phone && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "var(--charcoal)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                        Phone number
                      </span>
                    )}
                    {revealData.linkedin && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "var(--charcoal)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                        LinkedIn
                      </span>
                    )}
                    {!Object.values(revealData).some((v) => v) && (
                      <p style={{ fontSize: "0.75rem", color: "var(--gray)" }}>Nothing selected</p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => setRevealOpen(false)}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      backgroundColor: "white",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      color: "var(--charcoal)",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReveal}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      backgroundColor: "var(--charcoal)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                  >
                    Let them in
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
