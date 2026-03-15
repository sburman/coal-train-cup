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
  const [seasonRoundResults, setSeasonRoundResults] = useState<
    {
      round: number;
      wonCount: number;
      lostCount: number;
      drawCount: number;
      wonPercent: number;
      lostPercent: number;
      drawPercent: number;
      totalTips: number;
    }[]
  >([]);
  const [teamStats, setTeamStats] = useState<
    { team: string; count: number; result: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [seasonResultsLoading, setSeasonResultsLoading] = useState(false);
  const [roundDataLoading, setRoundDataLoading] = useState(false);

  useEffect(() => {
    fetch("/api/round-tips")
      .then((r) => r.json())
      .then((data) => {
        const rounds = data.availableRounds ?? [];
        setAvailableRounds(rounds);
        if (rounds.length) {
          setRound(rounds[rounds.length - 1]);
          setSeasonResultsLoading(true);
          Promise.all(
            rounds.map((r: number) =>
              fetch(`/api/round-tips?round=${r}`)
                .then((res) => res.json())
                .then((roundData) => {
                  const counts = roundData.resultCounts ?? {
                    Won: 0,
                    Lost: 0,
                    Draw: 0,
                  };
                  const wonCount = counts.Won ?? 0;
                  const lostCount = counts.Lost ?? 0;
                  const drawCount = counts.Draw ?? 0;
                  const totalTips = wonCount + lostCount + drawCount;
                  const wonPercent =
                    totalTips > 0 ? Math.round((wonCount / totalTips) * 100) : 0;
                  const lostPercent =
                    totalTips > 0 ? Math.round((lostCount / totalTips) * 100) : 0;
                  const drawPercent = Math.max(0, 100 - wonPercent - lostPercent);
                  return {
                    round: r,
                    wonCount,
                    lostCount,
                    drawCount,
                    wonPercent,
                    lostPercent,
                    drawPercent,
                    totalTips,
                  };
                })
            )
          )
            .then((rows) =>
              setSeasonRoundResults(rows.sort((a, b) => a.round - b.round))
            )
            .finally(() => setSeasonResultsLoading(false));
        } else {
          setSeasonRoundResults([]);
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
      })
      .finally(() => setRoundDataLoading(false));
  }, [round]);

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
  const maxTipCount = Math.max(0, ...sortedTeamStats.map((entry) => entry.count));
  const xTickStep = Math.max(1, Math.ceil(maxTipCount / 8));
  const xTicks =
    maxTipCount === 0
      ? [0, 1]
      : Array.from({ length: Math.floor(maxTipCount / xTickStep) + 1 }, (_, i) => i * xTickStep);
  if (xTicks[xTicks.length - 1] !== maxTipCount) {
    xTicks.push(maxTipCount);
  }

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
      {!seasonResultsLoading && seasonRoundResults.length > 0 && (
        <ChartContainer
          className="mb-6"
          contentClassName="min-h-0"
        >
          <div className="space-y-3">
            {seasonRoundResults.map((row) => (
              <div key={row.round} className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-sm font-medium text-white/90">
                  Round {row.round}
                </div>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="flex h-full w-full">
                    <div
                      className="flex items-center justify-center overflow-hidden text-[11px] font-semibold text-black"
                      style={{
                        width: `${row.wonPercent}%`,
                        backgroundColor: RESULT_COLORS.Won,
                      }}
                    >
                      {row.wonPercent > 0 ? `${row.wonPercent}% (${row.wonCount})` : ""}
                    </div>
                    <div
                      className="flex items-center justify-center overflow-hidden text-[11px] font-semibold text-white"
                      style={{
                        width: `${row.drawPercent}%`,
                        backgroundColor: RESULT_COLORS.Draw,
                      }}
                    >
                      {row.drawPercent > 0 ? `${row.drawPercent}% (${row.drawCount})` : ""}
                    </div>
                    <div
                      className="flex items-center justify-center overflow-hidden text-[11px] font-semibold text-white"
                      style={{
                        width: `${row.lostPercent}%`,
                        backgroundColor: RESULT_COLORS.Lost,
                      }}
                    >
                      {row.lostPercent > 0 ? `${row.lostPercent}% (${row.lostCount})` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      )}
      {seasonResultsLoading && (
        <div role="status" aria-label="Loading season results" className="mb-6 space-y-2">
          <p className="text-sm text-white/70">Loading competition results by round…</p>
          <Skeleton className="h-[220px] w-full rounded-brand-lg" />
        </div>
      )}
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
                    ticks={xTicks}
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
          {!roundDataLoading && teamStats.length === 0 && (
            <p className="text-white/80">No tips for this round.</p>
          )}
        </>
      )}
    </>
  );
}
