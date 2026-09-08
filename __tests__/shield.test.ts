import {
  finalsWeekLabel,
  finalsWeekNumber,
  isShieldRound,
  priorShieldRounds,
  requiresTieBreak,
  lineupReadiness,
  shieldEligibility,
  priorSelectionsFor,
  lineupsMatchDraw,
  shieldSelectionPool,
  isLocked,
  validateAndBuildShieldTip,
} from "@/lib/shield";
import { SHIELD_TIP_GRACE_MINUTES } from "@/lib/constants";
import type { Game, User, UserShieldTip } from "@/lib/types";
import type { RoundLineups, RoundPlayer } from "@/lib/nrl";

// Real 2026 Finals Week 1 draw.
const R28: Game[] = [
  g("South Sydney Rabbitohs", "Newcastle Knights", "2026-09-11T09:50:00+00:00"),
  g("New Zealand Warriors", "Dolphins", "2026-09-12T06:05:00+00:00"),
  g("Cronulla-Sutherland Sharks", "North Queensland Cowboys", "2026-09-12T09:50:00+00:00"),
  g("Penrith Panthers", "Sydney Roosters", "2026-09-13T06:05:00+00:00"),
];

function g(home: string, away: string, kickoff: string): Game {
  return {
    season: 2026,
    round: 28,
    kickoff,
    home_team: home,
    away_team: away,
    venue: "Venue, City",
    home_score: null,
    away_score: null,
  };
}

function player(name: string, team: string): RoundPlayer {
  return { name, team };
}

const PLAYERS: RoundPlayer[] = [
  player("Latrell Mitchell", "South Sydney Rabbitohs"),
  player("Kalyn Ponga", "Newcastle Knights"),
  player("Shaun Johnson", "New Zealand Warriors"),
  player("Hamiso Tabuai-Fidow", "Dolphins"),
  player("Nicho Hynes", "Cronulla-Sutherland Sharks"),
  player("Valentine Holmes", "North Queensland Cowboys"),
  player("Nathan Cleary", "Penrith Panthers"),
  player("James Tedesco", "Sydney Roosters"),
];

const USERS: User[] = [
  { email: "steve@example.com", username: "steve", username_masked: "s****e" },
  { email: "Jo@Example.com", username: "jo", username_masked: "j*o" },
];

function winner(
  email: string,
  round: number,
  team: string,
  tryscorer: string
): UserShieldTip {
  return {
    email,
    season: 2026,
    round,
    team,
    tryscorer,
    match_total: null,
    tipped_at: "2026-09-09T00:00:00.000Z",
  };
}

const BEFORE_ANY_KICKOFF = new Date("2026-09-10T00:00:00Z");

function lineups(partial: Partial<RoundLineups>): RoundLineups {
  return {
    players: PLAYERS,
    fixtureCount: 4,
    fixturesWithLineups: 4,
    fixtureFetchFailures: 0,
    ...partial,
  };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    email: "steve@example.com",
    round: 28,
    team: "Penrith Panthers",
    tryscorer: "Nathan Cleary",
    users: USERS,
    previousRoundWinners: null,
    priorWinners: [] as UserShieldTip[],
    roundGames: R28,
    players: PLAYERS,
    readiness: "ready" as const,
    now: BEFORE_ANY_KICKOFF,
    ...overrides,
  };
}

describe("round helpers", () => {
  it("labels finals weeks from the start round", () => {
    expect(finalsWeekNumber(28)).toBe(1);
    expect(finalsWeekLabel(28)).toBe("Finals Week 1");
    expect(finalsWeekLabel(31)).toBe("Finals Week 4");
  });

  it("bounds the shield to the four finals rounds", () => {
    expect(isShieldRound(27)).toBe(false);
    expect(isShieldRound(28)).toBe(true);
    expect(isShieldRound(31)).toBe(true);
    expect(isShieldRound(32)).toBe(false);
  });

  it("has no prior rounds in week 1 and three by week 4", () => {
    expect(priorShieldRounds(28)).toEqual([]);
    expect(priorShieldRounds(31)).toEqual([28, 29, 30]);
  });

  it("requires the tie-break only in the deciding week", () => {
    expect(requiresTieBreak(28)).toBe(false);
    expect(requiresTieBreak(30)).toBe(false);
    expect(requiresTieBreak(31)).toBe(true);
  });
});

