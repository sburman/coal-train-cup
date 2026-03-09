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
import { TableSkeleton } from "@/components/ui/table-skeleton";

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
      <SectionHeader as="h1">2025 Leaderboard</SectionHeader>
      <p className="mb-6 text-sm text-white/80">
        Archived final standings from the 2025 season.
      </p>
      <RoundSwitcher
        rounds={ROUNDS_2025}
        value={round}
        onValueChange={setRound}
        label="Show leaderboard after:"
        roundLabel={(r) => (r === 1 ? "Round 1" : String(r))}
        className="mb-6"
      />
      {loading && (
        <TableSkeleton aria-label="Loading 2025 leaderboard" />
      )}
      {!loading && leaderboard.length === 0 && (
        <EmptyState title="No 2025 data available." />
      )}
      {!loading && leaderboard.length > 0 && (
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
