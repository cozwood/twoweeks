"use client";

import { usePathname, useRouter } from "next/navigation";
import { House, User, LogOut, Search, Users, Briefcase, GitCompare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BottomNavProps {
  role: "seeker" | "employer" | "recruiter";
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const seekerItems = [
    { label: "Home", icon: House, href: "/dashboard" },
    { label: "Profile", icon: User, href: "/profile" },
    { label: "Sign out", icon: LogOut, href: null, action: handleSignOut },
  ];

  const employerItems = [
    { label: "Browse", icon: Search, href: "/browse" },
    { label: "Contacts", icon: Users, href: "/contacts" },
    { label: "Sign out", icon: LogOut, href: null, action: handleSignOut },
  ];

  const recruiterItems = [
    { label: "Home", icon: House, href: "/staff/dashboard" },
    { label: "Candidates", icon: Users, href: "/staff/candidates" },
    { label: "Jobs", icon: Briefcase, href: "/staff/jobs" },
    { label: "Matches", icon: GitCompare, href: "/staff/matches" },
    { label: "Sign out", icon: LogOut, href: null, action: handleSignOut },
  ];

  const items = role === "recruiter" ? recruiterItems : role === "seeker" ? seekerItems : employerItems;

  // Express navy for recruiter mode
  const activeColor = role === "recruiter" ? "text-express-navy" : "text-charcoal";
  const activeFontClass = role === "recruiter" ? "text-express-navy font-semibold" : "text-charcoal font-semibold";

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] h-16 bg-white border-t border-border flex items-center justify-around z-50">
      {items.map((item) => {
        const isActive = item.href && pathname === item.href;
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => {
              if (item.action) {
                item.action();
              } else if (item.href) {
                router.push(item.href);
              }
            }}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-off-white transition-colors"
          >
            <Icon
              size={22}
              className={`transition-colors ${
                isActive ? `${activeColor} stroke-2` : "text-gray-light stroke-1.5"
              }`}
              strokeWidth={1.5}
            />
            <span
              className={`text-[10px] leading-none font-medium transition-colors ${
                isActive ? activeFontClass : "text-gray-light"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