describe("lineupReadiness", () => {
  it("reads all-empty lineups as not yet published, not as failure", () => {
    expect(lineupReadiness(lineups({ fixturesWithLineups: 0 }))).toBe(
      "not_published"
    );
  });

  it("treats a partial drop as broken, since clubs publish together", () => {
    expect(lineupReadiness(lineups({ fixturesWithLineups: 3 }))).toBe("partial");
  });

  it("treats a fetch failure as broken even when others resolved", () => {
    expect(
      lineupReadiness(
        lineups({ fixturesWithLineups: 4, fixtureFetchFailures: 1 })
      )
    ).toBe("partial");
  });

  it("flags a total fetch failure as broken rather than unpublished", () => {
    expect(
      lineupReadiness(
        lineups({ fixturesWithLineups: 0, fixtureFetchFailures: 4 })
      )
    ).toBe("partial");
  });

  it("is ready only when every fixture has a lineup", () => {
    expect(lineupReadiness(lineups({}))).toBe("ready");
  });
});

describe("shieldEligibility", () => {
  it("opens week 1 to any registered user", () => {
    const e = shieldEligibility("steve@example.com", USERS, null);
    expect(e.eligible).toBe(true);
    expect(e.qualifyingSelection).toBeNull();
  });

  it("rejects an unregistered email even in week 1", () => {
    const e = shieldEligibility("nobody@example.com", USERS, null);
    expect(e.eligible).toBe(false);
    expect(e.reason).toBe("not_registered");
  });

  it("matches emails case-insensitively", () => {
    expect(shieldEligibility("jo@example.com", USERS, null).eligible).toBe(true);
  });

  it("gates week 2 on the previous round's winners", () => {
    const winners = [winner("steve@example.com", 28, "Penrith Panthers", "Nathan Cleary")];
    expect(shieldEligibility("steve@example.com", USERS, winners).eligible).toBe(true);
    const jo = shieldEligibility("Jo@Example.com", USERS, winners);
    expect(jo.eligible).toBe(false);
    expect(jo.reason).toBe("not_previous_winner");
  });

  it("reads an empty winners sheet as not-yet-published, not elimination", () => {
    // Monday of finals week 2: `Winners - Shield Round 28` is absent or empty,
    // so loadShieldWinners returns []. Telling everyone they lost here would be
    // wrong AND would block the actual winners.
    const e = shieldEligibility("steve@example.com", USERS, []);
    expect(e.eligible).toBe(false);
    expect(e.reason).toBe("winners_not_published");
  });

  it("returns the qualifying selection so the UI can echo it back", () => {
    const winners = [winner("steve@example.com", 28, "Penrith Panthers", "Nathan Cleary")];
    const e = shieldEligibility("steve@example.com", USERS, winners);
    expect(e.qualifyingSelection?.team).toBe("Penrith Panthers");
  });
});

describe("lineupsMatchDraw", () => {
  it("accepts lineups whose teams are all in the draw", () => {
    expect(lineupsMatchDraw(R28, PLAYERS)).toBe(true);
  });

  it("rejects a lineup team missing from the draw", () => {
    expect(
      lineupsMatchDraw(R28, [...PLAYERS, player("Reece Walsh", "Brisbane Broncos")])
    ).toBe(false);
  });

  it("rejects everything when the draw is empty", () => {
    expect(lineupsMatchDraw([], PLAYERS)).toBe(false);
  });

  it("is vacuously true with no players", () => {
    expect(lineupsMatchDraw(R28, [])).toBe(true);
  });
});

