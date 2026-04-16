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
    <div className="screen-body">
      <div className="login-card">
        <div className="login-brand">Two Weeks</div>
        <p className="login-tagline">
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
                border: "1.5px solid var(--border)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "var(--white)",
                color: "var(--charcoal)",
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
                border: "1.5px solid var(--border)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                background: "var(--white)",
                color: "var(--charcoal)",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "var(--red-bg)",
                color: "var(--red)",
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
            className="cta-btn cta-charcoal"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="footer-note" style={{ marginTop: "20px" }}>
          Don&apos;t have an account?
          <br />
          <Link href="/get-started/seeker" className="footer-link">
            I deserve better
          </Link>
          {" · "}
          <Link href="/get-started/employer" className="footer-link">
            I&apos;m hiring
          </Link>
          <br /><br />
          <Link href="/get-started/recruiter" className="footer-link" style={{ color: 'var(--express-navy)', fontSize: '11px' }}>
            Staffing agency? Set up your workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
