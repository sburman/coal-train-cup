"use client";

import { useState, useEffect } from "react";

type LeaderboardRow = {
  username: string;
  tips_count: number;
  points: number;
  margin: number;
  position: number;
};

export default function LeaderboardPage() {
  const [round, setRound] = useState<number | null>(null);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (res.ok) {
        setRound(data.round);
        setLeaderboard(data.leaderboard ?? []);
        setAvailableRounds(
          data.round ? Array.from({ length: data.round }, (_, i) => i + 1) : []
        );
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (round == null) return;
    fetch(`/api/leaderboard?round=${round}`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard ?? []));
  }, [round]);

  if (loading) return <p>Loading…</p>;

  return (
    <>
      <h1 style={{ marginBottom: "0.5rem" }}>2026 Leaderboard</h1>
      {availableRounds.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>Show leaderboard after:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {availableRounds.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRound(r)}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: round === r ? "var(--primary)" : "var(--bg-secondary)",
                  color: round === r ? "var(--bg)" : "var(--text)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {r === 1 ? "Round 1" : r}
              </button>
            ))}
          </div>
        </div>
      )}
      {leaderboard.length === 0 && !loading && (
        <p>No leaderboard data yet.</p>
      )}
      {leaderboard.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>Position</th>
                <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>Username</th>
                <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>Tips made</th>
                <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>Coal Train Cup points</th>
                <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>Accumulated margin</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.username + row.position}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{row.position}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{row.username}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>{row.tips_count}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>{row.points}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>{row.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