describe("priorSelectionsFor", () => {
  it("collects every team and tryscorer used across earlier weeks", () => {
    const prior = [
      winner("steve@example.com", 28, "Penrith Panthers", "Nathan Cleary"),
      winner("steve@example.com", 29, "Dolphins", "Hamiso Tabuai-Fidow"),
      winner("steve@example.com", 30, "Sydney Roosters", "James Tedesco"),
      winner("jo@example.com", 28, "Newcastle Knights", "Kalyn Ponga"),
    ];
    const s = priorSelectionsFor("steve@example.com", prior);
    expect([...s.teams].sort()).toEqual([
      "Dolphins",
      "Penrith Panthers",
      "Sydney Roosters",
    ]);
    expect(s.tryscorers.has("Kalyn Ponga")).toBe(false);
  });
});

describe("shieldSelectionPool", () => {
  const empty = { teams: new Set<string>(), tryscorers: new Set<string>() };

  it("offers both teams from every fixture", () => {
    const pool = shieldSelectionPool(R28, PLAYERS, empty, BEFORE_ANY_KICKOFF);
    expect(pool.teams).toHaveLength(8);
    expect(pool.teams.every((t) => t.available)).toBe(true);
  });

  it("locks a team and its players once that fixture kicks off", () => {
    // Just after the Friday game, before Saturday's.
    const now = new Date("2026-09-11T10:30:00Z");
    const pool = shieldSelectionPool(R28, PLAYERS, empty, now);
    const souths = pool.teams.find((t) => t.team === "South Sydney Rabbitohs")!;
    const knights = pool.teams.find((t) => t.team === "Newcastle Knights")!;
    expect(souths.available).toBe(false);
    expect(souths.reason).toBe("locked");
    expect(knights.available).toBe(false);

    expect(pool.tryscorers.find((p) => p.name === "Latrell Mitchell")!.available).toBe(false);
    expect(pool.tryscorers.find((p) => p.name === "Kalyn Ponga")!.reason).toBe("locked");
    // Sunday's game is untouched.
    expect(pool.tryscorers.find((p) => p.name === "Nathan Cleary")!.available).toBe(true);
    expect(pool.teams.find((t) => t.team === "Penrith Panthers")!.available).toBe(true);
  });

  it("applies exactly one minute of grace", () => {
    const kickoff = new Date("2026-09-11T09:50:00Z").getTime();
    const game = R28[0];
    expect(isLocked(game, new Date(kickoff + 30 * 1000))).toBe(false);
    expect(isLocked(game, new Date(kickoff + SHIELD_TIP_GRACE_MINUTES * 60 * 1000))).toBe(false);
    expect(isLocked(game, new Date(kickoff + 61 * 1000))).toBe(true);
  });

  it("marks previously used teams and tryscorers as used, not locked", () => {
    const prior = {
      teams: new Set(["Penrith Panthers"]),
      tryscorers: new Set(["Nathan Cleary"]),
    };
    const pool = shieldSelectionPool(R28, PLAYERS, prior, BEFORE_ANY_KICKOFF);
    const penrith = pool.teams.find((t) => t.team === "Penrith Panthers")!;
    expect(penrith.available).toBe(false);
    expect(penrith.reason).toBe("used");
    expect(pool.tryscorers.find((p) => p.name === "Nathan Cleary")!.reason).toBe("used");
  });

  it("locks a player whose team is not in this round's draw", () => {
    const stray = [...PLAYERS, player("Reece Walsh", "Brisbane Broncos")];
    const pool = shieldSelectionPool(R28, stray, empty, BEFORE_ANY_KICKOFF);
    expect(pool.tryscorers.find((p) => p.name === "Reece Walsh")!.available).toBe(false);
  });
});

