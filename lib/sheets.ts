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
  const records: Record<string, string | number>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rec: Record<string, string | number> = {};
    headers.forEach((h, j) => {
      const v = row[j];
      if (v !== undefined && v !== "") rec[h] = v;
    });
    records.push(rec);
  }
  return records;
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
  const values: (string | number)[] = [
    tip.email,
    tip.username,
    tip.season,
    tip.round,
    tip.team,
    tip.opponent,
    tip.home ? "TRUE" : "FALSE",
    tip.tipped_at,
  ];
  await appendRow(spreadsheetName, worksheetName, values);
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
