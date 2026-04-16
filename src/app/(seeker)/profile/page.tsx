"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/chip";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function salaryToRange(min: number | null, max: number | null): string {
  if (!min || !max) return "";
  const ranges: Record<string, string> = {
    "40000-60000": "$40–60k",
    "60000-80000": "$60–80k",
    "80000-100000": "$80–100k",
    "100000-120000": "$100–120k",
  };
  const key = `${min}-${max}`;
  return ranges[key] || (min < 40000 ? "Under $40k" : "$120k+");
}

function rangeToSalary(range: string): { min: number; max: number } | null {
  const map: Record<string, { min: number; max: number }> = {
    "Under $40k": { min: 0, max: 40000 },
    "$40–60k": { min: 40000, max: 60000 },
    "$60–80k": { min: 60000, max: 80000 },
    "$80–100k": { min: 80000, max: 100000 },
    "$100–120k": { min: 100000, max: 120000 },
    "$120k+": { min: 120000, max: 200000 },
  };
  return map[range] || null;
}

interface ProfileData {
  headline: string;
  field: string;
  experience: string;
  workSetup: string;
  payRange: string;
  city: string;
}

interface BlockedCompany {
  id: string;
  company_name: string;
}

const HEADLINE_OPTIONS = [
  "I lead teams and hit targets",
  "I build and ship software",
  "I keep operations running smooth",
  "I manage the money",
  "I take care of people",
  "I work with my hands",
];

const FIELD_OPTIONS = [
  "Sales & Marketing",
  "Technology",
  "Finance",
  "Operations",
  "Healthcare",
  "Skilled Trades",
];

const EXPERIENCE_OPTIONS = [
  "Just starting (0 yrs)",
  "A few years (3 yrs)",
  "Seasoned (8 yrs)",
  "Veteran (15 yrs)",
];

const WORK_SETUP_OPTIONS = [
  "Remote",
  "Hybrid",
  "On-site",
  "Flexible",
];

const PAY_RANGE_OPTIONS = [
  "Under $40k",
  "$40–60k",
  "$60–80k",
  "$80–100k",
  "$100–120k",
  "$120k+",
];

const CITY_OPTIONS = [
  "Des Moines",
  "Cedar Rapids",
  "Davenport",
  "Iowa City",
  "Waterloo",
  "Ames",
  "West Des Moines",
  "Ankeny",
];

const AVAILABLE_COMPANIES = [
  { id: "1", name: "Express Employment" },
  { id: "2", name: "Rockwell Collins" },
  { id: "3", name: "Principal Financial" },
  { id: "4", name: "UnityPoint Health" },
  { id: "5", name: "Hy-Vee" },
  { id: "6", name: "John Deere" },
  { id: "7", name: "Casey's" },
  { id: "8", name: "Pella Corporation" },
  { id: "9", name: "Corteva" },
  { id: "10", name: "Wells Fargo (DSM)" },
  { id: "11", name: "Vermeer" },
  { id: "12", name: "Acme Corp" },
];

