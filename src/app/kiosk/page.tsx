import { headers } from "next/headers";
import { EXPRESS_BRANDING, SITE_URLS, KIOSK_HOST } from "@/lib/constants";

export default async function KioskPage() {
  // Host detection: both ozvaag.com and kiosk.ozvaag.com point at this app.
  //   - main domain → short gateway with two CTAs (links out to kiosk subdomain)
  //   - kiosk subdomain → full explainer / "tour"
  const headersList = await headers();
  const host = (headersList.get("host") || "").toLowerCase();
  const isKioskHost = host === KIOSK_HOST || host.startsWith("kiosk.");

  if (isKioskHost) {
    return <FullExplainer />;
  }
  return <Gateway />;
}

// ── Gateway (shown on ozvaag.com/kiosk) ──
// Short landing page with two CTAs that send visitors to the kiosk subdomain.
function Gateway() {
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

      {/* Two CTAs */}
      <div style={{ padding: "28px 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <a
          href={`${SITE_URLS.kiosk}/kiosk`}
          style={{
            display: "block",
            width: "100%",
            padding: "18px 20px",
            borderRadius: "14px",
            background: "#FFFFFF",
            border: `2px solid ${EXPRESS_BRANDING.primaryColor}`,
            color: EXPRESS_BRANDING.primaryColor,
            textDecoration: "none",
            fontFamily: "inherit",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>
            Curious? Click here →
          </div>
          <div style={{ fontSize: "13px", color: "#636366", fontWeight: 500 }}>
            Take a tour of the Express Staffing Kiosk
          </div>
        </a>

        <a
          href={`${SITE_URLS.kiosk}/internal`}
          style={{
            display: "block",
            width: "100%",
            padding: "18px 20px",
            borderRadius: "14px",
            background: EXPRESS_BRANDING.primaryColor,
            border: `2px solid ${EXPRESS_BRANDING.primaryColor}`,
            color: "#FFFFFF",
            textDecoration: "none",
            fontFamily: "inherit",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>
            Already a user? Log in →
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
            Staff sign-in for Express recruiters
          </div>
        </a>
      </div>

      <div style={{ textAlign: "center", fontSize: "12px", color: "#AEAEB2", padding: "8px 28px 20px", lineHeight: 1.5 }}>
        {EXPRESS_BRANDING.tagline}
      </div>
    </div>
  );
}

// ── Full Explainer (shown on kiosk.ozvaag.com/kiosk) ──
// The "tour" — headline, how-it-works steps, who it's for, and a CTA
// that goes to /internal on the same (kiosk) domain.
function FullExplainer() {
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

      {/* CTA — stays on the kiosk subdomain */}
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
