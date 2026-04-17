"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXPRESS_BRANDING } from "@/lib/constants";

export default function StaffLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "recruiter") {
        router.push("/staff/dashboard");
      } else {
        setError("This login is for internal staff only.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F2F4F7" }}>
      <div style={{ padding: "50px 28px 30px", textAlign: "center", background: EXPRESS_BRANDING.primaryColor }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", marginBottom: "14px", fontWeight: 500 }}>
          INTERNAL
        </div>
        <div style={{ fontSize: "36px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px", marginBottom: "6px" }}>
          {EXPRESS_BRANDING.shortName}
        </div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "28px", lineHeight: 1.4 }}>
          {EXPRESS_BRANDING.tagline}
        </p>

        <form onSubmit={handleLogin} style={{ padding: "0 22px" }}>
          <div style={{ marginBottom: "14px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1.5px solid rgba(255,255,255,0.2)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
            />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1.5px solid rgba(255,255,255,0.2)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(229,62,62,0.15)",
                color: "#FEB2B2",
                fontSize: "13px",
                marginBottom: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "10px",
              border: "none",
              fontFamily: "inherit",
              background: EXPRESS_BRANDING.accentColor,
              color: "#FFFFFF",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", padding: "16px 28px 8px", fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
          Staff accounts only.
        </div>
      </div>
    </div>
  );
}
