import { EXPRESS_BRANDING } from "@/lib/constants";

// Public explainer / "tour" for the Express Staffing Kiosk.
// Served at kiosk.ozvaag.com/kiosk (and twoweeks-iota.vercel.app/kiosk).
// The outer ozvaag.com marketing site is a separate Cloudflare Pages project
// and is NOT served by this app.
export default function KioskInfoPage() {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", background: "#F5F5F5", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: EXPRESS_BRANDING.primaryColor, padding: "50px 28px 40px", textAlign: "center" }}>
        <span style={{ display: "inline-block", fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", marginBottom: "14px", fontWeight: 500 }}>
          {EXPRESS_BRANDING.shortName.toUpperCase()} STAFFING
        </span>
        <div style={{ fontSize: "40px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-1.2px", marginBottom: "14px" }}>
          The Express Staffing Kiosk
        </div>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, maxWidth: "340px", margin: "0 auto" }}>
          A tablet intake system for walk-in candidates at Express Employment branches.
        </p>
      </div>

      {/* How it works */}
      <div style={{ padding: "28px 22px 8px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#636366", letterSpacing: "0.5px", marginBottom: "14px" }}>
          HOW IT WORKS
        </div>

        <div style={{ display: "flex", gap: "14px", padding: "16px 0", borderBottom: "1px solid #E5E5EA", alignItems: "flex-start" }}>
          <div style={{ width: "38px", height: "38px", background: EXPRESS_BRANDING.primaryColor, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#FFFFFF", fontWeight: 800, fontSize: "15px" }}>
            1
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1C1C1E", marginBottom: "3px" }}>Quick 5-step form</div>
            <div style={{ fontSize: "13px", color: "#636366", lineHeight: 1.45 }}>
              Walk-ins tap through a 5-step form on a branch tablet: contact info, field &amp; role, experience &amp; pay, certs &amp; skills, review.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", padding: "16px 0", borderBottom: "1px solid #E5E5EA", alignItems: "flex-start" }}>
          <div style={{ width: "38px", height: "38px", background: EXPRESS_BRANDING.primaryColor, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#FFFFFF", fontWeight: 800, fontSize: "15px" }}>
            2
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1C1C1E", marginBottom: "3px" }}>Instant recruiter handoff</div>
            <div style={{ fontSize: "13px", color: "#636366", lineHeight: 1.45 }}>
              Submissions land in the recruiter dashboard instantly — no paperwork, no re-typing.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", padding: "16px 0", alignItems: "flex-start" }}>
          <div style={{ width: "38px", height: "38px", background: EXPRESS_BRANDING.primaryColor, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#FFFFFF", fontWeight: 800, fontSize: "15px" }}>
            3
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1C1C1E", marginBottom: "3px" }}>Auto-resets between candidates</div>
            <div style={{ fontSize: "13px", color: "#636366", lineHeight: 1.45 }}>
              The tablet auto-resets after each submission so the next person can start fresh.
            </div>
          </div>
        </div>
      </div>

      {/* Who it's for */}
      <div style={{ padding: "20px 22px 8px" }}>
        <div style={{ background: EXPRESS_BRANDING.lightBlue, borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: EXPRESS_BRANDING.secondaryColor, letterSpacing: "0.5px", marginBottom: "6px" }}>
            WHO IT&apos;S FOR
          </div>
          <div style={{ fontSize: "14px", color: "#1C1C1E", lineHeight: 1.5 }}>
            Express Employment branch recruiters who want a faster, cleaner way to intake walk-in candidates.
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "24px 20px 20px" }}>
        <a
          href="/internal"
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: 700,
            textAlign: "center",
            cursor: "pointer",
            border: "none",
            fontFamily: "inherit",
            background: EXPRESS_BRANDING.primaryColor,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          Staff sign in →
        </a>
        <div style={{ textAlign: "center", fontSize: "12px", color: "#AEAEB2", marginTop: "14px", lineHeight: 1.5 }}>
          {EXPRESS_BRANDING.tagline}
        </div>
      </div>
    </div>
  );
}
