import Link from "next/link";
import HomeStats from "./HomeStats";
import { SectionHeader } from "@/components/layout/section-header";
import { IconTrophy, IconShield } from "@/components/icons/nav-icons";
import { WinnerBadge } from "@/components/ui/winner-badge";
import { Alert } from "@/components/ui/alert";
import { EasterEggVersion } from "@/components/easter-egg-version";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <p className="mb-4 italic text-white/90">
        Join the{" "}
        <Link
          href="https://www.patreon.com/nrlboomrookies"
          target="_blank"
          rel="noopener"
          className="text-primary underline-offset-2 hover:opacity-90"
        >
          patreon
        </Link>
        , to access the competition!
      </p>

      <hr className="my-6 border-white/20" />

      <Alert variant="info" className="mb-6">
        <p className="font-medium">
          The 2026 Coal Train Cup is complete.
        </p>
        <p className="mt-1 text-white/80">
          Weekly tipping finished after round 27. The finals now belong to the
          Siliva Shield.
        </p>
      </Alert>

      <SectionHeader as="h2">Siliva Shield</SectionHeader>
      <p className="mb-2 text-white/90">
        A finals-only knockout run across the four weeks of the finals.
      </p>
      <ul className="mb-4 ml-5 list-disc space-y-1 text-white/90">
        <li>Each week, pick one team to win and one player to score a try</li>
        <li>Get both right and you go through; get either wrong and you&apos;re out</li>
        <li>
          You can&apos;t reuse a team or a tryscorer across the entire finals
        </li>
        <li>Picks lock as each game kicks off</li>
      </ul>
      <p className="mb-4">
        <Link
          href="/siliva-shield"
          className="text-primary underline-offset-2 hover:underline"
        >
          Make your Siliva Shield tip →
        </Link>
      </p>

      <hr className="my-6 border-white/20" />

      <SectionHeader as="h2" className="mb-4">
        2026 Champions
      </SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <WinnerBadge
          title="2026 Coal Train Cup winner"
          winner="TB"
          icon={<IconTrophy />}
        >
          <Link
            href="/leaderboard"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View 2026 results
          </Link>
        </WinnerBadge>
        <WinnerBadge
          title="2026 Siliva Shield winner"
          winner="???"
          icon={<IconShield />}
          className="border-white/20 opacity-90 ring-white/10"
        >
          <p className="text-sm text-white/70">
            Still to be decided — the Shield runs through the finals.
          </p>
        </WinnerBadge>
      </div>

      <hr className="my-6 border-white/20" />

      <SectionHeader as="h2" className="mb-4">
        Past Champions
      </SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <WinnerBadge
          title="2025 Coal Train Cup winner"
          winner="Paul Mac"
          icon={<IconTrophy />}
        >
          <Link
            href="/leaderboard-2025"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View 2025 results
          </Link>
        </WinnerBadge>
        <WinnerBadge
          title="2025 Siliva Shield winner"
          winner="Kyle (damiencooked)"
          icon={<IconShield />}
        />
      </div>

      <hr className="my-6 border-white/20" />
      <HomeStats />
      <hr className="my-6 border-white/20" />
      <EasterEggVersion>version: 2026.6.1</EasterEggVersion>
    </>
  );
}
