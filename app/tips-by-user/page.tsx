"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { ChartContainer } from "@/components/ui/chart-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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
        if (!r.ok)
          return r.json().then((d) => {
            throw new Error(d.error || "Failed");
          });
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

  const homeCount =
    data?.results.filter((r) => r.home && r.round !== 9).length ?? 0;
  const awayCount =
    data?.results.filter((r) => !r.home && r.round !== 9).length ?? 0;

  const teamSummary =
    data?.teams
      ?.map((team) => ({
        team,
        count: data.results.filter((r) => r.team === team).length,
      }))
      .sort((a, b) => b.count - a.count) ?? [];

  return (
    <>
      <SectionHeader as="h1">2026 tips by user</SectionHeader>
      <div className="mb-6 max-w-xs space-y-2">
        <Label htmlFor="email">Patreon email</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUser()}
            placeholder="your@email.com"
            className="flex-1"
          />
          <Button type="button" onClick={fetchUser} disabled={loading}>
            {loading ? "Loading…" : "Load"}
          </Button>
        </div>
      </div>
      {loading && (
        <div role="status" aria-label="Loading your tips" className="mt-6 space-y-4">
          <p className="text-sm text-white/70">Loading your tips…</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-brand" />
            <Skeleton className="h-20 w-full rounded-brand" />
          </div>
          <Skeleton className="h-64 w-full rounded-brand-lg" />
          <Skeleton className="h-48 w-full rounded-brand-lg" />
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4" role="alert">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fetchUser()}
          >
            Try again
          </Button>
        </Alert>
      )}
      {data && !error && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <StatCard label="Home tips used" value={`${homeCount} / 13`} />
            <StatCard label="Away tips used" value={`${awayCount} / 13`} />
          </div>
          {chartPoints.length > 0 && (
            <ChartContainer
              title="Leaderboard position by round"
              className="mb-6 min-h-[280px]"
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={chartPoints}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="round"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tick={{ fill: "#fff" }}
                  />
                  <YAxis
                    type="number"
                    reversed
                    domain={["dataMax + 2", "0"]}
                    tick={{ fill: "#fff" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                    formatter={(
                      value: number,
                      _name: string,
                      props: {
                        payload?: {
                          round: number;
                          team: string;
                          opponent: string;
                          venue: string;
                          result: string;
                          margin: number;
                        };
                      }
                    ) => {
                      const p = props?.payload;
                      const detail = p
                        ? `${p.team} vs ${p.opponent} (${p.venue}) — ${p.result}${p.margin !== 0 ? ` ${p.margin > 0 ? "+" : ""}${p.margin}` : ""}`
                        : "";
                      return [detail, "Position " + value];
                    }}
                    labelFormatter={(
                      _label,
                      payload
                    ) =>
                      payload?.[0]?.payload &&
                      `Round ${(payload[0].payload as { round: number }).round}`
                    }
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
                        fill={
                          RESULT_COLORS[
                            payload?.result as keyof typeof RESULT_COLORS
                          ] ?? "#9c6ade"
                        }
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          <SectionHeader as="h3">Tips used by team</SectionHeader>
          <div className="mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Number of tips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamSummary.map(({ team, count }) => (
                  <TableRow key={team}>
                    <TableCell>{team}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <SectionHeader as="h3">Tipping history</SectionHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>vs Opponent</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results
                .sort((a, b) => a.round - b.round)
                .map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.round}</TableCell>
                    <TableCell>{r.team}</TableCell>
                    <TableCell>{r.home ? "Home" : "Away"}</TableCell>
                    <TableCell>{r.opponent}</TableCell>
                    <TableCell className="text-right">{r.points}</TableCell>
                    <TableCell className="text-right">{r.margin}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}
