"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const THIS_WEEK = 31;
const AVAILABLE_TEAMS = ["Melbourne Storm", "Brisbane Broncos"];

export default function SilivaShieldPage() {
  const [email, setEmail] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [winners28, setWinners28] = useState<
    { email: string; team: string; tryscorer: string }[]
  >([]);
  const [winners29, setWinners29] = useState<
    { email: string; team: string; tryscorer: string }[]
  >([]);
  const [winners30, setWinners30] = useState<
    { email: string; team: string; tryscorer: string }[]
  >([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTryscorer, setSelectedTryscorer] = useState<string | null>(
    null
  );
  const [matchTotal, setMatchTotal] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/siliva-shield/players?round=${THIS_WEEK}`).then((r) =>
        r.json()
      ),
      fetch("/api/siliva-shield/winners?round=28").then((r) => r.json()),
      fetch("/api/siliva-shield/winners?round=29").then((r) => r.json()),
      fetch("/api/siliva-shield/winners?round=30").then((r) => r.json()),
    ]).then(([p, w28, w29, w30]) => {
      setPlayers(p.players ?? []);
      setWinners28(w28.winners ?? []);
      setWinners29(w29.winners ?? []);
      setWinners30(w30.winners ?? []);
    });
  }, []);

  const lastRoundWinners = winners30;
  const earlierWinners = [...winners28, ...winners29];
  const userLastRound = email
    ? lastRoundWinners.filter(
        (w) => w.email.toLowerCase() === email.toLowerCase()
      )
    : [];
  const userEarlier = email
    ? earlierWinners.filter(
        (w) => w.email.toLowerCase() === email.toLowerCase()
      )
    : [];

  const unavailableTeams = new Set<string>();
  const unavailableTryscorers = new Set<string>();
  if (userLastRound.length) {
    unavailableTeams.add(userLastRound[0].team);
    unavailableTryscorers.add(userLastRound[0].tryscorer);
  }
  userEarlier.forEach((w) => {
    unavailableTeams.add(w.team);
    unavailableTryscorers.add(w.tryscorer);
  });

  const availableTeams = AVAILABLE_TEAMS.filter((t) => !unavailableTeams.has(t));
  const availablePlayers = players.filter(
    (p) => !unavailableTryscorers.has(p)
  );

  const handleSubmit = async () => {
    if (!email.trim()) {
      setMessage({ type: "err", text: "Please enter your Patreon email" });
      return;
    }
    if (!selectedTeam) {
      setMessage({ type: "err", text: "Please select a team" });
      return;
    }
    if (!selectedTryscorer) {
      setMessage({ type: "err", text: "Please select a tryscorer" });
      return;
    }
    if (
      THIS_WEEK === 31 &&
      (matchTotal === "" || matchTotal === null)
    ) {
      setMessage({
        type: "err",
        text: "Please enter match points total",
      });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/siliva-shield/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          season: 2026,
          round: THIS_WEEK,
          team: selectedTeam,
          tryscorer: selectedTryscorer,
          match_total: THIS_WEEK === 31 ? Number(matchTotal) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage({ type: "ok", text: "Siliva Shield tip submitted." });
      } else {
        setMessage({ type: "err", text: data.error || "Submit failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionHeader as="h1">Siliva Shield</SectionHeader>
      <h2 className="mb-6 font-display text-xl font-semibold text-white/90">
        Finals Week 4
      </h2>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <p className="font-medium">Rules:</p>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap pt-0 text-sm text-white/90">
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Submit 1 team that you think will win this weekend</li>
            <li>Submit 1 player as a tryscorer for this weekend</li>
          </ul>
          <p className="mt-2">
            <em>IMPORTANT</em> – You can&apos;t repeat a team or tryscorer
            selection throughout the entire finals. Choose wisely!
          </p>
        </CardContent>
      </Card>
      <div className="mb-6 max-w-xs space-y-2">
        <Label htmlFor="shield-email">Patreon email</Label>
        <Input
          id="shield-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>
      {email && userLastRound.length === 0 && lastRoundWinners.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          Sorry, it looks like you were not a winner in the last round. Only
          previous round winners can continue in the Siliva Shield.
        </Alert>
      )}
      {userLastRound.length > 0 && (
        <>
          <Alert variant="success" className="mb-4">
            Congratulations! You were a winner last round tipping{" "}
            {userLastRound[0].team} and {userLastRound[0].tryscorer}.
          </Alert>
          {(unavailableTeams.size > 0 || unavailableTryscorers.size > 0) && (
            <Card className="mb-4 border-white/20 bg-[var(--code-bg)]">
              <CardContent className="pt-4">
                <p className="text-sm text-white/90">
                  You have already selected:{" "}
                  {Array.from(unavailableTeams).join(", ")};{" "}
                  {Array.from(unavailableTryscorers).join(", ")}
                </p>
              </CardContent>
            </Card>
          )}
          <div className="mb-4 max-w-xs space-y-2">
            <Label htmlFor="shield-team">Select a team</Label>
            <Select
              id="shield-team"
              value={selectedTeam ?? ""}
              onChange={(e) => setSelectedTeam(e.target.value || null)}
            >
              <option value="">--</option>
              {availableTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="mb-4 max-w-xs space-y-2">
            <Label htmlFor="shield-tryscorer">Select a tryscorer</Label>
            <Select
              id="shield-tryscorer"
              value={selectedTryscorer ?? ""}
              onChange={(e) => setSelectedTryscorer(e.target.value || null)}
            >
              <option value="">Type to search...</option>
              {availablePlayers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          {THIS_WEEK === 31 && (
            <div className="mb-4 max-w-[8rem] space-y-2">
              <Label htmlFor="shield-total">Match points total</Label>
              <Input
                id="shield-total"
                type="number"
                min={0}
                max={100}
                value={matchTotal}
                onChange={(e) =>
                  setMatchTotal(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </Button>
          {message && (
            <Alert
              variant={message.type === "ok" ? "success" : "destructive"}
              className="mt-4"
            >
              {message.type === "ok" ? "" : ""}
              {message.text}
            </Alert>
          )}
        </>
      )}
    </>
  );
}
