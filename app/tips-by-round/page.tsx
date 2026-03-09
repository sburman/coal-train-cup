"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
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
import { getTeamMascotName } from "@/lib/team-name";

const RESULT_COLORS = { Won: "#00e5b4", Lost: "#f45866", Draw: "#9c6ade" };
const RESULT_ORDER = { Won: 0, Draw: 1, Lost: 2, Unknown: 3 } as const;

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
  const totalTips = pieData.reduce((sum, d) => sum + d.value, 0);
  const sortedTeamStats = [...teamStats].sort((a, b) => {
    const aOrder =
      RESULT_ORDER[a.result as keyof typeof RESULT_ORDER] ?? RESULT_ORDER.Unknown;
    const bOrder =
      RESULT_ORDER[b.result as keyof typeof RESULT_ORDER] ?? RESULT_ORDER.Unknown;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return b.count - a.count;
  });
  const teamLabelWidth = 130;
  const teamChartHeight = Math.max(320, sortedTeamStats.length * 30);

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
              title="Competition results"
              className="mb-6"
              contentClassName="min-h-0"
            >
              <div className="space-y-3">
                {pieData.map((entry) => {
                  const percent =
                    totalTips > 0 ? Math.round((entry.value / totalTips) * 100) : 0;
                  return (
                    <div key={entry.name}>
                      <div className="mb-1 flex items-center justify-between text-sm text-white/90">
                        <span className="font-medium">{entry.name}</span>
                        <span>
                          {percent}% ({entry.value})
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: entry.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartContainer>
          )}
          {!roundDataLoading && teamStats.length > 0 && (
            <ChartContainer
              className="min-h-[320px]"
            >
              <ResponsiveContainer width="100%" height={teamChartHeight}>
                <BarChart
                  data={sortedTeamStats}
                  layout="vertical"
                  margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    domain={[0, "dataMax + 6"]}
                    tick={{ fill: "#fff" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="team"
                    interval={0}
                    width={teamLabelWidth}
                    tickMargin={10}
                    tickFormatter={getTeamMascotName}
                    tick={{ fill: "#fff", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.06)" }}
                    contentStyle={{
                      background: "rgba(31, 15, 82, 0.98)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                    formatter={(value: number) => [value, "Tips"]}
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.team ?? ""
                    }
                  />
                  <Bar dataKey="count" name="Tips">
                    {sortedTeamStats.map((entry) => (
                      <Cell
                        key={`${entry.team}-${entry.result}`}
                        fill={
                          RESULT_COLORS[
                            entry.result as keyof typeof RESULT_COLORS
                          ] ?? "#9c6ade"
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      formatter={(value: number) => (value > 0 ? value : "")}
                      fill="#fff"
                      fontSize={12}
                    />
                  </Bar>
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
