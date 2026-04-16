"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface RevealedContact {
  intro_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  show_name: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_linkedin: boolean;
  status: string;
}

interface OutreachEntry {
  id: string;
  status: string;
  created_at: string;
  seeker_title: string | null;
}

export default function ContactsPage() {
  const [supabase] = useState(() => createClient());
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contacts, setContacts] = useState<RevealedContact[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Profile
      const { data: profile } = await supabase.from("profiles").select("name, company").eq("id", user.id).single();
      if (profile) {
        if (profile.name) setUserName(profile.name);
        if (profile.company) setCompanyName(profile.company);
      }

      // Intros with status
      const { data: introsData } = await supabase
        .from("intros")
        .select("id, status, created_at, seeker_id")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      if (introsData) {
        // Build outreach list with seeker titles
        const entries: OutreachEntry[] = [];
        for (const intro of introsData) {
          const { data: sc } = await supabase.from("seeker_cards").select("job_title").eq("profile_id", intro.seeker_id).single();
          entries.push({ id: intro.id, status: intro.status, created_at: intro.created_at, seeker_title: sc?.job_title || "Candidate" });
        }
        setOutreach(entries);

        // Get revealed contacts
        const revealedIntros = introsData.filter((i) => i.status === "revealed" || i.status === "hired");
        const revealedContacts: RevealedContact[] = [];
        for (const intro of revealedIntros) {
          const { data: reveal } = await supabase.from("reveals").select("show_name, show_email, show_phone, show_linkedin").eq("intro_id", intro.id).single();
          const { data: prof } = await supabase.from("profiles").select("name, email, phone, linkedin").eq("id", intro.seeker_id).single();
          if (reveal && prof) {
            revealedContacts.push({
              intro_id: intro.id,
              name: reveal.show_name ? prof.name : null,
              email: reveal.show_email ? prof.email : null,
              phone: reveal.show_phone ? prof.phone : null,
              linkedin: reveal.show_linkedin ? prof.linkedin : null,
              show_name: reveal.show_name,
              show_email: reveal.show_email,
              show_phone: reveal.show_phone,
              show_linkedin: reveal.show_linkedin,
              status: intro.status,
            });
          }
        }
        setContacts(revealedContacts);
      }

      setLoading(false);
    })();
  }, [supabase]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <p style={{
          fontSize: "14px",
          color: "#636366"
        }}>Loading…</p>
      </div>
    );
  }

  const sentCount = outreach.length;
  const waitingCount = outreach.filter((o) => o.status === "pending").length;
  const revealedCount = outreach.filter((o) => o.status === "revealed").length;
  const hiredCount = outreach.filter((o) => o.status === "hired").length;

  return (
    <div style={{
      minHeight: "100vh",
      paddingBottom: 80,
      backgroundColor: "#F5F5F5"
    }}>
      {/* Header */}
      <div style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 24,
        paddingBottom: 8
      }}>
        <h2 style={{
          fontSize: "24px",
          fontWeight: "900",
          color: "#1C1C1E"
        }}>
          {userName ? `Hey, ${userName}.` : "Your Contacts"}
        </h2>
        {companyName && <p style={{
          fontSize: "14px",
          color: "#636366",
          marginTop: 4
        }}>{companyName}</p>}
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: 16,
        margin: 12,
        marginLeft: 16,
        marginRight: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
      }}>
        <div style={{
          textAlign: "center",
          paddingTop: 4,
          paddingBottom: 4
        }}>
          <div style={{
            fontSize: "24px",
            fontWeight: "900",
            color: "#1C1C1E"
          }}>{sentCount}</div>
          <div style={{
            fontSize: "12px",
            color: "#636366",
            marginTop: 4,
            fontWeight: "500"
          }}>Sent</div>
        </div>
        <div style={{
          textAlign: "center",
          paddingTop: 4,
          paddingBottom: 4
        }}>
          <div style={{
            fontSize: "24px",
            fontWeight: "900",
            color: "#1C1C1E"
          }}>{waitingCount}</div>
          <div style={{
            fontSize: "12px",
            color: "#636366",
            marginTop: 4,
            fontWeight: "500"
          }}>Waiting</div>
        </div>
        <div style={{
          textAlign: "center",
          paddingTop: 4,
          paddingBottom: 4
        }}>
          <div style={{
            fontSize: "24px",
            fontWeight: "900",
            color: "#1C1C1E"
          }}>{revealedCount}</div>
          <div style={{
            fontSize: "12px",
            color: "#636366",
            marginTop: 4,
            fontWeight: "500"
          }}>Opened</div>
        </div>
        <div style={{
          textAlign: "center",
          paddingTop: 4,
          paddingBottom: 4
        }}>
          <div style={{
            fontSize: "24px",
            fontWeight: "900",
            color: "#1C1C1E"
          }}>{hiredCount}</div>
          <div style={{
            fontSize: "12px",
            color: "#636366",
            marginTop: 4,
            fontWeight: "500"
          }}>Hired</div>
        </div>
      </div>

      {/* Revealed Contacts */}
      <div style={{
        fontSize: "14px",
        fontWeight: "700",
        color: "#1C1C1E",
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 12,
        paddingBottom: 12
      }}>People who shared with you ({contacts.length})</div>

      {contacts.length === 0 ? (
        <div style={{
          textAlign: "center",
          paddingTop: 40,
          paddingBottom: 40,
          paddingLeft: 28,
          paddingRight: 28
        }}>
          <div style={{
            fontSize: "36px",
            marginBottom: 12,
            opacity: 0.4
          }}>🤝</div>
          <div style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#1C1C1E",
            marginBottom: 4
          }}>Nobody's opened up yet</div>
          <div style={{
            fontSize: "14px",
            color: "#636366",
            lineHeight: "1.5",
            marginBottom: 16
          }}>When someone shares their info, they'll show up here.</div>
          <Link href="/browse">
            <button style={{
              backgroundColor: "#1C1C1E",
              color: "#FFFFFF",
              fontWeight: "600",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px"
            }}>
              Browse candidates
            </button>
          </Link>
        </div>
      ) : (
        <div style={{
          paddingLeft: 16,
          paddingRight: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingBottom: 16
        }}>
          {contacts.map((c) => (
            <div key={c.intro_id} style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: "#1C1C1E",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                borderRadius: "50%",
                flexShrink: 0
              }}>
                {c.name ? c.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1C1C1E"
                }}>{c.name || "Anonymous"}</div>
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{
                    fontSize: "12px",
                    color: "#636366",
                    display: "block",
                    marginTop: 2,
                    textDecoration: "none"
                  }} onMouseEnter={(e) => e.currentTarget.style.color = "#1C1C1E"} onMouseLeave={(e) => e.currentTarget.style.color = "#636366"}>
                    ✉ {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} style={{
                    fontSize: "12px",
                    color: "#636366",
                    display: "block",
                    textDecoration: "none"
                  }} onMouseEnter={(e) => e.currentTarget.style.color = "#1C1C1E"} onMouseLeave={(e) => e.currentTarget.style.color = "#636366"}>
                    ☎ {c.phone}
                  </a>
                )}
                {c.linkedin && (
                  <a href={`https://${c.linkedin}`} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: "12px",
                    color: "#636366",
                    display: "block",
                    textDecoration: "none"
                  }} onMouseEnter={(e) => e.currentTarget.style.color = "#1C1C1E"} onMouseLeave={(e) => e.currentTarget.style.color = "#636366"}>
                    🔗 LinkedIn
                  </a>
                )}
              </div>
              {c.status === "hired" && <span style={{
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "700",
                backgroundColor: "#1C1C1E",
                color: "#FFFFFF",
                whiteSpace: "nowrap"
              }}>HIRED</span>}
            </div>
          ))}
        </div>
      )}

      {/* Outreach History */}
      <div style={{
        fontSize: "14px",
        fontWeight: "700",
        color: "#1C1C1E",
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 8
      }}>Your outreach ({sentCount})</div>

      {outreach.length === 0 ? (
        <div style={{
          textAlign: "center",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 28,
          paddingRight: 28
        }}>
          <div style={{
            fontSize: "14px",
            color: "#636366"
          }}>No outreach yet</div>
        </div>
      ) : (
        <div style={{
          paddingLeft: 16,
          paddingRight: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingBottom: 16
        }}>
          {outreach.map((entry) => {
            const statusStyles = entry.status === "pending"
              ? { backgroundColor: "#FFFAF0", color: "#ED8936" }
              : entry.status === "passed"
              ? { backgroundColor: "#F5F5F5", color: "#AEAEB2" }
              : { backgroundColor: "#1C1C1E", color: "#FFFFFF" };
            return (
              <div key={entry.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 14,
                paddingBottom: 14,
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                <div>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#1C1C1E"
                  }}>{entry.seeker_title}</div>
                  <div style={{
                    fontSize: "12px",
                    color: "#636366",
                    marginTop: 2
                  }}>{formatDate(entry.created_at)}</div>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  ...statusStyles
                }}>
                  {entry.status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
