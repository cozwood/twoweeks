import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pb-[80px] staffing-mode">
      {children}
      <BottomNav role="recruiter" />
    </div>
  );
}
