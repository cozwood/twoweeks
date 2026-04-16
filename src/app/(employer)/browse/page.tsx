"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { Loader, ChevronRight } from "lucide-react";
import type { SeekerCard } from "@/lib/types";

// Sample seeker cards for fallback/demo
const SAMPLE_SEEKERS: SeekerCard[] = [
  {
    id: "1",
    profile_id: "p1",
    headline: "Store Manager",
    job_title: "Store Manager",
    years_experience: "5",
    arrangement: "on-site",
    availability: "2 weeks",
    salary_min: 45000,
    salary_max: 55000,
    city: "Des Moines",
    state: "IA",
    category: "Operations",
    certifications: [],
    skills: ["Leadership", "Inventory Management"],
    reasons: ["Better work-life balance", "Closer to family"],
    is_active: true,
    // summary:"Experienced retail manager looking for a fresh opportunity",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    profile_id: "p2",
    headline: "Medical Assistant",
    job_title: "Medical Assistant",
    years_experience: "4",
    arrangement: "on-site",
    availability: "immediately",
    salary_min: 32000,
    salary_max: 38000,
    city: "Cedar Rapids",
    state: "IA",
    category: "Healthcare",
    certifications: ["CMA", "BLS"],
    skills: ["Patient Care", "EHR Systems"],
    reasons: ["Seeking better benefits"],
    is_active: true,
    // summary:"Compassionate medical assistant with clinical experience",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    profile_id: "p3",
    headline: "Administrative Assistant",
    job_title: "Administrative Assistant",
    years_experience: "6",
    arrangement: "hybrid",
    availability: "1 month",
    salary_min: 38000,
    salary_max: 45000,
    city: "Iowa City",
    state: "IA",
    category: "Operations",
    certifications: [],
    skills: ["MS Office", "Scheduling", "Communication"],
    reasons: ["Remote flexibility needed"],
    is_active: true,
    // summary:"Organized administrator seeking hybrid work arrangement",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    profile_id: "p4",
    headline: "Warehouse Worker",
    job_title: "Warehouse Worker",
    years_experience: "7",
    arrangement: "on-site",
    availability: "immediately",
    salary_min: 40000,
    salary_max: 50000,
    city: "Davenport",
    state: "IA",
    category: "Skilled Trades",
    certifications: ["Forklift"],
    skills: ["Operations", "Safety", "Team Leadership"],
    reasons: ["Better pay", "Career growth"],
    is_active: true,
    // summary:"Dedicated warehouse professional with 7+ years experience",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    profile_id: "p5",
    headline: "CDL Driver",
    job_title: "CDL Driver",
    years_experience: "8",
    arrangement: "on-site",
    availability: "2 weeks",
    salary_min: 55000,
    salary_max: 70000,
    city: "Dubuque",
    state: "IA",
    category: "Skilled Trades",
    certifications: ["CDL Class A"],
    skills: ["Long-haul", "Route Planning"],
    reasons: ["Home more often", "Better company culture"],
    is_active: true,
    // summary:"Professional CDL driver seeking stable position",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    profile_id: "p6",
    headline: "Electrician",
    job_title: "Electrician",
    years_experience: "10",
    arrangement: "on-site",
    availability: "1 month",
    salary_min: 60000,
    salary_max: 75000,
    city: "Waterloo",
    state: "IA",
    category: "Skilled Trades",
    certifications: ["Journeyman", "OSHA"],
    skills: ["Commercial Wiring", "Code Compliance"],
    reasons: ["New challenge", "Better benefits"],
    is_active: true,
    // summary:"Expert electrician ready for new projects",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

type FilterKey = "all" | "healthcare" | "experience" | "salary" | "onsite" | "hybrid";

export default function BrowsePage() {
  const [supabase] = useState(() => createClient());
  const [seekers, setSeekers] = useState<SeekerCard[]>(SAMPLE_SEEKERS);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(["all"]));
  // Modal state
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);
  const [introError, setIntroError] = useState("");

  // Stats
  const totalMatches = seekers.length;
  const introsSent = 3; // Mock data
  const revealed = 2; // Mock data

  const getCategoryInitials = (category: string | null): string => {
    const categoryMap: { [key: string]: string } = {
      "Sales & Marketing": "SM",
      "Healthcare": "HC",
      "Technology": "TE",
      "Skilled Trades": "SK",
      "Operations": "OP",
      "Finance": "FI",
    };
    return categoryMap[category || "Operations"] || "OP";
  };

  const toggleFilter = (filter: FilterKey) => {
    const newFilters = new Set(filters);
    if (filter === "all") {
      newFilters.clear();
      newFilters.add("all");
    } else {
      newFilters.delete("all");
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
        if (newFilters.size === 0) {
          newFilters.add("all");
        }
      } else {
        newFilters.add(filter);
      }
    }
    setFilters(newFilters);
  };

  const isFilterActive = (filter: FilterKey): boolean => {
    return filters.has(filter);
  };

  const formatSalary = (min: number | null, max: number | null): string => {
    if (!min || !max) return "Open to offers";
    return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`;
  };

  const [showIntroModal, setShowIntroModal] = useState(false);
  const [modalSeeker, setModalSeeker] = useState<SeekerCard | null>(null);

  const handleSayHello = (seeker: SeekerCard) => {
    setModalSeeker(seeker);
    setIntroMessage("");
    setIntroError("");
    setShowIntroModal(true);
  };

  const handleSendIntro = async () => {
    if (!modalSeeker || !introMessage.trim()) return;

    setSendingIntro(true);
    setIntroError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        setShowIntroModal(false);
        setModalSeeker(null);
        setIntroMessage("");
      }
    } catch (err) {
      setIntroError("Failed to send introduction");
    } finally {
      setSendingIntro(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Browse Seekers</h1>
        <p className="text-sm text-gray">{totalMatches} candidates in Iowa</p>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-6 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{totalMatches}</p>
            <p className="text-xs text-gray-muted">Matches</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{introsSent}</p>
            <p className="text-xs text-gray-muted">Intros Sent</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-charcoal">{revealed}</p>
            <p className="text-xs text-gray-muted">Revealed</p>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-4 border-b border-border overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          {["All", "Healthcare", "5+ yrs", "$40–50k", "On-site", "Hybrid"].map((label) => (
            <button
              key={label}
              onClick={() => toggleFilter(label.toLowerCase() as FilterKey)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isFilterActive(label.toLowerCase() as FilterKey)
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
        {seekers.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <p className="text-base font-semibold text-charcoal mb-2">
              No matches right now
            </p>
            <p className="text-sm text-gray">
              Try loosening your filters — good people show up every day.
            </p>
          </div>
        ) : (
          seekers.map((seeker) => (
            <div key={seeker.id} className="bg-white border border-border rounded-lg overflow-hidden">
              {/* Header with Avatar */}
              <div className="bg-charcoal text-white pb-4 px-4 py-4">
                <div className="flex gap-3 items-start">
                  <div className="h-12 w-12 rounded-full bg-charcoal-light text-white flex items-center justify-center font-bold text-sm">
                    {getCategoryInitials(seeker.category)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base">{seeker.job_title}</p>
                    <p className="text-sm text-gray-light">
                      {seeker.city}, {seeker.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                {/* Detail Rows */}
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Experience</span>
                    <span className="font-semibold text-charcoal">
                      {seeker.years_experience} years
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Setup</span>
                    <span className="font-semibold text-charcoal capitalize">
                      {seeker.arrangement}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-muted">Available</span>
                    <span className="font-semibold text-charcoal capitalize">
                      {seeker.availability}
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
                  {seeker.arrangement && (
                    <span className="px-3 py-1 bg-off-white text-charcoal rounded-full text-xs font-medium">
                      {seeker.arrangement}
                    </span>
                  )}
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

      {/* Load More Button */}
      {seekers.length > 0 && (
        <div className="px-4 py-6">
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            disabled={loading}
            className="w-full border border-border text-charcoal py-3 px-4 rounded-lg font-medium hover:bg-off-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <>
                Load more
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

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

            {/* Summary Box */}
            {modalSeeker && (
              <div className="bg-off-white border border-border rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-muted mb-1">Candidate</p>
                <p className="font-semibold text-charcoal text-sm">
                  {modalSeeker.job_title}
                </p>
                <p className="text-xs text-gray mt-2">
                  {modalSeeker.years_experience} years · {modalSeeker.city}, {modalSeeker.state}
                </p>
              </div>
            )}

            {/* Message */}
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

            {/* Error */}
            {introError && (
              <div className="bg-red-bg border border-red text-red text-xs p-3 rounded-lg mb-4">
                {introError}
              </div>
            )}

            {/* Footer */}
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
                {sendingIntro ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
