"use client";

import { useState, useEffect } from "react";

export default function HomeStats() {
  const [stats, setStats] = useState<{
    usersCount: number;
    tipsCount: number;
    gamesCount: number;
    resultedGamesCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.ok ? r.json() : null)
      .then(setStats);
  }, []);

  if (!stats) return null;
  return (
    <>
      <h3 style={{ marginBottom: "0.25rem" }}>
        Total users: <span style={{ color: "var(--primary)" }}>{stats.usersCount}</span>
      </h3>
      <h3 style={{ marginBottom: "0.25rem" }}>
        Total tips made: <span style={{ color: "var(--primary)" }}>{stats.tipsCount}</span>
      </h3>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <h3 style={{ marginBottom: "0.25rem" }}>
        2026 games loaded: <span style={{ color: "var(--primary)" }}>{stats.gamesCount}</span>
      </h3>
      <h3 style={{ marginBottom: "0.25rem" }}>
        2026 resulted games: <span style={{ color: "var(--primary)" }}>{stats.resultedGamesCount}</span>
      </h3>
    </>
  );
}
