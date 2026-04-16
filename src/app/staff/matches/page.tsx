"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JobMatch, JobListing, SeekerCard, Profile } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatSalary, EXPRESS_BRANDING } from "@/lib/constants";

interface MatchWithDetails extends JobMatch {
  job_listings?: Pick<JobListing, "title" | "city" | "category"> | null;
  seeker_profiles?: Pick<Profile, "name" | "email" | "phone"> | null;
  seeker_cards?: Pick<SeekerCard, "job_title" | "years_experience" | "city" | "skills" | "certifications"> | null;
}

type StatusFilter = "all" | "pending" | "reviewed" | "interested" | "hired" | "declined";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-express-orange-bg text-express-orange",
  reviewed: "bg-off-white text-gray-dark",
  interested: "bg-green-bg text-green-700",
  hired: "bg-express-navy text-white",
  declined: "bg-red-bg text-red",
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
        <h1>Matches</h1>
        <div className="subtitle">{matches.length} total match{matches.length !== 1 ? "es" : ""}</div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        {(["all", "pending", "reviewed", "interested", "hired", "declined"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === s
                ? "bg-express-navy text-white border border-express-navy"
                : "bg-white text-gray border border-border"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">🔗</div>
          <div className="text-base font-bold text-charcoal mb-1">
            {matches.length === 0 ? "No matches yet" : "No matches with this status"}
          </div>
          <div className="text-sm text-gray leading-relaxed">
            {matches.length === 0
              ? "Match candidates to jobs from the Candidates page."
              : "Try a different filter."}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {filtered.map((match) => (
            <Card key={match.id} className="overflow-hidden border-0 shadow-sm">
              {/* Match header */}
              <div className="px-4 py-3 bg-white border-b border-off-white flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-charcoal">
                    {match.seeker_profiles?.name || match.seeker_cards?.job_title || "Candidate"}
                  </div>
                  <div className="text-xs text-gray mt-0.5">
                    {match.seeker_cards?.job_title && match.seeker_profiles?.name ? `${match.seeker_cards.job_title} · ` : ""}
                    {match.seeker_cards?.city || "Iowa"}, IA
                  </div>
                </div>
                <Badge className={`text-xs ${STATUS_COLORS[match.status] || ""}`}>
                  {STATUS_LABELS[match.status] || match.status}
                </Badge>
              </div>

              {/* Job info */}
              <div className="px-4 py-3 bg-off-white">
                <div className="text-xs text-gray font-semibold">Matched to</div>
                <div className="text-sm font-semibold text-charcoal mt-1">
                  {match.job_listings?.title || "Unknown Job"}
                </div>
                <div className="text-xs text-gray">
                  {match.job_listings?.city || "Iowa"} · {match.job_listings?.category}
                </div>
              </div>

              {/* Contact (staffing mode: full visibility) */}
              {(match.seeker_profiles?.email || match.seeker_profiles?.phone) && (
                <div className="px-4 py-2 bg-white text-xs space-y-1">
                  {match.seeker_profiles.email && <div className="text-gray">{match.seeker_profiles.email}</div>}
                  {match.seeker_profiles.phone && <div className="text-gray">{match.seeker_profiles.phone}</div>}
                </div>
              )}

              {/* Notes */}
              {match.notes && (
                <div className="px-4 py-2 bg-white border-t border-off-white">
                  <div className="text-xs text-gray italic">"{match.notes}"</div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-3 bg-white flex gap-2">
                {match.status === "pending" && (
                  <>
                    <Button
                      variant="outline" size="sm"
                      className="flex-1 text-xs"
                      onClick={() => updateStatus(match.id, "declined")}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green text-white text-xs"
                      onClick={() => updateStatus(match.id, "interested")}
                    >
                      Interested
                    </Button>
                  </>
                )}
                {match.status === "interested" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-express-navy hover:bg-express-navy-light text-white text-xs"
                    onClick={() => updateStatus(match.id, "hired")}
                  >
                    Mark Hired
                  </Button>
                )}
                <Button
                  variant="outline" size="sm"
                  className="text-xs"
                  onClick={() => { setSelectedMatch(match); setNotes(match.notes || ""); setNotesOpen(true); }}
                >
                  Notes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="w-full max-w-[430px] rounded-t-3xl rounded-b-none">
          <DialogHeader>
            <DialogTitle>Match Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMatch && (
              <div className="bg-off-white p-3 rounded-2xl">
                <div className="text-sm font-semibold text-charcoal">
                  {selectedMatch.seeker_profiles?.name || "Candidate"} → {selectedMatch.job_listings?.title || "Job"}
                </div>
              </div>
            )}
            <Textarea
              placeholder="Add notes about this match..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setNotesOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={saveNotes}
                disabled={savingNotes}
                className="flex-[2] bg-express-navy hover:bg-express-navy-light text-white"
              >
                {savingNotes ? "Saving…" : "Save Notes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