describe("validateAndBuildShieldTip", () => {
  it("builds a valid week 1 tip with no tie-break", () => {
    const tip = validateAndBuildShieldTip(baseInput());
    expect(tip.round).toBe(28);
    expect(tip.season).toBe(2026);
    expect(tip.team).toBe("Penrith Panthers");
    expect(tip.match_total).toBeNull();
    expect(tip.tipped_at).toBe(BEFORE_ANY_KICKOFF.toISOString());
  });

  it("stores the registered email, not the typed casing", () => {
    const tip = validateAndBuildShieldTip(baseInput({ email: "STEVE@example.com" }));
    expect(tip.email).toBe("steve@example.com");
  });

  it("refuses a non-finals round", () => {
    expect(() => validateAndBuildShieldTip(baseInput({ round: 27 }))).toThrow(
      /not a Siliva Shield finals round/
    );
  });

  it("refuses before team lists are published", () => {
    expect(() =>
      validateAndBuildShieldTip(baseInput({ readiness: "not_published" }))
    ).toThrow(/have not been published/);
  });

  it("refuses on a partial player list rather than accepting a guess", () => {
    expect(() =>
      validateAndBuildShieldTip(baseInput({ readiness: "partial" }))
    ).toThrow(/incomplete/);
  });

  it("refuses an unregistered email", () => {
    expect(() =>
      validateAndBuildShieldTip(baseInput({ email: "nobody@example.com" }))
    ).toThrow(/No user found/);
  });

  it("refuses to run week 2 before last round's winners are published", () => {
    expect(() =>
      validateAndBuildShieldTip(
        baseInput({ round: 29, previousRoundWinners: [] })
      )
    ).toThrow(/winners have not been published/);
  });

  it("refuses a non-winner from week 2 onwards", () => {
    expect(() =>
      validateAndBuildShieldTip(
        baseInput({
          round: 29,
          previousRoundWinners: [winner("jo@example.com", 28, "Dolphins", "Shaun Johnson")],
        })
      )
    ).toThrow(/previous round winners/);
  });

  it("rejects a team the client shouldn't have offered - already kicked off", () => {
    expect(() =>
      validateAndBuildShieldTip(
        baseInput({
          team: "South Sydney Rabbitohs",
          tryscorer: "Latrell Mitchell",
          now: new Date("2026-09-11T10:30:00Z"),
        })
      )
    ).toThrow(/already kicked off/);
  });

  it("rejects a team not playing this round", () => {
    expect(() =>
      validateAndBuildShieldTip(baseInput({ team: "Brisbane Broncos" }))
    ).toThrow(/not playing/);
  });

  it("rejects a tryscorer absent from the team lists", () => {
    expect(() =>
      validateAndBuildShieldTip(baseInput({ tryscorer: "Some Ringer" }))
    ).toThrow(/not in a team list/);
  });

  it("rejects a repeated team across finals weeks", () => {
    expect(() =>
      validateAndBuildShieldTip(
        baseInput({
          round: 29,
          previousRoundWinners: [
            winner("steve@example.com", 28, "Dolphins", "Shaun Johnson"),
          ],
          priorWinners: [
            winner("steve@example.com", 28, "Penrith Panthers", "Hamiso Tabuai-Fidow"),
          ],
        })
      )
    ).toThrow(/already used Penrith Panthers/);
  });

  it("rejects a repeated tryscorer across finals weeks", () => {
    expect(() =>
      validateAndBuildShieldTip(
        baseInput({
          round: 30,
          previousRoundWinners: [
            winner("steve@example.com", 29, "Dolphins", "Shaun Johnson"),
          ],
          priorWinners: [
            winner("steve@example.com", 28, "Dolphins", "Nathan Cleary"),
            winner("steve@example.com", 29, "Sydney Roosters", "Shaun Johnson"),
          ],
        })
      )
    ).toThrow(/already used Nathan Cleary/);
  });

  it("requires the tie-break total in the deciding week only", () => {
    const week4 = {
      round: 31,
      previousRoundWinners: [
        winner("steve@example.com", 30, "Dolphins", "Shaun Johnson"),
      ],
    };
    expect(() => validateAndBuildShieldTip(baseInput(week4))).toThrow(
      /match points total/
    );
    const tip = validateAndBuildShieldTip(
      baseInput({ ...week4, match_total: 38 })
    );
    expect(tip.match_total).toBe(38);
  });

  it("ignores a tie-break total supplied outside the deciding week", () => {
    const tip = validateAndBuildShieldTip(baseInput({ match_total: 38 }));
    expect(tip.match_total).toBeNull();
  });
});
