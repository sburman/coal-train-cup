"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeStats() {
  const [stats, setStats] = useState<{
    usersCount: number;
    tipsCount: number;
    gamesCount: number;
    resultedGamesCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total users" value={stats.usersCount} />
      <StatCard label="Total tips made" value={stats.tipsCount} />
      <div className="col-span-full border-t border-white/20" />
      <StatCard label="2026 games loaded" value={stats.gamesCount} />
      <StatCard label="2026 resulted games" value={stats.resultedGamesCount} />
    </div>
  );
}
