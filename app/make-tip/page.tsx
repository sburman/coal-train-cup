"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type AvailableTip = {
  season: number;
  round: number;
  team: string;
  opponent: string;
  home: boolean;
  available_until: string;
};

type Payload = {
  currentRound: number;
  user: { email: string; username: string } | null;
  previousRoundTip: {
    round: number;
    team: string;
    opponent: string;
    home: boolean;
    margin: number;
  } | null;
  availableTips: AvailableTip[];
  unavailableReasons: { team: string; reasons: string[] }[];
  error?: string;
};

export default function MakeTipPage() {
  const [email, setEmail] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"ok" | "err" | null>(null);
  const [submittedTip, setSubmittedTip] = useState<{
    round: number;
    team: string;
    opponent: string;
    home: boolean;
  } | null>(null);

  const fetchPayload = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setPayload(null);
    setSubmitResult(null);
    setSubmittedTip(null);
    try {
      const res = await fetch(
        `/api/make-tip?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      setPayload(data);
      setSelectedTeam(data.availableTips?.[0]?.team ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!payload?.user || !selectedTeam || !payload.availableTips.length)
      return;
    const tip = payload.availableTips.find((t) => t.team === selectedTeam);
    if (!tip) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/submit-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.user.email,
          tip,
          tipped_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitResult("ok");
        setSubmittedTip({
          round: tip.round,
          team: tip.team,
          opponent: tip.opponent,
          home: tip.home,
        });
        setPayload(null);
        setSelectedTeam(null);
      } else {
        setSubmitResult("err");
      }
    } catch {
      setSubmitResult("err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionHeader as="h1">Make a Tip</SectionHeader>
      <p className="mb-6 text-white/90">
        Enter your Patreon email, then we&apos;ll show your options for this
        round.
      </p>
      <div className="mb-6 max-w-md space-y-2">
        <Label htmlFor="email">Patreon email</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPayload()}
            placeholder="your@email.com"
            className="min-w-[200px] flex-1"
          />
          <Button
            type="button"
            onClick={fetchPayload}
            disabled={loading || !email.trim()}
          >
            {loading ? "Loading…" : "Go!"}
          </Button>
        </div>
      </div>
      {submittedTip && (
        <Alert variant="success" className="mb-6">
          <p className="font-medium">Tip submitted.</p>
          <p className="mt-1 text-white/90">
            For round {submittedTip.round}, you tipped{" "}
            <strong>{submittedTip.team}</strong> (
            {submittedTip.home ? "home" : "away"}) vs {submittedTip.opponent}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setSubmittedTip(null)}
          >
            Make another tip
          </Button>
        </Alert>
      )}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full max-w-md" />
        </div>
      )}
      {payload && !loading && (
        <>
          <SectionHeader as="h2" className="mb-4">
            Current round: {payload.currentRound}
          </SectionHeader>
          {payload.error && (
            <Alert variant="destructive" className="mb-4">
              <p>{payload.error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fetchPayload()}
              >
                Try again
              </Button>
            </Alert>
          )}
          {payload.user && !payload.error && (
            <>
              {payload.previousRoundTip && (
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <p className="text-white/90">
                      In round {payload.previousRoundTip.round} you tipped:{" "}
                      {payload.previousRoundTip.team} (
                      {payload.previousRoundTip.home ? "home" : "away"}) vs{" "}
                      {payload.previousRoundTip.opponent}.
                    </p>
                    {payload.previousRoundTip.margin > 0 && (
                      <p className="mt-1">They won by {payload.previousRoundTip.margin} points.</p>
                    )}
                    {payload.previousRoundTip.margin < 0 && (
                      <p className="mt-1">
                        They lost by {Math.abs(payload.previousRoundTip.margin)} points.
                      </p>
                    )}
                    {payload.previousRoundTip.margin === 0 && (
                      <p className="mt-1">It was a draw.</p>
                    )}
                  </CardContent>
                </Card>
              )}
              {!payload.previousRoundTip && payload.currentRound === 1 && (
                <p className="mb-4 text-white/90">
                  Round 1 – no restrictions from previous round. All options
                  available.
                </p>
              )}
              {payload.unavailableReasons.length > 0 && (
                <Card className="mb-4 border-white/20 bg-[var(--code-bg)]">
                  <CardHeader className="pb-2">
                    <p className="text-sm font-medium">
                      This week you can&apos;t select:
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="ml-5 list-disc space-y-0.5 text-sm text-white/90">
                      {payload.unavailableReasons.map(({ team, reasons }) => (
                        <li key={team}>
                          {team} [{reasons.join(", ")}]
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {payload.availableTips.length === 0 ? (
                <Alert variant="destructive">
                  No tips available for this round. Either the round is closed or
                  you have no eligible tips remaining.
                </Alert>
              ) : (
                <>
                  <p className="mb-2 font-medium text-white/90">
                    Select a tip for round {payload.currentRound}:
                  </p>
                  <div className="flex max-w-md flex-col gap-2">
                    {payload.availableTips.map((t) => (
                      <label
                        key={`${t.team}-${t.opponent}`}
                        className="flex cursor-pointer items-center gap-3 rounded-brand border border-white/20 px-4 py-3 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary-muted"
                      >
                        <input
                          type="radio"
                          name="tip"
                          checked={selectedTeam === t.team}
                          onChange={() => setSelectedTeam(t.team)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm text-white">
                          <strong>{t.team}</strong> ({t.home ? "H" : "A"}) vs{" "}
                          {t.opponent}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Submit tip"}
                    </Button>
                  </div>
                  {submitResult === "err" && (
                    <Alert variant="destructive" className="mt-4">
                      Could not submit tip. Please try again.
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
