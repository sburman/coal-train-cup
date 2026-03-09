"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/layout/section-header";
import { RoundSwitcher } from "@/components/ui/round-switcher";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

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
  const [roundLoading, setRoundLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (res.ok) {
        setRound(data.round);
        setLeaderboard(data.leaderboard ?? []);
        setAvailableRounds(
          data.round
            ? Array.from({ length: data.round }, (_, i) => i + 1)
            : []
        );
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (round == null) return;
    setRoundLoading(true);
    fetch(`/api/leaderboard?round=${round}`)
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
      })
      .finally(() => setRoundLoading(false));
  }, [round]);

  if (loading) {
    return (
      <>
        <SectionHeader as="h1">2026 Leaderboard</SectionHeader>
        <Skeleton className="mb-4 h-10 w-64" />
        <TableSkeleton aria-label="Loading leaderboard" />
      </>
    );
  }

  const showTableLoading = roundLoading;
  const showEmpty = !roundLoading && leaderboard.length === 0;
  const showTable = !roundLoading && leaderboard.length > 0;

  return (
    <>
      <SectionHeader as="h1">2026 Leaderboard</SectionHeader>
      <RoundSwitcher
        rounds={availableRounds}
        value={round}
        onValueChange={setRound}
        label="Show leaderboard after:"
        roundLabel={(r) => (r === 1 ? "Round 1" : String(r))}
        className="mb-6"
      />
      {showTableLoading && (
        <TableSkeleton aria-label="Loading leaderboard" />
      )}
      {showEmpty && (
        <EmptyState
          title="No leaderboard data yet."
          description="Check back once rounds are in progress."
        />
      )}
      {showTable && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Tips made</TableHead>
              <TableHead className="text-right">Coal Train Cup points</TableHead>
              <TableHead className="text-right">Accumulated margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((row) => (
              <TableRow key={row.username + row.position}>
                <TableCell>{row.position}</TableCell>
                <TableCell className="font-medium">{row.username}</TableCell>
                <TableCell className="text-right">{row.tips_count}</TableCell>
                <TableCell className="text-right">{row.points}</TableCell>
                <TableCell className="text-right">{row.margin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
