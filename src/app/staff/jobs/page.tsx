"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { JobListing } from "@/lib/types";
import {
  EXPERIENCE_OPTIONS,
  JOB_SEGMENTS,
  CATEGORIES,
  SEGMENT_CERTIFICATIONS,
  SEGMENT_SKILLS,
  HOURLY_RANGE_OPTIONS,
  SALARY_RANGE_OPTIONS,
  WORK_SETUP_OPTIONS,
  parseSalaryRange,
  formatSalary,
  EXPRESS_BRANDING,
} from "@/lib/constants";
import type { Branch } from "@/lib/types";

export default function JobsPage() {
  const [supabase] = useState(() => createClient());
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [payType, setPayType] = useState<"hourly" | "salary">("hourly");
  const [salaryRanges, setSalaryRanges] = useState<string[]>([]);
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

      const { data: profile } = await supabase.from("profiles").select("branch_id, is_admin").eq("id", user.id).single();
      const bid = profile?.branch_id;
      setBranchId(bid || null);

      // Load branch info for city display
      if (bid) {
        const { data: branchData } = await supabase.from("branches").select("*").eq("id", bid).single();
        if (branchData) setBranch(branchData as Branch);

        const { data } = await supabase
          .from("job_listings")
          .select("*")
          .eq("branch_id", bid)
          .order("created_at", { ascending: false });
        if (data) setJobs(data as JobListing[]);
      } else if (profile?.is_admin) {
        // Admin with no branch — show all jobs
        const { data } = await supabase
          .from("job_listings")
          .select("*")
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

    if (!branchId) { setFormError("No branch assigned. Contact an admin."); setSaving(false); return; }

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    for (const r of salaryRanges) {
      const parsed = parseSalaryRange(r);
      if (parsed) {
        if (salaryMin === null || parsed.min < salaryMin) salaryMin = parsed.min;
        if (salaryMax === null || parsed.max > salaryMax) salaryMax = parsed.max;
      }
    }
    const { data, error } = await supabase.from("job_listings").insert({
      branch_id: branchId,
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      years_experience: experience,
      salary_min: salaryMin,
      salary_max: salaryMax,
      arrangement: arrangement?.toLowerCase() || null,
      city: branch?.cities?.[0] || null,
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
    setPayType("hourly"); setSalaryRanges([]); setArrangement(null);
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        <p style={{ fontSize: 14, color: "#636366" }}>Loading…</p>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.is_active);
  const inactiveJobs = jobs.filter((j) => !j.is_active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#0060A9", padding: "20px 16px", color: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA8DA", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4DA8DA", textTransform: "uppercase" }}>
            {EXPRESS_BRANDING.shortName} Staffing
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 8px 0", color: "#FFFFFF" }}>Job Listings</h1>
        <div style={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9 }}>
          {activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* New Job CTA */}
      <div style={{ padding: "16px" }}>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width: "100%",
            background: "#0060A9",
            color: "#FFFFFF",
            fontWeight: 600,
            padding: "14px 16px",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            cursor: "pointer",
            transition: "background 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
        >
          + Create New Job
        </button>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <>
          <div style={{ padding: "20px 20px 8px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Active ({activeJobs.length})</div>
          </div>
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {activeJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  borderRadius: 16,
                  background: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  overflow: "hidden"
                }}
              >
                <div style={{ background: "#004B87", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {job.title}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
                      {job.city || "Iowa"}, {job.state} · {job.arrangement || "Flexible"}
                    </div>
                  </div>
                  <span style={{ background: "#4DA8DA", color: "#FFFFFF", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    Active
                  </span>
                </div>
                <div style={{ padding: "12px 16px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: 8 }}>
                  {job.description && (
                    <p style={{ fontSize: 12, color: "#636366", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {job.description}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Experience</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{job.years_experience || "Open"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#636366" }}>Pay range</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                </div>
                {(job.required_skills?.length > 0 || job.required_certifications?.length > 0) && (
                  <div style={{ padding: "8px 16px", background: "#FFFFFF", borderTop: "1px solid #F5F5F5", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {job.required_certifications?.map((c) => (
                      <span key={c} style={{ background: "#F0FFF4", color: "#22863A", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        {c}
                      </span>
                    ))}
                    {job.required_skills?.map((s) => (
                      <span key={s} style={{ background: "#E8F1FA", color: "#0060A9", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ padding: "12px 16px", background: "#FFFFFF", display: "flex", gap: 12 }}>
                  <button
                    onClick={() => toggleActive(job)}
                    style={{
                      flex: 1,
                      border: "1.5px solid #E5E5EA",
                      color: "#0060A9",
                      fontWeight: 600,
                      padding: "10px 16px",
                      background: "#FFFFFF",
                      borderRadius: 10,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => router.push(`/staff/matches?job=${job.id}`)}
                    style={{
                      flex: 1,
                      background: "#0060A9",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
                  >
                    View Matches
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Inactive Jobs */}
      {inactiveJobs.length > 0 && (
        <>
          <div style={{ padding: "20px 20px 8px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#636366" }}>Paused ({inactiveJobs.length})</div>
          </div>
          <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {inactiveJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  borderRadius: 16,
                  background: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  padding: "12px 16px",
                  opacity: 0.6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: "#636366" }}>{job.city || "Iowa"}, {job.state}</div>
                </div>
                <button
                  onClick={() => toggleActive(job)}
                  style={{
                    border: "1.5px solid #E5E5EA",
                    color: "#0060A9",
                    fontWeight: 600,
                    padding: "8px 14px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 28px" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>No jobs posted</div>
          <div style={{ fontSize: 14, color: "#636366", lineHeight: 1.6 }}>Create your first job listing to start matching candidates.</div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50
          }}
          onClick={() => { setShowCreate(false); resetForm(); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: "#FFFFFF",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 16px", borderBottom: "1px solid #E5E5EA" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1C1E", margin: 0 }}>Create Job Listing</h2>
            </div>

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Category (pick segment first) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Category</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {CATEGORIES.map((c) => (
                    <span
                      key={c}
                      onClick={() => { setCategory(c); setTitle(""); }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: category === c ? "#0060A9" : "#FFFFFF",
                        color: category === c ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title (from selected category) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Job Title</label>
                {category && JOB_SEGMENTS[category] && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {JOB_SEGMENTS[category].map((t) => (
                      <span
                        key={t}
                        onClick={() => setTitle(t)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 20,
                          border: "1.5px solid #E5E5EA",
                          background: title === t ? "#0060A9" : "#FFFFFF",
                          color: title === t ? "#FFFFFF" : "#636366",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Or type a custom title..."
                  value={category && JOB_SEGMENTS[category]?.includes(title) ? "" : title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1.5px solid #E5E5EA",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Description (optional)</label>
                <textarea
                  placeholder="Briefly describe the role..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1.5px solid #E5E5EA",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 14,
                    fontFamily: "inherit",
                    minHeight: 64,
                    boxSizing: "border-box",
                    resize: "none"
                  }}
                />
              </div>

              {/* Experience */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Experience Required</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {EXPERIENCE_OPTIONS.map((e) => (
                    <span
                      key={e}
                      onClick={() => setExperience(e)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: experience === e ? "#0060A9" : "#FFFFFF",
                        color: experience === e ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pay Range */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Pay Range</label>
                {/* Hourly / Salary toggle */}
                <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "1.5px solid #E5E5EA", width: "fit-content" }}>
                  <button
                    type="button"
                    onClick={() => { setPayType("hourly"); setSalaryRanges([]); }}
                    style={{
                      padding: "8px 20px", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      background: payType === "hourly" ? "#0060A9" : "#FFFFFF",
                      color: payType === "hourly" ? "#FFFFFF" : "#636366",
                    }}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPayType("salary"); setSalaryRanges([]); }}
                    style={{
                      padding: "8px 20px", border: "none", borderLeft: "1.5px solid #E5E5EA", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      background: payType === "salary" ? "#0060A9" : "#FFFFFF",
                      color: payType === "salary" ? "#FFFFFF" : "#636366",
                    }}
                  >
                    Salary
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(payType === "hourly" ? HOURLY_RANGE_OPTIONS : SALARY_RANGE_OPTIONS).map((s) => (
                    <span
                      key={s}
                      onClick={() => setSalaryRanges(salaryRanges.includes(s) ? salaryRanges.filter((v) => v !== s) : [...salaryRanges, s])}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: salaryRanges.includes(s) ? "#0060A9" : "#FFFFFF",
                        color: salaryRanges.includes(s) ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Branch / Location (auto from branch) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Location</label>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#E8F1FA",
                  fontSize: 13,
                  color: "#0060A9",
                  fontWeight: 600,
                }}>
                  {branch ? `${branch.name} — ${branch.cities.join(", ")}` : "Loading branch…"}
                </div>
              </div>

              {/* Arrangement */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Work Setup</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {WORK_SETUP_OPTIONS.map((w) => (
                    <span
                      key={w}
                      onClick={() => setArrangement(w)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: arrangement === w ? "#0060A9" : "#FFFFFF",
                        color: arrangement === w ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Skills */}
              {category && SEGMENT_SKILLS[category] && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Required Skills (optional)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SEGMENT_SKILLS[category].map((s) => (
                    <span
                      key={s}
                      onClick={() => toggleMulti(requiredSkills, setRequiredSkills, s)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: requiredSkills.includes(s) ? "#0060A9" : "#FFFFFF",
                        color: requiredSkills.includes(s) ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              )}

              {/* Required Certs */}
              {category && SEGMENT_CERTIFICATIONS[category] && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: 8 }}>Required Certifications (optional)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SEGMENT_CERTIFICATIONS[category].map((c) => (
                    <span
                      key={c}
                      onClick={() => toggleMulti(requiredCerts, setRequiredCerts, c)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1.5px solid #E5E5EA",
                        background: requiredCerts.includes(c) ? "#0060A9" : "#FFFFFF",
                        color: requiredCerts.includes(c) ? "#FFFFFF" : "#636366",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              )}

              {formError && (
                <div style={{ background: "#FFF5F5", border: "1px solid #E53E3E", color: "#E53E3E", fontSize: 12, padding: "12px", borderRadius: 16 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
                <button
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  style={{
                    flex: 1,
                    border: "1.5px solid #E5E5EA",
                    color: "#0060A9",
                    fontWeight: 600,
                    padding: "12px 16px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !title.trim()}
                  style={{
                    flex: 2,
                    background: "#0060A9",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: saving || !title.trim() ? "not-allowed" : "pointer",
                    opacity: saving || !title.trim() ? 0.6 : 1,
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!saving && title.trim()) e.currentTarget.style.background = "#004B87";
                  }}
                  onMouseLeave={(e) => {
                    if (!saving && title.trim()) e.currentTarget.style.background = "#0060A9";
                  }}
                >
                  {saving ? "Creating…" : "Create Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
