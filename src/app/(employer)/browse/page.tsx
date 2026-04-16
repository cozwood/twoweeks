"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerCard } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="screen-body flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray">Loading…</p>
      </div>
    );
  }

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-charcoal">Browse Seekers</h2>
        <p className="text-sm text-gray mt-1">{filteredSeekers.length} candidate{filteredSeekers.length !== 1 ? "s" : ""} in Iowa</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 my-3 mx-4 bg-white rounded-3xl shadow-sm">
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{allSeekers.length}</div>
          <div className="text-xs text-gray mt-1 font-medium">Available</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{introsSent}</div>
          <div className="text-xs text-gray mt-1 font-medium">Intros Sent</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{revealedCount}</div>
          <div className="text-xs text-gray mt-1 font-medium">Revealed</div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filters.has(key)
                ? "bg-charcoal text-white border border-charcoal"
                : "bg-white text-gray border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Seeker Cards */}
      {filteredSeekers.length === 0 ? (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">👀</div>
          <div className="text-base font-bold text-charcoal mb-1">
            {allSeekers.length === 0 ? "No seekers yet" : "No matches for these filters"}
          </div>
          <div className="text-sm text-gray leading-relaxed">
            {allSeekers.length === 0 ? "Candidates are still signing up — check back soon." : "Try loosening your filters — good people show up every day."}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {filteredSeekers.map((seeker) => (
            <Card key={seeker.id} className="overflow-hidden border-0 shadow-sm">
              {/* Dark Header */}
              <div className="bg-charcoal px-4 py-4 flex items-center gap-3">
                <Avatar className="w-11 h-11 bg-gray-dark text-white flex items-center justify-center font-bold text-base">
                  {getCategoryInitials(seeker.category)}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-base truncate">{seeker.job_title || seeker.headline}</div>
                  <div className="text-gray-light text-xs mt-0.5">{seeker.city || "Iowa"}, {seeker.state || "IA"}</div>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-4 space-y-2 bg-white">
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Experience</span>
                  <span className="text-charcoal font-semibold">{seeker.years_experience || "—"} years</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Setup</span>
                  <span className="text-charcoal font-semibold capitalize">{seeker.arrangement || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-off-white text-sm">
                  <span className="text-gray">Available</span>
                  <span className="text-charcoal font-semibold capitalize">{seeker.availability || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray">Pay range</span>
                  <span className="text-charcoal font-semibold">{formatSalary(seeker.salary_min, seeker.salary_max)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="px-4 py-3 flex flex-wrap gap-2 bg-white border-t border-off-white">
                {seeker.category && <Badge variant="secondary">{seeker.category}</Badge>}
                {seeker.certifications?.map((c) => (
                  <Badge key={c} className="bg-green-bg text-green-700">{c}</Badge>
                ))}
                {seeker.skills?.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>

              {/* Action Button */}
              <div className="px-4 py-4 bg-white">
                <Button
                  onClick={() => handleSayHello(seeker)}
                  className="w-full bg-charcoal hover:bg-charcoal-light text-white font-semibold"
                >
                  Say hello
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Intro Modal */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="w-full max-w-[430px] rounded-t-3xl rounded-b-none">
          <DialogHeader>
            <DialogTitle>Introduce yourself</DialogTitle>
          </DialogHeader>

          {introSuccess ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">✓</div>
              <div className="text-xl font-bold text-charcoal mb-2">Intro sent!</div>
              <div className="text-sm text-gray">They'll see your message and decide what to share.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {modalSeeker && (
                <div className="bg-off-white p-4 rounded-2xl">
                  <div className="font-semibold text-sm text-charcoal">{modalSeeker.job_title || modalSeeker.headline}</div>
                  <div className="text-xs text-gray mt-1">{modalSeeker.years_experience} years · {modalSeeker.city || "Iowa"}, {modalSeeker.state || "IA"}</div>
                </div>
              )}
              <Textarea
                placeholder="Why this person caught your eye..."
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-gray-light">Be specific. People can tell when it's genuine.</p>

              {introError && (
                <div className="bg-red-bg border border-red text-red text-xs p-3 rounded-2xl">
                  {introError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowIntroModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendIntro}
                  disabled={sendingIntro || !introMessage.trim()}
                  className="flex-[2] bg-charcoal hover:bg-charcoal-light text-white"
                >
                  {sendingIntro ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
