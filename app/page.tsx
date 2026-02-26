import Link from "next/link";
import HomeStats from "./HomeStats";
import { SectionHeader } from "@/components/layout/section-header";
import { IconTrophy, IconShield } from "@/components/icons/nav-icons";
import { WinnerBadge } from "@/components/ui/winner-badge";
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
      <SectionHeader as="h2">Coal Train Cup weekly competition rules</SectionHeader>
      <ul className="mb-4 ml-5 list-disc space-y-1 text-white/90">
        <li>Return to this site weekly to submit one tip per round</li>
        <li>If you choose to submit again, your previous tip will be replaced</li>
        <li>You can&apos;t tip <em>for</em> the same team in consecutive rounds</li>
        <li>You can&apos;t tip <em>against</em> the same team in consecutive rounds</li>
      </ul>
      <SectionHeader as="h2">End of season compliance</SectionHeader>
      <p className="mb-2 text-white/90">After 27 rounds, you must have:</p>
      <ul className="mb-4 ml-5 list-disc space-y-1 text-white/90">
        <li>tipped 13 home teams and 13 away teams (magic round counts as neutral)</li>
        <li>tipped every team at least once</li>
        <li>tipped no single team more than 3 times</li>
      </ul>
      <hr className="my-6 border-white/20" />
      <SectionHeader as="h2" className="mb-4">
        Past Champions
      </SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <WinnerBadge
          title="2025 Coal Train Cup winner"
          winner="Paul Mac"
          icon={<IconTrophy />}
        />
        <WinnerBadge
          title="2025 Siliva Shield winner"
          winner="Kyle (damiencooked)"
          icon={<IconShield />}
        />
      </div>
      <hr className="my-6 border-white/20" />
      <HomeStats />      
      <hr className="my-6 border-white/20" />
      <EasterEggVersion>version: 2026.1.2</EasterEggVersion>
    </>
  );
}
