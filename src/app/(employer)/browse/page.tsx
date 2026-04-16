"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader, ChevronRight } from "lucide-react";
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

  // Stats from real data
  const [introsSent, setIntrosSent] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

  // Modal state
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [modalSeeker, setModalSeeker] = useState<SeekerCard | null>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);
  const [introError, setIntroError] = useState("");
  const [introSuccess, setIntroSuccess] = useState(false);

  // Fetch real seekers + stats on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch active seeker cards (RLS handles block list filtering)
      const { data: cards, error } = await supabase
        .from("seeker_cards")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && cards) {
        setAllSeekers(cards);
      }

      // Fetch stats for this employer
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { count: introsCount } = await supabase
          .from("intros")
          .select("*", { count: "exact", head: true })
          .eq("employer_id", user.id);

        const { count: revealsCount } = await supabase
          .from("intros")
          .select("*", { count: "exact", head: true })
          .eq("employer_id", user.id)
          .eq("status", "revealed");

        setIntrosSent(introsCount || 0);
        setRevealedCount(revealsCount || 0);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  // Apply filters
  const filteredSeekers = allSeekers.filter((seeker) => {
    if (filters.has("all")) return true;

    let match = false;
    if (filters.has("healthcare") && seeker.category === "Healthcare") match = true;
    if (filters.has("trades") && seeker.category === "Skilled Trades") match = true;
    if (filters.has("operations") && seeker.category === "Operations") match = true;
    if (filters.has("on-site") && seeker.arrangement === "on-site") match = true;
    if (filters.has("hybrid") && seeker.arrangement === "hybrid") match = true;
    if (filters.has("remote") && seeker.arrangement === "remote") match = true;

    return match;
  });

  const getCategoryInitials = (category: string | null): string => {
    const categoryMap: Record<string, string> = {
      "Sales & Marketing": "SM",
      Healthcare: "HC",
      Technology: "TE",
      "Skilled Trades": "SK",
      Operations: "OP",
      Finance: "FI",
    };
    return categoryMap[category || ""] || "TW";
  };

  const toggleFilter = (filter: FilterKey) => {
    const next = new Set(filters);
    if (filter === "all") {
      next.clear();
      next.add("all");
    } else {
      next.delete("all");
      if (next.has(filter)) {
        next.delete(filter);
        if (next.size === 0) next.add("all");
      } else {
        next.add(filter);
      }
    }
    setFilters(next);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIntroError("Not authenticated");
        return;
      }

      const { error } = await supabase.from("intros").insert({
        employer_id: user.id,
        seeker_id: modalSeeker.profile_id,
        message: introMessage,
        status: "pending",
      });

      if (error) {
        setIntroError(error.message);
      } else {
        setIntroSuccess(true);
        setIntrosSent((prev) => prev + 1);
        setTimeout(() => {
          setShowIntroModal(false);
          setModalSeeker(null);
          setIntroMessage("");
          setIntroSuccess(false);
        }, 1500);
      }
    } catch {
      setIntroError("Failed to send introduction");
    } finally {
      setSendingIntro(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader size={24} className="animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Browse Seekers</h1>
        <p className="text-sm text-gray">
          {filteredSeekers.length} candidate{filteredSeekers.length !== 1 ? "s" : ""} in Iowa
        </p>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-6 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{allSeekers.length}</p>
            <p className="text-xs text-gray-muted">Available</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{introsSent}</p>
            <p className="text-xs text-gray-muted">Intros Sent</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{revealedCount}</p>
            <p className="text-xs text-gray-muted">Revealed</p>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-4 border-b border-border overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filters.has(key)
                  ? "bg-charcoal text-white"
                  : "bg-gray-light text-charcoal hover:bg-gray"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Seeker Cards */}
      <div className="px-4 py-6 space-y-4">
        {filteredSeekers.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <p className="text-base font-semibold text-charcoal mb-2">
              {allSeekers.length === 0 ? "No seekers yet" : "No matches for these filters"}
            </p>
            <p className="text-sm text-gray">
              {allSeekers.length === 0
                ? "Candidates are still signing up — check back soon."
                : "Try loosening your filters — good people show up every day."}
            </p>
          </div>
        ) : (
          filteredSeekers.map((seeker) => (
            <div
              key={seeker.id}
              className="bg-white border border-border rounded-lg overflow-hidden"
            >
              {/* Header with Avatar */}
              <div className="bg-charcoal text-white pb-4 px-4 py-4">
                <div className="flex gap-3 items-start">
                  <div className="h-12 w-12 rounded-full bg-charcoal-light text-white flex items-center justify-center font-bold text-sm">
                    {getCategoryInitials(seeker.category)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base">{seeker.job_title || seeker.headline}</p>
                    <p className="text-sm text-gray-light">
                      {seeker.city || "Iowa"}, {seeker.state || "IA"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Experience</span>
                    <span className="font-semibold text-charcoal">
                      {seeker.years_experience || "—"} years
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Setup</span>
                    <span className="font-semibold text-charcoal capitalize">
                      {seeker.arrangement || "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Available</span>
                    <span className="font-semibold text-charcoal capitalize">
                      {seeker.availability || "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Pay range</span>
                    <span className="font-semibold text-charcoal">
                      {formatSalary(seeker.salary_min, seeker.salary_max)}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {seeker.category && (
                    <span className="px-3 py-1 bg-off-white text-charcoal rounded-full text-xs font-medium">
                      {seeker.category}
                    </span>
                  )}
                  {seeker.certifications?.map((cert) => (
                    <span
                      key={cert}
                      className="px-3 py-1 bg-green-bg text-green rounded-full text-xs font-semibold"
                    >
                      {cert}
                    </span>
                  ))}
                  {seeker.skills?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-off-white text-charcoal rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSayHello(seeker)}
                  className="w-full bg-charcoal text-white py-3 px-4 rounded-lg font-medium hover:bg-charcoal-light transition-colors"
                >
                  Say hello
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Intro Modal */}
      {showIntroModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowIntroModal(false)}
        >
          <div
            className="bg-white w-full rounded-t-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-charcoal">Introduce yourself</h2>
              <button
                onClick={() => setShowIntroModal(false)}
                className="text-2xl text-gray hover:text-charcoal"
              >
                ×
              </button>
            </div>

            {introSuccess ? (
              <div className="py-8 text-center">
                <p className="text-lg font-semibold text-charcoal mb-2">Intro sent!</p>
                <p className="text-sm text-gray">
                  They'll see your message and decide what to share.
                </p>
              </div>
            ) : (
              <>
                {modalSeeker && (
                  <div className="bg-off-white border border-border rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-muted mb-1">Candidate</p>
                    <p className="font-semibold text-charcoal text-sm">
                      {modalSeeker.job_title || modalSeeker.headline}
                    </p>
                    <p className="text-xs text-gray mt-2">
                      {modalSeeker.years_experience} years · {modalSeeker.city || "Iowa"},{" "}
                      {modalSeeker.state || "IA"}
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <label className="text-xs font-semibold text-charcoal block">
                    What would you say to them?
                  </label>
                  <textarea
                    placeholder="Why this person caught your eye..."
                    value={introMessage}
                    onChange={(e) => setIntroMessage(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg min-h-24 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal"
                  />
                  <p className="text-xs text-gray-muted">
                    Be specific. People can tell when it's genuine.
                  </p>
                </div>

                {introError && (
                  <div className="bg-red-bg border border-red text-red text-xs p-3 rounded-lg mb-4">
                    {introError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowIntroModal(false)}
                    className="flex-1 border border-border text-charcoal py-3 px-4 rounded-lg font-medium hover:bg-off-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendIntro}
                    disabled={sendingIntro || !introMessage.trim()}
                    className="flex-1 bg-charcoal text-white py-3 px-4 rounded-lg font-medium hover:bg-charcoal-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingIntro ? <Loader size={16} className="animate-spin" /> : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
