"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step = 1 | 2;

const CITY_OPTIONS = [
  "Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City",
  "Waterloo", "Ames", "West Des Moines", "Ankeny", "Urbandale",
  "Council Bluffs", "Dubuque",
];

export default function EmployerOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartBrowsing = async () => {
    if (!name || !email || !password || !company) {
      setError("Name, email, password, and company are required.");
      return;
    }
    setLoading(true);
    setError("");

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "employer",
          name,
          company,
          city: city || undefined,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    // 2. Update profile with additional fields
    await supabase
      .from("profiles")
      .update({
        name,
        company,
        title: title || null,
        city: city || null,
      })
      .eq("id", user.id);

    router.push("/browse");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F5F5F5" }}>
      <div style={{ display: "flex", gap: "4px", padding: "16px 22px 0" }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "3px",
              background: s <= step ? "#1C1C1E" : "#E5E5EA",
              borderRadius: "2px",
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "11px", color: "#AEAEB2", padding: "8px 0 0", fontWeight: 500 }}>
        Step {step} of 2
      </div>

      {step === 1 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0 }}>
              Tell us about you
            </h2>
            <p style={{ fontSize: "14px", color: "#636366", marginTop: "4px", lineHeight: 1.4, margin: "4px 0 0" }}>
              Candidates see your name and company when you reach out.
            </p>
          </div>

          <label style={{ display: "block", padding: "0 22px", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#1C1C1E" }}>
            Your name
          </label>
          <input
            style={{
              display: "block",
              width: "calc(100% - 44px)",
              margin: "0 22px 14px",
              padding: "13px 16px",
              border: "1.5px solid #E5E5EA",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#1C1C1E",
              background: "#FFFFFF",
              outline: "none",
            }}
            placeholder="First and last"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label style={{ display: "block", padding: "0 22px", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#1C1C1E" }}>
            Email
          </label>
          <input
            style={{
              display: "block",
              width: "calc(100% - 44px)",
              margin: "0 22px 14px",
              padding: "13px 16px",
              border: "1.5px solid #E5E5EA",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#1C1C1E",
              background: "#FFFFFF",
              outline: "none",
            }}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ display: "block", padding: "0 22px", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#1C1C1E" }}>
            Password
          </label>
          <input
            style={{
              display: "block",
              width: "calc(100% - 44px)",
              margin: "0 22px 14px",
              padding: "13px 16px",
              border: "1.5px solid #E5E5EA",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#1C1C1E",
              background: "#FFFFFF",
              outline: "none",
            }}
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label style={{ display: "block", padding: "0 22px", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#1C1C1E" }}>
            Company
          </label>
          <input
            style={{
              display: "block",
              width: "calc(100% - 44px)",
              margin: "0 22px 14px",
              padding: "13px 16px",
              border: "1.5px solid #E5E5EA",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#1C1C1E",
              background: "#FFFFFF",
              outline: "none",
            }}
            placeholder="Where do you work?"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <label style={{ display: "block", padding: "0 22px", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#1C1C1E" }}>
            Title <span style={{ fontWeight: 400, color: "#AEAEB2" }}>(optional)</span>
          </label>
          <input
            style={{
              display: "block",
              width: "calc(100% - 44px)",
              margin: "0 22px 14px",
              padding: "13px 16px",
              border: "1.5px solid #E5E5EA",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#1C1C1E",
              background: "#FFFFFF",
              outline: "none",
            }}
            placeholder="HR Director, Recruiter, etc."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {error && (
            <div
              style={{
                padding: "10px 14px",
                margin: "0 22px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF5F5",
                color: "#E53E3E",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ padding: "8px 20px 20px" }}>
            <button
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
              }}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link
                href="/"
                style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textDecorationLine: "underline", textUnderlineOffset: "2px" }}
              >
                Back
              </Link>
              <span style={{ color: "#AEAEB2", margin: "0 6px" }}>·</span>
              <Link
                href="/login"
                style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textDecorationLine: "underline", textUnderlineOffset: "2px" }}
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0 }}>
              Where are you based?
            </h2>
            <p style={{ fontSize: "14px", color: "#636366", marginTop: "4px", lineHeight: 1.4, margin: "4px 0 0" }}>
              Helps candidates know who&apos;s reaching out. Optional.
            </p>
          </div>

          <div style={{ padding: "0 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>
              City
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {CITY_OPTIONS.map((c) => (
                <span
                  key={c}
                  style={{
                    padding: "9px 15px",
                    borderRadius: "22px",
                    border: "1.5px solid " + (city === c ? "#1C1C1E" : "#E5E5EA"),
                    background: city === c ? "#1C1C1E" : "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: city === c ? "#FFFFFF" : "#1C1C1E",
                    cursor: "pointer",
                    userSelect: "none",
                    fontFamily: "inherit",
                  }}
                  onClick={() => setCity(c)}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                margin: "0 22px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF5F5",
                color: "#E53E3E",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ padding: "8px 20px 20px" }}>
            <button
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
              onClick={handleStartBrowsing}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Start Browsing"}
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span
                style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}
                onClick={() => setStep(1)}
              >
                Back
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
