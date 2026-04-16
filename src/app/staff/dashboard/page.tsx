"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <h1>Dashboard</h1>
        <div className="subtitle">{EXPRESS_BRANDING.tagline}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <Card className="border-0 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/candidates")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-express-navy flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-charcoal">{stats.totalCandidates}</div>
              <div className="text-xs text-gray font-medium">Candidates</div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/jobs")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-express-orange flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-charcoal">{stats.activeJobs}</div>
              <div className="text-xs text-gray font-medium">Active Jobs</div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/matches")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green flex items-center justify-center">
              <GitCompare size={18} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-charcoal">{stats.pendingMatches}</div>
              <div className="text-xs text-gray font-medium">Pending</div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-charcoal">{stats.hiredThisMonth}</div>
              <div className="text-xs text-gray font-medium">Hired</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-3">
        <Button
          onClick={() => router.push("/staff/jobs?new=1")}
          className="flex-1 bg-express-navy hover:bg-express-navy-light text-white font-semibold text-sm"
        >
          + New Job
        </Button>
        <Button
          onClick={() => router.push("/staff/candidates")}
          variant="outline"
          className="flex-1 border-express-navy text-express-navy font-semibold text-sm"
        >
          Find Candidates
        </Button>
      </div>

      {/* Recent Candidates */}
      <div className="px-5 pt-5 pb-2">
        <div className="text-sm font-bold text-charcoal">Recent Candidates</div>
      </div>
      {recentCandidates.length === 0 ? (
        <div className="text-center py-6 px-7">
          <div className="text-sm text-gray">No candidates yet. They'll show up here once they sign up.</div>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {recentCandidates.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-charcoal">{c.job_title || "New Candidate"}</div>
                <div className="text-xs text-gray">{c.city || "Iowa"}, IA</div>
              </div>
              <div className="text-xs text-gray-light">{timeAgo(c.created_at)}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <div className="px-5 pt-5 pb-2">
        <div className="text-sm font-bold text-charcoal">Recent Jobs</div>
      </div>
      {recentJobs.length === 0 ? (
        <div className="text-center py-6 px-7">
          <div className="text-sm text-gray">No jobs posted yet. Create your first to start matching.</div>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {recentJobs.map((j) => (
            <Card key={j.id} className="border-0 shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-charcoal">{j.title}</div>
                <div className="text-xs text-gray">{j.city || "Iowa"}, IA</div>
              </div>
              <Badge className="bg-green-bg text-green-700 text-xs">Active</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
