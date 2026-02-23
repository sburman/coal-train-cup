"use client";

import { useState, useEffect } from "react";

type LeaderboardRow = {
  username: string;
  tips_count: number;
  points: number;
  margin: number;
  position: number;
};

const ROUNDS_2025 = Array.from({ length: 27 }, (_, i) => i + 1);

export default function Leaderboard2025Page() {
  const [round, setRound] = useState(27);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard/2025?round=${round}`)
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [round]);

  return (
    <>
      <h1 style={{ marginBottom: "0.25rem" }}>2025 Leaderboard</h1>
      <p style={{ fontSize: "0.875rem", opacity: 0.8, marginBottom: "1rem" }}>
        Archived final standings from the 2025 season.
      </p>
      <p style={{ marginBottom: "0.5rem" }}>Show leaderboard after:</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {ROUNDS_2025.map((r) => (
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
            Round {r}
          </button>
        ))}
      </div>
      {loading && <p>Loading…</p>}
      {!loading && leaderboard.length === 0 && (
        <p>No 2025 data available.</p>
      )}
      {!loading && leaderboard.length > 0 && (
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
