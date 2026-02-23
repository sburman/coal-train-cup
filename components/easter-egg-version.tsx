"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const CLICKS_NEEDED = 3;

export function EasterEggVersion({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [clicks, setClicks] = useState(0);

  const handleClick = useCallback(() => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= CLICKS_NEEDED) {
      router.push("/egg");
    }
  }, [clicks, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-default text-left text-sm text-white/70 transition-colors hover:text-white/90"
      aria-label="Version"
    >
      {children}
    </button>
  );
}
