"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

type ExclusionReason = "used" | "locked";

interface TeamOption {
  team: string;
  opponent: string;
  kickoff: string;
  available: boolean;
  reason?: ExclusionReason;
}

interface TryscorerOption {
  name: string;
  team: string;
  available: boolean;
  reason?: ExclusionReason;
}

interface ShieldPayload {
  shieldActive: boolean;
  round: number;
  weekLabel: string;
  requiresTieBreak: boolean;
  readiness: "not_published" | "partial" | "ready";
  fixtures: { home_team: string; away_team: string; kickoff: string }[];
  eligibility: {
    eligible: boolean;
    reason?:
      | "not_registered"
      | "not_previous_winner"
      | "winners_not_published";
    qualifyingSelection: { team: string; tryscorer: string } | null;
  } | null;
  pool: { teams: TeamOption[]; tryscorers: TryscorerOption[] } | null;
  existingTips: { team: string; tryscorer: string; tipped_at: string }[];
  error?: string;
}

export default function SilivaShieldPage() {
  const [email, setEmail] = useState("");
  /** The email the current payload was loaded for - what we submit against. */
  const [loadedEmail, setLoadedEmail] = useState("");
  const [payload, setPayload] = useState<ShieldPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTryscorer, setSelectedTryscorer] = useState("");
  const [matchTotal, setMatchTotal] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const loadPayload = async (forEmail: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/siliva-shield?email=${encodeURIComponent(forEmail)}`
      );
      const data = (await res.json()) as ShieldPayload;
      setPayload(data);
      setLoadedEmail(forEmail);
    } catch {
      setMessage({ type: "err", text: "Could not load the Siliva Shield." });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!email.trim()) return;
    setSelectedTeam("");
    setSelectedTryscorer("");
    loadPayload(email.trim());
  };

  const emailChanged = email.trim() !== loadedEmail && loadedEmail !== "";

  const handleSubmit = async () => {
    if (!payload) return;
    if (emailChanged) {
      setMessage({
        type: "err",
        text: "Your email has changed since these options were loaded. Press Continue first.",
      });
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
    if (payload.requiresTieBreak && matchTotal === "") {
      setMessage({ type: "err", text: "Please enter match points total" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/siliva-shield/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loadedEmail,
          round: payload.round,
          team: selectedTeam,
          tryscorer: selectedTryscorer,
          match_total: payload.requiresTieBreak ? Number(matchTotal) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Reset to a clean form. Reloading the payload here would re-render
        // the whole filled-in form under the confirmation, which reads as if
        // nothing was submitted and invites a second (appended) entry.
        setMessage({
          type: "ok",
          text: `Siliva Shield tip submitted: ${selectedTeam} / ${selectedTryscorer}.`,
        });
        setEmail("");
        setLoadedEmail("");
        setPayload(null);
        setSelectedTeam("");
        setSelectedTryscorer("");
        setMatchTotal("");
      } else {
        setMessage({ type: "err", text: data.error || "Submit failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const pool = payload?.pool;
  const availableTeams = pool?.teams.filter((t) => t.available) ?? [];
  const availableTryscorers = pool?.tryscorers.filter((p) => p.available) ?? [];
  const usedTeams = pool?.teams.filter((t) => t.reason === "used") ?? [];
  const usedTryscorers =
    pool?.tryscorers.filter((p) => p.reason === "used") ?? [];
  const lockedTeams = pool?.teams.filter((t) => t.reason === "locked") ?? [];

  return (
    <>
      <SectionHeader as="h1">Siliva Shield</SectionHeader>
      {payload?.shieldActive && (
        <h2 className="mb-6 font-display text-xl font-semibold text-white/90">
          {payload.weekLabel}
        </h2>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <p className="font-medium">Rules:</p>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap pt-0 text-sm text-white/90">
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Submit 1 team that you think will win this weekend</li>
            <li>Submit 1 player as a tryscorer for this weekend</li>
            <li>Selections lock when that team&apos;s game kicks off</li>
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
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="your@email.com"
        />
        <Button
          type="button"
          onClick={handleLookup}
          disabled={loading || !email.trim()}
        >
          {loading ? "Loading…" : "Continue"}
        </Button>
      </div>

      {payload && !payload.shieldActive && (
        <Alert variant="info" className="mb-4">
          The Siliva Shield runs during the finals. It isn&apos;t open right now.
        </Alert>
      )}

      {payload?.shieldActive && payload.readiness === "not_published" && (
        <Alert variant="info" className="mb-4">
          Team lists for {payload.weekLabel} haven&apos;t been published yet.
          They land on Tuesday afternoon — tipping opens then.
        </Alert>
      )}

      {payload?.shieldActive && payload.readiness === "partial" && (
        <Alert variant="warning" className="mb-4">
          The player list is incomplete right now, so we can&apos;t show you a
          full set of options. Please try again shortly rather than tipping from
          a partial list.
        </Alert>
      )}

      {payload?.eligibility?.reason === "winners_not_published" && (
        <Alert variant="info" className="mb-4">
          Last round&apos;s Siliva Shield winners haven&apos;t been published
          yet, so we can&apos;t confirm who is still in. Please check back
          shortly.
        </Alert>
      )}

      {payload?.eligibility?.reason === "not_registered" && (
        <Alert variant="destructive" className="mb-4">
          No user found with email: {email.trim()}
        </Alert>
      )}

      {payload?.eligibility?.reason === "not_previous_winner" && (
        <Alert variant="destructive" className="mb-4">
          Sorry, it looks like you were not a winner in the last round. Only
          previous round winners can continue in the Siliva Shield.
        </Alert>
      )}

      {payload?.eligibility?.qualifyingSelection && (
        <Alert variant="success" className="mb-4">
          Congratulations! You were a winner last round tipping{" "}
          {payload.eligibility.qualifyingSelection.team} and{" "}
          {payload.eligibility.qualifyingSelection.tryscorer}.
        </Alert>
      )}

      {payload && payload.existingTips.length > 0 && (
        <Alert variant="warning" className="mb-4">
          You have already tipped this round:{" "}
          {payload.existingTips
            .map((t) => `${t.team} / ${t.tryscorer}`)
            .join("; ")}
          . Submitting again will add another entry rather than replace it.
        </Alert>
      )}

      {payload?.shieldActive && payload.readiness === "ready" && pool && (
        <>
          {(usedTeams.length > 0 || usedTryscorers.length > 0) && (
            <Card className="mb-4 border-white/20 bg-[var(--code-bg)]">
              <CardContent className="pt-4">
                <p className="text-sm text-white/90">
                  Already used in earlier finals weeks:{" "}
                  {[
                    ...usedTeams.map((t) => t.team),
                    ...usedTryscorers.map((p) => p.name),
                  ].join(", ")}
                </p>
              </CardContent>
            </Card>
          )}

          {lockedTeams.length > 0 && (
            <Card className="mb-4 border-white/20 bg-[var(--code-bg)]">
              <CardContent className="pt-4">
                <p className="text-sm text-white/70">
                  Locked (already kicked off):{" "}
                  {lockedTeams.map((t) => t.team).join(", ")}
                </p>
              </CardContent>
            </Card>
          )}

          {availableTeams.length === 0 ? (
            <Alert variant="info" className="mb-4">
              {pool.teams.length > 0 && lockedTeams.length === pool.teams.length
                ? "Every game this week has kicked off. Tipping is closed."
                : "You have no teams left to pick — every side still to play this week is one you have already used in an earlier finals week."}
            </Alert>
          ) : (
            <>
              <div className="mb-4 max-w-xs space-y-2">
                <Label htmlFor="shield-team">Select a team</Label>
                <Select
                  id="shield-team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">--</option>
                  {availableTeams.map((t) => (
                    <option key={t.team} value={t.team}>
                      {t.team}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 max-w-xs space-y-2">
                <Label htmlFor="shield-tryscorer">Select a tryscorer</Label>
                <Input
                  id="shield-tryscorer"
                  list="shield-tryscorer-options"
                  value={selectedTryscorer}
                  onChange={(e) => setSelectedTryscorer(e.target.value)}
                  placeholder="Type to search…"
                />
                <datalist id="shield-tryscorer-options">
                  {availableTryscorers.map((p) => (
                    <option key={`${p.team}|${p.name}`} value={p.name}>
                      {p.team}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-white/60">
                  {availableTryscorers.length} players available
                </p>
              </div>

              {payload.requiresTieBreak && (
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

              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </>
          )}
        </>
      )}

      {message && (
        <Alert
          variant={message.type === "ok" ? "success" : "destructive"}
          className="mt-4"
        >
          {message.text}
        </Alert>
      )}
    </>
  );
}
