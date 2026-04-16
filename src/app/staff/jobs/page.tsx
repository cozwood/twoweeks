"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { JobListing } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EXPERIENCE_OPTIONS,
  JOB_TITLES,
  CATEGORIES,
  CERTIFICATION_OPTIONS,
  SKILL_OPTIONS,
  SALARY_RANGE_OPTIONS,
  LOCATION_OPTIONS,
  WORK_SETUP_OPTIONS,
  parseSalaryRange,
  formatSalary,
  EXPRESS_BRANDING,
} from "@/lib/constants";

export default function JobsPage() {
  const [supabase] = useState(() => createClient());
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [salaryRange, setSalaryRange] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [arrangement, setArrangement] = useState<string | null>(null);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowCreate(true);
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
      const orgId = profile?.organization_id;

      if (orgId) {
        const { data } = await supabase
          .from("job_listings")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });
        if (data) setJobs(data as JobListing[]);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleCreate = async () => {
    if (!title.trim()) { setFormError("Job title is required."); return; }
    setSaving(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFormError("Not authenticated."); setSaving(false); return; }

    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) { setFormError("No organization found. Complete recruiter setup first."); setSaving(false); return; }

    const salary = parseSalaryRange(salaryRange);
    const { data, error } = await supabase.from("job_listings").insert({
      organization_id: profile.organization_id,
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      years_experience: experience,
      salary_min: salary?.min || null,
      salary_max: salary?.max || null,
      arrangement: arrangement?.toLowerCase() || null,
      city,
      state: "IA",
      required_skills: requiredSkills,
      required_certifications: requiredCerts,
      is_active: true,
    }).select().single();

    if (error) { setFormError(error.message); setSaving(false); return; }
    if (data) {
      setJobs([data as JobListing, ...jobs]);
      resetForm();
      setShowCreate(false);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory(null); setExperience(null);
    setSalaryRange(null); setCity(null); setArrangement(null);
    setRequiredSkills([]); setRequiredCerts([]); setFormError("");
  };

  const toggleActive = async (job: JobListing) => {
    const { error } = await supabase
      .from("job_listings")
      .update({ is_active: !job.is_active })
      .eq("id", job.id);
    if (!error) {
      setJobs(jobs.map((j) => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
    }
  };

  if (loading) {
    return (
      <div className="screen-body flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray">Loading…</p>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.is_active);
  const inactiveJobs = jobs.filter((j) => !j.is_active);

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="staffing-header">
        <div className="express-badge">
          <span className="express-dot" />
          {EXPRESS_BRANDING.shortName} Staffing
        </div>
        <h1>Job Listings</h1>
        <div className="subtitle">{activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}</div>
      </div>

      {/* New Job CTA */}
      <div className="px-4 py-4">
        <Button
          onClick={() => setShowCreate(true)}
          className="w-full bg-express-navy hover:bg-express-navy-light text-white font-semibold"
        >
          + Create New Job
        </Button>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <>
          <div className="px-5 pb-2">
            <div className="text-sm font-bold text-charcoal">Active ({activeJobs.length})</div>
          </div>
          <div className="px-4 space-y-3">
            {activeJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden border-0 shadow-sm">
                <div className="job-card-header">
                  <div className="flex-1 min-w-0">
                    <div className="title truncate">{job.title}</div>
                    <div className="sub">{job.city || "Iowa"}, {job.state} · {job.arrangement || "Flexible"}</div>
                  </div>
                  <Badge className="bg-express-orange text-white text-xs">Active</Badge>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  {job.description && (
                    <p className="text-xs text-gray leading-relaxed line-clamp-2">{job.description}</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Experience</span>
                    <span className="text-charcoal font-semibold">{job.years_experience || "Open"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Pay range</span>
                    <span className="text-charcoal font-semibold">{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                </div>
                {(job.required_skills?.length > 0 || job.required_certifications?.length > 0) && (
                  <div className="px-4 py-2 flex flex-wrap gap-2 bg-white border-t border-off-white">
                    {job.required_certifications?.map((c) => (
                      <Badge key={c} className="bg-green-bg text-green-700">{c}</Badge>
                    ))}
                    {job.required_skills?.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                )}
                <div className="px-4 py-3 bg-white flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toggleActive(job)}>
                    Pause
                  </Button>
                  <Button size="sm" className="flex-1 bg-express-navy hover:bg-express-navy-light text-white text-xs" onClick={() => router.push(`/staff/matches?job=${job.id}`)}>
                    View Matches
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Inactive Jobs */}
      {inactiveJobs.length > 0 && (
        <>
          <div className="px-5 pt-5 pb-2">
            <div className="text-sm font-bold text-gray">Paused ({inactiveJobs.length})</div>
          </div>
          <div className="px-4 space-y-2 pb-4">
            {inactiveJobs.map((job) => (
              <Card key={job.id} className="border-0 shadow-sm px-4 py-3 opacity-60">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{job.title}</div>
                    <div className="text-xs text-gray">{job.city || "Iowa"}, {job.state}</div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleActive(job)}>
                    Reactivate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">📋</div>
          <div className="text-base font-bold text-charcoal mb-1">No jobs posted</div>
          <div className="text-sm text-gray leading-relaxed">Create your first job listing to start matching candidates.</div>
        </div>
      )}

      {/* Create Job Modal */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm(); }}>
        <DialogContent className="w-full max-w-[430px] rounded-t-3xl rounded-b-none max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Listing</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Job Title</Label>
              <div className="chip-row mt-2">
                {JOB_TITLES.map((t) => (
                  <span
                    key={t}
                    className={`chip ${title === t ? "selected" : ""}`}
                    style={title === t ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setTitle(t)}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Input
                placeholder="Or type a custom title..."
                value={JOB_TITLES.includes(title as typeof JOB_TITLES[number]) ? "" : title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Description (optional)</Label>
              <Textarea
                placeholder="Briefly describe the role..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-16"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Category</Label>
              <div className="chip-row mt-2">
                {CATEGORIES.map((c) => (
                  <span
                    key={c}
                    className={`chip ${category === c ? "selected" : ""}`}
                    style={category === c ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Experience Required</Label>
              <div className="chip-row mt-2">
                {EXPERIENCE_OPTIONS.map((e) => (
                  <span
                    key={e}
                    className={`chip ${experience === e ? "selected" : ""}`}
                    style={experience === e ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setExperience(e)}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Salary Range</Label>
              <div className="chip-row mt-2">
                {SALARY_RANGE_OPTIONS.map((s) => (
                  <span
                    key={s}
                    className={`chip ${salaryRange === s ? "selected" : ""}`}
                    style={salaryRange === s ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setSalaryRange(s)}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Location</Label>
              <div className="chip-row mt-2">
                {LOCATION_OPTIONS.map((loc) => (
                  <span
                    key={loc}
                    className={`chip ${city === loc ? "selected" : ""}`}
                    style={city === loc ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setCity(loc)}
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            {/* Arrangement */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Work Setup</Label>
              <div className="chip-row mt-2">
                {WORK_SETUP_OPTIONS.map((w) => (
                  <span
                    key={w}
                    className={`chip ${arrangement === w ? "selected" : ""}`}
                    style={arrangement === w ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setArrangement(w)}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Required Skills (optional)</Label>
              <div className="chip-row mt-2">
                {SKILL_OPTIONS.map((s) => (
                  <span
                    key={s}
                    className={`chip ${requiredSkills.includes(s) ? "selected" : ""}`}
                    style={requiredSkills.includes(s) ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => toggleMulti(requiredSkills, setRequiredSkills, s)}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Required Certs */}
            <div>
              <Label className="text-xs font-bold text-charcoal">Required Certifications (optional)</Label>
              <div className="chip-row mt-2">
                {CERTIFICATION_OPTIONS.map((c) => (
                  <span
                    key={c}
                    className={`chip cert-chip ${requiredCerts.includes(c) ? "selected" : ""}`}
                    onClick={() => toggleMulti(requiredCerts, setRequiredCerts, c)}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {formError && (
              <div className="bg-red-bg border border-red text-red text-xs p-3 rounded-2xl">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !title.trim()}
                className="flex-[2] bg-express-navy hover:bg-express-navy-light text-white font-semibold"
              >
                {saving ? "Creating…" : "Create Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
