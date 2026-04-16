import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default function SeekerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pb-[80px]">
      {children}
      <BottomNav role="seeker" />
    </div>
  );
}
