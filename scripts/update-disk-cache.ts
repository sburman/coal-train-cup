import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { getWorksheetNames, getWorksheetRecordsWithRowIndices } from '../lib/sheets';
import { getAllRoundsStatus } from '../lib/data';
import { SPREADSHEET_NAME, CURRENT_SEASON } from '../lib/constants';

async function run() {
  console.log(`Starting disk cache update for ${SPREADSHEET_NAME} (Season ${CURRENT_SEASON})...`);
  
  const statuses = await getAllRoundsStatus(SPREADSHEET_NAME);
  const closedRounds = Object.entries(statuses)
    .filter(([, status]) => status === "closed")
    .map(([round]) => Number(round));
    
  console.log(`Closed rounds identified: ${closedRounds.join(", ")}`);
  
  if (closedRounds.length === 0) {
    console.log("No closed rounds to cache. Exiting.");
    return;
  }

  const names = await getWorksheetNames(SPREADSHEET_NAME);
  const roundSheets = names.filter((n) => n.startsWith("Round "));
  
  const baseDir = path.join(process.cwd(), "data", "nrl", String(CURRENT_SEASON));
  fs.mkdirSync(baseDir, { recursive: true });

  for (const sheetName of roundSheets) {
    const roundNumber = Number(sheetName.replace("Round ", ""));
    if (closedRounds.includes(roundNumber)) {
      console.log(`Fetching records for ${sheetName}...`);
      const { getWorksheetRecordsWithRowIndices } = await import('../lib/sheets');
      const withIndices = await getWorksheetRecordsWithRowIndices(SPREADSHEET_NAME, sheetName);
      
      const tips = withIndices.map(({ record: r, zeroBasedRowIndex }) => ({
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
      }));
      
      const cachePath = path.join(baseDir, `round_${roundNumber}.json`);
      fs.writeFileSync(cachePath, JSON.stringify(tips, null, 2), "utf-8");
      console.log(`Saved ${tips.length} tips to ${cachePath}`);
    }
  }
  
  console.log("Disk cache update complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
