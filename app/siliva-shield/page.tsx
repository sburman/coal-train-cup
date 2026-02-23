"use client";

import { useState, useEffect } from "react";

const THIS_WEEK = 31;
const AVAILABLE_TEAMS = ["Melbourne Storm", "Brisbane Broncos"];

export default function SilivaShieldPage() {
  const [email, setEmail] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [winners28, setWinners28] = useState<{ email: string; team: string; tryscorer: string }[]>([]);
  const [winners29, setWinners29] = useState<{ email: string; team: string; tryscorer: string }[]>([]);
  const [winners30, setWinners30] = useState<{ email: string; team: string; tryscorer: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTryscorer, setSelectedTryscorer] = useState<string | null>(null);
  const [matchTotal, setMatchTotal] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/siliva-shield/players?round=${THIS_WEEK}`).then((r) => r.json()),
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
  const userLastRound = email ? lastRoundWinners.filter((w) => w.email.toLowerCase() === email.toLowerCase()) : [];
  const userEarlier = email ? earlierWinners.filter((w) => w.email.toLowerCase() === email.toLowerCase()) : [];

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
  const availablePlayers = players.filter((p) => !unavailableTryscorers.has(p));

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
    if (THIS_WEEK === 31 && (matchTotal === "" || matchTotal === null)) {
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
      <h1 style={{ marginBottom: "0.25rem" }}>🛡️ Siliva Shield</h1>
      <h2 style={{ marginBottom: "1rem" }}>Finals Week 4</h2>
      <div style={{ marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
        Rules:
        <ul style={{ marginLeft: "1.25rem", marginTop: "0.5rem" }}>
          <li>Submit 1 team that you think will win this weekend</li>
          <li>Submit 1 player as a tryscorer for this weekend</li>
        </ul>
        <p><em>IMPORTANT</em> – You can&apos;t repeat a team or tryscorer selection throughout the entire finals. Choose wisely!</p>
      </div>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <div style={{ marginBottom: "1rem", maxWidth: "20rem" }}>
        <label htmlFor="shield-email" style={{ display: "block", marginBottom: "0.25rem" }}>
          Patreon email
        </label>
        <input
          id="shield-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      {email && userLastRound.length === 0 && lastRoundWinners.length > 0 && (
        <p style={{ color: "var(--chart-loss)" }}>
          Sorry, it looks like you were not a winner in the last round. Only previous round winners can continue in the Siliva Shield.
        </p>
      )}
      {userLastRound.length > 0 && (
        <>
          <p style={{ color: "var(--chart-win)", marginBottom: "0.5rem" }}>
            🎉 Congratulations! You were a winner last round tipping {userLastRound[0].team} and {userLastRound[0].tryscorer}.
          </p>
          {(unavailableTeams.size > 0 || unavailableTryscorers.size > 0) && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--code-bg)", borderRadius: "4px" }}>
              <p style={{ marginBottom: "0.5rem" }}>
                You have already selected: {Array.from(unavailableTeams).join(", ")}; {Array.from(unavailableTryscorers).join(", ")}
              </p>
            </div>
          )}
          <div style={{ marginBottom: "1rem", maxWidth: "20rem" }}>
            <label htmlFor="shield-team" style={{ display: "block", marginBottom: "0.25rem" }}>Select a team</label>
            <select
              id="shield-team"
              value={selectedTeam ?? ""}
              onChange={(e) => setSelectedTeam(e.target.value || null)}
              style={{
                width: "100%",
                padding: "0.5rem",
                background: "var(--bg-secondary)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                color: "var(--text)",
              }}
            >
              <option value="">--</option>
              {availableTeams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "1rem", maxWidth: "20rem" }}>
            <label htmlFor="shield-tryscorer" style={{ display: "block", marginBottom: "0.25rem" }}>Select a tryscorer</label>
            <select
              id="shield-tryscorer"
              value={selectedTryscorer ?? ""}
              onChange={(e) => setSelectedTryscorer(e.target.value || null)}
              style={{
                width: "100%",
                padding: "0.5rem",
                background: "var(--bg-secondary)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                color: "var(--text)",
              }}
            >
              <option value="">Type to search...</option>
              {availablePlayers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {THIS_WEEK === 31 && (
            <div style={{ marginBottom: "1rem", maxWidth: "8rem" }}>
              <label htmlFor="shield-total" style={{ display: "block", marginBottom: "0.25rem" }}>Match points total</label>
              <input
                id="shield-total"
                type="number"
                min={0}
                max={100}
                value={matchTotal}
                onChange={(e) => setMatchTotal(e.target.value === "" ? "" : Number(e.target.value))}
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
          )}
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
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {message && (
            <p style={{ color: message.type === "ok" ? "var(--chart-win)" : "var(--chart-loss)", marginTop: "1rem" }}>
              {message.type === "ok" ? "✅ " : "❌ "}{message.text}
            </p>
          )}
        </>
      )}
    </>
  );
}
