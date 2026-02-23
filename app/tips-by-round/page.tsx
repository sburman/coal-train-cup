"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const RESULT_COLORS = { Won: "#00e5b4", Lost: "#f45866", Draw: "#9c6ade" };

export default function TipsByRoundPage() {
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [teamStats, setTeamStats] = useState<{ team: string; count: number; result: string }[]>([]);
  const [resultCounts, setResultCounts] = useState<{ Won: number; Lost: number; Draw: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/round-tips")
      .then((r) => r.json())
      .then((data) => {
        setAvailableRounds(data.availableRounds ?? []);
        if (data.availableRounds?.length) {
          setRound(data.availableRounds[data.availableRounds.length - 1]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (round == null) return;
    fetch(`/api/round-tips?round=${round}`)
      .then((r) => r.json())
      .then((data) => {
        setTeamStats(data.teamStats ?? []);
        setResultCounts(data.resultCounts ?? null);
      });
  }, [round]);

  const pieData = resultCounts
    ? [
        { name: "Won", value: resultCounts.Won, color: RESULT_COLORS.Won },
        { name: "Lost", value: resultCounts.Lost, color: RESULT_COLORS.Lost },
        { name: "Draw", value: resultCounts.Draw, color: RESULT_COLORS.Draw },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <>
      <h1 style={{ marginBottom: "0.5rem" }}>2026 tips by round</h1>
      {loading && <p>Loading…</p>}
      {!loading && availableRounds.length === 0 && <p>No closed rounds yet.</p>}
      {!loading && availableRounds.length > 0 && (
        <>
          <p style={{ marginBottom: "0.5rem" }}>Show round tip summary for:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
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
          {round != null && (
            <>
              {pieData.length > 0 && (
                <div style={{ marginBottom: "1.5rem", width: "100%", minHeight: 260 }}>
                  <h3 style={{ marginBottom: "0.5rem" }}>Distribution of Winning vs Losing Tips</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name} ${value}`}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid rgba(255,255,255,0.2)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {teamStats.length > 0 && (
                <div style={{ width: "100%", minHeight: 300 }}>
                  <h3 style={{ marginBottom: "0.5rem" }}>Team tips</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={teamStats.sort((a, b) => b.count - a.count)}
                      layout="vertical"
                      margin={{ left: 8, right: 8 }}
                    >
                      <XAxis type="number" tick={{ fill: "#fff" }} />
                      <YAxis type="category" dataKey="team" width={120} tick={{ fill: "#fff", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid rgba(255,255,255,0.2)" }} />
                      <Bar dataKey="count" name="Tips" fill="#9c6ade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {teamStats.length === 0 && resultCounts && (
                <p>No tips for this round.</p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
