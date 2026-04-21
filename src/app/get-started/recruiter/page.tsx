"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCATION_OPTIONS, EXPRESS_BRANDING } from "@/lib/constants";
import Link from "next/link";

type Step = 1 | 2;

export default function RecruiterOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);

  // Step 1: Organization
  const [orgName, setOrgName] = useState<string>(EXPRESS_BRANDING.name);
  const [city, setCity] = useState<string | null>(null);

  // Step 2: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!email || !password) { setError("Email and password are required."); return; }
    if (!name) { setError("Your name is required."); return; }
    setLoading(true);
    setError("");

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "recruiter", name },
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }
    const user = authData.user;
    if (!user) { setError("Something went wrong. Try again."); setLoading(false); return; }

    // 2. Create organization
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: org, error: orgError } = await supabase.from("organizations").insert({
      name: orgName,
      slug: `${slug}-${Date.now()}`,
      mode: "staffing",
      owner_id: user.id,
      config: {
        show_company_names: true,
        show_seeker_names: true,
        allow_self_serve: true,
        require_recruiter_approval: false,
        branding: {
          primary_color: EXPRESS_BRANDING.primaryColor,
        },
      },
    }).select().single();

    if (orgError) { setError(orgError.message); setLoading(false); return; }

    // 3. Update profile with org, name, title, city
    const { error: profileError } = await supabase.from("profiles").update({
      organization_id: org.id,
      name,
      title: title || "Recruiter",
      company: orgName,
      city,
      state: "IA",
    }).eq("id", user.id);

    if (profileError) { setError(profileError.message); setLoading(false); return; }

    router.push("/staff/dashboard");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F5F5F5" }}>
      {/* Step Bar */}
      <div style={{ display: "flex", gap: "4px", padding: "16px 22px 0" }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "3px",
              background: s <= step ? "#0060A9" : "#E5E5EA",
              borderRadius: "2px",
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "11px", color: "#AEAEB2", padding: "8px 0 0", fontWeight: 500 }}>
        Step {step} of 2 — {step === 1 ? "Organization" : "Your Account"}
      </div>

      {step === 1 && (
        <>
          {/* Express-branded header */}
          <div style={{ background: "#0060A9", padding: "24px 20px 24px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#F7941D", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "8px", textTransform: "uppercase" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F7941D" }} />
              Internal Staffing Tool
            </div>
            <h1 style={{ fontSize: "22px", lineHeight: "1.2", color: "#FFFFFF", marginTop: "0", fontWeight: 800 }}>Set up your office</h1>
            <div style={{ marginTop: "6px", fontSize: "14px", color: "#FFFFFF" }}>
              This creates a private staffing workspace for your team.
            </div>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Office / Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Express Employment Professionals"
                style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E5EA", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", color: "#1C1C1E", background: "#FFFFFF", outline: "none", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Office Location</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "4px" }}>
                {LOCATION_OPTIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    style={{
                      padding: "9px 15px",
                      borderRadius: "22px",
                      border: city === loc ? "1.5px solid #0060A9" : "1.5px solid #E5E5EA",
                      background: city === loc ? "#0060A9" : "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: city === loc ? "#FFFFFF" : "#1C1C1E",
                      cursor: "pointer",
                      userSelect: "none",
                      fontFamily: "inherit",
                    }}
                    onClick={() => setCity(loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "8px 20px 20px" }}>
            <button
              type="button"
              style={{ display: "block", width: "100%", padding: "15px", borderRadius: "14px", fontSize: "15px", fontWeight: 600, textAlign: "center", cursor: "pointer", marginBottom: "10px", border: "1.5px solid transparent", fontFamily: "inherit", background: "#0060A9", color: "#FFFFFF" }}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link href="/" style={{ color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                Back
              </Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ padding: "24px 20px 8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>Your Account</h2>
            <p style={{ fontSize: "14px", color: "#636366", margin: "4px 0 0 0" }}>You'll be the first recruiter in this workspace.</p>
          </div>

          <div style={{ padding: "0 22px" }}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E5EA", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", color: "#1C1C1E", background: "#FFFFFF", outline: "none", marginTop: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Job Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Recruiter"
                style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E5EA", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", color: "#1C1C1E", background: "#FFFFFF", outline: "none", marginTop: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@expresspros.com"
                style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E5EA", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", color: "#1C1C1E", background: "#FFFFFF", outline: "none", marginTop: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E5EA", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", color: "#1C1C1E", background: "#FFFFFF", outline: "none", marginTop: "4px" }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "0 22px", marginBottom: "14px" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF5F5",
                color: "#E53E3E",
                fontSize: "13px",
              }}>
                {error}
              </div>
            </div>
          )}

          <div style={{ padding: "8px 20px 20px" }}>
            <button
              type="button"
              style={{ display: "block", width: "100%", padding: "15px", borderRadius: "14px", fontSize: "15px", fontWeight: 600, textAlign: "center", cursor: "pointer", marginBottom: "10px", border: "1.5px solid transparent", fontFamily: "inherit", background: "#0060A9", color: "#FFFFFF", opacity: loading ? 0.6 : 1 }}
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "Setting up workspace…" : "Create workspace"}
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#636366", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", padding: "0", fontFamily: "inherit", fontSize: "inherit" }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
