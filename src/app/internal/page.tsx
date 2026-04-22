"use client";

import { useState, useEffect } from "react";
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("");

  // Check if already authenticated on load
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single();
        if (profile?.role === "recruiter") {
          setUserName(profile.name || "");
          setLoggedIn(true);
        }
      }
      setChecking(false);
    })();
  }, []);

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
        .select("role, name")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "recruiter") {
        setUserName(profile.name || "");
        setLoggedIn(true);
      } else {
        setError("This login is for internal staff only.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // Loading state while checking auth
  if (checking) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F2F4F7", minHeight: "100vh" }}>
        <div style={{ fontSize: "15px", color: "#999" }}>Loading…</div>
      </div>
    );
  }

  // ── Choice screen (after login) ──
  if (loggedIn) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F2F4F7" }}>
        {/* Header */}
        <div style={{ padding: "50px 28px 30px", textAlign: "center", background: EXPRESS_BRANDING.primaryColor }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", marginBottom: "14px", fontWeight: 500 }}>
            INTERNAL
          </div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px", marginBottom: "6px" }}>
            {EXPRESS_BRANDING.shortName}
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "0", lineHeight: 1.4 }}>
            {userName ? `Welcome back, ${userName.split(" ")[0]}` : EXPRESS_BRANDING.tagline}
          </p>
        </div>

        {/* Choice buttons */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", gap: "20px" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>
            What would you like to open?
          </p>

          {/* Kiosk button */}
          <button
            onClick={() => router.push("/kiosk/intake")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "340px",
              padding: "32px 24px",
              borderRadius: "16px",
              border: `2px solid ${EXPRESS_BRANDING.primaryColor}`,
              background: "#FFFFFF",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "transform 0.1s",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: EXPRESS_BRANDING.primaryColor, marginBottom: "6px" }}>
              Kiosk
            </div>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.4 }}>
              Walk-in intake for job seekers
            </div>
          </button>

          {/* Dashboard button */}
          <button
            onClick={() => router.push("/staff/dashboard")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "340px",
              padding: "32px 24px",
              borderRadius: "16px",
              border: `2px solid ${EXPRESS_BRANDING.accentColor}`,
              background: "#FFFFFF",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "transform 0.1s",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: EXPRESS_BRANDING.primaryColor, marginBottom: "6px" }}>
              Dashboard
            </div>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.4 }}>
              Recruiter tools &amp; candidate management
            </div>
          </button>
        </div>

        {/* Sign out */}
        <div style={{ textAlign: "center", padding: "0 28px 40px" }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ── Login form ──
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
