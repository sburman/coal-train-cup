import { google } from "googleapis";
import { getEnv } from "./env";
import { SPREADSHEET_NAME } from "./constants";
import type { User, UserTip, UserShieldTip, Game } from "./types";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

function getAuth() {
  const { googleCreds } = getEnv();
  return new google.auth.GoogleAuth({
    credentials: googleCreds as { client_email?: string; private_key?: string },
    scopes: SCOPES,
  });
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let driveClient: ReturnType<typeof google.drive> | null = null;

export async function getSheetsClient() {
  if (!sheetsClient) {
    const auth = getAuth();
    const client = await auth.getClient();
    sheetsClient = google.sheets({ version: "v4", auth: client as never });
  }
  return sheetsClient;
}

async function getDriveClient() {
  if (!driveClient) {
    const auth = getAuth();
    const client = await auth.getClient();
    driveClient = google.drive({ version: "v3", auth: client as never });
  }
  return driveClient;
}

async function getSpreadsheetId(name: string): Promise<string> {
  if (name === SPREADSHEET_NAME && process.env.GOOGLE_SPREADSHEET_ID) {
    return process.env.GOOGLE_SPREADSHEET_ID;
  }
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet'`,
    fields: "files(id)",
  });
  const file = res.data.files?.[0];
  if (!file?.id) throw new Error(`Spreadsheet not found: ${name}`);
  return file.id;
}

/** Sleep for ms (for 429 backoff). */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Call Sheets API with one retry after 429 (per-minute quota). */
async function withRetry429<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = (err as { code?: number; response?: { status?: number } })?.code ?? (err as { response?: { status?: number } })?.response?.status;
    if (status === 429) {
      await sleep(65000); // wait just over 1 minute
      return await fn();
    }
    throw err;
  }
}

/** Get all rows as records (first row = headers). */
export async function getWorksheetRecords(
  spreadsheetName: string,
  worksheetName: string
): Promise<Record<string, string | number>[]> {
  const withIndices = await getWorksheetRecordsWithRowIndices(
    spreadsheetName,
    worksheetName
  );
  return withIndices.map(({ record }) => record);
}

/** Get all rows as records plus 0-based row index in sheet (row 0 = header, first data row = 1). */
async function getWorksheetRecordsWithRowIndices(
  spreadsheetName: string,
  worksheetName: string
): Promise<{ record: Record<string, string | number>; zeroBasedRowIndex: number }[]> {
  return withRetry429(async () => {
    const sheets = await getSheetsClient();
    const id = await getSpreadsheetId(spreadsheetName);
    const range = `'${worksheetName}'`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range,
    });
    const rows = (res.data.values ?? []) as string[][];
    if (rows.length === 0) return [];
    const headers = rows[0].map((h) => String(h).trim());
    const out: { record: Record<string, string | number>; zeroBasedRowIndex: number }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rec: Record<string, string | number> = {};
      headers.forEach((h, j) => {
        const v = row[j];
        if (v !== undefined && v !== "") rec[h] = v;
      });
      out.push({ record: rec, zeroBasedRowIndex: i });
    }
    return out;
  });
}

