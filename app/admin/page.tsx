"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InvalidTipRow = { email: string; round: number; team: string; kickoff: string; tipped_at: string };
type DuplicateGroup = { round: number; email: string; count: number };
type TeamViolation = { user: string; team: string; count: number };
type VenueViolation = { user: string; type: "home" | "away"; count: number };
type AdminReports = {
  invalidTips: InvalidTipRow[];
  duplicateTips: DuplicateGroup[];
  teamViolations: TeamViolation[];
  venueViolations: VenueViolation[];
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [allowedEmail, setAllowedEmail] = useState<string | null>(null);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<"ok" | "err" | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<
    { deleted: number; illegalTips?: { email: string; round: number; team: string; opponent: string; tipped_at: string }[] } | { error: string } | null
 >(null);

  const unlock = () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setCacheMessage(null);
    fetch(`/api/admin/reports?email=${encodeURIComponent(email.trim())}`)
      .then((r) => {
        if (r.status === 403) {
          setAllowedEmail(null);
          setReports(null);
          throw new Error("Access denied");
        }
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error ?? "Failed"); });
        return r.json();
      })
      .then((data: AdminReports) => {
        setAllowedEmail(email.trim());
        setReports(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const clearCache = () => {
    if (!allowedEmail) return;
    setCacheClearing(true);
    setCacheMessage(null);
    fetch("/api/admin/cache-clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: allowedEmail }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        setCacheMessage("ok");
      })
      .catch(() => setCacheMessage("err"))
      .finally(() => setCacheClearing(false));
  };

  const refreshReports = () => {
    if (!allowedEmail) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/reports?email=${encodeURIComponent(allowedEmail)}`)
      .then((r) => {
        if (r.status === 403) {
          setAllowedEmail(null);
          setReports(null);
          throw new Error("Access denied");
        }
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error ?? "Failed"); });
        return r.json();
      })
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const cleanupDuplicates = () => {
    if (!allowedEmail) return;
    setCleanupLoading(true);
    setCleanupResult(null);
    fetch("/api/admin/cleanup-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: allowedEmail }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setCleanupResult({ error: data.error });
        else setCleanupResult({
          deleted: data.deleted ?? 0,
          illegalTips: data.illegalTips ?? [],
        });
        if (data.deleted > 0) refreshReports();
      })
      .catch((e) => setCleanupResult({ error: e.message }))
      .finally(() => setCleanupLoading(false));
  };

  if (allowedEmail == null || reports == null) {
    return (
      <>
        <SectionHeader as="h1">Admin</SectionHeader>
        <div className="mb-6 max-w-xs space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              placeholder="your@email.com"
              className="flex-1"
            />
            <Button type="button" onClick={unlock} disabled={loading}>
              {loading ? "Checking…" : "Unlock"}
            </Button>
          </div>
          <p className="text-sm text-white/70">
            Verifies your email against the allowed admin list; if accepted, you’ll see utility actions and reports below.
          </p>
        </div>
        {error && (
          <Alert variant="destructive" role="alert">
            <p>{error}</p>
          </Alert>
        )}
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1">Admin</SectionHeader>
      <p className="mb-4 text-sm text-white/70">
        Logged in as {allowedEmail}. Use the Streamlit app for round archive only.
      </p>

      <div className="mb-6 space-y-4">
        <div className="space-y-1">
          <Button
            type="button"
            variant="secondary"
            onClick={clearCache}
            disabled={cacheClearing}
          >
            {cacheClearing ? "Clearing…" : "Clear cache"}
          </Button>
          <p className="text-sm text-white/70">
            Empties the in-memory cache (users, tips, games, leaderboard) on this server instance. The next request will re-read from the spreadsheet. Use after sheet changes so the site shows fresh data; you’ll see a short confirmation when done.
          </p>
        </div>
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            onClick={refreshReports}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh reports"}
          </Button>
          <p className="text-sm text-white/70">
            Reloads the four reports below from the current data. Use after clearing cache or if you’ve made changes elsewhere; tables update with the latest invalid tips, duplicates, and rule violations.
          </p>
        </div>
        <div className="space-y-1">
          <Button
            type="button"
            variant="secondary"
            onClick={cleanupDuplicates}
            disabled={cleanupLoading}
          >
            {cleanupLoading ? "Cleaning…" : "Cleanup duplicates"}
          </Button>
          <p className="text-sm text-white/70">
            Two phases: (1) Same tip submitted more than once — keeps the latest. (2) Multiple different tips for the same round — keeps the latest legal tip (you can’t override once an earlier tip’s game has started). Expect a count of rows deleted; refresh reports afterward.
          </p>
        </div>
      </div>
      {cacheMessage === "ok" && (
        <Alert className="mb-4">Cache cleared.</Alert>
      )}
      {cacheMessage === "err" && (
        <Alert variant="destructive" className="mb-4">Failed to clear cache.</Alert>
      )}
      {cleanupResult && "deleted" in cleanupResult && (
        <div className="mb-4 space-y-3">
          <Alert>
            Duplicate cleanup complete: {cleanupResult.deleted} row{cleanupResult.deleted === 1 ? "" : "s"} removed from the spreadsheet.
          </Alert>
          {cleanupResult.illegalTips && cleanupResult.illegalTips.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/90">
                Illegal tips removed (submitted after an earlier tip’s game had started):
              </p>
              <div className="overflow-x-auto rounded-lg border border-white/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Tipped at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cleanupResult.illegalTips.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.email}</TableCell>
                        <TableCell>{t.round}</TableCell>
                        <TableCell>{t.team}</TableCell>
                        <TableCell>{t.opponent}</TableCell>
                        <TableCell>{new Date(t.tipped_at).toISOString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
      {cleanupResult && "error" in cleanupResult && (
        <Alert variant="destructive" className="mb-4">{cleanupResult.error}</Alert>
      )}

      <SectionHeader as="h2">Late tips (tipped after kickoff)</SectionHeader>
      <p className="mb-2 text-sm text-white/70">
        Tips where the user submitted after the game’s kickoff time; these are invalid. Expect an empty list in normal operation.
      </p>
      {reports.invalidTips.length === 0 ? (
        <p className="mb-6 text-sm text-white/70">None.</p>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Kickoff</TableHead>
                <TableHead>Tipped at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.invalidTips.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.round}</TableCell>
                  <TableCell>{t.team}</TableCell>
                  <TableCell>{new Date(t.kickoff).toISOString()}</TableCell>
                  <TableCell>{new Date(t.tipped_at).toISOString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SectionHeader as="h2">Duplicate tips (same round + email)</SectionHeader>
      <p className="mb-2 text-sm text-white/70">
        Same round and email with more than one tip recorded (e.g. double submit). Use the “Cleanup duplicates” button above to remove extras and keep the latest tip only.
      </p>
      {reports.duplicateTips.length === 0 ? (
        <p className="mb-6 text-sm text-white/70">None.</p>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.duplicateTips.map((g, i) => (
                <TableRow key={i}>
                  <TableCell>{g.round}</TableCell>
                  <TableCell>{g.email}</TableCell>
                  <TableCell className="text-right">{g.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SectionHeader as="h2">3 tips per team rule violations</SectionHeader>
      <p className="mb-2 text-sm text-white/70">
        Users who have tipped the same team more than three times; the rules allow at most three tips per team per season. Expect an empty list if everyone has complied.
      </p>
      {reports.teamViolations.length === 0 ? (
        <p className="mb-6 text-sm text-white/70">None.</p>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.teamViolations.map((v, i) => (
                <TableRow key={i}>
                  <TableCell>{v.user}</TableCell>
                  <TableCell>{v.team}</TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SectionHeader as="h2">Home/away limit violations (13 each, excluding round 9)</SectionHeader>
      <p className="mb-2 text-sm text-white/70">
        Users who have used more than 13 home tips or 13 away tips (round 9 is excluded from the count). Expect an empty list if limits are respected.
      </p>
      {reports.venueViolations.length === 0 ? (
        <p className="mb-6 text-sm text-white/70">None.</p>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.venueViolations.map((v, i) => (
                <TableRow key={i}>
                  <TableCell>{v.user}</TableCell>
                  <TableCell>{v.type}</TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 space-y-1">
        <Button
          type="button"
          variant="ghost"
          className="text-white/70"
          onClick={() => {
            setAllowedEmail(null);
            setReports(null);
            setEmail("");
            setError(null);
          }}
        >
          Lock
        </Button>
        <p className="text-sm text-white/70">
          Clears your admin session and returns to the email gate; use when you’re done so the next visitor sees the lock screen.
        </p>
      </div>
    </>
  );
}
