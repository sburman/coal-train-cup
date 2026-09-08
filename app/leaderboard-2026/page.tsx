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

// The 2026 regular season ran to round 27. Pinned rather than derived so the
// archive stays put as finals rounds close and move the "most recent" round on.
const FINAL_ROUND_2026 = 27;
const ROUNDS_2026 = Array.from(
  { length: FINAL_ROUND_2026 },
  (_, i) => i + 1
);

export default function Leaderboard2026Page() {
  const [round, setRound] = useState(FINAL_ROUND_2026);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?round=${round}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [round]);

  return (
    <>
      <SectionHeader as="h1">2026 Leaderboard</SectionHeader>
      <p className="mb-6 text-sm text-white/80">
        Archived final standings from the 2026 season.
      </p>
      <RoundSwitcher
        rounds={ROUNDS_2026}
        value={round}
        onValueChange={setRound}
        label="Show leaderboard after:"
        roundLabel={(r) => (r === 1 ? "Round 1" : String(r))}
        className="mb-6"
      />
      {loading && <TableSkeleton aria-label="Loading 2026 leaderboard" />}
      {!loading && leaderboard.length === 0 && (
        <EmptyState title="No 2026 data available." />
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