export async function getWorksheetNames(spreadsheetName: string): Promise<string[]> {
  return withRetry429(async () => {
    const sheets = await getSheetsClient();
    const id = await getSpreadsheetId(spreadsheetName);
    const res = await sheets.spreadsheets.get({ spreadsheetId: id });
    return (res.data.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
  });
}

/** Get the sheetId (for batchUpdate) of a worksheet by title. */
export async function getSheetId(
  spreadsheetName: string,
  worksheetName: string
): Promise<number> {
  return withRetry429(async () => {
    const sheets = await getSheetsClient();
    const id = await getSpreadsheetId(spreadsheetName);
    const res = await sheets.spreadsheets.get({
      spreadsheetId: id,
      fields: "sheets(properties(sheetId,title))",
    });
    const sheet = (res.data.sheets ?? []).find(
      (s) => (s.properties?.title ?? "") === worksheetName
    );
    if (sheet?.properties?.sheetId == null)
      throw new Error(`Worksheet not found: ${worksheetName}`);
    return sheet.properties.sheetId;
  });
}

/** Delete rows by 0-based row index. Indices are processed in descending order so positions stay valid. */
export async function deleteRows(
  spreadsheetName: string,
  worksheetName: string,
  zeroBasedRowIndices: number[]
): Promise<void> {
  if (zeroBasedRowIndices.length === 0) return;
  const sheetId = await getSheetId(spreadsheetName, worksheetName);
  const sorted = [...zeroBasedRowIndices].sort((a, b) => b - a);
  const sheets = await getSheetsClient();
  const id = await getSpreadsheetId(spreadsheetName);
  await withRetry429(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: sorted.map((startIndex) => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex,
              endIndex: startIndex + 1,
            },
          },
        })),
      },
    })
  );
}

export async function worksheetExists(
  spreadsheetName: string,
  worksheetName: string
): Promise<boolean> {
  const names = await getWorksheetNames(spreadsheetName);
  return names.includes(worksheetName);
}

export async function createWorksheet(
  spreadsheetName: string,
  worksheetName: string
): Promise<void> {
  const sheets = await getSheetsClient();
  const id = await getSpreadsheetId(spreadsheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: worksheetName,
              gridProperties: { rowCount: 500, columnCount: 20 },
            },
          },
        },
      ],
    },
  });
}

