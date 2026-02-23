"use client";

import Link from "next/link";

export default function EggPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex shrink-0 items-center border-b border-white/10 bg-brand-elevated px-4 py-2">
        <Link
          href="/"
          className="rounded-lg py-2 pr-3 font-display text-sm font-semibold text-white no-underline transition-colors hover:bg-white/5"
        >
          ← Back to Coal Train Cup
        </Link>
      </div>
      <div className="relative min-h-[60vh] flex-1">
        <iframe
          src="https://egggame.org/"
          title="Egg Game"
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
}
