import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Two Weeks",
  description: "Sign in to your Two Weeks account.",
};

export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
