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
    <div className="screen-body">
      <div className="step-bar">
        {[1, 2].map((s) => (
          <div key={s} className={`step-segment ${s <= step ? "filled" : ""}`} />
        ))}
      </div>
      <div className="step-label">Step {step} of 2</div>

      {step === 1 && (
        <>
          <div className="section-header">
            <h2>Tell us about you</h2>
            <p>Candidates see your name and company when you reach out.</p>
          </div>

          <label className="form-label">Your name</label>
          <input className="form-input" placeholder="First and last" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label className="form-label">Company</label>
          <input className="form-input" placeholder="Where do you work?" value={company} onChange={(e) => setCompany(e.target.value)} />

          <label className="form-label">
            Title <span style={{ fontWeight: 400, color: "var(--gray-light)" }}>(optional)</span>
          </label>
          <input className="form-input" placeholder="HR Director, Recruiter, etc." value={title} onChange={(e) => setTitle(e.target.value)} />

          {error && (
            <div style={{
              padding: "10px 14px",
              margin: "0 22px 14px",
              borderRadius: "10px",
              backgroundColor: "var(--red-bg)",
              color: "var(--red)",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <div className="cta-section">
            <button className="cta-btn cta-charcoal" onClick={() => setStep(2)}>Continue</button>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <Link href="/" className="footer-link">Back</Link>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="section-header">
            <h2>Where are you based?</h2>
            <p>Helps candidates know who&apos;s reaching out. Optional.</p>
          </div>

          <div className="chip-group">
            <div className="chip-group-label">City</div>
            <div className="chip-row">
              {CITY_OPTIONS.map((c) => (
                <span key={c} className={`chip ${city === c ? "selected" : ""}`} onClick={() => setCity(c)}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              margin: "0 22px 14px",
              borderRadius: "10px",
              backgroundColor: "var(--red-bg)",
              color: "var(--red)",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <div className="cta-section">
            <button
              className="cta-btn cta-charcoal"
              onClick={handleStartBrowsing}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Setting up..." : "Start Browsing"}
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
