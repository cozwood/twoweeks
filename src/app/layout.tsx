import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Two Weeks",
  description: "Anonymous job matching for people who are ready for something new.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