export default function Profile() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    headline: "",
    field: "",
    experience: "",
    workSetup: "",
    payRange: "",
    city: "",
  });

  const [blockedCompanies, setBlockedCompanies] = useState<BlockedCompany[]>([]);

  // Sample fallback data
  const fallbackProfile: ProfileData = {
    headline: "I build and ship software",
    field: "Technology",
    experience: "Seasoned (8 yrs)",
    workSetup: "Remote",
    payRange: "$100–120k",
    city: "Des Moines",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(fallbackProfile);
          setLoading(false);
          return;
        }

        // Fetch seeker card profile
        const { data: cardData } = await supabase
          .from("seeker_cards")
          .select(
            "headline, category, years_experience, arrangement, salary_min, salary_max, city"
          )
          .eq("profile_id", user.id)
          .single();

        if (cardData) {
          setProfile({
            headline: cardData.headline || "",
            field: cardData.category || "",
            experience: cardData.years_experience || "",
            workSetup: cardData.arrangement ? capitalize(cardData.arrangement) : "",
            payRange: salaryToRange(cardData.salary_min, cardData.salary_max),
            city: cardData.city || "",
          });
        } else {
          setProfile(fallbackProfile);
        }

        // Fetch blocked companies
        const { data: blocksData } = await supabase
          .from("block_list")
          .select("id, company_name")
          .eq("seeker_id", user.id);

        if (blocksData) {
          setBlockedCompanies(blocksData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(fallbackProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const salary = rangeToSalary(profile.payRange);
      const { error } = await supabase
        .from("seeker_cards")
        .update({
          headline: profile.headline,
          category: profile.field,
          years_experience: profile.experience,
          arrangement: profile.workSetup.toLowerCase() || null,
          salary_min: salary?.min || null,
          salary_max: salary?.max || null,
          city: profile.city,
        })
        .eq("profile_id", user.id);

      if (!error) {
        // Toast notification would go here
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlockCompany = async (companyName: string, isBlocked: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (isBlocked) {
        // Unblock
        const { error } = await supabase
          .from("block_list")
          .delete()
          .eq("seeker_id", user.id)
          .eq("company_name", companyName);

        if (!error) {
          setBlockedCompanies(
            blockedCompanies.filter((c) => c.company_name !== companyName)
          );
        }
      } else {
        // Block
        const { data, error } = await supabase
          .from("block_list")
          .insert({
            seeker_id: user.id,
            company_name: companyName,
          })
          .select()
          .single();

        if (!error && data) {
          setBlockedCompanies([
            ...blockedCompanies,
            { id: data.id, company_name: companyName },
          ]);
        }
      }
    } catch (error) {
      console.error("Error toggling block:", error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  const isBlockedByName = (companyName: string) =>
    blockedCompanies.some((c) => c.company_name === companyName);

  return (
    <div className="flex flex-col min-h-screen bg-off-white">
      <div className="flex-1 px-4 pt-8 pb-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            This is what they see
          </h1>
          <p className="text-sm text-gray">
            Pick what fits — no typing required.
          </p>
        </div>

        {/* Headline Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">
            Pick a headline
          </h2>
          <div className="flex flex-wrap gap-2">
            {HEADLINE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.headline === option}
                onClick={() => setProfile({ ...profile, headline: option })}
              />
            ))}
          </div>
        </div>

        {/* Field Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">Field</h2>
          <div className="flex flex-wrap gap-2">
            {FIELD_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.field === option}
                onClick={() => setProfile({ ...profile, field: option })}
              />
            ))}
          </div>
        </div>

        {/* Experience Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">
            Experience
          </h2>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.experience === option}
                onClick={() => setProfile({ ...profile, experience: option })}
              />
            ))}
          </div>
        </div>

        {/* Work Setup Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">
            Work setup
          </h2>
          <div className="flex flex-wrap gap-2">
            {WORK_SETUP_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.workSetup === option}
                onClick={() => setProfile({ ...profile, workSetup: option })}
              />
            ))}
          </div>
        </div>

        {/* Pay Range Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">Pay range</h2>
          <div className="flex flex-wrap gap-2">
            {PAY_RANGE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.payRange === option}
                onClick={() => setProfile({ ...profile, payRange: option })}
              />
            ))}
          </div>
        </div>

        {/* City Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-charcoal mb-3">City</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={profile.city === option}
                onClick={() => setProfile({ ...profile, city: option })}
              />
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-charcoal text-white hover:bg-charcoal-light py-6 h-auto font-semibold"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Block List Section */}
        <Card className="bg-white border-border">
          <CardHeader>
            <CardTitle className="text-base">Hide from these companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Available to block */}
              <div className="space-y-2">
                {AVAILABLE_COMPANIES.map((company) => {
                  const blocked = isBlockedByName(company.name);
                  return (
                    <button
                      key={company.id}
                      onClick={() =>
                        toggleBlockCompany(company.name, blocked)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        blocked
                          ? "bg-red-bg text-red"
                          : "bg-white border border-border text-charcoal hover:bg-off-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{company.name}</span>
                        {blocked && <span className="text-xs">Undo</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
