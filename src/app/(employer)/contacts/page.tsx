"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

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
      <div className="screen-body flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray">Loading…</p>
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
      <div className="px-5 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-charcoal">
          {userName ? `Hey, ${userName}.` : "Your Contacts"}
        </h2>
        {companyName && <p className="text-sm text-gray mt-1">{companyName}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3 my-3 mx-4 bg-white rounded-3xl shadow-sm">
        <div className="text-center py-1">
          <div className="text-2xl font-extrabold text-charcoal">{sentCount}</div>
          <div className="text-xs text-gray mt-1 font-medium">Sent</div>
        </div>
        <div className="text-center py-1">
          <div className="text-2xl font-extrabold text-charcoal">{waitingCount}</div>
          <div className="text-xs text-gray mt-1 font-medium">Waiting</div>
        </div>
        <div className="text-center py-1">
          <div className="text-2xl font-extrabold text-charcoal">{revealedCount}</div>
          <div className="text-xs text-gray mt-1 font-medium">Opened</div>
        </div>
        <div className="text-center py-1">
          <div className="text-2xl font-extrabold text-charcoal">{hiredCount}</div>
          <div className="text-xs text-gray mt-1 font-medium">Hired</div>
        </div>
      </div>

      {/* Revealed Contacts */}
      <div className="text-sm font-bold text-charcoal px-5 py-3">People who shared with you ({contacts.length})</div>

      {contacts.length === 0 ? (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">🤝</div>
          <div className="text-base font-bold text-charcoal mb-1">Nobody's opened up yet</div>
          <div className="text-sm text-gray leading-relaxed mb-4">When someone shares their info, they'll show up here.</div>
          <Link href="/browse">
            <Button className="bg-charcoal hover:bg-charcoal-light text-white font-semibold">
              Browse candidates
            </Button>
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {contacts.map((c) => (
            <Card key={c.intro_id} className="p-4 flex items-center gap-3 border-0 shadow-sm">
              <Avatar className="w-10 h-10 bg-charcoal text-white flex items-center justify-center font-bold">
                {c.name ? c.name.charAt(0).toUpperCase() : "?"}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-charcoal">{c.name || "Anonymous"}</div>
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-xs text-gray hover:text-charcoal block mt-0.5">
                    ✉ {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="text-xs text-gray hover:text-charcoal block">
                    ☎ {c.phone}
                  </a>
                )}
                {c.linkedin && (
                  <a href={`https://${c.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray hover:text-charcoal block">
                    🔗 LinkedIn
                  </a>
                )}
              </div>
              {c.status === "hired" && <Badge className="bg-charcoal text-white text-xs">HIRED</Badge>}
            </Card>
          ))}
        </div>
      )}

      {/* Outreach History */}
      <div className="text-sm font-bold text-charcoal px-5 py-3 mt-2">Your outreach ({sentCount})</div>

      {outreach.length === 0 ? (
        <div className="text-center py-6 px-7">
          <div className="text-sm text-gray">No outreach yet</div>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {outreach.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center px-4 py-3.5 bg-white rounded-xl shadow-sm">
              <div>
                <div className="text-xs font-semibold text-charcoal">{entry.seeker_title}</div>
                <div className="text-xs text-gray mt-0.5">{formatDate(entry.created_at)}</div>
              </div>
              <Badge
                className={`text-xs ${
                  entry.status === "pending"
                    ? "bg-orange-bg text-orange"
                    : entry.status === "passed"
                    ? "bg-off-white text-gray-light"
                    : "bg-charcoal text-white"
                }`}
              >
                {entry.status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
