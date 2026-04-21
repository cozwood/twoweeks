"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Briefcase, GitCompare, TrendingUp } from "lucide-react";
import { EXPRESS_BRANDING } from "@/lib/constants";

interface DashStats {
  totalCandidates: number;
  activeJobs: number;
  pendingMatches: number;
  hiredThisMonth: number;
}

export default function StaffingDashboard() {
  const [supabase] = useState(() => createClient());
  const [stats, setStats] = useState<DashStats>({ totalCandidates: 0, activeJobs: 0, pendingMatches: 0, hiredThisMonth: 0 });
  const [recentCandidates, setRecentCandidates] = useState<{ id: string; job_title: string | null; city: string | null; created_at: string }[]>([]);
  const [recentJobs, setRecentJobs] = useState<{ id: string; title: string; city: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
      const orgId = profile?.organization_id;

      // Candidate count
      const candidateQuery = orgId
        ? supabase.from("seeker_cards").select("*", { count: "exact", head: true }).eq("is_active", true).eq("organization_id", orgId)
        : supabase.from("seeker_cards").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: cc } = await candidateQuery;

      // Job count
      let jc = 0;
      if (orgId) {
        const { count } = await supabase.from("job_listings").select("*", { count: "exact", head: true }).eq("is_active", true).eq("organization_id", orgId);
        jc = count || 0;
      }

      // Pending matches
      let pm = 0;
      if (orgId) {
        const { count } = await supabase.from("job_matches").select("*", { count: "exact", head: true }).eq("status", "pending");
        pm = count || 0;
      }

      setStats({ totalCandidates: cc || 0, activeJobs: jc, pendingMatches: pm, hiredThisMonth: 0 });

      // Recent candidates
      const recentCandQuery = orgId
        ? supabase.from("seeker_cards").select("id, job_title, city, created_at").eq("is_active", true).eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5)
        : supabase.from("seeker_cards").select("id, job_title, city, created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5);
      const { data: rc } = await recentCandQuery;
      if (rc) setRecentCandidates(rc);

      // Recent jobs
      if (orgId) {
        const { data: rj } = await supabase.from("job_listings").select("id, title, city, created_at").eq("organization_id", orgId).eq("is_active", true).order("created_at", { ascending: false }).limit(5);
        if (rj) setRecentJobs(rj);
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        <p style={{ fontSize: 14, color: "#636366" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#0060A9", padding: "20px 16px", color: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F7941D", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#F7941D", textTransform: "uppercase" }}>
            {EXPRESS_BRANDING.shortName} Staffing
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 8px 0", color: "#FFFFFF" }}>Dashboard</h1>
        <div style={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9 }}>{EXPRESS_BRANDING.tagline}</div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, padding: "16px" }}>
        <div
          style={{
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: 16,
            cursor: "pointer",
            transition: "box-shadow 0.2s ease"
          }}
          onClick={() => router.push("/staff/candidates")}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#0060A9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>{stats.totalCandidates}</div>
              <div style={{ fontSize: 12, color: "#636366", fontWeight: 500 }}>Candidates</div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: 16,
            cursor: "pointer",
            transition: "box-shadow 0.2s ease"
          }}
          onClick={() => router.push("/staff/jobs")}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F7941D", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>{stats.activeJobs}</div>
              <div style={{ fontSize: 12, color: "#636366", fontWeight: 500 }}>Active Jobs</div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: 16,
            cursor: "pointer",
            transition: "box-shadow 0.2s ease"
          }}
          onClick={() => router.push("/staff/matches")}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#48BB78", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GitCompare size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>{stats.pendingMatches}</div>
              <div style={{ fontSize: 12, color: "#636366", fontWeight: 500 }}>Pending</div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1C1C1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>{stats.hiredThisMonth}</div>
              <div style={{ fontSize: 12, color: "#636366", fontWeight: 500 }}>Hired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/staff/jobs?new=1")}
          style={{
            flex: 1,
            background: "#0060A9",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 14,
            padding: "14px 16px",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            transition: "background 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#004B87")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0060A9")}
        >
          + New Job
        </button>
        <button
          onClick={() => router.push("/staff/candidates")}
          style={{
            flex: 1,
            border: "1.5px solid #0060A9",
            color: "#0060A9",
            fontWeight: 600,
            fontSize: 14,
            padding: "14px 16px",
            background: "#FFFFFF",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F8FAFC";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          Find Candidates
        </button>
      </div>

      {/* Recent Candidates */}
      <div style={{ padding: "20px 20px 8px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Recent Candidates</div>
      </div>
      {recentCandidates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 28px" }}>
          <div style={{ fontSize: 14, color: "#636366" }}>No candidates yet. They'll show up here once they sign up.</div>
        </div>
      ) : (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {recentCandidates.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: 16,
                background: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{c.job_title || "New Candidate"}</div>
                <div style={{ fontSize: 12, color: "#636366" }}>{c.city || "Iowa"}, IA</div>
              </div>
              <div style={{ fontSize: 12, color: "#AEAEB2" }}>{timeAgo(c.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <div style={{ padding: "20px 20px 8px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Recent Jobs</div>
      </div>
      {recentJobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 28px" }}>
          <div style={{ fontSize: 14, color: "#636366" }}>No jobs posted yet. Create your first to start matching.</div>
        </div>
      ) : (
        <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {recentJobs.map((j) => (
            <div
              key={j.id}
              style={{
                borderRadius: 16,
                background: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{j.title}</div>
                <div style={{ fontSize: 12, color: "#636366" }}>{j.city || "Iowa"}, IA</div>
              </div>
              <span style={{
                background: "#F0FFF4",
                color: "#22863A",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20
              }}>
                Active
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
