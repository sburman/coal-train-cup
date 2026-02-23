"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ResultRow = {
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  points: number;
  margin: number;
};

const RESULT_COLORS = { Win: "#00e5b4", Loss: "#f45866", Draw: "#9c6ade" };

export default function TipsByUserPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<{
    user: { email: string; username: string };
    maxRound: number;
    results: ResultRow[];
    teams: string[];
    positionsByRound: { round: number; position: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    fetch(`/api/user-tips?email=${encodeURIComponent(email.trim())}`)
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || "Failed"); });
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const chartPoints =
    data?.maxRound && data.positionsByRound?.length
      ? Array.from({ length: data.maxRound }, (_, i) => i + 1).map((round) => {
          const pos = data.positionsByRound.find((p) => p.round === round);
          const resultRow = data.results.find((r) => r.round === round);
          return {
            round,
            position: pos?.position ?? null,
            team: resultRow?.team ?? "",
            opponent: resultRow?.opponent ?? "",
            venue: resultRow ? (resultRow.home ? "Home" : "Away") : "",
            result: resultRow
              ? resultRow.margin > 0
                ? "Win"
                : resultRow.margin === 0
                  ? "Draw"
                  : "Loss"
              : "",
            margin: resultRow?.margin ?? 0,
          };
        })
      : [];

  const homeCount = data?.results.filter((r) => r.home && r.round !== 9).length ?? 0;
  const awayCount = data?.results.filter((r) => !r.home && r.round !== 9).length ?? 0;

  const teamSummary = data?.teams?.map((team) => ({
    team,
    count: data.results.filter((r) => r.team === team).length,
  })).sort((a, b) => b.count - a.count) ?? [];

  return (
    <>
      <h1 style={{ marginBottom: "0.5rem" }}>2026 tips by user</h1>
      <div style={{ marginBottom: "1rem", maxWidth: "20rem" }}>
        <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>
          Patreon email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUser()}
          placeholder="your@email.com"
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            color: "var(--text)",
          }}
        />
        <button
          type="button"
          onClick={fetchUser}
          disabled={loading}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            background: "var(--primary)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>
      {error && <p style={{ color: "var(--chart-loss)", marginBottom: "1rem" }}>{error}</p>}
      {data && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "4px" }}>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Home tips used</div>
              <div style={{ fontSize: "1.25rem", color: "var(--primary)" }}>{homeCount} / 13</div>
            </div>
            <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "4px" }}>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Away tips used</div>
              <div style={{ fontSize: "1.25rem", color: "var(--primary)" }}>{awayCount} / 13</div>
            </div>
          </div>
          {chartPoints.length > 0 && (
            <div style={{ marginBottom: "1.5rem", width: "100%", minHeight: 280 }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Leaderboard position by round</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartPoints} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="round" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#fff" }} />
                  <YAxis type="number" reversed domain={["dataMax + 2", "0"]} tick={{ fill: "#fff" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", border: "1px solid rgba(255,255,255,0.2)" }}
                    formatter={(value: number, _name: string, props: { payload?: { round: number; team: string; opponent: string; venue: string; result: string; margin: number } }) => {
                      const p = props?.payload;
                      const detail = p ? `${p.team} vs ${p.opponent} (${p.venue}) — ${p.result}${p.margin !== 0 ? ` ${p.margin > 0 ? "+" : ""}${p.margin}` : ""}` : "";
                      return [detail, "Position " + value];
                    }}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload && `Round ${(payload[0].payload as { round: number }).round}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="#9c6ade"
                    connectNulls
                    dot={({ payload, cx, cy }) => (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={RESULT_COLORS[payload?.result as keyof typeof RESULT_COLORS] ?? "#9c6ade"}
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <h3 style={{ marginBottom: "0.5rem" }}>Tips used by team</h3>
          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Team</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Number of tips</th>
                </tr>
              </thead>
              <tbody>
                {teamSummary.map(({ team, count }) => (
                  <tr key={team}>
                    <td style={{ padding: "0.5rem" }}>{team}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>Tipping history</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Round</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Team</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Venue</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>vs Opponent</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Points</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {data.results
                  .sort((a, b) => a.round - b.round)
                  .map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "0.5rem" }}>{r.round}</td>
                      <td style={{ padding: "0.5rem" }}>{r.team}</td>
                      <td style={{ padding: "0.5rem" }}>{r.home ? "Home" : "Away"}</td>
                      <td style={{ padding: "0.5rem" }}>{r.opponent}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.points}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.margin}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
