import type { Metadata } from "next";
import Image from "next/image";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  IconHome,
  IconPencil,
  IconScroll,
  IconTrophy,
  IconShield,
} from "@/components/icons/nav-icons";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coal Train Cup",
  description: "Weekly tipping competition",
  icons: { icon: "/favicon.ico" },
};

const navItems = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/make-tip", label: "Make a tip", Icon: IconPencil },
  { href: "/leaderboard-2025", label: "2025 Results", Icon: IconScroll },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <nav
          className="border-b border-white/10 bg-brand-elevated px-4 py-3"
          aria-label="Main"
        >
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
            <div className="flex basis-full justify-center md:basis-auto md:justify-start">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-3 rounded-lg py-2 pr-3 font-display text-xl font-bold text-white no-underline transition-colors hover:bg-white/5 sm:mr-2 sm:pr-4 sm:text-2xl"
              >
              <Image
                src="/brlogo.jpeg"
                alt=""
                width={120}
                height={64}
                className="h-16 min-h-16 min-w-16 w-auto object-contain"
              />
              <span>Coal Train Cup</span>
              </Link>
            </div>
            <span className="hidden h-4 w-px shrink-0 bg-primary/80 md:block" aria-hidden />
            <div className="flex min-w-0 basis-full flex-wrap items-center justify-center gap-1 md:basis-auto md:flex-1 md:justify-end">
              {navItems.slice(1).map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 no-underline transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

