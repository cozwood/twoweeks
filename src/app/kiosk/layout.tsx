import { EXPRESS_BRANDING } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function KioskLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F2F4F7",
        // Disable text selection and context menu for tablet kiosk
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Slim branded header */}
      <div
        style={{
          background: EXPRESS_BRANDING.primaryColor,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.3px",
          }}
        >
          {EXPRESS_BRANDING.shortName}
        </span>
      </div>
      {children}
    </div>
  );
}
