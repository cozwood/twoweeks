"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, Profile } from "@/lib/types";

interface OrgContext {
  org: Organization | null;
  profile: Profile | null;
  loading: boolean;
  isStaffing: boolean;
  isMarketplace: boolean;
  isRecruiter: boolean;
}

const OrgCtx = createContext<OrgContext>({
  org: null,
  profile: null,
  loading: true,
  isStaffing: false,
  isMarketplace: true,
  isRecruiter: false,
});

export function useOrg() {
  return useContext(OrgCtx);
}

export { OrgCtx };

export function useOrgLoader(): OrgContext {
  const [org, setOrg] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof as Profile);

        if (prof.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", prof.organization_id)
            .single();
          if (orgData) setOrg(orgData as Organization);
        }
      }
      setLoading(false);
    })();
  }, []);

  return {
    org,
    profile,
    loading,
    isStaffing: org?.mode === "staffing",
    isMarketplace: !org || org.mode === "marketplace",
    isRecruiter: profile?.role === "recruiter",
  };
}
