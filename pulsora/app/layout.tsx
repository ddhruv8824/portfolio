import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulsora — your AI CMO",
  description: "Pulsora analyses your website, builds a marketing strategy, and runs AI agents for SEO, GEO, content, X, LinkedIn, Reddit and Hacker News.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
