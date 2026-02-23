"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SectionHeader } from "@/components/layout/section-header";
import { RoundSwitcher } from "@/components/ui/round-switcher";
import { ChartContainer } from "@/components/ui/chart-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const RESULT_COLORS = { Won: "#00e5b4", Lost: "#f45866", Draw: "#9c6ade" };

export default function TipsByRoundPage() {
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [teamStats, setTeamStats] = useState<
    { team: string; count: number; result: string }[]
  >([]);
  const [resultCounts, setResultCounts] = useState<{
    Won: number;
    Lost: number;
    Draw: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundDataLoading, setRoundDataLoading] = useState(false);

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
    setRoundDataLoading(true);
    fetch(`/api/round-tips?round=${round}`)
      .then((r) => r.json())
      .then((data) => {
        setTeamStats(data.teamStats ?? []);
        setResultCounts(data.resultCounts ?? null);
      })
      .finally(() => setRoundDataLoading(false));
  }, [round]);

  const pieData = resultCounts
    ? [
        { name: "Won", value: resultCounts.Won, color: RESULT_COLORS.Won },
        { name: "Lost", value: resultCounts.Lost, color: RESULT_COLORS.Lost },
        { name: "Draw", value: resultCounts.Draw, color: RESULT_COLORS.Draw },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <>
        <SectionHeader as="h1">2026 tips by round</SectionHeader>
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  if (availableRounds.length === 0) {
    return (
      <>
        <SectionHeader as="h1">2026 tips by round</SectionHeader>
        <EmptyState title="No closed rounds yet." />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1">2026 tips by round</SectionHeader>
      <RoundSwitcher
        rounds={availableRounds}
        value={round}
        onValueChange={setRound}
        label="Show round tip summary for:"
        roundLabel={(r) => (r === 1 ? "Round 1" : String(r))}
        className="mb-6"
      />
      {round != null && (
        <>
          {roundDataLoading && (
            <div role="status" aria-label="Loading round data" className="space-y-4">
              <p className="text-sm text-white/70">Loading round data…</p>
              <Skeleton className="h-[260px] w-full rounded-brand-lg" />
              <Skeleton className="h-[300px] w-full rounded-brand-lg" />
            </div>
          )}
          {!roundDataLoading && pieData.length > 0 && (
            <ChartContainer
              title="Distribution of Winning vs Losing Tips"
              className="mb-6 min-h-[260px]"
            >
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
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          {!roundDataLoading && teamStats.length > 0 && (
            <ChartContainer
              title="Team tips"
              className="min-h-[300px]"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={teamStats.sort((a, b) => b.count - a.count)}
                  layout="vertical"
                  margin={{ left: 8, right: 8 }}
                >
                  <XAxis type="number" tick={{ fill: "#fff" }} />
                  <YAxis
                    type="category"
                    dataKey="team"
                    width={120}
                    tick={{ fill: "#fff", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Bar dataKey="count" name="Tips" fill="#9c6ade" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          {!roundDataLoading && teamStats.length === 0 && resultCounts && (
            <p className="text-white/80">No tips for this round.</p>
          )}
        </>
      )}
    </>
  );
}
