"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="screen-body">
      {/* Step Bar */}
      <div className="step-bar">
        {[1, 2].map((s) => (
          <div key={s} className={`step-segment ${s <= step ? "filled" : ""}`} style={s <= step ? { background: "var(--express-navy)" } : {}} />
        ))}
      </div>
      <div className="step-label">
        Step {step} of 2 — {step === 1 ? "Organization" : "Your Account"}
      </div>

      {step === 1 && (
        <>
          {/* Express-branded header */}
          <div className="staffing-header" style={{ paddingBottom: "24px" }}>
            <div className="express-badge">
              <span className="express-dot" />
              Internal Staffing Tool
            </div>
            <h1 style={{ fontSize: "22px", lineHeight: "1.2" }}>Set up your office</h1>
            <div className="subtitle" style={{ marginTop: "6px" }}>
              This creates a private staffing workspace for your team.
            </div>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: "20px" }}>
              <Label className="text-xs font-bold text-charcoal">Office / Organization Name</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Express Employment Professionals"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-charcoal">Office Location</Label>
              <div className="chip-row mt-2">
                {LOCATION_OPTIONS.map((loc) => (
                  <span
                    key={loc}
                    className={`chip ${city === loc ? "selected" : ""}`}
                    style={city === loc ? { background: "var(--express-navy)", borderColor: "var(--express-navy)" } : {}}
                    onClick={() => setCity(loc)}
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="cta-section">
            <button
              className="cta-btn"
              style={{ background: "var(--express-navy)", color: "white" }}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link href="/" className="footer-link">Back</Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="section-header">
            <h2>Your Account</h2>
            <p>You'll be the first recruiter in this workspace.</p>
          </div>

          <div style={{ padding: "0 22px" }}>
            <div style={{ marginBottom: "14px" }}>
              <Label className="text-xs font-bold text-charcoal">Your Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="mt-1"
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <Label className="text-xs font-bold text-charcoal">Job Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Recruiter"
                className="mt-1"
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <Label className="text-xs font-bold text-charcoal">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@expresspros.com"
                className="mt-1"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Label className="text-xs font-bold text-charcoal">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "0 22px", marginBottom: "14px" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "var(--red-bg)",
                color: "var(--red)",
                fontSize: "13px",
              }}>
                {error}
              </div>
            </div>
          )}

          <div className="cta-section">
            <button
              className="cta-btn"
              style={{ background: "var(--express-navy)", color: "white", opacity: loading ? 0.6 : 1 }}
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "Setting up workspace…" : "Create workspace"}
            </button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <span className="footer-link" onClick={() => setStep(1)}>Back</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
