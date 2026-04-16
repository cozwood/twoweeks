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
      <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ fontSize: 14, color: "var(--gray)" }}>Loading…</p>
      </div>
    );
  }

  const sentCount = outreach.length;
  const waitingCount = outreach.filter((o) => o.status === "pending").length;
  const revealedCount = outreach.filter((o) => o.status === "revealed").length;
  const hiredCount = outreach.filter((o) => o.status === "hired").length;

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="section-header">
        <h2>{userName ? `Hey, ${userName}.` : "Your Contacts"}</h2>
        {companyName && <p>{companyName}</p>}
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ flexWrap: "wrap" }}>
        <div className="stat-card">
          <div className="stat-num">{sentCount}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{waitingCount}</div>
          <div className="stat-label">Waiting</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{revealedCount}</div>
          <div className="stat-label">Opened</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{hiredCount}</div>
          <div className="stat-label">Hired</div>
        </div>
      </div>

      {/* Revealed Contacts */}
      <div className="section-label">People who shared with you ({contacts.length})</div>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <div className="empty-title">Nobody's opened up yet</div>
          <div className="empty-desc">When someone shares their info, they'll show up here.</div>
          <Link href="/browse" style={{ display: "inline-block", marginTop: 16 }}>
            <button className="card-action-btn" style={{ width: "auto", padding: "10px 24px" }}>Browse candidates</button>
          </Link>
        </div>
      ) : (
        contacts.map((c) => (
          <div key={c.intro_id} className="contact-card">
            <div className="avatar small">{c.name ? c.name.charAt(0) : "?"}</div>
            <div className="contact-info">
              <div className="contact-name">{c.name || "Anonymous"}</div>
              {c.email && (
                <a href={`mailto:${c.email}`} className="contact-detail" style={{ display: "block", textDecoration: "none", color: "var(--gray)" }}>
                  ✉ {c.email}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} className="contact-detail" style={{ display: "block", textDecoration: "none", color: "var(--gray)" }}>
                  ☎ {c.phone}
                </a>
              )}
              {c.linkedin && (
                <a href={`https://${c.linkedin}`} target="_blank" rel="noopener noreferrer" className="contact-detail" style={{ display: "block", textDecoration: "none", color: "var(--gray)" }}>
                  🔗 LinkedIn
                </a>
              )}
            </div>
            {c.status === "hired" && <span className="badge badge-revealed">HIRED</span>}
          </div>
        ))
      )}

      {/* Outreach History */}
      <div className="section-label" style={{ marginTop: 16 }}>Your outreach ({sentCount})</div>

      {outreach.length === 0 ? (
        <div className="empty-state">
          <div className="empty-desc">No outreach yet</div>
        </div>
      ) : (
        outreach.map((entry) => (
          <div key={entry.id} className="outreach-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--charcoal)" }}>{entry.seeker_title}</div>
              <div className="outreach-date">{formatDate(entry.created_at)}</div>
            </div>
            <span className={`badge ${
              entry.status === "pending" ? "badge-pending" :
              entry.status === "passed" ? "badge-passed" :
              "badge-revealed"
            }`}>
              {entry.status.toUpperCase()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