export async function appendRow(
  spreadsheetName: string,
  worksheetName: string,
  values: (string | number)[]
): Promise<void> {
  const exists = await worksheetExists(spreadsheetName, worksheetName);
  if (!exists) await createWorksheet(spreadsheetName, worksheetName);

  const sheets = await getSheetsClient();
  const id = await getSpreadsheetId(spreadsheetName);
  await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `'${worksheetName}'!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values.map(String)] },
  });
}

// --- Load entities from sheets ---

export async function loadUsersFromSheets(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<User[]> {
  const records = await getWorksheetRecords(spreadsheetName, "Users");
  return records.map((r) => ({
    email: String(r.email ?? ""),
    username: String(r.username ?? ""),
    username_masked: String(r.username_masked ?? ""),
    pin: r.pin != null ? String(r.pin) : undefined,
  }));
}

export async function loadGamesFromSheets(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<Game[]> {
  const records = await getWorksheetRecords(spreadsheetName, "Games");
  return records.map((r) => ({
    season: Number(r.season),
    round: Number(r.round),
    kickoff: String(r.kickoff ?? ""),
    home_team: String(r.home_team ?? ""),
    away_team: String(r.away_team ?? ""),
    venue: String(r.venue ?? ""),
    home_score:
      r.home_score === "" || r.home_score === undefined || r.home_score === null
        ? null
        : Number(r.home_score),
    away_score:
      r.away_score === "" || r.away_score === undefined || r.away_score === null
        ? null
        : Number(r.away_score),
  }));
}

export async function loadUserTipsFromSheets(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<UserTip[]> {
  const names = await getWorksheetNames(spreadsheetName);
  const roundSheets = names.filter((n) => n.startsWith("Round "));
  const tips: UserTip[] = [];
  for (const sheetName of roundSheets) {
    const records = await getWorksheetRecords(spreadsheetName, sheetName);
    for (const r of records) {
      tips.push({
        email: String(r.email ?? ""),
        username: String(r.username ?? ""),
        season: Number(r.season),
        round: Number(r.round),
        team: String(r.team ?? ""),
        opponent: String(r.opponent ?? ""),
        home: [true, "TRUE", "1", 1].includes(r.home as boolean | string | number),
        tipped_at: String(r.tipped_at ?? ""),
      });
    }
  }
  return tips;
}

export type UserTipWithRow = { tip: UserTip; round: number; zeroBasedRowIndex: number };

/** Load all user tips with their sheet row index (for duplicate cleanup). */
export async function loadUserTipsWithRowIndices(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<UserTipWithRow[]> {
  const names = await getWorksheetNames(spreadsheetName);
  const roundSheets = names.filter((n) => n.startsWith("Round "));
  const out: UserTipWithRow[] = [];
  for (const sheetName of roundSheets) {
    const withIndices = await getWorksheetRecordsWithRowIndices(
      spreadsheetName,
      sheetName
    );
    for (const { record: r, zeroBasedRowIndex } of withIndices) {
      out.push({
        tip: {
          email: String(r.email ?? ""),
          username: String(r.username ?? ""),
          season: Number(r.season),
          round: Number(r.round),
          team: String(r.team ?? ""),
          opponent: String(r.opponent ?? ""),
          home: [true, "TRUE", "1", 1].includes(r.home as boolean | string | number),
          tipped_at: String(r.tipped_at ?? ""),
        },
        round: Number(r.round),
        zeroBasedRowIndex,
      });
    }
  }
  return out;
}

export async function loadShieldWinners(
  spreadsheetName: string,
  round: number
): Promise<UserShieldTip[]> {
  const sheetName = `Winners - Shield Round ${round}`;
  const exists = await worksheetExists(spreadsheetName, sheetName);
  if (!exists) return [];
  const records = await getWorksheetRecords(spreadsheetName, sheetName);
  return records.map((r) => ({
    email: String(r.email ?? ""),
    season: Number(r.season),
    round: Number(r.round),
    team: String(r.team ?? ""),
    tryscorer: String(r.tryscorer ?? ""),
    match_total: r.match_total != null ? Number(r.match_total) : null,
    tipped_at: String(r.tipped_at ?? ""),
  }));
}

// --- Writes ---

export async function appendTipToSheet(
  tip: UserTip,
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<void> {
  const worksheetName = `Round ${tip.round}`;
  const headers: (string | number)[] = [
    "email",
    "season",
    "round",
    "team",
    "opponent",
    "home",
    "tipped_at",
  ];
  const values: (string | number)[] = [
    tip.email,
    tip.season,
    tip.round,
    tip.team,
    tip.opponent,
    tip.home ? "TRUE" : "FALSE",
    tip.tipped_at,
  ];
  const exists = await worksheetExists(spreadsheetName, worksheetName);
  if (!exists) {
    await createWorksheet(spreadsheetName, worksheetName);
    await appendRow(spreadsheetName, worksheetName, headers);
  }
  await appendRow(spreadsheetName, worksheetName, values);
}

const TIP_HEADERS = [
  "email",
  "season",
  "round",
  "team",
  "opponent",
  "home",
  "tipped_at",
] as const;
const LEGACY_TIP_HEADERS = [
  "email",
  "username",
  "season",
  "round",
  "team",
  "opponent",
  "home",
  "tipped_at",
] as const;

function normalizeHeaderCells(row: string[]): string[] {
  return row.map((c) => String(c ?? "").trim().toLowerCase());
}

function headersMatch(row: string[], expected: readonly string[]): boolean {
  if (row.length < expected.length) return false;
  const normalized = normalizeHeaderCells(row);
  return expected.every((h, i) => normalized[i] === h);
}

function toSevenColumnTipRow(row: string[]): string[] {
  if (row.length >= 8) {
    return [
      String(row[0] ?? ""),
      String(row[2] ?? ""),
      String(row[3] ?? ""),
      String(row[4] ?? ""),
      String(row[5] ?? ""),
      String(row[6] ?? ""),
      String(row[7] ?? ""),
    ];
  }
  if (row.length >= 7) {
    return [
      String(row[0] ?? ""),
      String(row[1] ?? ""),
      String(row[2] ?? ""),
      String(row[3] ?? ""),
      String(row[4] ?? ""),
      String(row[5] ?? ""),
      String(row[6] ?? ""),
    ];
  }
  return [
    String(row[0] ?? ""),
    String(row[1] ?? ""),
    String(row[2] ?? ""),
    String(row[3] ?? ""),
    String(row[4] ?? ""),
    String(row[5] ?? ""),
    String(row[6] ?? ""),
  ];
}

export interface TipSheetMigrationResult {
  sheetName: string;
  status: "already_current" | "migrated_legacy_header" | "recovered_missing_header";
  rowsWritten: number;
}

/**
 * Normalize all Round sheets to the 7-column tip schema:
 * email, season, round, team, opponent, home, tipped_at
 */
export async function migrateRoundTipSheetsSchema(
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<TipSheetMigrationResult[]> {
  const worksheetNames = await getWorksheetNames(spreadsheetName);
  const roundSheets = worksheetNames.filter((n) => n.startsWith("Round "));
  const sheets = await getSheetsClient();
  const id = await getSpreadsheetId(spreadsheetName);
  const results: TipSheetMigrationResult[] = [];

  for (const sheetName of roundSheets) {
    const read = await withRetry429(() =>
      sheets.spreadsheets.values.get({
        spreadsheetId: id,
        range: `'${sheetName}'!A:Z`,
      })
    );
    const rows = (read.data.values ?? []) as string[][];

    if (rows.length === 0) {
      await withRetry429(() =>
        sheets.spreadsheets.values.update({
          spreadsheetId: id,
          range: `'${sheetName}'!A1:G1`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [Array.from(TIP_HEADERS)] },
        })
      );
      results.push({
        sheetName,
        status: "recovered_missing_header",
        rowsWritten: 0,
      });
      continue;
    }

    const header = rows[0];
    if (headersMatch(header, TIP_HEADERS)) {
      results.push({
        sheetName,
        status: "already_current",
        rowsWritten: Math.max(rows.length - 1, 0),
      });
      continue;
    }

    const dataRows = headersMatch(header, LEGACY_TIP_HEADERS)
      ? rows.slice(1).map(toSevenColumnTipRow)
      : rows.map(toSevenColumnTipRow);
    const out = [Array.from(TIP_HEADERS), ...dataRows];
    await withRetry429(() =>
      sheets.spreadsheets.values.clear({
        spreadsheetId: id,
        range: `'${sheetName}'!A:Z`,
      })
    );
    await withRetry429(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range: `'${sheetName}'!A1:G${out.length}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: out },
      })
    );
    results.push({
      sheetName,
      status: headersMatch(header, LEGACY_TIP_HEADERS)
        ? "migrated_legacy_header"
        : "recovered_missing_header",
      rowsWritten: dataRows.length,
    });
  }

  return results;
}

export async function appendShieldTipToSheet(
  tip: UserShieldTip,
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<void> {
  const worksheetName = `Shield Round ${tip.round}`;
  const values = [
    tip.email,
    tip.season,
    tip.round,
    tip.team,
    tip.tryscorer,
    tip.match_total ?? "",
    tip.tipped_at,
  ];
  await appendRow(spreadsheetName, worksheetName, values);
}

export async function saveGamesToSheets(
  games: Game[],
  spreadsheetName: string = SPREADSHEET_NAME
): Promise<void> {
  const sheets = await getSheetsClient();
  const id = await getSpreadsheetId(spreadsheetName);
  const headers = [
    "season",
    "round",
    "kickoff",
    "home_team",
    "away_team",
    "venue",
    "home_score",
    "away_score",
  ];
  const rows = games.map((g) => [
    g.season,
    g.round,
    g.kickoff,
    g.home_team,
    g.away_team,
    g.venue,
    g.home_score ?? "",
    g.away_score ?? "",
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `Games!A1:H${rows.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers, ...rows] },
  });
}
