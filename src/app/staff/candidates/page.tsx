"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerCard, Profile } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  WORK_SETUP_OPTIONS,
  formatSalary,
  getCategoryInitials,
  EXPRESS_BRANDING,
} from "@/lib/constants";

type FilterKey = "all" | "healthcare" | "trades" | "operations" | "sales" | "technology" | "finance";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "healthcare", label: "Healthcare" },
  { key: "trades", label: "Skilled Trades" },
  { key: "operations", label: "Operations" },
  { key: "sales", label: "Sales" },
  { key: "technology", label: "Tech" },
  { key: "finance", label: "Finance" },
];

const CATEGORY_MAP: Record<string, string> = {
  healthcare: "Healthcare",
  trades: "Skilled Trades",
  operations: "Operations",
  sales: "Sales & Marketing",
  technology: "Technology",
  finance: "Finance",
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
      <div className="screen-body flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray">Loading…</p>
      </div>
    );
  }

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="staffing-header">
        <div className="express-badge">
          <span className="express-dot" />
          {EXPRESS_BRANDING.shortName} Staffing
        </div>
        <h1>Candidates</h1>
        <div className="subtitle">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""} in pipeline</div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filters.has(key)
                ? "bg-express-navy text-white border border-express-navy"
                : "bg-white text-gray border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Candidates List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">👥</div>
          <div className="text-base font-bold text-charcoal mb-1">No candidates yet</div>
          <div className="text-sm text-gray leading-relaxed">Candidates show up here as they complete intake.</div>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {filtered.map((c) => (
            <Card key={c.id} className="overflow-hidden border-0 shadow-sm">
              {/* Header — Express navy */}
              <div className="job-card-header">
                <Avatar className="w-11 h-11 bg-express-navy-light text-white flex items-center justify-center font-bold text-base">
                  {/* In staffing mode, show name initials if available */}
                  {c.profiles?.name
                    ? c.profiles.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : getCategoryInitials(c.category)}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="title truncate">
                    {c.profiles?.name || c.job_title || c.headline || "Candidate"}
                  </div>
                  <div className="sub">
                    {c.job_title && c.profiles?.name ? `${c.job_title} · ` : ""}
                    {c.city || "Iowa"}, {c.state || "IA"}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-4 space-y-2 bg-white">
                {c.profiles?.email && (
                  <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                    <span className="text-gray">Email</span>
                    <span className="text-charcoal font-semibold text-xs">{c.profiles.email}</span>
                  </div>
                )}
                {c.profiles?.phone && (
                  <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                    <span className="text-gray">Phone</span>
                    <span className="text-charcoal font-semibold">{c.profiles.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Experience</span>
                  <span className="text-charcoal font-semibold">{c.years_experience || "—"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Setup</span>
                  <span className="text-charcoal font-semibold capitalize">{c.arrangement || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Available</span>
                  <span className="text-charcoal font-semibold capitalize">{c.availability || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray">Pay range</span>
                  <span className="text-charcoal font-semibold">{formatSalary(c.salary_min, c.salary_max)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="px-4 py-3 flex flex-wrap gap-2 bg-white border-t border-off-white">
                {c.category && <Badge variant="secondary">{c.category}</Badge>}
                {c.certifications?.map((cert) => (
                  <Badge key={cert} className="bg-green-bg text-green-700">{cert}</Badge>
                ))}
                {c.skills?.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="px-4 py-4 bg-white flex gap-3">
                <Button
                  onClick={() => handleViewCandidate(c)}
                  variant="outline"
                  className="flex-1 border-express-navy text-express-navy font-semibold"
                >
                  View details
                </Button>
                <Button
                  onClick={() => handleViewCandidate(c)}
                  className="flex-1 bg-express-navy hover:bg-express-navy-light text-white font-semibold"
                >
                  Match to job
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-full max-w-[430px] rounded-t-3xl rounded-b-none max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4">
              {/* Name & contact — full visibility in staffing mode */}
              <div className="bg-express-orange-bg p-4 rounded-2xl space-y-2">
                <div className="font-bold text-sm text-charcoal">
                  {candidateProfile?.name || selectedCandidate.job_title || "Candidate"}
                </div>
                {candidateProfile?.email && (
                  <div className="text-xs text-gray">{candidateProfile.email}</div>
                )}
                {candidateProfile?.phone && (
                  <div className="text-xs text-gray">{candidateProfile.phone}</div>
                )}
                {candidateProfile?.linkedin && (
                  <div className="text-xs text-gray">{candidateProfile.linkedin}</div>
                )}
              </div>

              {/* Card info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Title</span>
                  <span className="font-semibold text-charcoal">{selectedCandidate.job_title || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Experience</span>
                  <span className="font-semibold text-charcoal">{selectedCandidate.years_experience || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Location</span>
                  <span className="font-semibold text-charcoal">{selectedCandidate.city || "Iowa"}, {selectedCandidate.state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Setup</span>
                  <span className="font-semibold text-charcoal capitalize">{selectedCandidate.arrangement || "Flexible"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Available</span>
                  <span className="font-semibold text-charcoal capitalize">{selectedCandidate.availability || "Flexible"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Pay range</span>
                  <span className="font-semibold text-charcoal">{formatSalary(selectedCandidate.salary_min, selectedCandidate.salary_max)}</span>
                </div>
              </div>

              {/* Skills & certs */}
              {(selectedCandidate.certifications?.length > 0 || selectedCandidate.skills?.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCandidate.certifications?.map((c) => (
                    <Badge key={c} className="bg-green-bg text-green-700">{c}</Badge>
                  ))}
                  {selectedCandidate.skills?.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}

              {/* Why looking */}
              {selectedCandidate.reasons?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray mb-2">Why they're looking</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.reasons.map((r) => (
                      <Badge key={r} className="bg-red-bg text-red">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  className="flex-[2] bg-express-navy hover:bg-express-navy-light text-white font-semibold"
                >
                  Match to job
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
