import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coal Train Cup",
  description: "Weekly tipping competition",
  icons: { icon: "/favicon.ico" },
};

const nav = [
  { href: "/", label: "Home", icon: "🚂" },
  { href: "/make-tip", label: "Make a tip", icon: "✏️" },
  // { href: "/tips-by-user", label: "2026 tips by user", icon: "🗒️" },
  // { href: "/tips-by-round", label: "2026 tips by round", icon: "📊" },
  // { href: "/leaderboard", label: "2026 Leaderboard", icon: "🏆" },
  { href: "/leaderboard-2025", label: "2025 Results", icon: "📜" },
  // { href: "/siliva-shield", label: "Siliva Shield", icon: "🛡️" },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            background: "var(--bg-secondary)",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem 1rem",
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 700,
                marginRight: "0.5rem",
                color: "var(--text)",
                textDecoration: "none",
              }}
            >
              Coal Train Cup
            </Link>
            {nav.slice(1).map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  color: "var(--link)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                {icon} {label}
              </Link>
            ))}
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
