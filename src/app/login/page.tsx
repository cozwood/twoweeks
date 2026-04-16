"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
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

    // Redirect based on role
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "recruiter") {
        router.push("/staff/dashboard");
      } else if (profile?.role === "employer") {
        router.push("/browse");
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F5F5F5" }}>
      <div style={{ padding: "50px 28px 30px", textAlign: "center", background: "#FFFFFF" }}>
        <div style={{ fontSize: "42px", fontWeight: 900, color: "#1C1C1E", letterSpacing: "-1px", marginBottom: "6px" }}>
          Two Weeks
        </div>
        <p style={{ fontSize: "14px", color: "#636366", marginBottom: "28px", lineHeight: 1.4 }}>
          Your next move starts here.
          <br />
          No names until you say so.
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
                border: "1.5px solid #E5E5EA",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "#FFFFFF",
                color: "#1C1C1E",
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
                border: "1.5px solid #E5E5EA",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "#FFFFFF",
                color: "#1C1C1E",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF5F5",
                color: "#E53E3E",
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
              border: "1.5px solid transparent",
              fontFamily: "inherit",
              background: "#1C1C1E",
              color: "#FFFFFF",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", padding: "10px 28px 24px", fontSize: "12px", color: "#AEAEB2", lineHeight: 1.5, marginTop: "20px" }}>
          Don&apos;t have an account?
          <br />
          <Link href="/get-started/seeker" style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            I deserve better
          </Link>
          {" · "}
          <Link href="/get-started/employer" style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            I&apos;m hiring
          </Link>
          <br /><br />
          <Link href="/get-started/recruiter" style={{ color: "#003768", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", fontSize: "11px" }}>
            Staffing agency? Set up your workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
