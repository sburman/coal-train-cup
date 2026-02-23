"use client";

import { useState } from "react";

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

  const fetchPayload = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setPayload(null);
    setSubmitResult(null);
    try {
      const res = await fetch(`/api/make-tip?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      setPayload(data);
      setSelectedTeam(data.availableTips?.[0]?.team ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!payload?.user || !selectedTeam || !payload.availableTips.length) return;
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
      <h1 style={{ marginBottom: "0.5rem" }}>✏️ Make a Tip</h1>
      <p style={{ marginBottom: "1rem" }}>
        Enter your Patreon email, then we&apos;ll show your options for this round.
      </p>
      <div style={{ marginBottom: "1rem", maxWidth: "20rem" }}>
        <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>
          Patreon email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email.trim() && fetchPayload()}
          placeholder="your@email.com"
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            color: "var(--text)",
          }}
        />
      </div>
      {loading && <p>Loading…</p>}
      {payload && !loading && (
        <>
          <h2 style={{ marginBottom: "0.5rem" }}>Current round: {payload.currentRound}</h2>
          {payload.error && (
            <p style={{ color: "var(--chart-loss)", marginBottom: "1rem" }}>{payload.error}</p>
          )}
          {payload.user && !payload.error && (
            <>
              {payload.previousRoundTip && (
                <div style={{ marginBottom: "1rem" }}>
                  <p>
                    In round {payload.previousRoundTip.round} you tipped: {payload.previousRoundTip.team}{" "}
                    ({payload.previousRoundTip.home ? "home" : "away"}) vs {payload.previousRoundTip.opponent}.
                  </p>
                  {payload.previousRoundTip.margin > 0 && (
                    <p>✅ They won by {payload.previousRoundTip.margin} points.</p>
                  )}
                  {payload.previousRoundTip.margin < 0 && (
                    <p>❌ They lost by {Math.abs(payload.previousRoundTip.margin)} points.</p>
                  )}
                  {payload.previousRoundTip.margin === 0 && <p>It was a draw.</p>}
                </div>
              )}
              {!payload.previousRoundTip && payload.currentRound === 1 && (
                <p style={{ marginBottom: "1rem" }}>
                  Round 1 – no restrictions from previous round. All options available.
                </p>
              )}
              {payload.unavailableReasons.length > 0 && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--code-bg)", borderRadius: "4px" }}>
                  <p style={{ marginBottom: "0.5rem" }}>This week you can&apos;t select:</p>
                  <ul style={{ marginLeft: "1.25rem" }}>
                    {payload.unavailableReasons.map(({ team, reasons }) => (
                      <li key={team}>
                        {team} [{reasons.join(", ")}]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payload.availableTips.length === 0 ? (
                <p style={{ color: "var(--chart-loss)" }}>
                  No tips available for this round. Either the round is closed or you have no eligible tips remaining.
                </p>
              ) : (
                <>
                  <p style={{ marginBottom: "0.5rem" }}>
                    Select a tip for round {payload.currentRound}:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "28rem" }}>
                    {payload.availableTips.map((t) => (
                      <label
                        key={`${t.team}-${t.opponent}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          background: selectedTeam === t.team ? "var(--bg-secondary)" : "transparent",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="tip"
                          checked={selectedTeam === t.team}
                          onChange={() => setSelectedTeam(t.team)}
                        />
                        <span>
                          <strong>{t.team}</strong> ({t.home ? "H" : "A"}) vs {t.opponent}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--primary)",
                        color: "var(--bg)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: submitting ? "not-allowed" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {submitting ? "Submitting…" : "Submit tip"}
                    </button>
                  </div>
                  {submitResult === "ok" && (
                    <p style={{ color: "var(--chart-win)", marginTop: "1rem" }}>
                      ✅ Tip submitted. If you are seeing this, I&apos;m proud of you ❤️
                    </p>
                  )}
                  {submitResult === "err" && (
                    <p style={{ color: "var(--chart-loss)", marginTop: "1rem" }}>
                      ❌ Could not submit tip. Please try again.
                    </p>
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
